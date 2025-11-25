import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { ContactWithActivity } from '../lib/supabase';

interface ImportModalProps {
  onClose: () => void;
  onImport: (contacts: Partial<ContactWithActivity>[]) => void;
}

export default function ImportModal({ onClose, onImport }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Partial<ContactWithActivity>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        console.log('First row of Excel data:', jsonData[0]);

        const parsedContacts: Partial<ContactWithActivity>[] = jsonData.map((row: any) => {
          const contact = {
            name: row.Name || row.name || row.NAME || '',
            phone: row.Phone || row.phone || row.PHONE || row['Phone Number'] || row.Mobile || row.mobile || undefined,
            email: row.Email || row.email || row.EMAIL || row['Email Address'] || row['E-mail'] || undefined,
            company: row.Company || row.company || row.COMPANY || row['Company Name'] || undefined,
            company_excerpt: row['Company Description'] || row.company_excerpt || row.company_description || row.Description || row.description || undefined,
            website: row.Website || row.website || row.WEBSITE || row.URL || row.url || undefined,
            address: row.Address || row.address || row.ADDRESS || row['Street Address'] || undefined,
            city: row.City || row.city || row.CITY || undefined,
            post_code: row['Post Code'] || row.post_code || row.postcode || row['Postal Code'] || row.ZIP || row.zip || row['Zip Code'] || undefined,
            country: row.Country || row.country || row.COUNTRY || undefined,
            reminder_days: row['Reminder Days'] || row.reminder_days || row.ReminderDays || row.Reminder || undefined,
            notes: row.Notes || row.notes || row.NOTES || row.Note || row.note || row.Comments || row.comments || undefined,
          };
          console.log('Parsed contact:', contact);
          return contact;
        });

        const validContacts = parsedContacts.filter(c => c.name && c.name.trim() !== '');

        if (validContacts.length === 0) {
          setError('No valid contacts found. Make sure your Excel file has a "Name" column.');
          setPreview([]);
        } else {
          setPreview(validContacts);
        }
      } catch (err) {
        setError('Failed to parse Excel file. Please make sure it\'s a valid .xlsx or .xls file.');
        setPreview([]);
      }
    };

    reader.readAsBinaryString(selectedFile);
  };

  const handleImport = async () => {
    if (preview.length === 0) return;

    setImporting(true);
    try {
      await onImport(preview);
      onClose();
    } catch (err) {
      setError('Failed to import contacts. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        Name: 'John Doe',
        Phone: '+1 (555) 123-4567',
        Email: 'john@example.com',
        Company: 'Acme Inc.',
        'Company Description': 'Leading technology company',
        Website: 'https://example.com',
        Address: '123 Main Street, Suite 100',
        City: 'New York',
        'Post Code': '10001',
        Country: 'United States',
        'Reminder Days': 7,
        Notes: 'Important client',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts');
    XLSX.writeFile(workbook, 'contacts_template.xlsx');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Import Contacts from Excel</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Expected Excel Format:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Name</strong> (required)</li>
              <li>• Phone, Email, Company (optional)</li>
              <li>• Company Description, Website (optional)</li>
              <li>• Address, City, Post Code, Country (optional)</li>
              <li>• Reminder Days (optional, number)</li>
              <li>• Notes (optional)</li>
            </ul>
            <button
              onClick={downloadTemplate}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Download template Excel file
            </button>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="excel-upload"
            />
            <label
              htmlFor="excel-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              {file ? (
                <FileSpreadsheet className="w-16 h-16 text-green-600 mb-3" />
              ) : (
                <Upload className="w-16 h-16 text-gray-400 mb-3" />
              )}
              <p className="text-lg font-medium text-gray-900 mb-1">
                {file ? file.name : 'Choose Excel file'}
              </p>
              <p className="text-sm text-gray-500">
                Click to browse or drag and drop
              </p>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {preview.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">
                    Ready to import {preview.length} contact{preview.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-green-800 mt-1">Preview:</p>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto bg-white rounded border border-green-200 p-3">
                <div className="space-y-3">
                  {preview.slice(0, 10).map((contact, index) => (
                    <div key={index} className="text-sm text-gray-700 border-b border-gray-100 pb-2 last:border-0">
                      <div className="font-semibold text-gray-900">{contact.name}</div>
                      <div className="grid grid-cols-1 gap-1 mt-1 text-xs">
                        {contact.company && <div><span className="text-gray-500">Company:</span> {contact.company}</div>}
                        {contact.email && <div><span className="text-gray-500">Email:</span> {contact.email}</div>}
                        {contact.phone && <div><span className="text-gray-500">Phone:</span> {contact.phone}</div>}
                        {contact.address && <div><span className="text-gray-500">Address:</span> {contact.address}</div>}
                        {contact.city && <div><span className="text-gray-500">City:</span> {contact.city}</div>}
                        {contact.post_code && <div><span className="text-gray-500">Post Code:</span> {contact.post_code}</div>}
                        {contact.country && <div><span className="text-gray-500">Country:</span> {contact.country}</div>}
                        {contact.website && <div><span className="text-gray-500">Website:</span> {contact.website}</div>}
                        {contact.notes && <div><span className="text-gray-500">Notes:</span> {contact.notes}</div>}
                      </div>
                    </div>
                  ))}
                  {preview.length > 10 && (
                    <div className="text-gray-500 italic text-center pt-2">
                      ...and {preview.length - 10} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={preview.length === 0 || importing}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? 'Importing...' : `Import ${preview.length} Contact${preview.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
