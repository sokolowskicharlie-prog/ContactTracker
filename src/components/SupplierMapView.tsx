import { useState, useEffect, useRef } from 'react';
import { MapPin, Ship, Truck, Anchor, X, Building2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
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
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

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

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.3, 5));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.3, 0.5));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.max(0.5, Math.min(5, prev * delta)));
  };

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-4 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">UK Ports Map</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
              <button
                onClick={handleZoomOut}
                className="p-1.5 hover:bg-white rounded transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={handleResetView}
                className="p-1.5 hover:bg-white rounded transition-colors"
                title="Reset View"
              >
                <Maximize2 className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1.5 hover:bg-white rounded transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4 text-gray-600" />
              </button>
            </div>
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
        </div>

        <div
          className="relative flex-1 overflow-hidden bg-white rounded-lg"
          style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        >
          <svg
            ref={svgRef}
            viewBox="0 0 800 1000"
            className="w-full h-full"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              <image
                href="/image copy copy.png"
                x="0"
                y="0"
                width="800"
                height="1000"
                preserveAspectRatio="xMidYMid meet"
              />

              {portLocations.map((port) => {
                const { x, y } = latLngToSVG(port.latitude, port.longitude);
                const supplierCount = getSuppliersForPort(port.port_name).length;
                const isSelected = selectedPort === port.port_name;
                const isHovered = hoveredPort === port.port_name;
                const color = getPortColor(port.port_name);
                const radiusScale = 1 / zoom;

                return (
                  <g key={port.port_name}>
                    <circle
                      cx={x}
                      cy={y}
                      r={(isSelected ? 12 : isHovered ? 10 : 8) * radiusScale}
                      fill={color}
                      stroke="white"
                      strokeWidth={2 * radiusScale}
                      className="cursor-pointer transition-all duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPort(isSelected ? null : port.port_name);
                      }}
                      onMouseEnter={() => !isPanning && setHoveredPort(port.port_name)}
                      onMouseLeave={() => setHoveredPort(null)}
                    />
                    {(isHovered || isSelected) && (
                      <text
                        x={x}
                        y={y - 15 * radiusScale}
                        textAnchor="middle"
                        fontSize={12 * radiusScale}
                        className="font-semibold pointer-events-none"
                        fill="#1F2937"
                        stroke="white"
                        strokeWidth={3 * radiusScale}
                        paintOrder="stroke"
                      >
                        {port.port_name}
                      </text>
                    )}
                    {supplierCount > 0 && (
                      <text
                        x={x}
                        y={y + 5 * radiusScale}
                        textAnchor="middle"
                        fontSize={10 * radiusScale}
                        className="font-bold pointer-events-none"
                        fill="white"
                      >
                        {supplierCount}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm text-xs text-gray-600">
            Zoom: {(zoom * 100).toFixed(0)}% | Drag to pan
          </div>
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
