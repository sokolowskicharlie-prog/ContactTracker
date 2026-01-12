import { useState, useEffect, useRef } from 'react';
import { MapPin, Ship, Truck, Anchor, X, Building2, ZoomIn, ZoomOut, Maximize2, Edit3, Save, Lock, Unlock } from 'lucide-react';
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggingPort, setDraggingPort] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [mapWidth, setMapWidth] = useState(60);
  const [isZoomLocked, setIsZoomLocked] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    loadPortLocations();
    loadMapWidth();
  }, []);

  const loadMapWidth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('map_width, map_zoom_locked')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data?.map_width) {
        setMapWidth(data.map_width);
      }
      if (data?.map_zoom_locked !== undefined) {
        setIsZoomLocked(data.map_zoom_locked);
      }
    } catch (error) {
      console.error('Error loading map width:', error);
    }
  };

  const saveMapWidth = async (width: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_preferences')
        .update({ map_width: width })
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving map width:', error);
    }
  };

  const toggleZoomLock = async () => {
    const newLockState = !isZoomLocked;
    setIsZoomLocked(newLockState);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_preferences')
        .update({ map_zoom_locked: newLockState })
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving zoom lock:', error);
    }
  };

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

  const svgToLatLng = (x: number, y: number) => {
    const minLat = 49.5;
    const maxLat = 61;
    const minLng = -8;
    const maxLng = 2;

    const mapWidth = 800;
    const mapHeight = 1000;

    const lng = (x / mapWidth) * (maxLng - minLng) + minLng;
    const lat = ((mapHeight - y) / mapHeight) * (maxLat - minLat) + minLat;

    return { lat, lng };
  };

  const getPortColor = (portName: string) => {
    const supplierCount = getSuppliersForPort(portName).length;
    if (supplierCount === 0) return '#D1D5DB';
    if (supplierCount < 3) return '#3B82F6';
    if (supplierCount < 6) return '#F59E0B';
    return '#EF4444';
  };

  const handleZoomIn = () => {
    if (isZoomLocked) return;
    setZoom((prev) => Math.min(prev * 1.3, 5));
  };

  const handleZoomOut = () => {
    if (isZoomLocked) return;
    setZoom((prev) => Math.max(prev / 1.3, 0.5));
  };

  const handleResetView = () => {
    if (isZoomLocked) return;
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !isEditMode) {
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
    if (isZoomLocked) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.max(0.5, Math.min(5, prev * delta)));
  };

  const handlePortMouseDown = (e: React.MouseEvent, portName: string) => {
    if (isEditMode) {
      e.stopPropagation();
      setDraggingPort(portName);
    }
  };

  const handlePortDrag = (e: React.MouseEvent) => {
    if (draggingPort && svgRef.current) {
      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      const svgX = ((e.clientX - rect.left - pan.x) / zoom) / (rect.width / 800);
      const svgY = ((e.clientY - rect.top - pan.y) / zoom) / (rect.height / 1000);

      const { lat, lng } = svgToLatLng(svgX, svgY);

      setPortLocations((prev) =>
        prev.map((port) =>
          port.port_name === draggingPort
            ? { ...port, latitude: lat, longitude: lng }
            : port
        )
      );
      setHasUnsavedChanges(true);
    }
  };

  const handlePortMouseUp = () => {
    setDraggingPort(null);
  };

  const savePortLocations = async () => {
    try {
      for (const port of portLocations) {
        const { error } = await supabase
          .from('uk_port_regions')
          .update({
            latitude: port.latitude,
            longitude: port.longitude,
          })
          .eq('port_name', port.port_name);

        if (error) throw error;
      }
      setHasUnsavedChanges(false);
      alert('Port locations saved successfully!');
    } catch (error) {
      console.error('Error saving port locations:', error);
      alert('Failed to save port locations');
    }
  };

  return (
    <div className="flex gap-4 h-full">
      <div
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col transition-all duration-300"
        style={{ width: `${mapWidth}%`, maxHeight: '100%' }}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900">UK Ports Map</h3>
            <div className="flex items-center gap-2">
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {[40, 50, 60, 70, 80].map((width) => (
                  <button
                    key={width}
                    onClick={() => {
                      setMapWidth(width);
                      saveMapWidth(width);
                    }}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      mapWidth === width
                        ? 'bg-blue-600 text-white'
                        : 'bg-transparent text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {width}%
                  </button>
                ))}
              </div>
              <input
                type="range"
                min="30"
                max="90"
                value={mapWidth}
                onChange={(e) => {
                  const width = Number(e.target.value);
                  setMapWidth(width);
                  saveMapWidth(width);
                }}
                className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            {hasUnsavedChanges && isEditMode && (
              <button
                onClick={savePortLocations}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            )}
            <button
              onClick={() => {
                if (hasUnsavedChanges && !confirm('You have unsaved changes. Discard them?')) {
                  return;
                }
                setIsEditMode(!isEditMode);
                setHasUnsavedChanges(false);
                loadPortLocations();
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${
                isEditMode
                  ? 'bg-red-100 hover:bg-red-200 text-red-700'
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              {isEditMode ? 'Exit Edit Mode' : 'Edit Mode'}
            </button>
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
              <button
                onClick={toggleZoomLock}
                className={`p-1.5 rounded transition-colors ${
                  isZoomLocked
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'hover:bg-white'
                }`}
                title={isZoomLocked ? 'Unlock Zoom' : 'Lock Zoom'}
              >
                {isZoomLocked ? (
                  <Lock className="w-4 h-4 text-white" />
                ) : (
                  <Unlock className="w-4 h-4 text-gray-600" />
                )}
              </button>
              <button
                onClick={handleZoomOut}
                disabled={isZoomLocked}
                className={`p-1.5 hover:bg-white rounded transition-colors ${
                  isZoomLocked ? 'opacity-40 cursor-not-allowed' : ''
                }`}
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={handleResetView}
                disabled={isZoomLocked}
                className={`p-1.5 hover:bg-white rounded transition-colors ${
                  isZoomLocked ? 'opacity-40 cursor-not-allowed' : ''
                }`}
                title="Reset View"
              >
                <Maximize2 className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={handleZoomIn}
                disabled={isZoomLocked}
                className={`p-1.5 hover:bg-white rounded transition-colors ${
                  isZoomLocked ? 'opacity-40 cursor-not-allowed' : ''
                }`}
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

        <div className="flex-1 p-4 min-h-0 flex items-center justify-center">
          <div
            className="relative bg-white rounded-lg"
            style={{
              width: '100%',
              height: '100%',
              maxWidth: 'calc(100% - 2rem)',
              maxHeight: 'calc(100% - 2rem)',
              aspectRatio: '0.8',
              cursor: draggingPort ? 'grabbing' : isPanning ? 'grabbing' : isEditMode ? 'default' : 'grab'
            }}
          >
            {isEditMode && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-10 text-sm font-medium">
                Edit Mode: Drag ports to reposition them
              </div>
            )}
            <svg
              ref={svgRef}
              viewBox="0 0 800 1000"
              className="w-full h-full"
              preserveAspectRatio="xMidYMid meet"
            onMouseDown={handleMouseDown}
            onMouseMove={(e) => {
              handleMouseMove(e);
              handlePortDrag(e);
            }}
            onMouseUp={() => {
              handleMouseUp();
              handlePortMouseUp();
            }}
            onMouseLeave={() => {
              handleMouseUp();
              handlePortMouseUp();
            }}
            onWheel={handleWheel}
          >
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              <image
                href="/image copy copy.png"
                x="0"
                y="0"
                width="800"
                height="1000"
                preserveAspectRatio="xMidYMid slice"
              />

              {portLocations.map((port) => {
                const { x, y } = latLngToSVG(port.latitude, port.longitude);
                const supplierCount = getSuppliersForPort(port.port_name).length;
                const isSelected = selectedPort === port.port_name;
                const isHovered = hoveredPort === port.port_name;
                const isDragging = draggingPort === port.port_name;
                const color = getPortColor(port.port_name);
                const radiusScale = 1 / zoom;

                return (
                  <g key={port.port_name}>
                    <circle
                      cx={x}
                      cy={y}
                      r={(isDragging ? 14 : isSelected ? 12 : isHovered ? 10 : 8) * radiusScale}
                      fill={isEditMode && (isDragging || isHovered) ? '#3B82F6' : color}
                      stroke={isEditMode ? '#1D4ED8' : 'white'}
                      strokeWidth={2 * radiusScale}
                      className={`transition-all duration-200 ${
                        isEditMode ? 'cursor-move' : 'cursor-pointer'
                      }`}
                      onClick={(e) => {
                        if (!isEditMode) {
                          e.stopPropagation();
                          setSelectedPort(isSelected ? null : port.port_name);
                        }
                      }}
                      onMouseDown={(e) => handlePortMouseDown(e, port.port_name)}
                      onMouseEnter={() => !isPanning && !draggingPort && setHoveredPort(port.port_name)}
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
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm text-xs text-gray-600 flex items-center gap-2">
              <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
              {isZoomLocked && (
                <span className="flex items-center gap-1 text-blue-600 font-medium">
                  <Lock className="w-3 h-3" />
                  Locked
                </span>
              )}
              <span>|</span>
              <span>{isEditMode ? 'Drag ports to move them' : 'Drag to pan'}</span>
            </div>
          </div>
        </div>
      </div>

      {selectedPort && (
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col min-w-0">
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
