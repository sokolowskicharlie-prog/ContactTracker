import { Phone, Mail, Building2, Edit, Trash2, Star, AlertTriangle, Check, TrendingUp, ArrowUpDown, Filter, Skull } from 'lucide-react';
import { ContactWithActivity } from '../lib/supabase';
import { useState } from 'react';

interface PriorityListProps {
  contacts: ContactWithActivity[];
  onContactClick: (contact: ContactWithActivity) => void;
  onEditContact: (contact: ContactWithActivity) => void;
  onDeleteContact: (id: string) => void;
  customPriorityLabels?: Record<number, string>;
}

const PRIORITY_STYLES: Record<number, { color: string; bgColor: string; borderColor: string }> = {
  0: { color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  1: { color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  2: { color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  3: { color: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  4: { color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  5: { color: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
};

type SortOption = 'name' | 'company' | 'activity' | 'priority';
type FilterStatus = 'all' | 'client' | 'traction' | 'jammed' | 'dead' | 'none';

export default function PriorityList({ contacts, onContactClick, onEditContact, onDeleteContact, customPriorityLabels }: PriorityListProps) {
  const priorityLabels = customPriorityLabels || {
    0: 'Client',
    1: 'Highest Priority',
    2: 'High Priority',
    3: 'Medium Priority',
    4: 'Low Priority',
    5: 'Lowest Priority'
  };
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedPriorities, setSelectedPriorities] = useState<number[]>([0, 1, 2, 3, 4, 5]);
  const [showFilters, setShowFilters] = useState(false);

  let priorityContacts = contacts.filter(c => c.priority_rank !== null && c.priority_rank !== undefined && c.priority_rank >= 0 && c.priority_rank <= 5);

  priorityContacts = priorityContacts.filter(c => selectedPriorities.includes(c.priority_rank!));

  if (filterStatus !== 'all') {
    priorityContacts = priorityContacts.filter(c => {
      if (filterStatus === 'client') return c.is_client;
      if (filterStatus === 'traction') return c.has_traction && !c.is_client;
      if (filterStatus === 'jammed') return c.is_jammed;
      if (filterStatus === 'dead') return c.is_dead;
      if (filterStatus === 'none') return !c.is_client && !c.has_traction && !c.is_jammed && !c.is_dead;
      return true;
    });
  }

  const groupedByPriority: Record<number, ContactWithActivity[]> = {};

  for (let i = 0; i <= 5; i++) {
    let contactsInPriority = priorityContacts.filter(c => c.priority_rank === i);

    if (sortBy === 'name') {
      contactsInPriority = contactsInPriority.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'company') {
      contactsInPriority = contactsInPriority.sort((a, b) =>
        (a.company || '').localeCompare(b.company || '')
      );
    } else if (sortBy === 'activity') {
      contactsInPriority = contactsInPriority.sort((a, b) =>
        (b.total_calls + b.total_emails) - (a.total_calls + a.total_emails)
      );
    } else {
      contactsInPriority = contactsInPriority.sort((a, b) => a.name.localeCompare(b.name));
    }

    groupedByPriority[i] = contactsInPriority;
  }

  const togglePriority = (priority: number) => {
    setSelectedPriorities(prev =>
      prev.includes(priority)
        ? prev.filter(p => p !== priority)
        : [...prev, priority].sort()
    );
  };

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
    if (contact.is_dead) {
      return <Skull className="w-4 h-4 text-gray-700" title="Dead" />;
    }
    return null;
  };

  const getStatusNote = (contact: ContactWithActivity) => {
    if (contact.is_client && (contact.client_note || contact.client_additional_note)) {
      const noteText = contact.client_additional_note || contact.client_note || '';
      return {
        text: noteText,
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-gray-600'
      };
    }
    if (contact.has_traction && (contact.traction_note || contact.traction_additional_note)) {
      const noteText = contact.traction_additional_note || contact.traction_note || '';
      return {
        text: noteText,
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-gray-600'
      };
    }
    if (contact.is_jammed && (contact.jammed_note || contact.jammed_additional_note)) {
      const noteText = contact.jammed_additional_note || contact.jammed_note || '';
      return {
        text: noteText,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-gray-600'
      };
    }
    if (contact.is_dead && (contact.dead_note || contact.dead_additional_note)) {
      const noteText = contact.dead_additional_note || contact.dead_note || '';
      return {
        text: noteText,
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-600'
      };
    }
    return null;
  };

  const totalPriorityContacts = contacts.filter(c => c.priority_rank && c.priority_rank >= 1 && c.priority_rank <= 5).length;
  const displayedCount = priorityContacts.length;

  if (totalPriorityContacts === 0) {
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="priority">Priority</option>
                <option value="name">Name</option>
                <option value="company">Company</option>
                <option value="activity">Activity</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="client">Client</option>
                <option value="traction">Traction</option>
                <option value="jammed">Jammed</option>
                <option value="dead">Dead</option>
                <option value="none">No Status</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              showFilters ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Filter className="w-4 h-4" />
            Priority Filters
          </button>
        </div>

        {showFilters && (
          <div className="pt-4 border-t border-gray-200">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Show Priority Levels:</label>
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4, 5].map(priority => {
                const styles = PRIORITY_STYLES[priority];
                const label = priorityLabels[priority];
                const isSelected = selectedPriorities.includes(priority);
                return (
                  <button
                    key={priority}
                    onClick={() => togglePriority(priority)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      isSelected
                        ? `${styles.bgColor} ${styles.color} border ${styles.borderColor}`
                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                    }`}
                  >
                    {priority === 0 ? `C - ${label}` : `P${priority} - ${label.replace(' Priority', '')}`}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          Showing {displayedCount} of {totalPriorityContacts} priority contacts
        </div>
      </div>

      {displayedCount === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center text-gray-500">
            <Filter className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium mb-2">No Contacts Match Filters</h3>
            <p>Try adjusting your filters or status selection.</p>
          </div>
        </div>
      ) : (
        <>
          {[0, 1, 2, 3, 4, 5].map(priority => {
            const contactsInPriority = groupedByPriority[priority];
            if (contactsInPriority.length === 0) return null;

        const priorityStyles = PRIORITY_STYLES[priority];
        const label = priorityLabels[priority];

        return (
          <div key={priority} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className={`px-4 py-3 ${priorityStyles.bgColor} border-b ${priorityStyles.borderColor}`}>
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold ${priorityStyles.color} flex items-center gap-2`}>
                  <span className="text-lg">{priority === 0 ? 'C' : priority}</span>
                  <span>{label}</span>
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

                      {getStatusNote(contact) && (
                        <div className={`mb-3 p-2 rounded text-sm border ${getStatusNote(contact)!.bgColor} ${getStatusNote(contact)!.borderColor} ${getStatusNote(contact)!.textColor}`}>
                          <p className="italic">{getStatusNote(contact)!.text}</p>
                        </div>
                      )}

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
        </>
      )}
    </div>
  );
}
