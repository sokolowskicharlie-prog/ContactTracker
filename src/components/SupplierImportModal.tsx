import { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import * as XLSX from 'xlsx';

interface SupplierImportData {
  'Supplier Name': string;
  'Ports'?: string;
  'Address'?: string;
  'Notes'?: string;
  'Usual Payment Terms'?: string;
  'Emails'?: string;
  'Phone Number'?: string;
  'Country'?: string;
  'Website'?: string;
  'Currency'?: string;
  'Supplier Type'?: string;
  'Fuel Types'?: string;
}

interface SupplierImportModalProps {
  onClose: () => void;
  onImport: (suppliers: SupplierImportData[]) => Promise<void>;
}

export default function SupplierImportModal({ onClose, onImport }: SupplierImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewData, setPreviewData] = useState<SupplierImportData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setSuccess(false);
      parseFile(selectedFile);
    }
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<SupplierImportData>(worksheet);

        if (jsonData.length === 0) {
          setError('The Excel file is empty');
          return;
        }

        const firstRow = jsonData[0];
        if (!firstRow['Supplier Name']) {
          setError('Excel file must contain a "Supplier Name" column');
          return;
        }

        setPreviewData(jsonData.slice(0, 5));
      } catch (err) {
        setError('Failed to parse Excel file. Please ensure it is a valid Excel file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<SupplierImportData>(worksheet);

          await onImport(jsonData);
          setSuccess(true);
          setTimeout(() => {
            onClose();
          }, 1500);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to import suppliers');
        } finally {
          setImporting(false);
        }
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      setError('Failed to read file');
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Upload className="w-6 h-6" />
            <h2 className="text-xl font-bold">Import Suppliers</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Excel File Requirements</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
              <p className="mb-2">Your Excel file should include the following columns:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Supplier Name</strong> (required)</li>
                <li>Ports</li>
                <li>Address</li>
                <li>Notes</li>
                <li>Usual Payment Terms</li>
                <li>Emails</li>
                <li>Phone Number</li>
                <li>Country</li>
                <li>Website</li>
                <li>Currency</li>
                <li>Supplier Type</li>
                <li>Fuel Types</li>
              </ul>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Excel File
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
            >
              <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 mb-1">
                {file ? file.name : 'Click to select an Excel file'}
              </p>
              <p className="text-xs text-gray-500">
                Supports .xlsx, .xls files
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {previewData.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Preview (first {previewData.length} rows)
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Supplier Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Country</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.map((row, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm text-gray-900">{row['Supplier Name']}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{row['Country'] || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{row['Supplier Type'] || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-700">Suppliers imported successfully!</div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={importing}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!file || importing || success}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {importing && <Loader className="w-4 h-4 animate-spin" />}
            {importing ? 'Importing...' : 'Import Suppliers'}
          </button>
        </div>
      </div>
    </div>
  );
}
