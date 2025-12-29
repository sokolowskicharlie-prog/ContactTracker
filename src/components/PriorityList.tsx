import { Phone, Mail, Building2, Edit, Trash2, Star, AlertTriangle, Check, TrendingUp } from 'lucide-react';
import { ContactWithActivity } from '../lib/supabase';

interface PriorityListProps {
  contacts: ContactWithActivity[];
  onContactClick: (contact: ContactWithActivity) => void;
  onEditContact: (contact: ContactWithActivity) => void;
  onDeleteContact: (id: string) => void;
}

const PRIORITY_LABELS: Record<number, { label: string; color: string; bgColor: string; borderColor: string }> = {
  1: { label: 'Highest Priority', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  2: { label: 'High Priority', color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  3: { label: 'Medium Priority', color: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  4: { label: 'Low Priority', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  5: { label: 'Lowest Priority', color: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
};

export default function PriorityList({ contacts, onContactClick, onEditContact, onDeleteContact }: PriorityListProps) {
  const priorityContacts = contacts.filter(c => c.priority_rank && c.priority_rank >= 1 && c.priority_rank <= 5);
  const groupedByPriority: Record<number, ContactWithActivity[]> = {};

  for (let i = 1; i <= 5; i++) {
    groupedByPriority[i] = priorityContacts
      .filter(c => c.priority_rank === i)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  const getStatusIcon = (contact: ContactWithActivity) => {
    if (contact.is_client) {
      return <Check className="w-4 h-4 text-green-600" title="Client" />;
    }
    if (contact.has_traction) {
      return <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" title="Has Traction" />;
    }
    if (contact.is_jammed) {
      return <AlertTriangle className="w-4 h-4 text-red-600 fill-red-100" title="Jammed" />;
    }
    return null;
  };

  if (priorityContacts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
        <div className="text-center text-gray-500">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium mb-2">No Priority Contacts</h3>
          <p>You haven't assigned priority ranks to any contacts yet.</p>
          <p className="text-sm mt-2">Edit a contact to set their priority rank.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {[1, 2, 3, 4, 5].map(priority => {
        const contactsInPriority = groupedByPriority[priority];
        if (contactsInPriority.length === 0) return null;

        const priorityConfig = PRIORITY_LABELS[priority];

        return (
          <div key={priority} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className={`px-4 py-3 ${priorityConfig.bgColor} border-b ${priorityConfig.borderColor}`}>
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold ${priorityConfig.color} flex items-center gap-2`}>
                  <span className="text-lg">{priority}</span>
                  <span>{priorityConfig.label}</span>
                </h3>
                <span className="text-sm text-gray-600">
                  {contactsInPriority.length} {contactsInPriority.length === 1 ? 'contact' : 'contacts'}
                </span>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {contactsInPriority.map(contact => (
                <div
                  key={contact.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => onContactClick(contact)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{contact.name}</h4>
                        {getStatusIcon(contact)}
                      </div>

                      <div className="space-y-1">
                        {contact.company && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Building2 className="w-4 h-4 mr-2" />
                            {contact.company}
                            {contact.company_size && (
                              <span className="ml-1 text-xs text-gray-500">({contact.company_size})</span>
                            )}
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-4 h-4 mr-2" />
                            {contact.phone}
                          </div>
                        )}
                        {contact.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-2" />
                            {contact.email}
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                        <span>{contact.total_calls} calls</span>
                        <span>{contact.total_emails} emails</span>
                        {contact.total_deals > 0 && <span>{contact.total_deals} deals</span>}
                        {contact.pending_tasks > 0 && (
                          <span className="text-orange-600 font-medium">
                            {contact.pending_tasks} pending tasks
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditContact(contact);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete ${contact.name}?`)) {
                            onDeleteContact(contact.id);
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
