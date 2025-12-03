import { X, User, Phone, CheckSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Call, ContactPerson, Contact, Supplier } from '../lib/supabase';

interface CallModalProps {
  call?: Call;
  contactId: string;
  contactName: string;
  contactPersons?: ContactPerson[];
  contacts: Contact[];
  suppliers: Supplier[];
  onClose: () => void;
  onSave: (call: { id?: string; call_date: string; duration?: number; spoke_with?: string; phone_number?: string; notes?: string }, newPIC?: { name: string; phone: string }, task?: { task_type: string; title: string; due_date?: string; notes: string; contact_id?: string; supplier_id?: string }) => void;
}

export default function CallModal({ call, contactId, contactName, contactPersons = [], contacts, suppliers, onClose, onSave }: CallModalProps) {
  const [callDate, setCallDate] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [duration, setDuration] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [manualName, setManualName] = useState('');
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [useManualEntry, setUseManualEntry] = useState(false);
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
    if (call) {
      setCallDate(new Date(call.call_date).toISOString().slice(0, 16));
      setDuration(call.duration ? call.duration.toString() : '');
      setNotes(call.notes || '');

      const matchedPerson = contactPersons.find(p => p.name === call.spoke_with);
      if (matchedPerson) {
        setSelectedPersonId(matchedPerson.id);
        setSelectedPhoneNumber(call.phone_number || '');
      } else {
        setUseManualEntry(true);
        setManualName(call.spoke_with || '');
        setSelectedPhoneNumber(call.phone_number || '');
      }
    }
  }, [call, contactPersons]);

  const getPhoneNumbers = (personId: string) => {
    const person = contactPersons.find(p => p.id === personId);
    if (!person) return [];

    const phones: { label: string; number: string }[] = [];
    if (person.mobile) phones.push({ label: 'Mobile', number: person.mobile });
    if (person.phone) phones.push({ label: 'Phone', number: person.phone });
    if (person.direct_line) phones.push({ label: 'Direct Line', number: person.direct_line });
    return phones;
  };

  const handlePersonChange = (personId: string) => {
    setSelectedPersonId(personId);
    if (personId) {
      const phones = getPhoneNumbers(personId);
      if (phones.length > 0) {
        setSelectedPhoneNumber(phones[0].number);
      }
    } else {
      setSelectedPhoneNumber('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let spokeWith = '';
    let phoneNumber = selectedPhoneNumber.trim();
    let newPIC = undefined;

    if (useManualEntry) {
      spokeWith = manualName.trim();
      if (spokeWith && phoneNumber && !call) {
        const existingPerson = contactPersons.find(p =>
          p.name.toLowerCase() === spokeWith.toLowerCase()
        );
        if (!existingPerson) {
          newPIC = { name: spokeWith, phone: phoneNumber };
        }
      }
    } else if (selectedPersonId) {
      const person = contactPersons.find(p => p.id === selectedPersonId);
      spokeWith = person?.name || '';
    }

    const taskData = createTask && taskTitle.trim() ? {
      task_type: taskType,
      title: taskTitle.trim(),
      due_date: taskDueDate ? new Date(taskDueDate).toISOString() : undefined,
      notes: taskNotes.trim(),
      contact_id: taskEntityType === 'contact' ? taskContactId : undefined,
      supplier_id: taskEntityType === 'supplier' ? taskSupplierId : undefined,
    } : undefined;

    onSave({
      ...(call ? { id: call.id } : {}),
      call_date: new Date(callDate).toISOString(),
      duration: duration ? parseInt(duration) : undefined,
      spoke_with: spokeWith || undefined,
      phone_number: phoneNumber || undefined,
      notes: notes.trim() || undefined,
    }, newPIC, taskData);

    onClose();
  };

  const selectedPhones = selectedPersonId ? getPhoneNumbers(selectedPersonId) : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {call ? 'Edit Call' : 'Log Call'} with {contactName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date & Time *
            </label>
            <input
              type="datetime-local"
              value={callDate}
              onChange={(e) => setCallDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="15"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Spoke With
            </label>

            {contactPersons.length > 0 && (
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setUseManualEntry(false)}
                  className={`flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    !useManualEntry
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Select PIC
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUseManualEntry(true);
                    setSelectedPersonId('');
                  }}
                  className={`flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    useManualEntry
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Type Manually
                </button>
              </div>
            )}

            {!useManualEntry && contactPersons.length > 0 ? (
              <select
                value={selectedPersonId}
                onChange={(e) => handlePersonChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required={!useManualEntry}
              >
                <option value="">Select a person</option>
                {contactPersons.map(person => (
                  <option key={person.id} value={person.id}>
                    {person.name}{person.job_title ? ` - ${person.job_title}` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Name of person"
                  required={useManualEntry || contactPersons.length === 0}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            {selectedPhones.length > 0 ? (
              <select
                value={selectedPhoneNumber}
                onChange={(e) => setSelectedPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {selectedPhones.map((phone, idx) => (
                  <option key={idx} value={phone.number}>
                    {phone.label}: {phone.number}
                  </option>
                ))}
              </select>
            ) : (
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  value={selectedPhoneNumber}
                  onChange={(e) => setSelectedPhoneNumber(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Phone number used"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="What did you discuss?"
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
              {call ? 'Update' : 'Log'} Call
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
