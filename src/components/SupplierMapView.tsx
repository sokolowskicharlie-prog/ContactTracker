import { useState, useEffect, useRef } from 'react';
import { MapPin, Ship, Truck, Anchor, X, Building2, ZoomIn, ZoomOut, Maximize2, CreditCard as Edit3, Save, Lock, Unlock, Plus } from 'lucide-react';
import { supabase, SupplierWithOrders } from '../lib/supabase';

interface Region {
  id: string;
  name: string;
}

interface PortLocation {
  id?: string;
  port_name: string;
  latitude: number;
  longitude: number;
  region: string;
  region_id: string;
}

interface SupplierMapViewProps {
  suppliers: SupplierWithOrders[];
  onSelectSupplier: (supplier: SupplierWithOrders) => void;
}

export default function SupplierMapView({ suppliers, onSelectSupplier }: SupplierMapViewProps) {
  const [portLocations, setPortLocations] = useState<PortLocation[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedPort, setSelectedPort] = useState<string | null>(null);
  const [hoveredPort, setHoveredPort] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggingPort, setDraggingPort] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [mapWidth, setMapWidth] = useState(60);
  const [isZoomLocked, setIsZoomLocked] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDraggingMap, setIsDraggingMap] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showAddPort, setShowAddPort] = useState(false);
  const [newPortName, setNewPortName] = useState('');
  const [newPortRegion, setNewPortRegion] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    loadPortLocations();
    loadRegions();
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

  const loadRegions = async () => {
    try {
      const { data, error } = await supabase
        .from('uk_regions')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setRegions(data || []);
    } catch (error) {
      console.error('Error loading regions:', error);
    }
  };

  const loadPortLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('uk_port_regions')
        .select(`
          id,
          port_name,
          latitude,
          longitude,
          region_id,
          region:uk_regions(name)
        `)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) throw error;

      const locations = (data || []).map((item: any) => ({
        id: item.id,
        port_name: item.port_name,
        latitude: parseFloat(item.latitude),
        longitude: parseFloat(item.longitude),
        region: item.region?.name || '',
        region_id: item.region_id || '',
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
    if (!isZoomLocked) return;
    setZoom((prev) => Math.min(prev * 1.3, 5));
  };

  const handleZoomOut = () => {
    if (!isZoomLocked) return;
    setZoom((prev) => Math.max(prev / 1.3, 0.5));
  };

  const handleResetView = () => {
    if (!isZoomLocked) return;
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!isZoomLocked) return;
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

      // Get mouse position relative to SVG in pixel coordinates
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Convert to SVG viewBox coordinates (0-800, 0-1000)
      const viewBoxX = (mouseX / rect.width) * 800;
      const viewBoxY = (mouseY / rect.height) * 1000;

      // Reverse the transform to get actual SVG coordinates
      // Transform is: translate(400 + panOffset.x/zoom, 500 + panOffset.y/zoom) scale(zoom) translate(-400, -500)
      const centerX = 400 + panOffset.x / zoom;
      const centerY = 500 + panOffset.y / zoom;

      const svgX = (viewBoxX - centerX) / zoom + 400;
      const svgY = (viewBoxY - centerY) / zoom + 500;

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

  const handleMapMouseDown = (e: React.MouseEvent) => {
    if (isZoomLocked && !isEditMode && !draggingPort) {
      setIsDraggingMap(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMapMouseMove = (e: React.MouseEvent) => {
    if (isDraggingMap) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMapMouseUp = () => {
    setIsDraggingMap(false);
  };

  const savePortLocations = async () => {
    try {
      for (const port of portLocations) {
        if (port.id) {
          const { error } = await supabase
            .from('uk_port_regions')
            .update({
              latitude: port.latitude,
              longitude: port.longitude,
              region_id: port.region_id,
            })
            .eq('id', port.id);

          if (error) throw error;
        }
      }
      setHasUnsavedChanges(false);
      alert('Port locations saved successfully!');
      loadPortLocations();
    } catch (error) {
      console.error('Error saving port locations:', error);
      alert('Failed to save port locations');
    }
  };

  const handleAddPort = async () => {
    if (!newPortName.trim() || !newPortRegion) {
      alert('Please enter a port name and select a region');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('uk_port_regions')
        .insert({
          port_name: newPortName.toUpperCase().trim(),
          region_id: newPortRegion,
          latitude: 55,
          longitude: -3,
        })
        .select(`
          id,
          port_name,
          latitude,
          longitude,
          region_id,
          region:uk_regions(name)
        `)
        .single();

      if (error) throw error;

      if (data) {
        const newPort: PortLocation = {
          id: data.id,
          port_name: data.port_name,
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
          region: data.region?.name || '',
          region_id: data.region_id,
        };
        setPortLocations([...portLocations, newPort]);
        setNewPortName('');
        setNewPortRegion('');
        setShowAddPort(false);
        alert('Port added successfully! Drag it to the correct position and save.');
      }
    } catch (error: any) {
      console.error('Error adding port:', error);
      if (error.code === '23505') {
        alert('A port with this name already exists');
      } else {
        alert('Failed to add port');
      }
    }
  };

  const handleRegionChange = (portName: string, newRegionId: string) => {
    setPortLocations((prev) =>
      prev.map((port) => {
        if (port.port_name === portName) {
          const newRegion = regions.find((r) => r.id === newRegionId);
          return {
            ...port,
            region_id: newRegionId,
            region: newRegion?.name || port.region,
          };
        }
        return port;
      })
    );
    setHasUnsavedChanges(true);
  };

  return (
    <div className="flex gap-4 h-full">
      <div
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col transition-all duration-300"
        style={{ width: `${mapWidth}%`, maxHeight: '100%' }}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0 flex-wrap gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-900 whitespace-nowrap">UK Ports Map</h3>
            <div className="flex items-center gap-2">
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {[40, 50, 60, 70, 80, 100].map((width) => (
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
                max="100"
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
          <div className="flex items-center gap-4 flex-wrap">
            {hasUnsavedChanges && isEditMode && (
              <button
                onClick={savePortLocations}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            )}
            {isEditMode && (
              <button
                onClick={() => setShowAddPort(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Port
              </button>
            )}
            <button
              onClick={() => {
                if (hasUnsavedChanges && !confirm('You have unsaved changes. Discard them?')) {
                  return;
                }
                setIsEditMode(!isEditMode);
                setHasUnsavedChanges(false);
                setShowAddPort(false);
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
                title={isZoomLocked ? 'Disable Pan & Zoom' : 'Enable Pan & Zoom'}
              >
                {isZoomLocked ? (
                  <Lock className="w-4 h-4 text-white" />
                ) : (
                  <Unlock className="w-4 h-4 text-gray-600" />
                )}
              </button>
              <button
                onClick={handleZoomOut}
                disabled={!isZoomLocked}
                className={`p-1.5 hover:bg-white rounded transition-colors ${
                  !isZoomLocked ? 'opacity-40 cursor-not-allowed' : ''
                }`}
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={handleResetView}
                disabled={!isZoomLocked}
                className={`p-1.5 hover:bg-white rounded transition-colors ${
                  !isZoomLocked ? 'opacity-40 cursor-not-allowed' : ''
                }`}
                title="Reset View"
              >
                <Maximize2 className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={handleZoomIn}
                disabled={!isZoomLocked}
                className={`p-1.5 hover:bg-white rounded transition-colors ${
                  !isZoomLocked ? 'opacity-40 cursor-not-allowed' : ''
                }`}
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="flex items-center gap-3 text-xs flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <span className="text-gray-600 whitespace-nowrap">No suppliers</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-gray-600">1-2</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-gray-600">3-5</span>
              </div>
              <div className="flex items-center gap-1.5">
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
              cursor: draggingPort ? 'grabbing' : isDraggingMap ? 'grabbing' : isZoomLocked && !isEditMode ? 'grab' : isEditMode ? 'default' : 'default'
            }}
          >
            {isEditMode && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-10 text-sm font-medium max-w-xs text-center">
                Edit Mode: Drag ports to reposition
              </div>
            )}
            <svg
              ref={svgRef}
              viewBox="0 0 800 1000"
              className="w-full h-full"
              preserveAspectRatio="xMidYMid meet"
              onMouseDown={handleMapMouseDown}
              onMouseMove={(e) => {
                handleMapMouseMove(e);
                handlePortDrag(e);
              }}
              onMouseUp={() => {
                handleMapMouseUp();
                handlePortMouseUp();
              }}
              onMouseLeave={() => {
                handleMapMouseUp();
                handlePortMouseUp();
              }}
              onWheel={handleWheel}
              style={{ transformOrigin: 'center center' }}
            >
              <g transform={`translate(${400 + panOffset.x / zoom}, ${500 + panOffset.y / zoom}) scale(${zoom}) translate(-400, -500)`}>
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
                      onMouseEnter={() => !draggingPort && setHoveredPort(port.port_name)}
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
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm text-xs text-gray-600 flex items-center gap-2">
              <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
              {isZoomLocked && (
                <>
                  <span>|</span>
                  <span className="flex items-center gap-1 text-blue-600 font-medium">
                    <Lock className="w-3 h-3" />
                    Pan & Zoom Enabled
                  </span>
                </>
              )}
              {isEditMode && (
                <>
                  <span>|</span>
                  <span>Drag ports to reposition</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedPort && (
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col min-w-0">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                {selectedPort}
              </h3>
              <button
                onClick={() => setSelectedPort(null)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {isEditMode ? (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Region</label>
                <select
                  value={portLocations.find((p) => p.port_name === selectedPort)?.region_id || ''}
                  onChange={(e) => handleRegionChange(selectedPort, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a region</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                {portLocations.find((p) => p.port_name === selectedPort)?.region}
              </p>
            )}
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

      {showAddPort && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Add New Port</h2>
                <button
                  onClick={() => {
                    setShowAddPort(false);
                    setNewPortName('');
                    setNewPortRegion('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Port Name
                </label>
                <input
                  type="text"
                  value={newPortName}
                  onChange={(e) => setNewPortName(e.target.value)}
                  placeholder="Enter port name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region
                </label>
                <select
                  value={newPortRegion}
                  onChange={(e) => setNewPortRegion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a region</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-sm text-gray-600">
                The port will be added at a default location. You can drag it to the correct position on the map and then save your changes.
              </p>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddPort(false);
                  setNewPortName('');
                  setNewPortRegion('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPort}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Add Port
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
