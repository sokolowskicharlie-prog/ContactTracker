import { X, Ship, Hash, ExternalLink, MapPin, Calendar, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Vessel } from '../lib/supabase';

interface VesselModalProps {
  vessel?: Vessel;
  contactName: string;
  onClose: () => void;
  onSave: (vessel: Partial<Vessel> | Partial<Vessel>[]) => void;
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
  const [marineTrafficId, setMarineTrafficId] = useState('');
  const [notes, setNotes] = useState('');
  const [destination, setDestination] = useState('');
  const [eta, setEta] = useState('');
  const [charterStatus, setCharterStatus] = useState('');
  const [isSearchingIMO, setIsSearchingIMO] = useState(false);
  const [imoSearchError, setImoSearchError] = useState('');

  const vesselNames = vesselName.split(';').map(name => name.trim()).filter(name => name.length > 0);
  const isMultipleVessels = vesselNames.length > 1;

  useEffect(() => {
    if (vessel) {
      setVesselName(vessel.vessel_name);
      setImoNumber(vessel.imo_number || '');
      setVesselType(vessel.vessel_type || '');
      setMarineTrafficUrl(vessel.marine_traffic_url || '');
      setMarineTrafficId(vessel.marine_traffic_id || '');
      setNotes(vessel.notes || '');
      setDestination(vessel.destination || '');
      setEta(vessel.eta ? vessel.eta.split('T')[0] : '');
      setCharterStatus(vessel.charter_status || '');
    }
  }, [vessel]);

