import { X, User, Mail, CheckSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Email, ContactPerson, Contact, Supplier, CallSchedule } from '../lib/supabase';

interface EmailModalProps {
  email?: Email;
  contactId: string;
  contactName: string;
  contactPersons?: ContactPerson[];
  contacts: Contact[];
  suppliers: Supplier[];
  scheduleData?: Partial<CallSchedule>;
  onClose: () => void;
  onSave: (email: { id?: string; email_date: string; subject?: string; emailed_to?: string; email_address?: string; notes?: string }, newPIC?: { name: string; email: string }, task?: { task_type: string; title: string; due_date?: string; notes: string; contact_id?: string; supplier_id?: string }) => void;
}

export default function EmailModal({ email, contactId, contactName, contactPersons = [], contacts, suppliers, scheduleData, onClose, onSave }: EmailModalProps) {
  const [emailDate, setEmailDate] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [subject, setSubject] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [manualName, setManualName] = useState('');
  const [selectedEmailAddress, setSelectedEmailAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [createTask, setCreateTask] = useState(false);
  const [taskType, setTaskType] = useState('email_back');
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
    if (email) {
      setEmailDate(new Date(email.email_date).toISOString().slice(0, 16));
      setSubject(email.subject || '');
      setNotes(email.notes || '');

      const matchedPerson = contactPersons.find(p => p.name === email.emailed_to);
      if (matchedPerson) {
        setSelectedPersonId(matchedPerson.id);
        setSelectedEmailAddress(email.email_address || '');
      } else {
        setUseManualEntry(true);
        setManualName(email.emailed_to || '');
        setSelectedEmailAddress(email.email_address || '');
      }
    }
  }, [email, contactPersons]);

  useEffect(() => {
    if (scheduleData && !email) {
      if (scheduleData.email_subject) {
        setSubject(scheduleData.email_subject);
      }
      if (scheduleData.contact_person_name) {
        // Try to find a matching PIC first
        const matchingPerson = contactPersons.find(
          p => p.name.toLowerCase() === scheduleData.contact_person_name?.toLowerCase()
        );

        if (matchingPerson) {
          // Found a matching PIC, select it
          setUseManualEntry(false);
          setSelectedPersonId(matchingPerson.id);
          if (scheduleData.contact_person_email) {
            setSelectedEmailAddress(scheduleData.contact_person_email);
          } else if (matchingPerson.email) {
            setSelectedEmailAddress(matchingPerson.email);
          }
        } else {
          // No matching PIC, use manual entry
          setUseManualEntry(true);
          setManualName(scheduleData.contact_person_name);
          if (scheduleData.contact_person_email) {
            setSelectedEmailAddress(scheduleData.contact_person_email);
          }
        }
      }
    }
  }, [scheduleData, email, contactPersons]);

  const getEmailAddresses = (personId: string) => {
    const person = contactPersons.find(p => p.id === personId);
    if (!person) return [];

    const emails: { label: string; address: string }[] = [];
    if (person.email) emails.push({ label: 'Email', address: person.email });
    return emails;
  };

  const handlePersonChange = (personId: string) => {
    setSelectedPersonId(personId);
    if (personId) {
      const emails = getEmailAddresses(personId);
      if (emails.length > 0) {
        setSelectedEmailAddress(emails[0].address);
      }
    } else {
      setSelectedEmailAddress('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let emailedTo = '';
    let emailAddress = selectedEmailAddress.trim();
    let newPIC = undefined;

    if (useManualEntry) {
      emailedTo = manualName.trim();
      if (emailedTo && emailAddress && !email) {
        const existingPerson = contactPersons.find(p =>
          p.name.toLowerCase() === emailedTo.toLowerCase()
        );
        if (!existingPerson) {
          newPIC = { name: emailedTo, email: emailAddress };
        }
      }
    } else if (selectedPersonId) {
      const person = contactPersons.find(p => p.id === selectedPersonId);
      emailedTo = person?.name || '';
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
      ...(email ? { id: email.id } : {}),
      email_date: new Date(emailDate).toISOString(),
      subject: subject.trim() || null,
      emailed_to: emailedTo || null,
      email_address: emailAddress || null,
      notes: notes.trim() || null,
    }, newPIC, taskData);

    onClose();
  };

  const selectedEmails = selectedPersonId ? getEmailAddresses(selectedPersonId) : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {email ? 'Edit Email' : 'Log Email'} with {contactName}
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
              value={emailDate}
              onChange={(e) => setEmailDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Email subject line"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emailed To
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
                  placeholder="Name of recipient"
                  required={useManualEntry || contactPersons.length === 0}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            {selectedEmails.length > 0 ? (
              <select
                value={selectedEmailAddress}
                onChange={(e) => setSelectedEmailAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {selectedEmails.map((emailItem, idx) => (
                  <option key={idx} value={emailItem.address}>
                    {emailItem.label}: {emailItem.address}
                  </option>
                ))}
              </select>
            ) : (
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={selectedEmailAddress}
                  onChange={(e) => setSelectedEmailAddress(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="recipient@example.com"
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
              placeholder="Summary or key points from the email..."
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
              {email ? 'Update' : 'Log'} Email
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
