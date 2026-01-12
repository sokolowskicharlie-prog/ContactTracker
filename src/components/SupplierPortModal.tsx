import { X, Anchor, Truck, Ship, FileText, Fuel, Plus, Edit2, Check, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { SupplierPort, CustomFuelType, CustomDeliveryMethod, supabase } from '../lib/supabase';

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
  const [hasVlsfo, setHasVlsfo] = useState(false);
  const [hasLsmgo, setHasLsmgo] = useState(false);
  const [notes, setNotes] = useState('');
  const [customFuelTypes, setCustomFuelTypes] = useState<CustomFuelType[]>([]);
  const [customDeliveryMethods, setCustomDeliveryMethods] = useState<CustomDeliveryMethod[]>([]);
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<string[]>([]);
  const [selectedDeliveryMethods, setSelectedDeliveryMethods] = useState<string[]>([]);
  const [newFuelType, setNewFuelType] = useState('');
  const [newDeliveryMethod, setNewDeliveryMethod] = useState('');
  const [showAddFuelType, setShowAddFuelType] = useState(false);
  const [showAddDeliveryMethod, setShowAddDeliveryMethod] = useState(false);
  const [editingFuelTypeId, setEditingFuelTypeId] = useState<string | null>(null);
  const [editingFuelTypeName, setEditingFuelTypeName] = useState('');
  const [editingDeliveryMethodId, setEditingDeliveryMethodId] = useState<string | null>(null);
  const [editingDeliveryMethodName, setEditingDeliveryMethodName] = useState('');
  const [vlsfoName, setVlsfoName] = useState('VLSFO');
  const [lsmgoName, setLsmgoName] = useState('LSMGO');
  const [editingVlsfo, setEditingVlsfo] = useState(false);
  const [editingLsmgo, setEditingLsmgo] = useState(false);
  const [editVlsfoValue, setEditVlsfoValue] = useState('');
  const [editLsmgoValue, setEditLsmgoValue] = useState('');

  useEffect(() => {
    loadCustomTypes();
    loadFuelNames();
  }, []);

  useEffect(() => {
    if (supplierPort) {
      setPortName(supplierPort.port_name);
      setHasBarge(supplierPort.has_barge);
      setHasTruck(supplierPort.has_truck);
      setHasExpipe(supplierPort.has_expipe);
      setHasVlsfo(supplierPort.has_vlsfo);
      setHasLsmgo(supplierPort.has_lsmgo);
      setNotes(supplierPort.notes || '');
      setSelectedFuelTypes((supplierPort.custom_fuel_types || []).map(ft => ft.id));
      setSelectedDeliveryMethods((supplierPort.custom_delivery_methods || []).map(dm => dm.id));
    }
  }, [supplierPort]);

  const loadCustomTypes = async () => {
    try {
      const { data: fuelTypes } = await supabase
        .from('custom_fuel_types')
        .select('*')
        .order('name');

      const { data: deliveryMethods } = await supabase
        .from('custom_delivery_methods')
        .select('*')
        .order('name');

      setCustomFuelTypes(fuelTypes || []);
      setCustomDeliveryMethods(deliveryMethods || []);
    } catch (error) {
      console.error('Error loading custom types:', error);
    }
  };

  const loadFuelNames = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('vlsfo_name, lsmgo_name')
        .eq('user_id', user.user.id)
        .maybeSingle();

      if (prefs) {
        setVlsfoName(prefs.vlsfo_name || 'VLSFO');
        setLsmgoName(prefs.lsmgo_name || 'LSMGO');
      }
    } catch (error) {
      console.error('Error loading fuel names:', error);
    }
  };

  const startEditingVlsfo = () => {
    setEditingVlsfo(true);
    setEditVlsfoValue(vlsfoName);
  };

  const startEditingLsmgo = () => {
    setEditingLsmgo(true);
    setEditLsmgoValue(lsmgoName);
  };

  const saveVlsfoName = async () => {
    if (!editVlsfoValue.trim()) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from('user_preferences')
        .update({ vlsfo_name: editVlsfoValue.trim() })
        .eq('user_id', user.user.id);

      if (error) throw error;

      setVlsfoName(editVlsfoValue.trim());
      setEditingVlsfo(false);
      setEditVlsfoValue('');
    } catch (error) {
      console.error('Error updating VLSFO name:', error);
    }
  };

  const saveLsmgoName = async () => {
    if (!editLsmgoValue.trim()) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from('user_preferences')
        .update({ lsmgo_name: editLsmgoValue.trim() })
        .eq('user_id', user.user.id);

      if (error) throw error;

      setLsmgoName(editLsmgoValue.trim());
      setEditingLsmgo(false);
      setEditLsmgoValue('');
    } catch (error) {
      console.error('Error updating LSMGO name:', error);
    }
  };

  const cancelEditingVlsfo = () => {
    setEditingVlsfo(false);
    setEditVlsfoValue('');
  };

  const cancelEditingLsmgo = () => {
    setEditingLsmgo(false);
    setEditLsmgoValue('');
  };

  const handleAddFuelType = async () => {
    if (!newFuelType.trim()) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('custom_fuel_types')
        .insert([{ name: newFuelType.trim(), user_id: user.user.id }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setCustomFuelTypes([...customFuelTypes, data]);
        setSelectedFuelTypes([...selectedFuelTypes, data.id]);
        setNewFuelType('');
        setShowAddFuelType(false);
      }
    } catch (error) {
      console.error('Error adding fuel type:', error);
    }
  };

  const handleAddDeliveryMethod = async () => {
    if (!newDeliveryMethod.trim()) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('custom_delivery_methods')
        .insert([{ name: newDeliveryMethod.trim(), user_id: user.user.id }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setCustomDeliveryMethods([...customDeliveryMethods, data]);
        setSelectedDeliveryMethods([...selectedDeliveryMethods, data.id]);
        setNewDeliveryMethod('');
        setShowAddDeliveryMethod(false);
      }
    } catch (error) {
      console.error('Error adding delivery method:', error);
    }
  };

  const toggleFuelType = (id: string) => {
    setSelectedFuelTypes(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleDeliveryMethod = (id: string) => {
    setSelectedDeliveryMethods(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleEditFuelType = (fuelType: CustomFuelType) => {
    setEditingFuelTypeId(fuelType.id);
    setEditingFuelTypeName(fuelType.name);
  };

  const handleSaveFuelType = async () => {
    if (!editingFuelTypeId || !editingFuelTypeName.trim()) return;

    try {
      const { error } = await supabase
        .from('custom_fuel_types')
        .update({ name: editingFuelTypeName.trim() })
        .eq('id', editingFuelTypeId);

      if (error) throw error;

      setCustomFuelTypes(
        customFuelTypes.map(ft =>
          ft.id === editingFuelTypeId ? { ...ft, name: editingFuelTypeName.trim() } : ft
        )
      );
      setEditingFuelTypeId(null);
      setEditingFuelTypeName('');
    } catch (error) {
      console.error('Error updating fuel type:', error);
    }
  };

  const handleEditDeliveryMethod = (method: CustomDeliveryMethod) => {
    setEditingDeliveryMethodId(method.id);
    setEditingDeliveryMethodName(method.name);
  };

  const handleSaveDeliveryMethod = async () => {
    if (!editingDeliveryMethodId || !editingDeliveryMethodName.trim()) return;

    try {
      const { error } = await supabase
        .from('custom_delivery_methods')
        .update({ name: editingDeliveryMethodName.trim() })
        .eq('id', editingDeliveryMethodId);

      if (error) throw error;

      setCustomDeliveryMethods(
        customDeliveryMethods.map(dm =>
          dm.id === editingDeliveryMethodId ? { ...dm, name: editingDeliveryMethodName.trim() } : dm
        )
      );
      setEditingDeliveryMethodId(null);
      setEditingDeliveryMethodName('');
    } catch (error) {
      console.error('Error updating delivery method:', error);
    }
  };

  const savePortRelationships = async (portId: string) => {
    try {
      if (selectedFuelTypes.length > 0) {
        await supabase.from('supplier_port_fuel_types').delete().eq('port_id', portId);
        const fuelTypeInserts = selectedFuelTypes.map(ftId => ({
          port_id: portId,
          fuel_type_id: ftId,
        }));
        await supabase.from('supplier_port_fuel_types').insert(fuelTypeInserts);
      } else {
        await supabase.from('supplier_port_fuel_types').delete().eq('port_id', portId);
      }

      if (selectedDeliveryMethods.length > 0) {
        await supabase.from('supplier_port_delivery_methods').delete().eq('port_id', portId);
        const deliveryMethodInserts = selectedDeliveryMethods.map(dmId => ({
          port_id: portId,
          delivery_method_id: dmId,
        }));
        await supabase.from('supplier_port_delivery_methods').insert(deliveryMethodInserts);
      } else {
        await supabase.from('supplier_port_delivery_methods').delete().eq('port_id', portId);
      }
    } catch (error) {
      console.error('Error saving port relationships:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portName.trim()) return;

    try {
      if (supplierPort) {
        const { data, error } = await supabase
          .from('supplier_ports')
          .update({
            port_name: portName.trim(),
            has_barge: hasBarge,
            has_truck: hasTruck,
            has_expipe: hasExpipe,
            has_vlsfo: hasVlsfo,
            has_lsmgo: hasLsmgo,
            notes: notes.trim() || null,
          })
          .eq('id', supplierPort.id)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          await savePortRelationships(data.id);
        }
      } else {
        const portNames = portName.split(';').map(p => p.trim()).filter(Boolean);

        for (const name of portNames) {
          const { data, error } = await supabase
            .from('supplier_ports')
            .insert([{
              supplier_id: supplierId,
              port_name: name,
              has_barge: hasBarge,
              has_truck: hasTruck,
              has_expipe: hasExpipe,
              has_vlsfo: hasVlsfo,
              has_lsmgo: hasLsmgo,
              notes: notes.trim() || null,
            }])
            .select()
            .single();

          if (error) throw error;
          if (data) {
            await savePortRelationships(data.id);
          }
        }
      }

      onSave({});
      onClose();
    } catch (error) {
      console.error('Error saving port:', error);
    }
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
            {supplierPort?.region && (
              <p className="text-xs text-gray-600 mt-1">
                Region: <span className="font-medium">{supplierPort.region}</span>
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Delivery Methods
              </label>
              {!showAddDeliveryMethod && (
                <button
                  type="button"
                  onClick={() => setShowAddDeliveryMethod(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Custom
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
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

              {customDeliveryMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg bg-blue-50"
                >
                  {editingDeliveryMethodId === method.id ? (
                    <>
                      <input
                        type="text"
                        value={editingDeliveryMethodName}
                        onChange={(e) => setEditingDeliveryMethodName(e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveDeliveryMethod();
                          } else if (e.key === 'Escape') {
                            setEditingDeliveryMethodId(null);
                            setEditingDeliveryMethodName('');
                          }
                        }}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSaveDeliveryMethod}
                        className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDeliveryMethodId(null);
                          setEditingDeliveryMethodName('');
                        }}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        type="checkbox"
                        checked={selectedDeliveryMethods.includes(method.id)}
                        onChange={() => toggleDeliveryMethod(method.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <Truck className="w-5 h-5 text-blue-600" />
                      <span className="flex-1 text-sm font-medium text-gray-700">{method.name}</span>
                      <button
                        type="button"
                        onClick={() => handleEditDeliveryMethod(method)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              ))}

              {showAddDeliveryMethod && (
                <div className="flex gap-2 p-2 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
                  <input
                    type="text"
                    value={newDeliveryMethod}
                    onChange={(e) => setNewDeliveryMethod(e.target.value)}
                    placeholder="New delivery method..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDeliveryMethod();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddDeliveryMethod}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddDeliveryMethod(false);
                      setNewDeliveryMethod('');
                    }}
                    className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Fuel Types
              </label>
              {!showAddFuelType && (
                <button
                  type="button"
                  onClick={() => setShowAddFuelType(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Custom
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                {editingVlsfo ? (
                  <>
                    <input
                      type="text"
                      value={editVlsfoValue}
                      onChange={(e) => setEditVlsfoValue(e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          saveVlsfoName();
                        } else if (e.key === 'Escape') {
                          cancelEditingVlsfo();
                        }
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={saveVlsfoName}
                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditingVlsfo}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <label className="flex items-center gap-3 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasVlsfo}
                        onChange={(e) => setHasVlsfo(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <Fuel className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">{vlsfoName}</span>
                    </label>
                    <button
                      type="button"
                      onClick={startEditingVlsfo}
                      className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                {editingLsmgo ? (
                  <>
                    <input
                      type="text"
                      value={editLsmgoValue}
                      onChange={(e) => setEditLsmgoValue(e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          saveLsmgoName();
                        } else if (e.key === 'Escape') {
                          cancelEditingLsmgo();
                        }
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={saveLsmgoName}
                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditingLsmgo}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <label className="flex items-center gap-3 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasLsmgo}
                        onChange={(e) => setHasLsmgo(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <Fuel className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">{lsmgoName}</span>
                    </label>
                    <button
                      type="button"
                      onClick={startEditingLsmgo}
                      className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>

              {customFuelTypes.map((fuelType) => (
                <div
                  key={fuelType.id}
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg bg-blue-50"
                >
                  {editingFuelTypeId === fuelType.id ? (
                    <>
                      <input
                        type="text"
                        value={editingFuelTypeName}
                        onChange={(e) => setEditingFuelTypeName(e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveFuelType();
                          } else if (e.key === 'Escape') {
                            setEditingFuelTypeId(null);
                            setEditingFuelTypeName('');
                          }
                        }}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSaveFuelType}
                        className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFuelTypeId(null);
                          setEditingFuelTypeName('');
                        }}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        type="checkbox"
                        checked={selectedFuelTypes.includes(fuelType.id)}
                        onChange={() => toggleFuelType(fuelType.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <Fuel className="w-5 h-5 text-blue-600" />
                      <span className="flex-1 text-sm font-medium text-gray-700">{fuelType.name}</span>
                      <button
                        type="button"
                        onClick={() => handleEditFuelType(fuelType)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              ))}

              {showAddFuelType && (
                <div className="flex gap-2 p-2 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
                  <input
                    type="text"
                    value={newFuelType}
                    onChange={(e) => setNewFuelType(e.target.value)}
                    placeholder="New fuel type..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFuelType();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddFuelType}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddFuelType(false);
                      setNewFuelType('');
                    }}
                    className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              )}
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
