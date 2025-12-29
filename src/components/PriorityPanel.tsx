import { X, TrendingUp, ChevronDown, ChevronUp, Star, AlertTriangle, Check, Phone, Mail, Building2 } from 'lucide-react';
import { useState } from 'react';
import { ContactWithActivity } from '../lib/supabase';

interface PriorityPanelProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: ContactWithActivity[];
  onContactClick: (contact: ContactWithActivity) => void;
  showGoals: boolean;
  showNotepad: boolean;
}

const PRIORITY_LABELS: Record<number, { label: string; color: string; bgColor: string; borderColor: string }> = {
  1: { label: 'Highest', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  2: { label: 'High', color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  3: { label: 'Medium', color: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  4: { label: 'Low', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  5: { label: 'Lowest', color: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
};

export default function PriorityPanel({ isOpen, onClose, contacts, onContactClick, showGoals, showNotepad }: PriorityPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedPriority, setSelectedPriority] = useState<number | null>(null);

  if (!isOpen) return null;

  const priorityContacts = contacts.filter(c => c.priority_rank && c.priority_rank >= 1 && c.priority_rank <= 5);

  const groupedByPriority: Record<number, ContactWithActivity[]> = {};
  for (let i = 1; i <= 5; i++) {
    groupedByPriority[i] = priorityContacts
      .filter(c => c.priority_rank === i)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  const getStatusIcon = (contact: ContactWithActivity) => {
    if (contact.is_client) {
      return <Check className="w-3 h-3 text-green-600" title="Client" />;
    }
    if (contact.has_traction) {
      return <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" title="Has Traction" />;
    }
    if (contact.is_jammed) {
      return <AlertTriangle className="w-3 h-3 text-red-600 fill-red-100" title="Jammed" />;
    }
    return null;
  };

  const calculateTopPosition = () => {
    let top = 80;
    if (showGoals) top += 496;
    if (showNotepad) top += 384;
    return top;
  };

  return (
    <div
      className="fixed right-4 z-40 w-80"
      style={{ top: `${calculateTopPosition()}px` }}
    >
      <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden max-h-[600px] flex flex-col">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            <h3 className="font-semibold">Priority Contacts</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="overflow-y-auto flex-1">
            {priorityContacts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No priority contacts yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {[1, 2, 3, 4, 5].map(priority => {
                  const contactsInPriority = groupedByPriority[priority];
                  if (contactsInPriority.length === 0) return null;

                  const priorityConfig = PRIORITY_LABELS[priority];
                  const isSelected = selectedPriority === priority;

                  return (
                    <div key={priority} className="border-b border-gray-200 last:border-b-0">
                      <button
                        onClick={() => setSelectedPriority(isSelected ? null : priority)}
                        className={`w-full px-4 py-2.5 flex items-center justify-between ${priorityConfig.bgColor} hover:opacity-80 transition-opacity`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${priorityConfig.color} text-lg`}>{priority}</span>
                          <span className={`text-sm font-medium ${priorityConfig.color}`}>
                            {priorityConfig.label}
                          </span>
                        </div>
                        <span className="text-xs text-gray-600 font-medium">
                          {contactsInPriority.length}
                        </span>
                      </button>

                      {isSelected && (
                        <div className="bg-white divide-y divide-gray-100">
                          {contactsInPriority.map(contact => (
                            <div
                              key={contact.id}
                              onClick={() => onContactClick(contact)}
                              className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                                      {contact.name}
                                    </h4>
                                    {getStatusIcon(contact)}
                                  </div>

                                  {contact.company && (
                                    <div className="flex items-center text-xs text-gray-600 mb-0.5">
                                      <Building2 className="w-3 h-3 mr-1 flex-shrink-0" />
                                      <span className="truncate">{contact.company}</span>
                                    </div>
                                  )}

                                  {contact.phone && (
                                    <div className="flex items-center text-xs text-gray-600 mb-0.5">
                                      <Phone className="w-3 h-3 mr-1 flex-shrink-0" />
                                      <span className="truncate">{contact.phone}</span>
                                    </div>
                                  )}

                                  {contact.email && (
                                    <div className="flex items-center text-xs text-gray-600">
                                      <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
                                      <span className="truncate">{contact.email}</span>
                                    </div>
                                  )}

                                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                                    <span>{contact.total_calls} calls</span>
                                    <span>{contact.total_emails} emails</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
