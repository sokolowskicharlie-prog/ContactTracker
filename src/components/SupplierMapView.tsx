import { useState, useEffect } from 'react';
import { MapPin, Ship, Truck, Anchor, X, Building2 } from 'lucide-react';
import { supabase, SupplierWithOrders } from '../lib/supabase';

interface PortLocation {
  port_name: string;
  latitude: number;
  longitude: number;
  region: string;
}

interface SupplierMapViewProps {
  suppliers: SupplierWithOrders[];
  onSelectSupplier: (supplier: SupplierWithOrders) => void;
}

export default function SupplierMapView({ suppliers, onSelectSupplier }: SupplierMapViewProps) {
  const [portLocations, setPortLocations] = useState<PortLocation[]>([]);
  const [selectedPort, setSelectedPort] = useState<string | null>(null);
  const [hoveredPort, setHoveredPort] = useState<string | null>(null);

  useEffect(() => {
    loadPortLocations();
  }, []);

  const loadPortLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('uk_port_regions')
        .select(`
          port_name,
          latitude,
          longitude,
          region:uk_regions(name)
        `)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) throw error;

      const locations = (data || []).map((item: any) => ({
        port_name: item.port_name,
        latitude: parseFloat(item.latitude),
        longitude: parseFloat(item.longitude),
        region: item.region?.name || '',
      }));

      setPortLocations(locations);
    } catch (error) {
      console.error('Error loading port locations:', error);
    }
  };

  const getSuppliersForPort = (portName: string) => {
    return suppliers.filter((supplier) =>
      supplier.ports_detailed?.some(
        (port) => port.port_name.toLowerCase() === portName.toLowerCase()
      )
    );
  };

  const latLngToSVG = (lat: number, lng: number) => {
    const minLat = 49.5;
    const maxLat = 61;
    const minLng = -8;
    const maxLng = 2;

    const mapWidth = 800;
    const mapHeight = 1000;

    const x = ((lng - minLng) / (maxLng - minLng)) * mapWidth;
    const y = mapHeight - ((lat - minLat) / (maxLat - minLat)) * mapHeight;

    return { x, y };
  };

  const getPortColor = (portName: string) => {
    const supplierCount = getSuppliersForPort(portName).length;
    if (supplierCount === 0) return '#D1D5DB';
    if (supplierCount < 3) return '#3B82F6';
    if (supplierCount < 6) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-4 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">UK Ports Map</h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
              <span className="text-gray-600">No suppliers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-600">1-2</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-gray-600">3-5</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-600">6+</span>
            </div>
          </div>
        </div>

        <div className="relative w-full h-full overflow-auto">
          <svg
            viewBox="0 0 800 1000"
            className="w-full h-auto"
            style={{ minHeight: '600px' }}
          >
            <rect width="800" height="1000" fill="#E0F2FE" />

            {portLocations.map((port) => {
              const { x, y } = latLngToSVG(port.latitude, port.longitude);
              const supplierCount = getSuppliersForPort(port.port_name).length;
              const isSelected = selectedPort === port.port_name;
              const isHovered = hoveredPort === port.port_name;
              const color = getPortColor(port.port_name);

              return (
                <g key={port.port_name}>
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 12 : isHovered ? 10 : 8}
                    fill={color}
                    stroke="white"
                    strokeWidth="2"
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => setSelectedPort(isSelected ? null : port.port_name)}
                    onMouseEnter={() => setHoveredPort(port.port_name)}
                    onMouseLeave={() => setHoveredPort(null)}
                  />
                  {(isHovered || isSelected) && (
                    <text
                      x={x}
                      y={y - 15}
                      textAnchor="middle"
                      className="text-xs font-semibold pointer-events-none"
                      fill="#1F2937"
                      stroke="white"
                      strokeWidth="3"
                      paintOrder="stroke"
                    >
                      {port.port_name}
                    </text>
                  )}
                  {supplierCount > 0 && (
                    <text
                      x={x}
                      y={y + 5}
                      textAnchor="middle"
                      className="text-xs font-bold pointer-events-none"
                      fill="white"
                    >
                      {supplierCount}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {selectedPort && (
        <div className="w-96 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                {selectedPort}
              </h3>
              <p className="text-sm text-gray-600">
                {portLocations.find((p) => p.port_name === selectedPort)?.region}
              </p>
            </div>
            <button
              onClick={() => setSelectedPort(null)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {getSuppliersForPort(selectedPort).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No suppliers at this port</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getSuppliersForPort(selectedPort).map((supplier) => {
                  const portData = supplier.ports_detailed?.find(
                    (p) => p.port_name.toLowerCase() === selectedPort.toLowerCase()
                  );

                  return (
                    <div
                      key={supplier.id}
                      onClick={() => onSelectSupplier(supplier)}
                      className="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer"
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">{supplier.company_name}</h4>

                      {portData && (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {(portData.has_barge || supplier.default_has_barge) && (
                              <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                <Ship className="w-3 h-3" />
                                <span>Barge</span>
                              </div>
                            )}
                            {(portData.has_truck || supplier.default_has_truck) && (
                              <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                                <Truck className="w-3 h-3" />
                                <span>Truck</span>
                              </div>
                            )}
                            {(portData.has_expipe || supplier.default_has_expipe) && (
                              <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs">
                                <Anchor className="w-3 h-3" />
                                <span>Ex-Pipe</span>
                              </div>
                            )}
                          </div>

                          {portData.notes && (
                            <p className="text-xs text-gray-600">{portData.notes}</p>
                          )}
                        </div>
                      )}

                      {supplier.contact_person && (
                        <p className="text-xs text-gray-500 mt-2">
                          Contact: {supplier.contact_person}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
