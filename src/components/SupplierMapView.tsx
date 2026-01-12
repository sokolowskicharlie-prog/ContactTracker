import { useState, useEffect, useRef } from 'react';
import { MapPin, Ship, Truck, Anchor, X, Building2, CreditCard as Edit3, Save, Plus, Trash2, Download, Lock, Search, Mail, Copy } from 'lucide-react';
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
  const [newPortRegion, setNewPortRegion] = useState('');
  const [availablePorts, setAvailablePorts] = useState<string[]>([]);
  const [selectedPortsToAdd, setSelectedPortsToAdd] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [selectedSupplierRanges, setSelectedSupplierRanges] = useState<string[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    loadPortLocations();
    loadRegions();
    loadMapWidth();
    loadAvailablePorts();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      return;
    }

    const results = portLocations
      .filter((port) =>
        port.port_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map((port) => port.port_name);

    setSearchResults(results);

    if (results.length === 1) {
      setSelectedPort(results[0]);
    }
  }, [searchTerm, portLocations]);

  const loadAvailablePorts = async () => {
    try {
      const { data: supplierPortsData } = await supabase
        .from('supplier_ports')
        .select('port_name');

      const { data: suppliersData } = await supabase
        .from('suppliers')
        .select('ports');

      const portsSet = new Set<string>();

      if (supplierPortsData) {
        supplierPortsData.forEach(item => {
          if (item.port_name) {
            portsSet.add(item.port_name.trim());
          }
        });
      }

      if (suppliersData) {
        suppliersData.forEach(supplier => {
          if (supplier.ports) {
            const legacyPorts = supplier.ports.split(';').map(p => p.trim()).filter(p => p.length > 0);
            legacyPorts.forEach(port => portsSet.add(port));
          }
        });
      }

      const availableToAdd = Array.from(portsSet).sort();

      setAvailablePorts(availableToAdd);
    } catch (error) {
      console.error('Error loading available ports:', error);
    }
  };

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

  const getEmailsForPort = (portName: string) => {
    const portSuppliers = getSuppliersForPort(portName);
    const emailsSet = new Set<string>();

    portSuppliers.forEach((supplier) => {
      if (supplier.email) {
        emailsSet.add(supplier.email.trim().toLowerCase());
      }
      if (supplier.general_email) {
        emailsSet.add(supplier.general_email.trim().toLowerCase());
      }
      supplier.contacts?.forEach((contact) => {
        if (contact.email) {
          emailsSet.add(contact.email.trim().toLowerCase());
        }
      });
    });

    return Array.from(emailsSet).sort();
  };

  const copyEmailsToClipboard = (emails: string[]) => {
    const emailString = emails.join('; ');
    navigator.clipboard.writeText(emailString).then(() => {
      alert('Emails copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy emails');
    });
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

  const getSupplierRange = (count: number): string => {
    if (count === 0) return 'none';
    if (count <= 2) return '1-2';
    if (count <= 5) return '3-5';
    return '6+';
  };

  const meetsSupplierCountFilter = (portName: string) => {
    if (selectedSupplierRanges.length === 0) return true;
    const supplierCount = getSuppliersForPort(portName).length;
    const range = getSupplierRange(supplierCount);
    return selectedSupplierRanges.includes(range);
  };

  const hasActiveSupplierFilter = selectedSupplierRanges.length > 0;

  const toggleSupplierRange = (range: string) => {
    setSelectedSupplierRanges(prev =>
      prev.includes(range)
        ? prev.filter(r => r !== range)
        : [...prev, range]
    );
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
    if (selectedPortsToAdd.length === 0) {
      alert('Please select at least one port');
      return;
    }

    try {
      const addedPorts: PortLocation[] = [];
      const skippedPorts: string[] = [];

      for (const portName of selectedPortsToAdd) {
        const portToInsert = {
          port_name: portName.toUpperCase().trim(),
          region_id: newPortRegion || null,
          latitude: 60,
          longitude: 1,
        };

        const { data, error } = await supabase
          .from('uk_port_regions')
          .insert([portToInsert])
          .select(`
            id,
            port_name,
            latitude,
            longitude,
            region_id,
            region:uk_regions(name)
          `)
          .single();

        if (error) {
          if (error.code === '23505') {
            skippedPorts.push(portName);
          } else {
            throw error;
          }
        } else if (data) {
          addedPorts.push({
            id: data.id,
            port_name: data.port_name,
            latitude: parseFloat(data.latitude),
            longitude: parseFloat(data.longitude),
            region: data.region?.name || '',
            region_id: data.region_id,
          });
        }
      }

      if (addedPorts.length > 0) {
        setPortLocations([...portLocations, ...addedPorts]);
      }

      setNewPortRegion('');
      setSelectedPortsToAdd([]);
      setShowAddPort(false);
      loadAvailablePorts();

      let message = '';
      if (addedPorts.length > 0) {
        message += `${addedPorts.length} port(s) added successfully! Drag them to the correct positions and save.`;
      }
      if (skippedPorts.length > 0) {
        if (message) message += '\n\n';
        message += `${skippedPorts.length} port(s) already exist on the map and were skipped: ${skippedPorts.join(', ')}`;
      }
      if (message) {
        alert(message);
      }
    } catch (error: any) {
      console.error('Error adding port:', error);
      alert('Failed to add ports: ' + (error.message || 'Unknown error'));
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

  const handleDeletePort = async (portName: string) => {
    if (!confirm(`Are you sure you want to delete ${portName}? This cannot be undone.`)) {
      return;
    }

    try {
      const port = portLocations.find((p) => p.port_name === portName);
      if (!port?.id) return;

      const { error } = await supabase
        .from('uk_port_regions')
        .delete()
        .eq('id', port.id);

      if (error) throw error;

      setPortLocations((prev) => prev.filter((p) => p.port_name !== portName));
      if (selectedPort === portName) {
        setSelectedPort(null);
      }
      alert('Port deleted successfully!');
    } catch (error) {
      console.error('Error deleting port:', error);
      alert('Failed to delete port');
    }
  };

  const handleImportAllPorts = async () => {
    try {
      // Get all unique port names from supplier_ports
      const { data: supplierPorts, error: fetchError } = await supabase
        .from('supplier_ports')
        .select('port_name');

      if (fetchError) throw fetchError;

      if (!supplierPorts || supplierPorts.length === 0) {
        alert('No ports found in supplier data');
        return;
      }

      // Get unique port names
      const uniquePortNames = [...new Set(supplierPorts.map((p) => p.port_name.toUpperCase().trim()))];

      // Get existing port names
      const existingPortNames = new Set(portLocations.map((p) => p.port_name.toUpperCase()));

      // Filter out ports that already exist
      const newPortNames = uniquePortNames.filter((name) => !existingPortNames.has(name));

      if (newPortNames.length === 0) {
        alert('All ports are already on the map!');
        return;
      }

      if (!confirm(`This will add ${newPortNames.length} new port${newPortNames.length !== 1 ? 's' : ''} to the map (ports already on the map will be skipped). Continue?`)) {
        return;
      }

      // Get default region (first one)
      if (regions.length === 0) {
        alert('No regions available. Please refresh the page.');
        return;
      }

      const defaultRegion = regions[0];

      // Insert all new ports
      const newPorts = newPortNames.map((portName) => ({
        port_name: portName,
        region_id: defaultRegion.id,
        latitude: 60,
        longitude: 1,
      }));

      const { data: insertedPorts, error: insertError } = await supabase
        .from('uk_port_regions')
        .insert(newPorts)
        .select(`
          id,
          port_name,
          latitude,
          longitude,
          region_id,
          region:uk_regions(name)
        `);

      if (insertError) throw insertError;

      if (insertedPorts) {
        const formattedPorts: PortLocation[] = insertedPorts.map((port: any) => ({
          id: port.id,
          port_name: port.port_name,
          latitude: parseFloat(port.latitude),
          longitude: parseFloat(port.longitude),
          region: port.region?.name || '',
          region_id: port.region_id,
        }));

        setPortLocations([...portLocations, ...formattedPorts]);
        alert(`Added ${newPortNames.length} new ports! Drag them to the correct positions and assign regions, then save.`);
      }
    } catch (error) {
      console.error('Error importing ports:', error);
      alert('Failed to import ports');
    }
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search ports..."
                  className="pl-9 pr-8 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48"
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSearchResults([]);
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {searchTerm && searchResults.length > 0 && (
                <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-lg whitespace-nowrap">
                  {searchResults.length} match{searchResults.length !== 1 ? 'es' : ''}
                </span>
              )}
              {searchTerm && searchResults.length === 0 && (
                <span className="text-xs font-medium px-2 py-1 bg-red-100 text-red-700 rounded-lg whitespace-nowrap">
                  No matches
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
              <span className="text-xs text-gray-600 font-medium whitespace-nowrap">Filter:</span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedSupplierRanges.includes('none')}
                    onChange={() => toggleSupplierRange('none')}
                    className="w-3.5 h-3.5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                  <span className="text-xs text-gray-600 whitespace-nowrap">None</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedSupplierRanges.includes('1-2')}
                    onChange={() => toggleSupplierRange('1-2')}
                    className="w-3.5 h-3.5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-gray-600">1-2</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedSupplierRanges.includes('3-5')}
                    onChange={() => toggleSupplierRange('3-5')}
                    className="w-3.5 h-3.5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                  <span className="text-xs text-gray-600">3-5</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedSupplierRanges.includes('6+')}
                    onChange={() => toggleSupplierRange('6+')}
                    className="w-3.5 h-3.5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                  <span className="text-xs text-gray-600">6+</span>
                </label>
              </div>
              {hasActiveSupplierFilter && (
                <>
                  <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-lg whitespace-nowrap">
                    {portLocations.filter(p => meetsSupplierCountFilter(p.port_name)).length} ports
                  </span>
                  <button
                    onClick={() => setSelectedSupplierRanges([])}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Clear supplier filter"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
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
              <>
                <button
                  onClick={handleImportAllPorts}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Import All Ports
                </button>
                <button
                  onClick={() => {
                    loadAvailablePorts();
                    setShowAddPort(true);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Port
                </button>
              </>
            )}
            <button
              onClick={() => {
                if (hasUnsavedChanges && !confirm('You have unsaved changes. Discard them?')) {
                  return;
                }
                setIsEditMode(!isEditMode);
                setHasUnsavedChanges(false);
                setShowAddPort(false);
                setSelectedPortsToAdd([]);
                setNewPortRegion('');
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
                const isSearchMatch = searchResults.includes(port.port_name);
                const hasActiveSearch = searchTerm.trim() !== '';
                const meetsSupplierFilter = meetsSupplierCountFilter(port.port_name);
                const isGreyedOut = (hasActiveSearch && !isSearchMatch) || (hasActiveSupplierFilter && !meetsSupplierFilter);
                const color = getPortColor(port.port_name);
                const radiusScale = 1 / zoom;

                return (
                  <g key={port.port_name} style={{ opacity: isGreyedOut ? 0.25 : 1 }}>
                    <circle
                      cx={x}
                      cy={y}
                      r={(isDragging ? 14 : isSelected ? 12 : isHovered ? 10 : isSearchMatch ? 10 : 8) * radiusScale}
                      fill={isGreyedOut ? '#9CA3AF' : isEditMode && (isDragging || isHovered) ? '#3B82F6' : isSearchMatch ? '#10B981' : color}
                      stroke={isEditMode ? '#1D4ED8' : isSearchMatch ? '#059669' : 'white'}
                      strokeWidth={isSearchMatch ? 3 * radiusScale : 2 * radiusScale}
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
                    {(isHovered || isSelected || isSearchMatch) && (
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
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
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
                <button
                  onClick={() => handleDeletePort(selectedPort)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Port
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                {portLocations.find((p) => p.port_name === selectedPort)?.region}
              </p>
            )}
          </div>

          {getEmailsForPort(selectedPort).length > 0 && (
            <div className="p-4 border-b border-gray-200 bg-blue-50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  All Associated Emails ({getEmailsForPort(selectedPort).length})
                </h4>
                <button
                  onClick={() => copyEmailsToClipboard(getEmailsForPort(selectedPort))}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                  title="Copy all emails"
                >
                  <Copy className="w-3 h-3" />
                  Copy All
                </button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {getEmailsForPort(selectedPort).map((email) => (
                  <a
                    key={email}
                    href={`mailto:${email}`}
                    className="inline-flex items-center gap-1.5 px-2 py-1 bg-white text-blue-700 rounded text-xs hover:bg-blue-100 transition-colors border border-blue-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Mail className="w-3 h-3" />
                    {email}
                  </a>
                ))}
              </div>
            </div>
          )}

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
                <h2 className="text-xl font-semibold text-gray-900">Add Ports</h2>
                <button
                  onClick={() => {
                    setShowAddPort(false);
                    setNewPortRegion('');
                    setSelectedPortsToAdd([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Select Ports ({selectedPortsToAdd.length} selected)
                    </label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Ports already on the map will be skipped if selected
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {selectedPortsToAdd.length < availablePorts.length && availablePorts.length > 0 && (
                      <button
                        onClick={() => setSelectedPortsToAdd([...availablePorts])}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Select All
                      </button>
                    )}
                    {selectedPortsToAdd.length > 0 && (
                      <button
                        onClick={() => setSelectedPortsToAdd([])}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>
                <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
                  {availablePorts.length === 0 ? (
                    <div className="text-sm text-gray-500 p-4 text-center space-y-1">
                      <p className="font-medium">No ports found</p>
                      <p className="text-xs">No ports are available from your supplier data</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {availablePorts.map((port) => {
                        const existsOnMap = portLocations.some(p => p.port_name.toUpperCase() === port.toUpperCase());
                        return (
                          <label
                            key={port}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPortsToAdd.includes(port)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPortsToAdd([...selectedPortsToAdd, port]);
                                } else {
                                  setSelectedPortsToAdd(selectedPortsToAdd.filter((p) => p !== port));
                                }
                              }}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                            <span className="text-sm text-gray-900 flex-1">{port}</span>
                            {existsOnMap && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                Already on map
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <select
                  value={newPortRegion}
                  onChange={(e) => setNewPortRegion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a region (optional)</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-sm text-gray-600">
                Selected ports will be added at a default location. You can drag them to the correct positions on the map and then save your changes.
              </p>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddPort(false);
                  setNewPortRegion('');
                  setSelectedPortsToAdd([]);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPort}
                disabled={selectedPortsToAdd.length === 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Selected Ports
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
