import { X, Ship, Droplet, Calendar, Anchor, FileText, CheckSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Vessel, Contact, Supplier } from '../lib/supabase';

interface FuelDeal {
  id?: string;
  vessel_id?: string;
  vessel_name: string;
  fuel_quantity: number;
  fuel_type: string;
  deal_date: string;
  port: string;
  notes?: string;
}

interface FuelDealModalProps {
  deal?: FuelDeal;
  vessels: Vessel[];
  contactId: string;
  contactName: string;
  contacts: Contact[];
  suppliers: Supplier[];
  onClose: () => void;
  onSave: (deal: FuelDeal, task?: { task_type: string; title: string; due_date?: string; notes: string; contact_id?: string; supplier_id?: string }) => void;
}

const FUEL_TYPES = [
  'VLSFO (Very Low Sulfur Fuel Oil)',
  'LSMGO (Low Sulfur Marine Gas Oil)',
  'MGO (Marine Gas Oil)',
  'HFO (Heavy Fuel Oil)',
  'HSFO (High Sulfur Fuel Oil)',
  'MDO (Marine Diesel Oil)',
  'IFO 180 (Intermediate Fuel Oil)',
  'IFO 380 (Intermediate Fuel Oil)',
  'LNG (Liquefied Natural Gas)',
  'Methanol',
];

export default function FuelDealModal({ deal, vessels, contactId, contactName, contacts, suppliers, onClose, onSave }: FuelDealModalProps) {
  const [vesselId, setVesselId] = useState('');
  const [vesselName, setVesselName] = useState('');
  const [fuelQuantity, setFuelQuantity] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [dealDate, setDealDate] = useState('');
  const [port, setPort] = useState('');
  const [notes, setNotes] = useState('');
  const [createTask, setCreateTask] = useState(false);
  const [taskType, setTaskType] = useState('call_back');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 16);
  });
  const [taskNotes, setTaskNotes] = useState('');
  const [taskEntityType, setTaskEntityType] = useState<'contact' | 'supplier'>('contact');
  const [taskContactId, setTaskContactId] = useState(contactId);
  const [taskSupplierId, setTaskSupplierId] = useState('');

  useEffect(() => {
    if (deal) {
      setVesselId(deal.vessel_id || '');
      setVesselName(deal.vessel_name);
      setFuelQuantity(deal.fuel_quantity.toString());
      setFuelType(deal.fuel_type);
      setDealDate(deal.deal_date.split('T')[0]);
      setPort(deal.port);
      setNotes(deal.notes || '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setDealDate(today);
    }
  }, [deal]);

  const handleVesselChange = (selectedVesselId: string) => {
    setVesselId(selectedVesselId);
    if (selectedVesselId) {
      const vessel = vessels.find(v => v.id === selectedVesselId);
      if (vessel) {
        setVesselName(vessel.vessel_name);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vesselName.trim() || !fuelQuantity || !fuelType || !dealDate || !port.trim()) return;

    const taskData = createTask && taskTitle.trim() ? {
      task_type: taskType,
      title: taskTitle.trim(),
      due_date: taskDueDate ? new Date(taskDueDate).toISOString() : undefined,
      notes: taskNotes.trim(),
      contact_id: taskEntityType === 'contact' ? taskContactId : undefined,
      supplier_id: taskEntityType === 'supplier' ? taskSupplierId : undefined,
    } : undefined;

    onSave({
      ...(deal?.id ? { id: deal.id } : {}),
      vessel_id: vesselId || undefined,
      vessel_name: vesselName.trim(),
      fuel_quantity: parseFloat(fuelQuantity),
      fuel_type: fuelType,
      deal_date: new Date(dealDate).toISOString(),
      port: port.trim(),
      notes: notes.trim() || undefined,
    }, taskData);

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {deal ? 'Edit Fuel Deal' : 'Add Fuel Deal'}
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
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vessel *
              </label>
              {vessels.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={vesselId}
                    onChange={(e) => handleVesselChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select existing vessel or enter custom name</option>
                    {vessels.map((vessel) => (
                      <option key={vessel.id} value={vessel.id}>
                        {vessel.vessel_name}
                        {vessel.imo_number ? ` (IMO: ${vessel.imo_number})` : ''}
                      </option>
                    ))}
                  </select>
                  {!vesselId && (
                    <div className="relative">
                      <Ship className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={vesselName}
                        onChange={(e) => setVesselName(e.target.value)}
                        required={!vesselId}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter vessel name"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <Ship className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={vesselName}
                    onChange={(e) => setVesselName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter vessel name"
                  />
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Select from your vessels or enter a custom name
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fuel Quantity (MT) *
              </label>
              <div className="relative">
                <Droplet className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={fuelQuantity}
                  onChange={(e) => setFuelQuantity(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 500.50"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Metric tons</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fuel Type *
              </label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select fuel type</option>
                {FUEL_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deal Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={dealDate}
                  onChange={(e) => setDealDate(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Port *
              </label>
              <div className="relative">
                <Anchor className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Singapore, Rotterdam"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <FileText className="w-4 h-4" />
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional details about the deal (price, terms, contact person, etc.)"
            />
          </div>

          <div className="border-t pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={createTask}
                onChange={(e) => setCreateTask(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <CheckSquare className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Create follow-up task</span>
            </label>

            {createTask && (
              <div className="mt-4 space-y-3 pl-6 border-l-2 border-blue-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Type *
                  </label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={createTask}
                  >
                    <option value="call_back">Call Back</option>
                    <option value="email_back">Email Back</option>
                    <option value="text_back">Text Back</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Related To *
                  </label>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="contact"
                        checked={taskEntityType === 'contact'}
                        onChange={(e) => setTaskEntityType(e.target.value as 'contact')}
                        className="mr-2"
                      />
                      Contact
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="supplier"
                        checked={taskEntityType === 'supplier'}
                        onChange={(e) => setTaskEntityType(e.target.value as 'supplier')}
                        className="mr-2"
                      />
                      Supplier
                    </label>
                  </div>

                  {taskEntityType === 'contact' ? (
                    <select
                      value={taskContactId}
                      onChange={(e) => setTaskContactId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={createTask}
                    >
                      <option value="">Select a contact</option>
                      {contacts.map((contact) => (
                        <option key={contact.id} value={contact.id}>
                          {contact.name} {contact.company ? `- ${contact.company}` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={taskSupplierId}
                      onChange={(e) => setTaskSupplierId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={createTask}
                    >
                      <option value="">Select a supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.company_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Follow up on..."
                    required={createTask}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={taskNotes}
                    onChange={(e) => setTaskNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Task details..."
                  />
                </div>
              </div>
            )}
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
              {deal ? 'Update' : 'Add'} Deal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
