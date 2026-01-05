import { useState } from 'react';
import { X, Upload, Search, Download, AlertCircle, ArrowUpDown, Filter, Plus, Mail } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ContactWithActivity, Supplier, supabase } from '../lib/supabase';
import ContactModal from './ContactModal';
import SupplierModal from './SupplierModal';

interface BulkSearchModalProps {
  contacts: ContactWithActivity[];
  onClose: () => void;
  onSelectContact: (contact: ContactWithActivity) => void;
}

interface SearchResult {
  searchedName: string;
  found: boolean;
  type?: 'contact' | 'supplier';
  contact?: ContactWithActivity;
  supplier?: Supplier;
}

type SortType = 'none' | 'found-first' | 'not-found-first' | 'alphabetical' | 'priority';

export default function BulkSearchModal({ contacts, onClose, onSelectContact }: BulkSearchModalProps) {
  const [searchNames, setSearchNames] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [textInput, setTextInput] = useState('');
  const [sortType, setSortType] = useState<SortType>('none');

  const [filterText, setFilterText] = useState('');
  const [filterFoundStatus, setFilterFoundStatus] = useState<'all' | 'found' | 'not-found'>('all');
  const [filterType, setFilterType] = useState<'all' | 'contact' | 'supplier'>('all');
  const [filterContactStatus, setFilterContactStatus] = useState<'all' | 'client' | 'traction' | 'jammed' | 'none'>('all');

  const [showContactModal, setShowContactModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [prefilledEmail, setPrefilledEmail] = useState('');

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

  const performSearch = async (names: string[]) => {
    const results: SearchResult[] = [];

    for (const searchedName of names) {
      const searchTerm = searchedName.toLowerCase().trim();

      // Skip empty search terms
      if (!searchTerm) {
        results.push({
          searchedName,
          found: false
        });
        continue;
      }

      // Check if it's an email domain search (e.g., @company.com)
      let isEmailDomain = searchTerm.startsWith('@');
      let domainToSearch = searchTerm;

      // If it's a full email address, extract the domain
      if (!isEmailDomain && searchTerm.includes('@')) {
        const atIndex = searchTerm.indexOf('@');
        domainToSearch = searchTerm.substring(atIndex); // e.g., "ukbrokers@wfscorp.com" -> "@wfscorp.com"
        isEmailDomain = true;
      }

      // If searching by domain, find ALL matches
      if (isEmailDomain) {
        const allContactMatches = contacts.filter(contact => {
          const contactEmail = contact.email?.toLowerCase() || '';
          return contactEmail.includes(domainToSearch);
        });

        // Search in suppliers for domain matches
        let supplierMatches: any[] = [];
        try {
          const { data: suppliers } = await supabase
            .from('suppliers')
            .select('*')
            .or(`email.ilike.%${domainToSearch}%,general_email.ilike.%${domainToSearch}%`);

          supplierMatches = suppliers || [];
        } catch (error) {
          console.error('Error searching suppliers:', error);
        }

        // Add all contact matches as separate results
        allContactMatches.forEach(contact => {
          results.push({
            searchedName: searchedName,
            found: true,
            type: 'contact',
            contact: contact
          });
        });

        // Add all supplier matches as separate results
        supplierMatches.forEach(supplier => {
          results.push({
            searchedName: searchedName,
            found: true,
            type: 'supplier',
            supplier: supplier
          });
        });

        // If no matches found at all
        if (allContactMatches.length === 0 && supplierMatches.length === 0) {
          results.push({
            searchedName,
            found: false
          });
        }

        continue;
      }

      // Non-domain search: Search in contacts first
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

      if (foundContact) {
        results.push({
          searchedName,
          found: true,
          type: 'contact',
          contact: foundContact
        });
        continue;
      }

      // If not found in contacts, search in suppliers
      try {
        const { data: suppliers } = await supabase
          .from('suppliers')
          .select('*')
          .or(
            `company_name.ilike.%${searchTerm}%,contact_person.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,general_email.ilike.%${searchTerm}%`
          );

        if (suppliers && suppliers.length > 0) {
          results.push({
            searchedName,
            found: true,
            type: 'supplier',
            supplier: suppliers[0]
          });
          continue;
        }
      } catch (error) {
        console.error('Error searching suppliers:', error);
      }

      // Not found in either database
      results.push({
        searchedName,
        found: false
      });
    }

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

      if (result.type === 'supplier' && result.supplier) {
        return {
          'Searched Name': result.searchedName,
          'Status': result.found ? 'Found' : 'Not Found',
          'Type': 'Supplier',
          'Company Name': result.supplier.company_name || '',
          'Contact Person': result.supplier.contact_person || '',
          'Country': result.supplier.country || '',
          'Email': result.supplier.email || '',
          'General Email': result.supplier.general_email || '',
          'Phone': result.supplier.phone || '',
          'Supplier Type': result.supplier.supplier_type || '',
          'Contact Status': '',
          'Priority Rank': ''
        };
      }

      return {
        'Searched Name': result.searchedName,
        'Status': result.found ? 'Found' : 'Not Found',
        'Type': result.type === 'contact' ? 'Contact' : '',
        'Company Name': result.contact?.company || '',
        'Contact Person': result.contact?.name || '',
        'Country': result.contact?.country || '',
        'Email': result.contact?.email || '',
        'General Email': '',
        'Phone': result.contact?.phone || '',
        'Supplier Type': '',
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

  const getFilteredAndSortedResults = () => {
    let filtered = [...searchResults];

    if (filterText.trim()) {
      const searchTerm = filterText.toLowerCase().trim();
      filtered = filtered.filter(result => {
        const name = result.contact?.name?.toLowerCase() || '';
        const email = result.contact?.email?.toLowerCase() || '';
        const company = result.contact?.company?.toLowerCase() || '';
        const supplierName = result.supplier?.company_name?.toLowerCase() || '';
        const supplierEmail = result.supplier?.email?.toLowerCase() || '';
        const supplierGeneralEmail = result.supplier?.general_email?.toLowerCase() || '';
        const country = result.contact?.country?.toLowerCase() || result.supplier?.country?.toLowerCase() || '';

        return (
          name.includes(searchTerm) ||
          email.includes(searchTerm) ||
          company.includes(searchTerm) ||
          supplierName.includes(searchTerm) ||
          supplierEmail.includes(searchTerm) ||
          supplierGeneralEmail.includes(searchTerm) ||
          country.includes(searchTerm)
        );
      });
    }

    if (filterFoundStatus !== 'all') {
      filtered = filtered.filter(result => {
        if (filterFoundStatus === 'found') return result.found;
        if (filterFoundStatus === 'not-found') return !result.found;
        return true;
      });
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(result => {
        if (filterType === 'contact') return result.type === 'contact';
        if (filterType === 'supplier') return result.type === 'supplier';
        return true;
      });
    }

    if (filterContactStatus !== 'all') {
      filtered = filtered.filter(result => {
        if (!result.contact) return false;
        if (filterContactStatus === 'client') return result.contact.is_client;
        if (filterContactStatus === 'traction') return result.contact.has_traction;
        if (filterContactStatus === 'jammed') return result.contact.is_jammed;
        if (filterContactStatus === 'none') {
          return !result.contact.is_client && !result.contact.has_traction && !result.contact.is_jammed;
        }
        return true;
      });
    }

    if (sortType === 'none') {
      return filtered;
    }

    if (sortType === 'found-first') {
      return filtered.sort((a, b) => (b.found ? 1 : 0) - (a.found ? 1 : 0));
    } else if (sortType === 'not-found-first') {
      return filtered.sort((a, b) => (a.found ? 1 : 0) - (b.found ? 1 : 0));
    } else if (sortType === 'alphabetical') {
      return filtered.sort((a, b) => {
        const nameA = a.contact?.name || a.contact?.email || a.supplier?.company_name || a.searchedName;
        const nameB = b.contact?.name || b.contact?.email || b.supplier?.company_name || b.searchedName;
        return nameA.toLowerCase().localeCompare(nameB.toLowerCase());
      });
    } else if (sortType === 'priority') {
      return filtered.sort((a, b) => {
        const getPriorityValue = (result: SearchResult) => {
          if (!result.contact) return 4;
          if (result.contact.is_jammed) return 1;
          if (result.contact.is_client) return 2;
          if (!result.contact.is_client && !result.contact.has_traction && !result.contact.is_jammed) return 3;
          if (result.contact.has_traction) return 4;
          return 5;
        };

        return getPriorityValue(a) - getPriorityValue(b);
      });
    }

    return filtered;
  };


  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleAddEmailToContact = async (result: SearchResult) => {
    if (!result.contact) return;

    const searchedText = result.searchedName.toLowerCase().trim();
    if (!isValidEmail(searchedText)) {
      alert('The searched text is not a valid email address');
      return;
    }

    const contactEmail = result.contact.email?.toLowerCase().trim();
    if (contactEmail === searchedText) {
      alert('This email is already associated with the contact');
      return;
    }

    const confirmAdd = confirm(`Add email "${searchedText}" to contact "${result.contact.name}"?`);
    if (!confirmAdd) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .update({ email: searchedText })
        .eq('id', result.contact.id);

      if (error) throw error;

      alert('Email added successfully');

      result.contact.email = searchedText;
      setSearchResults([...searchResults]);
    } catch (error) {
      console.error('Error adding email:', error);
      alert('Failed to add email to contact');
    }
  };

  const handleCreateNewContact = (result: SearchResult) => {
    const searchedText = result.searchedName.trim();
    setPrefilledEmail(isValidEmail(searchedText) ? searchedText : '');
    setSelectedResult(result);
    setShowContactModal(true);
  };

  const handleCreateNewSupplier = (result: SearchResult) => {
    const searchedText = result.searchedName.trim();
    setPrefilledEmail(isValidEmail(searchedText) ? searchedText : '');
    setSelectedResult(result);
    setShowSupplierModal(true);
  };

  const handleContactSave = async (contact: Partial<ContactWithActivity>, contactPersons: any[]) => {
    try {
      const { data: newContact, error } = await supabase
        .from('contacts')
        .insert([contact])
        .select()
        .single();

      if (error) throw error;

      if (contactPersons && contactPersons.length > 0) {
        const personsWithContactId = contactPersons.map(person => ({
          ...person,
          contact_id: newContact.id
        }));

        const { error: personsError } = await supabase
          .from('contact_persons')
          .insert(personsWithContactId);

        if (personsError) throw personsError;
      }

      alert('Contact created successfully');
      setShowContactModal(false);

      if (selectedResult) {
        selectedResult.found = true;
        selectedResult.type = 'contact';
        selectedResult.contact = newContact as ContactWithActivity;
        setSearchResults([...searchResults]);
      }
    } catch (error) {
      console.error('Error creating contact:', error);
      alert('Failed to create contact');
    }
  };

  const handleSupplierSave = async (supplier: Partial<Supplier>) => {
    try {
      const { data: newSupplier, error } = await supabase
        .from('suppliers')
        .insert([supplier])
        .select()
        .single();

      if (error) throw error;

      alert('Supplier created successfully');
      setShowSupplierModal(false);

      if (selectedResult) {
        selectedResult.found = true;
        selectedResult.type = 'supplier';
        selectedResult.supplier = newSupplier;
        setSearchResults([...searchResults]);
      }
    } catch (error) {
      console.error('Error creating supplier:', error);
      alert('Failed to create supplier');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Search className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Bulk Search</h2>
              <p className="text-blue-100 text-sm">Search contacts and suppliers at once</p>
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
                      <li>Searches both Contacts and Suppliers databases</li>
                      <li>Matches by name, email, company, or email domain</li>
                      <li>When you enter a full email (e.g., ukbrokers@wfscorp.com), it automatically extracts and searches for ALL contacts and suppliers with that domain (@wfscorp.com)</li>
                      <li>Each matching contact or supplier is shown as a separate result</li>
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
                  Search
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
                  <div className="border-l border-gray-300 pl-6 flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-gray-600" />
                    <select
                      value={sortType}
                      onChange={(e) => setSortType(e.target.value as SortType)}
                      className="text-sm text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer"
                    >
                      <option value="none">Sort: None</option>
                      <option value="found-first">Sort: Found First</option>
                      <option value="not-found-first">Sort: Not Found First</option>
                      <option value="alphabetical">Sort: A-Z (by Match Name)</option>
                      <option value="priority">Sort: Priority Status</option>
                    </select>
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
                      setFilterText('');
                      setFilterFoundStatus('all');
                      setFilterType('all');
                      setFilterContactStatus('all');
                    }}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    New Search
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="w-4 h-4 text-gray-600" />
                  <h3 className="font-semibold text-gray-800">Filter Results</h3>
                  <span className="ml-auto text-sm text-gray-600">
                    Showing: {getFilteredAndSortedResults().length} / {searchResults.length}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Search Text
                    </label>
                    <input
                      type="text"
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      placeholder="Search by name, email, company, country..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Found Status
                      </label>
                      <select
                        value={filterFoundStatus}
                        onChange={(e) => setFilterFoundStatus(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All</option>
                        <option value="found">Found</option>
                        <option value="not-found">Not Found</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Type
                      </label>
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All</option>
                        <option value="contact">Contact</option>
                        <option value="supplier">Supplier</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Contact Status
                      </label>
                      <select
                        value={filterContactStatus}
                        onChange={(e) => setFilterContactStatus(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All</option>
                        <option value="jammed">Jammed</option>
                        <option value="client">Client</option>
                        <option value="none">None</option>
                        <option value="traction">Traction</option>
                      </select>
                    </div>
                  </div>

                  {(filterText || filterFoundStatus !== 'all' || filterType !== 'all' || filterContactStatus !== 'all') && (
                    <button
                      onClick={() => {
                        setFilterText('');
                        setFilterFoundStatus('all');
                        setFilterType('all');
                        setFilterContactStatus('all');
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {getFilteredAndSortedResults().map((result, index) => (
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
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 font-medium">Searched:</span>
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
                            {result.type && (
                              <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-800">
                                {result.type === 'contact' ? 'Contact' : 'Supplier'}
                              </span>
                            )}
                          </div>
                        </div>
                        {result.contact && (
                          <div className="text-sm text-gray-700 space-y-1">
                            <div className="bg-blue-50 p-2 rounded border border-blue-200 mb-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-blue-700 uppercase">Found Match:</span>
                              </div>
                              <div className="font-semibold text-gray-900">
                                {result.contact.name}
                                {result.contact.email && (
                                  <span className="ml-2 text-blue-600">
                                    ({result.contact.email})
                                  </span>
                                )}
                              </div>
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
                        {result.supplier && (
                          <div className="text-sm text-gray-700 space-y-1">
                            <div className="bg-gray-50 p-2 rounded border border-gray-200 mb-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-gray-700 uppercase">Found Match:</span>
                              </div>
                              <div className="font-semibold text-gray-900">
                                {result.supplier.company_name}
                                {(result.supplier.email || result.supplier.general_email) && (
                                  <span className="ml-2 text-gray-600">
                                    ({result.supplier.email || result.supplier.general_email})
                                  </span>
                                )}
                              </div>
                            </div>
                            {result.supplier.contact_person && (
                              <div>
                                <span className="font-medium">Contact Person:</span>{' '}
                                {result.supplier.contact_person}
                              </div>
                            )}
                            {result.supplier.country && (
                              <div>
                                <span className="font-medium">Country:</span>{' '}
                                {result.supplier.country}
                              </div>
                            )}
                            {result.supplier.supplier_type && (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                                  {result.supplier.supplier_type}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col gap-2">
                        {result.contact && (
                          <>
                            <button
                              onClick={() => {
                                onSelectContact(result.contact!);
                              }}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                            >
                              View Contact
                            </button>
                            {isValidEmail(result.searchedName) &&
                             result.contact.email?.toLowerCase() !== result.searchedName.toLowerCase() && (
                              <button
                                onClick={() => handleAddEmailToContact(result)}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap flex items-center gap-2"
                              >
                                <Mail className="w-4 h-4" />
                                Add Email
                              </button>
                            )}
                          </>
                        )}
                        {result.supplier && (
                          <button
                            onClick={() => {
                              alert('Supplier details can be viewed in the Suppliers tab');
                            }}
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm whitespace-nowrap"
                          >
                            View Supplier
                          </button>
                        )}
                        {!result.found && (
                          <>
                            <button
                              onClick={() => handleCreateNewContact(result)}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              New Contact
                            </button>
                            <button
                              onClick={() => handleCreateNewSupplier(result)}
                              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm whitespace-nowrap flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              New Supplier
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showContactModal && (
        <ContactModal
          contact={prefilledEmail ? { email: prefilledEmail } as any : undefined}
          onClose={() => {
            setShowContactModal(false);
            setSelectedResult(null);
            setPrefilledEmail('');
          }}
          onSave={handleContactSave}
        />
      )}

      {showSupplierModal && (
        <SupplierModal
          supplier={prefilledEmail ? { email: prefilledEmail } as any : undefined}
          onClose={() => {
            setShowSupplierModal(false);
            setSelectedResult(null);
            setPrefilledEmail('');
          }}
          onSave={handleSupplierSave}
        />
      )}
    </div>
  );
}
