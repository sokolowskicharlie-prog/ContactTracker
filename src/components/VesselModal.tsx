import { X, Ship, Hash, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Vessel } from '../lib/supabase';

interface VesselModalProps {
  vessel?: Vessel;
  contactName: string;
  onClose: () => void;
  onSave: (vessel: Partial<Vessel>) => void;
}

const VESSEL_TYPES = [
  'Container Ship',
  'Bulk Carrier',
  'Tanker',
  'General Cargo',
  'Ro-Ro',
  'Vehicle Carrier',
  'Reefer',
  'Chemical Tanker',
  'LNG Carrier',
  'LPG Carrier',
  'Crude Oil Tanker',
  'Product Tanker',
  'Offshore Vessel',
  'Tug',
  'Other',
];

export default function VesselModal({ vessel, contactName, onClose, onSave }: VesselModalProps) {
  const [vesselName, setVesselName] = useState('');
  const [imoNumber, setImoNumber] = useState('');
  const [vesselType, setVesselType] = useState('');
  const [marineTrafficUrl, setMarineTrafficUrl] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (vessel) {
      setVesselName(vessel.vessel_name);
      setImoNumber(vessel.imo_number || '');
      setVesselType(vessel.vessel_type || '');
      setMarineTrafficUrl(vessel.marine_traffic_url || '');
      setNotes(vessel.notes || '');
    }
  }, [vessel]);

  useEffect(() => {
    if (imoNumber && imoNumber.length >= 7 && !marineTrafficUrl) {
      const cleanImo = imoNumber.replace(/[^0-9]/g, '');
      if (cleanImo.length === 7) {
        setMarineTrafficUrl(`https://www.marinetraffic.com/en/ais/details/ships/imo:${cleanImo}`);
      }
    }
  }, [imoNumber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vesselName.trim()) return;

    onSave({
      ...(vessel ? { id: vessel.id } : {}),
      vessel_name: vesselName.trim(),
      imo_number: imoNumber.trim() || null,
      vessel_type: vesselType || null,
      marine_traffic_url: marineTrafficUrl.trim() || null,
      notes: notes.trim() || null,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {vessel ? 'Edit Vessel' : 'Add Vessel'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">For {contactName}</p>
          </div>
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
              Vessel Name *
            </label>
            <div className="relative">
              <Ship className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={vesselName}
                onChange={(e) => setVesselName(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., MSC Gulsun"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IMO Number
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={imoNumber}
                onChange={(e) => setImoNumber(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 9454436"
                maxLength={7}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              7-digit International Maritime Organization number
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vessel Type
            </label>
            <select
              value={vesselType}
              onChange={(e) => setVesselType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select type</option>
              {VESSEL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              Marine Traffic URL
              {marineTrafficUrl && (
                <a
                  href={marineTrafficUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </label>
            <input
              type="url"
              value={marineTrafficUrl}
              onChange={(e) => setMarineTrafficUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Auto-generated from IMO or enter custom URL"
            />
            <p className="text-xs text-gray-500 mt-1">
              {imoNumber
                ? 'URL will be auto-generated from IMO number'
                : 'Enter IMO number to auto-generate Marine Traffic link'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional information about the vessel..."
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
              {vessel ? 'Update' : 'Add'} Vessel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
