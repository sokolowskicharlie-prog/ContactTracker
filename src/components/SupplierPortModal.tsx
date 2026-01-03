import { X, Anchor, Truck, Ship, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { SupplierPort } from '../lib/supabase';

interface SupplierPortModalProps {
  supplierPort?: SupplierPort;
  supplierId: string;
  onClose: () => void;
  onSave: (port: Partial<SupplierPort>) => void;
}

export default function SupplierPortModal({ supplierPort, supplierId, onClose, onSave }: SupplierPortModalProps) {
  const [portName, setPortName] = useState('');
  const [hasBarge, setHasBarge] = useState(false);
  const [hasTruck, setHasTruck] = useState(false);
  const [hasExpipe, setHasExpipe] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (supplierPort) {
      setPortName(supplierPort.port_name);
      setHasBarge(supplierPort.has_barge);
      setHasTruck(supplierPort.has_truck);
      setHasExpipe(supplierPort.has_expipe);
      setNotes(supplierPort.notes || '');
    }
  }, [supplierPort]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portName.trim()) return;

    if (supplierPort) {
      // Editing existing port - single port only
      onSave({
        id: supplierPort.id,
        supplier_id: supplierId,
        port_name: portName.trim(),
        has_barge: hasBarge,
        has_truck: hasTruck,
        has_expipe: hasExpipe,
        notes: notes.trim() || undefined,
      });
    } else {
      // Adding new port(s) - support multiple ports separated by semicolons
      const portNames = portName.split(';').map(p => p.trim()).filter(Boolean);

      // Call onSave for each port sequentially
      for (const name of portNames) {
        await onSave({
          supplier_id: supplierId,
          port_name: name,
          has_barge: hasBarge,
          has_truck: hasTruck,
          has_expipe: hasExpipe,
          notes: notes.trim() || undefined,
        });
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {supplierPort ? 'Edit Port' : 'Add Port'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Port Name{supplierPort ? '' : 's'} *
            </label>
            <div className="relative">
              <Anchor className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={portName}
                onChange={(e) => setPortName(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={supplierPort ? "e.g., Singapore" : "e.g., Singapore; Rotterdam; Dubai"}
              />
            </div>
            {!supplierPort && (
              <p className="text-xs text-gray-500 mt-1">
                Tip: Add multiple ports at once by separating them with semicolons (;)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Methods
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasBarge}
                  onChange={(e) => setHasBarge(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <Ship className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Barge</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasTruck}
                  onChange={(e) => setHasTruck(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <Truck className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Truck</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasExpipe}
                  onChange={(e) => setHasExpipe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <Anchor className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Ex-Pipe</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional information about this port..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {supplierPort ? 'Update Port' : portName.includes(';') ? `Add ${portName.split(';').filter(p => p.trim()).length} Ports` : 'Add Port'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
