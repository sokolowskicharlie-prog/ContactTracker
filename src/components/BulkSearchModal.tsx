import { useState } from 'react';
import { X, Upload, Search, Download, AlertCircle, ArrowUpDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ContactWithActivity } from '../lib/supabase';

interface BulkSearchModalProps {
  contacts: ContactWithActivity[];
  onClose: () => void;
  onSelectContact: (contact: ContactWithActivity) => void;
}

interface SearchResult {
  searchedName: string;
  found: boolean;
  contact?: ContactWithActivity;
}

type SortType = 'none' | 'found-first' | 'not-found-first';

export default function BulkSearchModal({ contacts, onClose, onSelectContact }: BulkSearchModalProps) {
  const [searchNames, setSearchNames] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [textInput, setTextInput] = useState('');
  const [sortType, setSortType] = useState<SortType>('none');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

        const names: string[] = [];
        jsonData.forEach(row => {
          if (row[0] && typeof row[0] === 'string' && row[0].trim()) {
            names.push(row[0].trim());
          }
        });

        setSearchNames(names);
        performSearch(names);
      } catch (error) {
        console.error('Error reading file:', error);
        alert('Error reading file. Please make sure it\'s a valid Excel file.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleTextSearch = () => {
    const names = textInput
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    setSearchNames(names);
    performSearch(names);
  };

  const performSearch = (names: string[]) => {
    const results: SearchResult[] = names.map(searchedName => {
      const searchTerm = searchedName.toLowerCase().trim();

      // Skip empty search terms
      if (!searchTerm) {
        return {
          searchedName,
          found: false,
          contact: undefined
        };
      }

      const foundContact = contacts.find(contact => {
        const contactName = contact.name?.toLowerCase() || '';
        const contactEmail = contact.email?.toLowerCase() || '';
        const contactCompany = contact.company?.toLowerCase() || '';

        // Exact or partial match in name, email, or company
        return (
          contactName.includes(searchTerm) ||
          contactEmail.includes(searchTerm) ||
          contactCompany.includes(searchTerm) ||
          // Also check if search term matches the name/email exactly (for reverse lookup)
          (contactName && searchTerm.includes(contactName) && contactName.length > 2) ||
          (contactEmail && searchTerm === contactEmail)
        );
      });

      return {
        searchedName,
        found: !!foundContact,
        contact: foundContact
      };
    });

    setSearchResults(results);
  };

  const exportResults = () => {
    const exportData = searchResults.map(result => {
      const getContactStatus = () => {
        if (!result.contact) return '';
        const statuses = [];
        if (result.contact.is_client) statuses.push('Client');
        if (result.contact.has_traction) statuses.push('Traction');
        if (result.contact.is_jammed) statuses.push('Jammed');
        return statuses.length > 0 ? statuses.join(', ') : 'None';
      };

      return {
        'Searched Name': result.searchedName,
        'Status': result.found ? 'Found' : 'Not Found',
        'Contact Name': result.contact?.name || '',
        'Company': result.contact?.company || '',
        'Country': result.contact?.country || '',
        'Email': result.contact?.email || '',
        'Phone': result.contact?.phone || '',
        'Contact Status': getContactStatus(),
        'Priority Rank': result.contact?.priority_rank || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Search Results');
    XLSX.writeFile(wb, `bulk_search_results_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const foundCount = searchResults.filter(r => r.found).length;
  const notFoundCount = searchResults.length - foundCount;

  const getSortedResults = () => {
    if (sortType === 'none') {
      return searchResults;
    }

    const sorted = [...searchResults];
    if (sortType === 'found-first') {
      return sorted.sort((a, b) => (b.found ? 1 : 0) - (a.found ? 1 : 0));
    } else {
      return sorted.sort((a, b) => (a.found ? 1 : 0) - (b.found ? 1 : 0));
    }
  };

  const toggleSort = () => {
    if (sortType === 'none') {
      setSortType('found-first');
    } else if (sortType === 'found-first') {
      setSortType('not-found-first');
    } else {
      setSortType('none');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Search className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Bulk Contact Search</h2>
              <p className="text-blue-100 text-sm">Search multiple contacts at once</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {searchResults.length === 0 ? (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">How to use:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Upload an Excel file with names or emails in the first column</li>
                      <li>Or paste names/emails (one per line) in the text area below</li>
                      <li>The system will search for matching contacts by name, email, or company</li>
                      <li>Export results to Excel when done</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <label className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-700 font-semibold">
                    Upload Excel File
                  </span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Excel, CSV files accepted
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="text-gray-500 text-sm">OR</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste Names or Emails (one per line)
                </label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="John Smith&#10;jane.doe@example.com&#10;Company ABC&#10;john@company.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={8}
                />
                <button
                  onClick={handleTextSearch}
                  disabled={!textInput.trim()}
                  className="mt-3 w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Search Contacts
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-sm text-gray-600">Total Searched:</span>
                    <span className="ml-2 font-bold text-gray-900">{searchResults.length}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Found:</span>
                    <span className="ml-2 font-bold text-green-600">{foundCount}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Not Found:</span>
                    <span className="ml-2 font-bold text-red-600">{notFoundCount}</span>
                  </div>
                  <div className="border-l border-gray-300 pl-6">
                    <button
                      onClick={toggleSort}
                      className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 transition-colors"
                    >
                      <ArrowUpDown className="w-4 h-4" />
                      <span>
                        {sortType === 'none' && 'Sort by Status'}
                        {sortType === 'found-first' && 'Found First'}
                        {sortType === 'not-found-first' && 'Not Found First'}
                      </span>
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={exportResults}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export Results
                  </button>
                  <button
                    onClick={() => {
                      setSearchResults([]);
                      setSearchNames([]);
                      setTextInput('');
                      setSortType('none');
                    }}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    New Search
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {getSortedResults().map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      result.found
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-gray-900">
                            {result.searchedName}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                              result.found
                                ? 'bg-green-200 text-green-800'
                                : 'bg-red-200 text-red-800'
                            }`}
                          >
                            {result.found ? 'Found' : 'Not Found'}
                          </span>
                        </div>
                        {result.contact && (
                          <div className="text-sm text-gray-700 space-y-1">
                            <div>
                              <span className="font-medium">Contact Name:</span>{' '}
                              {result.contact.name}
                            </div>
                            {result.contact.company && (
                              <div>
                                <span className="font-medium">Company:</span>{' '}
                                {result.contact.company}
                              </div>
                            )}
                            {result.contact.country && (
                              <div>
                                <span className="font-medium">Country:</span>{' '}
                                {result.contact.country}
                              </div>
                            )}
                            {result.contact.email && (
                              <div>
                                <span className="font-medium">Email:</span>{' '}
                                {result.contact.email}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {result.contact.is_client && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                                  Client
                                </span>
                              )}
                              {result.contact.has_traction && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                  Traction
                                </span>
                              )}
                              {result.contact.is_jammed && (
                                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                                  Jammed
                                </span>
                              )}
                              {result.contact.priority_rank && result.contact.priority_rank > 0 && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                                  Priority: {result.contact.priority_rank}
                                </span>
                              )}
                              {!result.contact.is_client && !result.contact.has_traction && !result.contact.is_jammed && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                                  None
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      {result.contact && (
                        <button
                          onClick={() => {
                            onSelectContact(result.contact!);
                            onClose();
                          }}
                          className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          View Contact
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
