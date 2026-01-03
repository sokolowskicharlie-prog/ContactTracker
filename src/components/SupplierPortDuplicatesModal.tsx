import { X, AlertTriangle, Trash2, Check, Ship, Truck, Anchor, Fuel } from 'lucide-react';
import { useState, useEffect } from 'react';
import { SupplierPort } from '../lib/supabase';

interface DuplicateGroup {
  portName: string;
  ports: SupplierPort[];
}

interface SupplierPortDuplicatesModalProps {
  supplierId: string;
  ports: SupplierPort[];
  onClose: () => void;
  onDeletePorts: (portIds: string[]) => Promise<void>;
}

export default function SupplierPortDuplicatesModal({
  supplierId,
  ports,
  onClose,
  onDeletePorts,
}: SupplierPortDuplicatesModalProps) {
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [selectedToKeep, setSelectedToKeep] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const portsByName = ports.reduce((acc, port) => {
      const normalizedName = port.port_name.toLowerCase().trim();
      if (!acc[normalizedName]) {
        acc[normalizedName] = [];
      }
      acc[normalizedName].push(port);
      return acc;
    }, {} as Record<string, SupplierPort[]>);

    const duplicates: DuplicateGroup[] = Object.entries(portsByName)
      .filter(([, ports]) => ports.length > 1)
      .map(([, ports]) => ({
        portName: ports[0].port_name,
        ports: ports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      }));

    setDuplicateGroups(duplicates);

    const initialSelection: Record<string, string> = {};
    duplicates.forEach((group) => {
      initialSelection[group.portName] = group.ports[0].id;
    });
    setSelectedToKeep(initialSelection);
  }, [ports]);

  const handleDeleteDuplicates = async () => {
    setDeleting(true);
    try {
      const idsToDelete: string[] = [];

      duplicateGroups.forEach((group) => {
        const keepId = selectedToKeep[group.portName];
        group.ports.forEach((port) => {
          if (port.id !== keepId) {
            idsToDelete.push(port.id);
          }
        });
      });

      if (idsToDelete.length > 0) {
        await onDeletePorts(idsToDelete);
      }

      onClose();
    } catch (error) {
      console.error('Error deleting duplicate ports:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (duplicateGroups.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">No Duplicates Found</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center py-8">
            <Check className="w-16 h-16 mx-auto text-green-500 mb-3" />
            <p className="text-gray-600">No duplicate ports were found for this supplier.</p>
          </div>
          <button
            onClick={onClose}
            className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Duplicate Ports Found</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {duplicateGroups.length} port{duplicateGroups.length > 1 ? 's have' : ' has'} duplicates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {duplicateGroups.map((group) => (
            <div key={group.portName} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Anchor className="w-5 h-5 text-blue-600" />
                {group.portName}
                <span className="text-sm text-gray-500 font-normal">
                  ({group.ports.length} duplicates)
                </span>
              </h3>

              <div className="space-y-3">
                {group.ports.map((port) => (
                  <label
                    key={port.id}
                    className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedToKeep[group.portName] === port.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name={`keep-${group.portName}`}
                        checked={selectedToKeep[group.portName] === port.id}
                        onChange={() =>
                          setSelectedToKeep((prev) => ({
                            ...prev,
                            [group.portName]: port.id,
                          }))
                        }
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {selectedToKeep[group.portName] === port.id ? 'Keep this' : 'Delete this'}
                          </span>
                          {selectedToKeep[group.portName] !== port.id && (
                            <Trash2 className="w-4 h-4 text-red-500" />
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-2">
                          {port.has_barge && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                              <Ship className="w-3 h-3" />
                              <span>Barge</span>
                            </div>
                          )}
                          {port.has_truck && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                              <Truck className="w-3 h-3" />
                              <span>Truck</span>
                            </div>
                          )}
                          {port.has_expipe && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                              <Anchor className="w-3 h-3" />
                              <span>Ex-Pipe</span>
                            </div>
                          )}
                          {port.custom_delivery_methods && port.custom_delivery_methods.map((method) => (
                            <div key={method.id} className="flex items-center gap-1 px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">
                              <Truck className="w-3 h-3" />
                              <span>{method.name}</span>
                            </div>
                          ))}
                          {port.has_vlsfo && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                              <Fuel className="w-3 h-3" />
                              <span>VLSFO</span>
                            </div>
                          )}
                          {port.has_lsmgo && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-700 rounded text-xs">
                              <Fuel className="w-3 h-3" />
                              <span>LSMGO</span>
                            </div>
                          )}
                          {port.custom_fuel_types && port.custom_fuel_types.map((fuelType) => (
                            <div key={fuelType.id} className="flex items-center gap-1 px-2 py-1 bg-purple-200 text-purple-800 rounded text-xs">
                              <Fuel className="w-3 h-3" />
                              <span>{fuelType.name}</span>
                            </div>
                          ))}
                        </div>

                        {port.notes && (
                          <p className="text-xs text-gray-500 italic mb-1">{port.notes}</p>
                        )}

                        <p className="text-xs text-gray-400">
                          Added {new Date(port.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              {Object.values(selectedToKeep).length} port{Object.values(selectedToKeep).length > 1 ? 's' : ''} will be kept,{' '}
              {duplicateGroups.reduce((sum, group) => sum + group.ports.length, 0) - Object.values(selectedToKeep).length}{' '}
              will be deleted
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteDuplicates}
              disabled={deleting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {deleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Duplicates
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
