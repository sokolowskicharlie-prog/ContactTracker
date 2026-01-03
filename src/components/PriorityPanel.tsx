import { X, TrendingUp, ChevronDown, ChevronUp, Star, AlertTriangle, Check, Phone, Mail, Building2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ContactWithActivity } from '../lib/supabase';

interface PriorityPanelProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: ContactWithActivity[];
  onContactClick: (contact: ContactWithActivity) => void;
  showGoals: boolean;
  showNotepad: boolean;
  panelOrder?: string[];
  showPriority?: boolean;
  notepadExpanded?: boolean;
  goalsExpanded?: boolean;
  priorityExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  panelSpacing?: number;
}

const PRIORITY_LABELS: Record<number, { label: string; color: string; bgColor: string; borderColor: string }> = {
  0: { label: 'Client', color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  1: { label: 'Highest', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  2: { label: 'High', color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  3: { label: 'Medium', color: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  4: { label: 'Low', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  5: { label: 'Lowest', color: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
};

export default function PriorityPanel({ isOpen, onClose, contacts, onContactClick, showGoals, showNotepad, panelOrder = ['notes', 'goals', 'priority'], showPriority = false, notepadExpanded = true, goalsExpanded = true, priorityExpanded = true, onExpandedChange, panelSpacing = 2 }: PriorityPanelProps) {
  const [isExpanded, setIsExpanded] = useState(priorityExpanded);
  const [selectedPriority, setSelectedPriority] = useState<number | null>(null);

  useEffect(() => {
    setIsExpanded(priorityExpanded);
  }, [priorityExpanded]);

  if (!isOpen) return null;

  const priorityContacts = contacts.filter(c => c.priority_rank !== null && c.priority_rank !== undefined && c.priority_rank >= 0 && c.priority_rank <= 5);

  const groupedByPriority: Record<number, ContactWithActivity[]> = {};
  for (let i = 0; i <= 5; i++) {
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
    return null;
  };

  const calculateTopPosition = () => {
    let top = 80;
    const myIndex = panelOrder.indexOf('priority');
    const PANEL_SIZES = {
      notesExpanded: 388,
      notesCollapsed: 52,
      goalsExpanded: 180,
      goalsCollapsed: 52,
      priorityExpanded: 352,
      priorityCollapsed: 52
    };

    for (let i = 0; i < myIndex; i++) {
      const panelId = panelOrder[i];
      if (panelId === 'notes' && showNotepad) {
        const height = notepadExpanded ? PANEL_SIZES.notesExpanded : PANEL_SIZES.notesCollapsed;
        top += height + panelSpacing;
      } else if (panelId === 'goals' && showGoals) {
        const height = goalsExpanded ? PANEL_SIZES.goalsExpanded : PANEL_SIZES.goalsCollapsed;
        top += height + panelSpacing;
      } else if (panelId === 'priority' && showPriority) {
        const height = priorityExpanded ? PANEL_SIZES.priorityExpanded : PANEL_SIZES.priorityCollapsed;
        top += height + panelSpacing;
      }
    }

    return top;
  };

  return (
    <div
      className="fixed right-4 z-40 w-80"
      style={{ top: `${calculateTopPosition()}px` }}
    >
      <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            <h3 className="font-semibold">Priority Contacts</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newExpanded = !isExpanded;
                setIsExpanded(newExpanded);
                if (onExpandedChange) {
                  onExpandedChange(newExpanded);
                }
              }}
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
          <div className="overflow-y-auto max-h-[300px] pb-0 mb-0" style={{ overflowAnchor: 'none' }}>
            {priorityContacts.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No priority contacts yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 flex flex-col flex-none mb-0">
                {[0, 1, 2, 3, 4, 5].map(priority => {
                  const contactsInPriority = groupedByPriority[priority];
                  if (contactsInPriority.length === 0) return null;

                  const priorityConfig = PRIORITY_LABELS[priority];
                  const isSelected = selectedPriority === priority;

                  // Check if this is the last visible priority group
                  const isLastGroup = [0, 1, 2, 3, 4, 5].reverse().find(p => groupedByPriority[p].length > 0) === priority;

                  return (
                    <div key={priority} className={`border-b border-gray-200 last:border-b-0 flex-none ${isLastGroup && isSelected ? 'pb-0 mb-0' : ''}`}>
                      <button
                        onClick={() => setSelectedPriority(isSelected ? null : priority)}
                        className={`w-full px-4 py-2.5 flex items-center justify-between ${priorityConfig.bgColor} hover:opacity-80 transition-opacity flex-none`}
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
                        <div className="bg-white divide-y divide-gray-100 flex-none mb-0">
                          {contactsInPriority.map((contact, index) => (
                            <div
                              key={contact.id}
                              onClick={() => onContactClick(contact)}
                              className={`px-4 hover:bg-gray-50 cursor-pointer transition-colors flex-none ${index === contactsInPriority.length - 1 ? 'py-3 pb-0 mb-0' : 'py-3'}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                                      {contact.name}
                                    </h4>
                                    {getStatusIcon(contact)}
                                  </div>

                                  {getStatusNote(contact) && (
                                    <div className={`mb-2 p-2 rounded text-xs border ${getStatusNote(contact)!.bgColor} ${getStatusNote(contact)!.borderColor} ${getStatusNote(contact)!.textColor}`}>
                                      <p className="italic">{getStatusNote(contact)!.text}</p>
                                    </div>
                                  )}

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

                                  <div className={`mt-2 flex items-center gap-3 text-xs text-gray-500 ${index === contactsInPriority.length - 1 ? 'mb-0' : ''}`}>
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
