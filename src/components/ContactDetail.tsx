import { X, Phone, Mail, Building2, FileText, Calendar, Clock, Globe, User, Star, Globe as Globe2, Ship, Plus, CreditCard as Edit, Trash2, ExternalLink, Hash, Droplet, Anchor, TrendingUp, MessageCircle, Smartphone, Check, XCircle, CheckSquare, Circle, CheckCircle2, AlertCircle, CreditCard as Edit2, StickyNote, AlertTriangle, Package, Skull, MapPin } from 'lucide-react';
import { ContactWithActivity, Vessel, FuelDeal, Call, Email, TaskWithRelated, CustomJammedReason, supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';

interface SavedNote {
  id: string;
  title: string;
  content: string;
  contact_id?: string;
  created_at: string;
  updated_at: string;
}

interface ContactDetailProps {
  contact: ContactWithActivity;
  tasks: TaskWithRelated[];
  notes: SavedNote[];
  onClose: () => void;
  onEdit: () => void;
  onEditContact: (contact: ContactWithActivity) => void;
  onLogCall: () => void;
  onLogEmail: () => void;
  onEditCall: (call: Call) => void;
  onEditEmail: (email: Email) => void;
  onDeleteCall: (callId: string) => void;
  onDeleteEmail: (emailId: string) => void;
  onAddVessel: () => void;
  onEditVessel: (vessel: Vessel) => void;
  onDeleteVessel: (vesselId: string) => void;
  onAddFuelDeal: () => void;
  onEditFuelDeal: (deal: FuelDeal) => void;
  onDeleteFuelDeal: (dealId: string) => void;
  onUpdateStatus: (statusField: 'is_jammed' | 'has_traction' | 'is_client' | 'is_dead', value: boolean) => void;
  onAddTask: () => void;
  onToggleTaskComplete: (taskId: string, completed: boolean) => void;
  onEditTask: (task: TaskWithRelated) => void;
  onDeleteTask: (taskId: string) => void;
  onEditNote: (note: SavedNote) => void;
  onDeleteNote: (noteId: string) => void;
  onDelete: (contactId: string) => void;
}

export default function ContactDetail({ contact, tasks, notes, onClose, onEdit, onEditContact, onLogCall, onLogEmail, onEditCall, onEditEmail, onDeleteCall, onDeleteEmail, onAddVessel, onEditVessel, onDeleteVessel, onAddFuelDeal, onEditFuelDeal, onDeleteFuelDeal, onUpdateStatus, onAddTask, onToggleTaskComplete, onEditTask, onDeleteTask, onEditNote, onDeleteNote, onDelete }: ContactDetailProps) {
  const [expandedStatusNote, setExpandedStatusNote] = useState<'jammed' | 'client' | 'traction' | 'dead' | null>(null);
  const [isEditingStatusNote, setIsEditingStatusNote] = useState(false);
  const [statusNoteValue, setStatusNoteValue] = useState('');
  const [jammedReason, setJammedReason] = useState('');
  const [tractionReason, setTractionReason] = useState('');
  const [clientReason, setClientReason] = useState('');
  const [deadReason, setDeadReason] = useState('');
  const [jammedAdditionalNote, setJammedAdditionalNote] = useState('');
  const [tractionAdditionalNote, setTractionAdditionalNote] = useState('');
  const [clientAdditionalNote, setClientAdditionalNote] = useState('');
  const [deadAdditionalNote, setDeadAdditionalNote] = useState('');
  const [priorityRank, setPriorityRank] = useState<string>(contact.priority_rank?.toString() || '');
  const [followUpDate, setFollowUpDate] = useState(contact.follow_up_date || '');
  const [followUpReason, setFollowUpReason] = useState(contact.follow_up_reason || '');
  const [customJammedReasons, setCustomJammedReasons] = useState<CustomJammedReason[]>([]);
  const [customTractionReasons, setCustomTractionReasons] = useState<CustomJammedReason[]>([]);
  const [customClientReasons, setCustomClientReasons] = useState<CustomJammedReason[]>([]);
  const [customDeadReasons, setCustomDeadReasons] = useState<CustomJammedReason[]>([]);
  const [isAddingNewReason, setIsAddingNewReason] = useState(false);
  const [newReasonText, setNewReasonText] = useState('');

  const defaultJammedReasons = [
    'Direct with suppliers',
    'TC only',
    'They already have a set panel of traders',
    'Other'
  ];

  const defaultTractionReasons = [
    'In touch with bunker buyer',
    'Need to pay more attention',
    'Other'
  ];

  const defaultClientReasons = [
    'In touch with bunker buyer',
    'Need to pay more attention',
    'Other'
  ];

  const defaultDeadReasons = [
    'No longer in business',
    'Unresponsive',
    'Not interested',
    'Other'
  ];

  const jammedReasons = [...defaultJammedReasons, ...customJammedReasons.map(r => r.reason)];
  const tractionReasons = [...defaultTractionReasons, ...customTractionReasons.map(r => r.reason)];
  const clientReasons = [...defaultClientReasons, ...customClientReasons.map(r => r.reason)];
  const deadReasons = [...defaultDeadReasons, ...customDeadReasons.map(r => r.reason)];

  useEffect(() => {
    loadCustomReasons();
  }, []);

  const loadCustomReasons = async () => {
    const { data, error } = await supabase
      .from('custom_jammed_reasons')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error loading custom reasons:', error);
      return;
    }

    if (data) {
      setCustomJammedReasons(data.filter(r => r.reason_type === 'jammed'));
      setCustomTractionReasons(data.filter(r => r.reason_type === 'traction'));
      setCustomClientReasons(data.filter(r => r.reason_type === 'client'));
      setCustomDeadReasons(data.filter(r => r.reason_type === 'dead'));
    }
  };

  const addNewCustomReason = async (reasonType: 'jammed' | 'traction' | 'client' | 'dead') => {
    if (!newReasonText.trim()) return;

    const currentReasons = reasonType === 'jammed' ? customJammedReasons :
                           reasonType === 'traction' ? customTractionReasons :
                           reasonType === 'client' ? customClientReasons :
                           customDeadReasons;

    const maxOrder = currentReasons.length > 0
      ? Math.max(...currentReasons.map(r => r.display_order))
      : 0;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('custom_jammed_reasons')
      .insert({
        reason: newReasonText.trim(),
        reason_type: reasonType,
        display_order: maxOrder + 1,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding custom reason:', error);
      return;
    }

    if (data) {
      if (reasonType === 'jammed') {
        setCustomJammedReasons([...customJammedReasons, data]);
        setJammedReason(data.reason);
        setStatusNoteValue(data.reason);
      } else if (reasonType === 'traction') {
        setCustomTractionReasons([...customTractionReasons, data]);
        setTractionReason(data.reason);
        setStatusNoteValue(data.reason);
      } else if (reasonType === 'client') {
        setCustomClientReasons([...customClientReasons, data]);
        setClientReason(data.reason);
        setStatusNoteValue(data.reason);
      } else {
        setCustomDeadReasons([...customDeadReasons, data]);
        setDeadReason(data.reason);
        setStatusNoteValue(data.reason);
      }
      setNewReasonText('');
      setIsAddingNewReason(false);
    }
  };

  const handleStatusToggle = (type: 'jammed' | 'client' | 'traction' | 'dead', currentValue: boolean) => {
    if (!currentValue) {
      toggleStatusNote(type);
      onUpdateStatus(type === 'jammed' ? 'is_jammed' : type === 'traction' ? 'has_traction' : type === 'client' ? 'is_client' : 'is_dead', true);
    } else {
      onUpdateStatus(type === 'jammed' ? 'is_jammed' : type === 'traction' ? 'has_traction' : type === 'client' ? 'is_client' : 'is_dead', false);
    }
  };

  const toggleStatusNote = (type: 'jammed' | 'client' | 'traction' | 'dead') => {
    if (expandedStatusNote === type) {
      setExpandedStatusNote(null);
      setIsEditingStatusNote(false);
    } else {
      setExpandedStatusNote(type);
      const currentNote = contact[`${type}_note`] || '';

      setIsEditingStatusNote(true);
      setStatusNoteValue(currentNote);

      if (type === 'jammed') {
        if (jammedReasons.includes(currentNote)) {
          setJammedReason(currentNote);
        } else if (currentNote) {
          setJammedReason('Other');
        } else {
          setJammedReason('');
        }
        setJammedAdditionalNote(contact.jammed_additional_note || '');
      } else if (type === 'traction') {
        if (tractionReasons.includes(currentNote)) {
          setTractionReason(currentNote);
        } else if (currentNote) {
          setTractionReason('Other');
        } else {
          setTractionReason('');
        }
        setTractionAdditionalNote(contact.traction_additional_note || '');
      } else if (type === 'client') {
        if (clientReasons.includes(currentNote)) {
          setClientReason(currentNote);
        } else if (currentNote) {
          setClientReason('Other');
        } else {
          setClientReason('');
        }
        setClientAdditionalNote(contact.client_additional_note || '');
      } else if (type === 'dead') {
        if (deadReasons.includes(currentNote)) {
          setDeadReason(currentNote);
        } else if (currentNote) {
          setDeadReason('Other');
        } else {
          setDeadReason('');
        }
        setDeadAdditionalNote(contact.dead_additional_note || '');
      }
    }
  };

  const saveStatusNote = async (type: 'jammed' | 'client' | 'traction' | 'dead') => {
    let noteValue = statusNoteValue;

    if (type === 'jammed' && jammedReason && jammedReason !== 'Other') {
      noteValue = jammedReason;
    } else if (type === 'traction' && tractionReason && tractionReason !== 'Other') {
      noteValue = tractionReason;
    } else if (type === 'client' && clientReason && clientReason !== 'Other') {
      noteValue = clientReason;
    } else if (type === 'dead' && deadReason && deadReason !== 'Other') {
      noteValue = deadReason;
    }

    const updatedContact: any = {
      ...contact,
      [`${type}_note`]: noteValue
    };

    if (type === 'jammed') {
      updatedContact.jammed_additional_note = jammedAdditionalNote;
    } else if (type === 'traction') {
      updatedContact.traction_additional_note = tractionAdditionalNote;
    } else if (type === 'client') {
      updatedContact.client_additional_note = clientAdditionalNote;
    } else if (type === 'dead') {
      updatedContact.dead_additional_note = deadAdditionalNote;
    }

    await onEditContact(updatedContact);
    setIsEditingStatusNote(false);
    setExpandedStatusNote(null);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const hasTime = hours !== 0 || minutes !== 0;

    if (hasTime) {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatShortDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const savePriorityRank = async () => {
    const updatedContact = {
      ...contact,
      priority_rank: priorityRank ? parseInt(priorityRank) : null
    };
    await onEditContact(updatedContact);
  };

  const saveFollowUpDate = async () => {
    const updatedContact = {
      ...contact,
      follow_up_date: followUpDate || null,
      follow_up_reason: followUpReason || null
    };
    await onEditContact(updatedContact);
  };

  const getNextWorkingDay = async () => {
    const { data: holidays } = await supabase
      .from('holidays')
      .select('date, end_date')
      .gte('date', new Date().toISOString().split('T')[0]);

    const holidayDates = new Set<string>();
    holidays?.forEach(holiday => {
      const start = new Date(holiday.date);
      const end = holiday.end_date ? new Date(holiday.end_date) : start;

      let current = new Date(start);
      while (current <= end) {
        holidayDates.add(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
    });

    let nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);

    while (true) {
      const dayOfWeek = nextDay.getDay();
      const dateStr = nextDay.toISOString().split('T')[0];

      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.has(dateStr)) {
        break;
      }

      nextDay.setDate(nextDay.getDate() + 1);
    }

    return nextDay.toISOString();
  };

  const setNextWorkingDay = async () => {
    const nextWorkingDay = await getNextWorkingDay();
    setFollowUpDate(nextWorkingDay);
    const updatedContact = {
      ...contact,
      follow_up_date: nextWorkingDay,
      follow_up_reason: followUpReason || null
    };
    await onEditContact(updatedContact);
  };

  const setNextWeek = async () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekDate = nextWeek.toISOString();
    setFollowUpDate(nextWeekDate);
    const updatedContact = {
      ...contact,
      follow_up_date: nextWeekDate,
      follow_up_reason: followUpReason || null
    };
    await onEditContact(updatedContact);
  };

  const getTaskTypeLabel = (taskType: string) => {
    switch (taskType) {
      case 'call_back':
        return 'Call Back';
      case 'email_back':
        return 'Email Back';
      case 'text_back':
        return 'Text Back';
      default:
        return 'Other';
    }
  };

  const getTaskTypeIcon = (taskType: string) => {
    switch (taskType) {
      case 'call_back':
        return <Phone className="w-3 h-3" />;
      case 'email_back':
        return <Mail className="w-3 h-3" />;
      case 'text_back':
        return <MessageCircle className="w-3 h-3" />;
      default:
        return <CheckSquare className="w-3 h-3" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-2xl font-semibold text-gray-900">{contact.name}</h2>
              <button
                onClick={onEdit}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                title="Edit contact"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete ${contact.name}? This action cannot be undone.`)) {
                    onDelete(contact.id);
                    onClose();
                  }
                }}
                className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                title="Delete contact"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {/* Priority Rank */}
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Priority:</label>
              <select
                value={priorityRank}
                onChange={(e) => setPriorityRank(e.target.value)}
                onBlur={savePriorityRank}
                className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">No Priority</option>
                <option value="0">0 - Client</option>
                <option value="1">1 - Highest</option>
                <option value="2">2 - High</option>
                <option value="3">3 - Medium</option>
                <option value="4">4 - Low</option>
                <option value="5">5 - Lowest</option>
              </select>
              {priorityRank && (
                <button
                  onClick={() => {
                    setPriorityRank('');
                    onEditContact({ ...contact, priority_rank: null });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  title="Clear priority rank"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {/* Follow-up Date */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Follow-up:</label>
                <input
                  type="date"
                  value={followUpDate ? new Date(followUpDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFollowUpDate(e.target.value ? new Date(e.target.value).toISOString() : '')}
                  onBlur={saveFollowUpDate}
                  className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={setNextWorkingDay}
                  className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  title="Set to next working day"
                >
                  Tomorrow
                </button>
                <button
                  onClick={setNextWeek}
                  className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  title="Set to one week from today"
                >
                  Next Week
                </button>
                {followUpDate && (
                  <button
                    onClick={() => {
                      setFollowUpDate('');
                      setFollowUpReason('');
                      onEditContact({ ...contact, follow_up_date: null, follow_up_reason: null });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                    title="Clear follow-up date"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {followUpDate && (
                <div className="flex items-center gap-2 ml-6">
                  <label className="text-sm font-medium text-gray-700">Reason:</label>
                  <input
                    type="text"
                    value={followUpReason}
                    onChange={(e) => setFollowUpReason(e.target.value)}
                    onBlur={saveFollowUpDate}
                    placeholder="Why follow up?"
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStatusToggle('traction', contact.has_traction)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      contact.has_traction
                        ? 'bg-yellow-400 text-yellow-900 border border-yellow-500'
                        : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${contact.has_traction ? 'fill-yellow-900' : ''}`} />
                    Traction
                  </button>
                  {contact.has_traction && (
                    <button
                      onClick={() => toggleStatusNote('traction')}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                      title="Add/edit traction note"
                    >
                      <StickyNote className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                </div>
                {contact.has_traction && contact.traction_date && (
                  <span className="text-xs text-gray-500 ml-1">Marked: {formatShortDate(contact.traction_date)}</span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStatusToggle('client', contact.is_client)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      contact.is_client
                        ? 'bg-green-500 text-white border border-green-600'
                        : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    Client
                  </button>
                  {contact.is_client && (
                    <button
                      onClick={() => toggleStatusNote('client')}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                      title="Add/edit client note"
                    >
                      <StickyNote className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                </div>
                {contact.is_client && contact.client_date && (
                  <span className="text-xs text-gray-500 ml-1">Marked: {formatShortDate(contact.client_date)}</span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStatusToggle('jammed', contact.is_jammed)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      contact.is_jammed
                        ? 'bg-red-500 text-white border border-red-600'
                        : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    Jammed
                  </button>
                  {contact.is_jammed && (
                    <button
                      onClick={() => toggleStatusNote('jammed')}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                      title="Add/edit jammed note"
                    >
                      <StickyNote className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                </div>
                {contact.is_jammed && contact.jammed_date && (
                  <span className="text-xs text-gray-500 ml-1">Marked: {formatShortDate(contact.jammed_date)}</span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStatusToggle('dead', contact.is_dead)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      contact.is_dead
                        ? 'bg-gray-800 text-white border border-gray-900'
                        : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    <Skull className="w-4 h-4" />
                    Dead
                  </button>
                  {contact.is_dead && (
                    <button
                      onClick={() => toggleStatusNote('dead')}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                      title="Add/edit dead note"
                    >
                      <StickyNote className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                </div>
                {contact.is_dead && contact.dead_date && (
                  <span className="text-xs text-gray-500 ml-1">Marked: {formatShortDate(contact.dead_date)}</span>
                )}
              </div>
            </div>

            {/* Expandable Status Note Section */}
            {expandedStatusNote && (
              <div className="mt-3 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {expandedStatusNote === 'traction' && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                  {expandedStatusNote === 'client' && <Check className="w-4 h-4 text-green-600" />}
                  {expandedStatusNote === 'jammed' && <XCircle className="w-4 h-4 text-red-600" />}
                  {expandedStatusNote === 'dead' && <Skull className="w-4 h-4 text-gray-700" />}
                  {expandedStatusNote === 'traction' && 'Traction Note'}
                  {expandedStatusNote === 'client' && 'Client Note'}
                  {expandedStatusNote === 'jammed' && 'Jammed Reason'}
                  {expandedStatusNote === 'dead' && 'Dead Reason'}
                </label>

                {isEditingStatusNote ? (
                  <>
                    {expandedStatusNote === 'jammed' ? (
                      <>
                        <select
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={jammedReason}
                          onChange={(e) => {
                            setJammedReason(e.target.value);
                            if (e.target.value !== 'Other') {
                              setStatusNoteValue(e.target.value);
                            } else {
                              setStatusNoteValue('');
                            }
                          }}
                        >
                          <option value="">Select a reason...</option>
                          {jammedReasons.map((reason) => (
                            <option key={reason} value={reason}>
                              {reason}
                            </option>
                          ))}
                        </select>

                        {!isAddingNewReason ? (
                          <button
                            type="button"
                            onClick={() => setIsAddingNewReason(true)}
                            className="mt-2 w-full px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add Custom Reason
                          </button>
                        ) : (
                          <div className="mt-2 space-y-2">
                            <input
                              type="text"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter new reason..."
                              value={newReasonText}
                              onChange={(e) => setNewReasonText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addNewCustomReason('jammed');
                                } else if (e.key === 'Escape') {
                                  setIsAddingNewReason(false);
                                  setNewReasonText('');
                                }
                              }}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => addNewCustomReason('jammed')}
                                className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Add
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingNewReason(false);
                                  setNewReasonText('');
                                }}
                                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {jammedReason === 'Other' && (
                          <textarea
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-3"
                            rows={3}
                            placeholder="Enter custom reason..."
                            value={statusNoteValue}
                            onChange={(e) => setStatusNoteValue(e.target.value)}
                          />
                        )}

                        {jammedReason && (
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Additional Notes</label>
                            <textarea
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows={2}
                              placeholder="Add any additional details..."
                              value={jammedAdditionalNote}
                              onChange={(e) => setJammedAdditionalNote(e.target.value)}
                            />
                          </div>
                        )}
                      </>
                    ) : expandedStatusNote === 'traction' ? (
                      <>
                        <select
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={tractionReason}
                          onChange={(e) => {
                            setTractionReason(e.target.value);
                            if (e.target.value !== 'Other') {
                              setStatusNoteValue(e.target.value);
                            } else {
                              setStatusNoteValue('');
                            }
                          }}
                        >
                          <option value="">Select a reason...</option>
                          {tractionReasons.map((reason) => (
                            <option key={reason} value={reason}>
                              {reason}
                            </option>
                          ))}
                        </select>

                        {!isAddingNewReason ? (
                          <button
                            type="button"
                            onClick={() => setIsAddingNewReason(true)}
                            className="mt-2 w-full px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add Custom Reason
                          </button>
                        ) : (
                          <div className="mt-2 space-y-2">
                            <input
                              type="text"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter new reason..."
                              value={newReasonText}
                              onChange={(e) => setNewReasonText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addNewCustomReason('traction');
                                } else if (e.key === 'Escape') {
                                  setIsAddingNewReason(false);
                                  setNewReasonText('');
                                }
                              }}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => addNewCustomReason('traction')}
                                className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Add
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingNewReason(false);
                                  setNewReasonText('');
                                }}
                                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {tractionReason === 'Other' && (
                          <textarea
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-3"
                            rows={3}
                            placeholder="Enter custom reason..."
                            value={statusNoteValue}
                            onChange={(e) => setStatusNoteValue(e.target.value)}
                          />
                        )}

                        {tractionReason && (
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Additional Notes</label>
                            <textarea
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows={2}
                              placeholder="Add any additional details..."
                              value={tractionAdditionalNote}
                              onChange={(e) => setTractionAdditionalNote(e.target.value)}
                            />
                          </div>
                        )}
                      </>
                    ) : expandedStatusNote === 'client' ? (
                      <>
                        <select
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={clientReason}
                          onChange={(e) => {
                            setClientReason(e.target.value);
                            if (e.target.value !== 'Other') {
                              setStatusNoteValue(e.target.value);
                            } else {
                              setStatusNoteValue('');
                            }
                          }}
                        >
                          <option value="">Select a reason...</option>
                          {clientReasons.map((reason) => (
                            <option key={reason} value={reason}>
                              {reason}
                            </option>
                          ))}
                        </select>

                        {!isAddingNewReason ? (
                          <button
                            type="button"
                            onClick={() => setIsAddingNewReason(true)}
                            className="mt-2 w-full px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add Custom Reason
                          </button>
                        ) : (
                          <div className="mt-2 space-y-2">
                            <input
                              type="text"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter new reason..."
                              value={newReasonText}
                              onChange={(e) => setNewReasonText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addNewCustomReason('client');
                                } else if (e.key === 'Escape') {
                                  setIsAddingNewReason(false);
                                  setNewReasonText('');
                                }
                              }}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => addNewCustomReason('client')}
                                className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Add
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingNewReason(false);
                                  setNewReasonText('');
                                }}
                                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {clientReason === 'Other' && (
                          <textarea
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-3"
                            rows={3}
                            placeholder="Enter custom reason..."
                            value={statusNoteValue}
                            onChange={(e) => setStatusNoteValue(e.target.value)}
                          />
                        )}

                        {clientReason && (
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Additional Notes</label>
                            <textarea
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows={2}
                              placeholder="Add any additional details..."
                              value={clientAdditionalNote}
                              onChange={(e) => setClientAdditionalNote(e.target.value)}
                            />
                          </div>
                        )}
                      </>
                    ) : expandedStatusNote === 'dead' ? (
                      <>
                        <select
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={deadReason}
                          onChange={(e) => {
                            setDeadReason(e.target.value);
                            if (e.target.value !== 'Other') {
                              setStatusNoteValue(e.target.value);
                            } else {
                              setStatusNoteValue('');
                            }
                          }}
                        >
                          <option value="">Select a reason...</option>
                          {deadReasons.map((reason) => (
                            <option key={reason} value={reason}>
                              {reason}
                            </option>
                          ))}
                        </select>

                        {!isAddingNewReason ? (
                          <button
                            type="button"
                            onClick={() => setIsAddingNewReason(true)}
                            className="mt-2 w-full px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add Custom Reason
                          </button>
                        ) : (
                          <div className="mt-2 space-y-2">
                            <input
                              type="text"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter new reason..."
                              value={newReasonText}
                              onChange={(e) => setNewReasonText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addNewCustomReason('dead');
                                } else if (e.key === 'Escape') {
                                  setIsAddingNewReason(false);
                                  setNewReasonText('');
                                }
                              }}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => addNewCustomReason('dead')}
                                className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Add
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingNewReason(false);
                                  setNewReasonText('');
                                }}
                                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {deadReason === 'Other' && (
                          <textarea
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-3"
                            rows={3}
                            placeholder="Enter custom reason..."
                            value={statusNoteValue}
                            onChange={(e) => setStatusNoteValue(e.target.value)}
                          />
                        )}

                        {deadReason && (
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Additional Notes</label>
                            <textarea
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows={2}
                              placeholder="Add any additional details..."
                              value={deadAdditionalNote}
                              onChange={(e) => setDeadAdditionalNote(e.target.value)}
                            />
                          </div>
                        )}
                      </>
                    ) : null}

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => saveStatusNote(expandedStatusNote)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Save Note
                      </button>
                      <button
                        onClick={() => setExpandedStatusNote(null)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      {contact[`${expandedStatusNote}_note`] && (
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{contact[`${expandedStatusNote}_note`]}</p>
                        </div>
                      )}
                      {(expandedStatusNote === 'jammed' && contact.jammed_additional_note) ||
                       (expandedStatusNote === 'traction' && contact.traction_additional_note) ||
                       (expandedStatusNote === 'client' && contact.client_additional_note) ||
                       (expandedStatusNote === 'dead' && contact.dead_additional_note) ? (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Additional Notes</label>
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {expandedStatusNote === 'jammed' && contact.jammed_additional_note}
                              {expandedStatusNote === 'traction' && contact.traction_additional_note}
                              {expandedStatusNote === 'client' && contact.client_additional_note}
                              {expandedStatusNote === 'dead' && contact.dead_additional_note}
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setIsEditingStatusNote(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Edit Note
                      </button>
                      <button
                        onClick={() => setExpandedStatusNote(null)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Display existing status notes when not editing */}
            {!expandedStatusNote && (
              <div className="space-y-2 mt-3">
                {contact.traction_note && contact.has_traction && (
                  <div className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <div className="flex items-center justify-between">
                      <span className="font-medium flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-600 fill-yellow-600" />
                        Traction:
                      </span>
                      <button
                        onClick={() => {
                          setExpandedStatusNote('traction');
                          setIsEditingStatusNote(true);
                        }}
                        className="p-1 hover:bg-yellow-100 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3 h-3 text-yellow-600" />
                      </button>
                    </div>
                    <p className="mt-1 text-gray-600">{contact.traction_note}</p>
                    {contact.traction_additional_note && (
                      <div className="mt-2 pt-2 border-t border-yellow-200">
                        <p className="text-xs font-medium text-gray-500 mb-1">Additional Notes:</p>
                        <p className="text-gray-600 whitespace-pre-wrap">{contact.traction_additional_note}</p>
                      </div>
                    )}
                  </div>
                )}
                {contact.client_note && contact.is_client && (
                  <div className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <span className="font-medium flex items-center gap-1">
                        <Check className="w-3 h-3 text-green-600" />
                        Client:
                      </span>
                      <button
                        onClick={() => {
                          setExpandedStatusNote('client');
                          setIsEditingStatusNote(true);
                        }}
                        className="p-1 hover:bg-green-100 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3 h-3 text-green-600" />
                      </button>
                    </div>
                    <p className="mt-1 text-gray-600">{contact.client_note}</p>
                    {contact.client_additional_note && (
                      <div className="mt-2 pt-2 border-t border-green-200">
                        <p className="text-xs font-medium text-gray-500 mb-1">Additional Notes:</p>
                        <p className="text-gray-600 whitespace-pre-wrap">{contact.client_additional_note}</p>
                      </div>
                    )}
                  </div>
                )}
                {contact.jammed_note && contact.is_jammed && (
                  <div className="text-sm text-gray-700 bg-red-50 p-3 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <span className="font-medium flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-red-600" />
                        Jammed:
                      </span>
                      <button
                        onClick={() => {
                          setExpandedStatusNote('jammed');
                          setIsEditingStatusNote(true);
                        }}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3 h-3 text-red-600" />
                      </button>
                    </div>
                    <p className="mt-1 text-gray-600">{contact.jammed_note}</p>
                    {contact.jammed_additional_note && (
                      <div className="mt-2 pt-2 border-t border-red-200">
                        <p className="text-xs font-medium text-gray-500 mb-1">Additional Notes:</p>
                        <p className="text-gray-600 whitespace-pre-wrap">{contact.jammed_additional_note}</p>
                      </div>
                    )}
                  </div>
                )}
                {contact.dead_note && contact.is_dead && (
                  <div className="text-sm text-gray-700 bg-gray-100 p-3 rounded-lg border border-gray-300">
                    <div className="flex items-center justify-between">
                      <span className="font-medium flex items-center gap-1">
                        <Skull className="w-3 h-3 text-gray-700" />
                        Dead:
                      </span>
                      <button
                        onClick={() => {
                          setExpandedStatusNote('dead');
                          setIsEditingStatusNote(true);
                        }}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3 h-3 text-gray-700" />
                      </button>
                    </div>
                    <p className="mt-1 text-gray-600">{contact.dead_note}</p>
                    {contact.dead_additional_note && (
                      <div className="mt-2 pt-2 border-t border-gray-300">
                        <p className="text-xs font-medium text-gray-500 mb-1">Additional Notes:</p>
                        <p className="text-gray-600 whitespace-pre-wrap">{contact.dead_additional_note}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            {contact.company && (
              <div className="flex items-center text-gray-700">
                <Building2 className="w-5 h-5 mr-3 text-gray-500" />
                <div className="flex items-center gap-2">
                  <span>{contact.company}</span>
                  {contact.company_size && (
                    <span className="text-sm text-gray-500">({contact.company_size})</span>
                  )}
                </div>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center text-gray-700">
                {contact.phone_type === 'whatsapp' ? (
                  <MessageCircle className="w-5 h-5 mr-3 text-green-500" />
                ) : (
                  <Phone className="w-5 h-5 mr-3 text-gray-500" />
                )}
                <span>{contact.phone}</span>
                <span className="ml-2 text-xs text-gray-400">({contact.phone_type || 'general'})</span>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center text-gray-700">
                <Mail className="w-5 h-5 mr-3 text-gray-500" />
                <span>{contact.email}</span>
              </div>
            )}
            {contact.website && (
              <div className="flex items-center text-gray-700">
                <Globe className="w-5 h-5 mr-3 text-gray-500" />
                <a href={contact.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 underline">
                  {contact.website}
                </a>
              </div>
            )}
            {contact.address && (
              <div className="flex items-start text-gray-700">
                <Building2 className="w-5 h-5 mr-3 text-gray-500 mt-0.5" />
                <span className="flex-1">{contact.address}</span>
              </div>
            )}
            {contact.city && (
              <div className="flex items-center text-gray-700">
                <Building2 className="w-5 h-5 mr-3 text-gray-500" />
                <span>{contact.city}</span>
              </div>
            )}
            {contact.post_code && (
              <div className="flex items-center text-gray-700">
                <Hash className="w-5 h-5 mr-3 text-gray-500" />
                <span>{contact.post_code}</span>
              </div>
            )}
            {contact.country && (
              <div className="flex items-center text-gray-700">
                <Globe2 className="w-5 h-5 mr-3 text-gray-500" />
                <span>{contact.country}</span>
              </div>
            )}
            {contact.timezone && (
              <div className="flex items-center text-gray-700">
                <Clock className="w-5 h-5 mr-3 text-gray-500" />
                <span>{contact.timezone}</span>
              </div>
            )}
            {contact.company_excerpt && (
              <div className="flex items-start text-gray-700">
                <FileText className="w-5 h-5 mr-3 text-gray-500 mt-0.5" />
                <span className="flex-1 italic">{contact.company_excerpt}</span>
              </div>
            )}
            {contact.notes && (
              <div className="flex items-start text-gray-700 pt-2 border-t border-gray-200">
                <FileText className="w-5 h-5 mr-3 text-gray-500 mt-0.5" />
                <span className="flex-1">{contact.notes}</span>
              </div>
            )}
          </div>

          {contact.contact_persons && contact.contact_persons.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                Contact Persons ({contact.contact_persons.length})
              </h3>
              <div className="space-y-3">
                {(contact.contact_persons || [])
                  .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
                  .map((person) => (
                    <div
                      key={person.id}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {person.name}
                            {person.is_primary && (
                              <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                            )}
                          </div>
                          {person.job_title && (
                            <div className="text-sm text-gray-500 mt-0.5">{person.job_title}</div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        {person.email && (
                          <div className="flex items-start text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                            <div className="flex flex-wrap gap-1">
                              {person.email.split(';').map((email, idx) => (
                                <span key={idx} className="break-all">
                                  {email.trim()}
                                  {idx < person.email!.split(';').length - 1 && <span className="text-gray-400 ml-1">;</span>}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {person.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            {person.phone_type === 'whatsapp' ? (
                              <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                            ) : (
                              <Phone className="w-4 h-4 mr-2" />
                            )}
                            <span>{person.phone}</span>
                            <span className="ml-1 text-xs text-gray-400">({person.phone_type || 'general'})</span>
                          </div>
                        )}
                        {person.mobile && (
                          <div className="flex items-center text-sm text-gray-600">
                            {person.mobile_type === 'whatsapp' ? (
                              <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                            ) : (
                              <Smartphone className="w-4 h-4 mr-2" />
                            )}
                            <span>{person.mobile}</span>
                            <span className="ml-1 text-xs text-gray-400">({person.mobile_type || 'general'})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {contact.vessels && contact.vessels.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Ship className="w-5 h-5" />
                  Vessels ({contact.vessels.length})
                </h3>
                <button
                  onClick={onAddVessel}
                  className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Vessel
                </button>
              </div>
              <div className="space-y-3">
                {(contact.vessels || []).map((vessel) => (
                  <div
                    key={vessel.id}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          <Ship className="w-4 h-4 text-blue-600" />
                          {vessel.vessel_name}
                        </div>
                        {vessel.vessel_type && (
                          <div className="text-xs text-gray-500 mt-1">
                            {vessel.vessel_type}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => onEditVessel(vessel)}
                          className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete vessel ${vessel.vessel_name}?`)) {
                              onDeleteVessel(vessel.id);
                            }
                          }}
                          className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {vessel.imo_number && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Hash className="w-4 h-4 mr-2" />
                          IMO: {vessel.imo_number}
                        </div>
                      )}
                      {vessel.marine_traffic_url && (
                        <a
                          href={vessel.marine_traffic_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Track on Marine Traffic
                        </a>
                      )}
                      {vessel.destination && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          Destination: {vessel.destination}
                        </div>
                      )}
                      {vessel.eta && (
                        <div className="flex items-center text-sm">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span className="text-gray-600">
                            ETA: {new Date(vessel.eta).toLocaleDateString()}
                            <span className="ml-1 font-medium text-blue-600">
                              ({(() => {
                                const etaDate = new Date(vessel.eta);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                etaDate.setHours(0, 0, 0, 0);
                                const daysRemaining = Math.ceil((etaDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                                if (daysRemaining < 0) {
                                  return `arrived ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? '' : 's'} ago`;
                                } else if (daysRemaining === 0) {
                                  return 'arriving today';
                                } else if (daysRemaining === 1) {
                                  return 'arriving tomorrow';
                                } else {
                                  return `${daysRemaining} days`;
                                }
                              })()})
                            </span>
                          </span>
                        </div>
                      )}
                      {vessel.notes && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          {vessel.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!contact.vessels || contact.vessels.length === 0) && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Ship className="w-5 h-5" />
                  Vessels
                </h3>
                <button
                  onClick={onAddVessel}
                  className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Vessel
                </button>
              </div>
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                <Ship className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p>No vessels added yet</p>
              </div>
            </div>
          )}

          {contact.fuel_deals && contact.fuel_deals.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Fuel Deals ({contact.fuel_deals.length})
                </h3>
                <button
                  onClick={onAddFuelDeal}
                  className="px-3 py-1 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Deal
                </button>
              </div>
              <div className="space-y-3">
                {(contact.fuel_deals || [])
                  .sort((a, b) => new Date(b.deal_date).getTime() - new Date(a.deal_date).getTime())
                  .map((deal) => (
                  <div
                    key={deal.id}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 flex items-center gap-2 mb-1">
                          <Ship className="w-4 h-4 text-green-600" />
                          {deal.vessel_name}
                        </div>
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(deal.deal_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => onEditFuelDeal(deal)}
                          className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete fuel deal for ${deal.vessel_name}?`)) {
                              onDeleteFuelDeal(deal.id);
                            }
                          }}
                          className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center text-gray-700">
                        <Droplet className="w-4 h-4 mr-2 text-blue-500" />
                        <span className="font-semibold">{deal.fuel_quantity} MT</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <Anchor className="w-4 h-4 mr-2 text-gray-500" />
                        {deal.port}
                      </div>
                      <div className="col-span-2 text-gray-600 text-xs bg-gray-50 px-2 py-1 rounded">
                        {deal.fuel_type}
                      </div>
                    </div>
                    {deal.notes && (
                      <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100 italic">
                        {deal.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!contact.fuel_deals || contact.fuel_deals.length === 0) && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Fuel Deals
                </h3>
                <button
                  onClick={onAddFuelDeal}
                  className="px-3 py-1 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Deal
                </button>
              </div>
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p>No fuel deals recorded yet</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Tasks ({tasks.length})
                </h3>
                <button
                  onClick={onAddTask}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                >
                  <CheckSquare className="w-4 h-4" />
                  Add Task
                </button>
              </div>

              {tasks.length > 0 ? (
                <div className="space-y-3">
                  {tasks
                    .sort((a, b) => {
                      if (a.completed !== b.completed) {
                        return a.completed ? 1 : -1;
                      }
                      if (a.due_date && b.due_date) {
                        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                      }
                      if (a.due_date) return -1;
                      if (b.due_date) return 1;
                      return 0;
                    })
                    .map((task) => (
                      <div
                        key={task.id}
                        className={`bg-white border rounded-lg p-4 transition-all ${
                          task.completed
                            ? 'border-gray-200 opacity-60'
                            : task.is_overdue
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => onToggleTaskComplete(task.id, !task.completed)}
                            className="mt-0.5 flex-shrink-0"
                          >
                            {task.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400 hover:text-orange-600" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-xs font-medium">
                                    {getTaskTypeIcon(task.task_type)}
                                    {getTaskTypeLabel(task.task_type)}
                                  </div>
                                  {task.is_overdue && !task.completed && (
                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                                      <AlertCircle className="w-3 h-3" />
                                      Overdue
                                    </div>
                                  )}
                                </div>

                                <h4 className={`font-medium text-gray-900 mb-1 ${task.completed ? 'line-through' : ''}`}>
                                  {task.title}
                                </h4>

                                {task.notes && (
                                  <p className="text-sm text-gray-600 mb-2">{task.notes}</p>
                                )}

                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <Calendar className="w-3 h-3" />
                                  <span>{formatDate(task.due_date)}</span>
                                  {task.days_until_due !== undefined && !task.completed && (
                                    <span className={task.is_overdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                                      {task.is_overdue
                                        ? `${Math.abs(task.days_until_due)} days overdue`
                                        : `${task.days_until_due} days left`}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => onEditTask(task)}
                                  className="p-1.5 text-gray-400 hover:text-orange-600 transition-colors rounded hover:bg-orange-50"
                                  title="Edit task"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('Are you sure you want to delete this task?')) {
                                      onDeleteTask(task.id);
                                    }
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded hover:bg-red-50"
                                  title="Delete task"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p>No tasks created yet</p>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Call History ({contact.calls?.length || 0})
                </h3>
                <button
                  onClick={onLogCall}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Log Call
                </button>
              </div>

            {contact.calls && contact.calls.length > 0 ? (
              <div className="space-y-3">
                {(contact.calls || [])
                  .sort((a, b) => new Date(b.call_date).getTime() - new Date(a.call_date).getTime())
                  .map((call) => (
                    <div
                      key={call.id}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          {formatDateTime(call.call_date)}
                        </div>
                        <div className="flex items-center gap-2">
                          {call.duration && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="w-4 h-4 mr-1" />
                              {call.duration} min
                            </div>
                          )}
                          <button
                            onClick={() => onEditCall(call)}
                            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit call"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this call?')) {
                                onDeleteCall(call.id);
                              }
                            }}
                            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete call"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {(call.spoke_with || call.phone_number) && (
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-2 pt-2 border-t border-gray-100">
                          {call.spoke_with && (
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-2 text-gray-400" />
                              <span>{call.spoke_with}</span>
                            </div>
                          )}
                          {call.phone_number && (
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-2 text-gray-400" />
                              <span>{call.phone_number}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {call.notes && (
                        <p className="text-gray-700 text-sm mt-2">{call.notes}</p>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                <Phone className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p>No calls logged yet</p>
              </div>
            )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Email History ({contact.emails?.length || 0})
                </h3>
                <button
                  onClick={onLogEmail}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Log Email
                </button>
              </div>

              {contact.emails && contact.emails.length > 0 ? (
                <div className="space-y-3">
                  {(contact.emails || [])
                    .sort((a, b) => new Date(b.email_date).getTime() - new Date(a.email_date).getTime())
                    .map((email) => (
                      <div
                        key={email.id}
                        className="bg-white border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            {formatDateTime(email.email_date)}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onEditEmail(email)}
                              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit email"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this email?')) {
                                  onDeleteEmail(email.id);
                                }
                              }}
                              className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete email"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {email.subject && (
                          <p className="text-gray-900 font-medium text-sm mb-1">{email.subject}</p>
                        )}
                        {(email.emailed_to || email.email_address) && (
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-2 pt-2 border-t border-gray-100">
                            {email.emailed_to && (
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-2 text-gray-400" />
                                <span>{email.emailed_to}</span>
                              </div>
                            )}
                            {email.email_address && (
                              <div className="flex items-center">
                                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                <span className="text-blue-600">{email.email_address}</span>
                              </div>
                            )}
                          </div>
                        )}
                        {email.notes && (
                          <p className="text-gray-700 text-sm">{email.notes}</p>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <Mail className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p>No emails logged yet</p>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <StickyNote className="w-5 h-5" />
                  Notes ({notes.length})
                </h3>
              </div>

              {notes.length > 0 ? (
                <div className="space-y-3">
                  {notes
                    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                    .map((note) => (
                      <div
                        key={note.id}
                        className="bg-white border border-amber-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">{note.title}</h4>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="w-3.5 h-3.5 mr-1" />
                                Updated: {new Date(note.updated_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-3.5 h-3.5 mr-1" />
                                {new Date(note.updated_at).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onEditNote(note)}
                              className="p-1 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                              title="Edit note"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this note?')) {
                                  onDeleteNote(note.id);
                                }
                              }}
                              className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete note"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {note.content && (
                          <p className="text-gray-700 text-sm whitespace-pre-wrap">{note.content}</p>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <StickyNote className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p>No notes attached to this contact</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
