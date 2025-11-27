import { X, User, Phone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Call, ContactPerson } from '../lib/supabase';

interface CallModalProps {
  call?: Call;
  contactName: string;
  contactPersons?: ContactPerson[];
  onClose: () => void;
  onSave: (call: { id?: string; call_date: string; duration?: number; spoke_with?: string; phone_number?: string; notes?: string }) => void;
}

export default function CallModal({ call, contactName, contactPersons = [], onClose, onSave }: CallModalProps) {
  const [callDate, setCallDate] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [duration, setDuration] = useState('');
  const [spokeWith, setSpokeWith] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState('');

  useEffect(() => {
    if (call) {
      setCallDate(new Date(call.call_date).toISOString().slice(0, 16));
      setDuration(call.duration ? call.duration.toString() : '');
      setSpokeWith(call.spoke_with || '');
      setPhoneNumber(call.phone_number || '');
      setNotes(call.notes || '');
    }
  }, [call]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSave({
      ...(call ? { id: call.id } : {}),
      call_date: new Date(callDate).toISOString(),
      duration: duration ? parseInt(duration) : undefined,
      spoke_with: spokeWith.trim() || undefined,
      phone_number: phoneNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Spoke With
            </label>
            {contactPersons.length > 0 ? (
              <div className="space-y-2">
                <select
                  value={selectedPersonId}
                  onChange={(e) => {
                    const personId = e.target.value;
                    setSelectedPersonId(personId);
                    if (personId) {
                      const person = contactPersons.find(p => p.id === personId);
                      if (person) {
                        setSpokeWith(person.name);
                        const phones = [];
                        if (person.mobile) phones.push(person.mobile);
                        if (person.phone) phones.push(person.phone);
                        if (person.direct_line) phones.push(person.direct_line);
                        if (phones.length > 0) {
                          setPhoneNumber(phones[0]);
                        }
                      }
                    } else {
                      setSpokeWith('');
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a person or type manually below</option>
                  {contactPersons.map(person => (
                    <option key={person.id} value={person.id}>
                      {person.name}{person.job_title ? ` - ${person.job_title}` : ''}
                    </option>
                  ))}
                </select>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={spokeWith}
                    onChange={(e) => {
                      setSpokeWith(e.target.value);
                      setSelectedPersonId('');
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Or type name manually"
                  />
                </div>
              </div>
            ) : (
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={spokeWith}
                  onChange={(e) => setSpokeWith(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Name of person"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            {selectedPersonId && (() => {
              const person = contactPersons.find(p => p.id === selectedPersonId);
              const phones = [];
              if (person?.mobile) phones.push({ label: 'Mobile', number: person.mobile });
              if (person?.phone) phones.push({ label: 'Phone', number: person.phone });
              if (person?.direct_line) phones.push({ label: 'Direct Line', number: person.direct_line });
              return phones.length > 1 ? (
                <select
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                >
                  {phones.map((phone, idx) => (
                    <option key={idx} value={phone.number}>
                      {phone.label}: {phone.number}
                    </option>
                  ))}
                </select>
              ) : null;
            })()}
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Phone number used"
              />
            </div>
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