  useEffect(() => {
    if (!vesselName.trim() || isMultipleVessels || vessel || imoNumber) {
      return;
    }

    const timeoutId = setTimeout(() => {
      handleSearchIMO();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [vesselName, isMultipleVessels]);

  useEffect(() => {
    if (imoNumber && imoNumber.length >= 7 && !marineTrafficUrl) {
      const cleanImo = imoNumber.replace(/[^0-9]/g, '');
      if (cleanImo.length === 7) {
        setMarineTrafficUrl(`https://www.marinetraffic.com/en/ais/details/ships/imo:${cleanImo}`);
      }
    }
  }, [imoNumber]);

  // Extract IMO and Ship ID from Marine Traffic URL when pasted
  useEffect(() => {
    if (marineTrafficUrl) {
      // Extract IMO if not already set
      if (!imoNumber) {
        const imoMatch = marineTrafficUrl.match(/imo[:\-]?(\d{7})/i);
        if (imoMatch) {
          setImoNumber(imoMatch[1]);
        }
      }

      // Extract ship ID
      const shipIdMatch = marineTrafficUrl.match(/shipid[:\-]?(\d+)/i);
      if (shipIdMatch) {
        setMarineTrafficId(shipIdMatch[1]);
      }
    }
  }, [marineTrafficUrl]);

  const handleSearchIMO = async () => {
    if (!vesselName.trim() || isMultipleVessels) return;

    setIsSearchingIMO(true);
    setImoSearchError('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-vessel-imo`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ vesselName: vesselName.trim() }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to search for vessel');
      }

      const data = await response.json();

      if (data.error) {
        setImoSearchError(data.error);
      } else if (data.imo) {
        setImoNumber(data.imo);
        if (data.mmsi) {
          setMarineTrafficUrl(`https://www.marinetraffic.com/en/ais/details/ships/imo:${data.imo}`);
        }
      }
    } catch (error) {
      console.error('Error searching for IMO:', error);
      setImoSearchError('Failed to search for vessel. Please try manually.');
    } finally {
      setIsSearchingIMO(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vesselName.trim()) return;

    if (isMultipleVessels) {
      const vessels = vesselNames.map(name => ({
        vessel_name: name,
        imo_number: null,
        vessel_type: vesselType || null,
        marine_traffic_url: null,
        marine_traffic_id: null,
        notes: notes.trim() || null,
        destination: destination.trim() || null,
        eta: eta ? new Date(eta).toISOString() : null,
        charter_status: charterStatus || null,
        last_updated: new Date().toISOString(),
      }));
      onSave(vessels);
    } else {
      onSave({
        ...(vessel ? { id: vessel.id } : {}),
        vessel_name: vesselName.trim(),
        imo_number: imoNumber.trim() || null,
        vessel_type: vesselType || null,
        marine_traffic_url: marineTrafficUrl.trim() || null,
        marine_traffic_id: marineTrafficId.trim() || null,
        notes: notes.trim() || null,
        destination: destination.trim() || null,
        eta: eta ? new Date(eta).toISOString() : null,
        charter_status: charterStatus || null,
        last_updated: new Date().toISOString(),
      });
    }

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
          <div className="mb-3 pb-3 border-b border-gray-100">
            <a
              href="https://www.marinetraffic.com/en/ais/home/centerx:1.9/centery:51.6/zoom:6"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              <Search className="w-4 h-4" />
              Search for vessels on Marine Traffic
            </a>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vessel Name{isMultipleVessels ? 's' : ''} *
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Ship className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={vesselName}
                  onChange={(e) => {
                    setVesselName(e.target.value);
                    setImoSearchError('');
                  }}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., MSC Gulsun or Ship1; Ship2; Ship3"
                />
              </div>
              {!isMultipleVessels && vesselName.trim() && (
                <button
                  type="button"
                  onClick={handleSearchIMO}
                  disabled={isSearchingIMO}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                >
                  <Search className="w-4 h-4" />
                  {isSearchingIMO ? 'Searching...' : 'Find IMO'}
                </button>
              )}
            </div>
            {imoSearchError && (
              <p className="text-xs text-red-600 mt-1">{imoSearchError}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Separate multiple vessel names with semicolons (;) to add them all at once
            </p>
            {isMultipleVessels && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Will create {vesselNames.length} vessels:
                </p>
                <ul className="text-sm text-blue-800 space-y-1">
                  {vesselNames.map((name, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Ship className="w-3 h-3" />
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {!isMultipleVessels && (
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
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vessel Type{isMultipleVessels ? ' (applies to all)' : ''}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Charter Status{isMultipleVessels ? ' (applies to all)' : ''}
            </label>
            <select
              value={charterStatus}
              onChange={(e) => setCharterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">None</option>
              <option value="TC">TC (Time Charter)</option>
              <option value="Bunkers Managed">Bunkers Managed</option>
            </select>
          </div>

          {!isMultipleVessels && (
            <>
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
                  placeholder="e.g., https://www.marinetraffic.com/en/ais/details/ships/shipid:5437592"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Paste the Marine Traffic vessel page URL - Ship ID will be extracted automatically
                </p>
              </div>

              {marineTrafficId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marine Traffic Ship ID
                  </label>
                  <input
                    type="text"
                    value={marineTrafficId}
                    onChange={(e) => setMarineTrafficId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 5437592"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Extracted from Marine Traffic URL
                  </p>
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Destination{isMultipleVessels ? ' (applies to all)' : ''}
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Port of Rotterdam"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ETA{isMultipleVessels ? ' (applies to all)' : ''}
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={eta}
                onChange={(e) => setEta(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {eta && (
              <p className="text-xs text-gray-600 mt-1">
                {(() => {
                  const etaDate = new Date(eta);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  etaDate.setHours(0, 0, 0, 0);
                  const daysRemaining = Math.ceil((etaDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                  if (daysRemaining < 0) {
                    return `Arrived ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? '' : 's'} ago`;
                  } else if (daysRemaining === 0) {
                    return 'Arriving today';
                  } else if (daysRemaining === 1) {
                    return 'Arriving tomorrow';
                  } else {
                    return `${daysRemaining} days remaining`;
                  }
                })()}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes{isMultipleVessels ? ' (applies to all)' : ''}
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
              {vessel ? 'Update' : 'Add'} {isMultipleVessels ? `${vesselNames.length} Vessels` : 'Vessel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
