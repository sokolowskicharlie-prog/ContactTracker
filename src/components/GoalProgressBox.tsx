import { useState, useEffect } from 'react';
import { Target, ChevronDown, ChevronUp, Phone, Mail, Fuel, Clock, X, User, Calendar, Plus, Trash2 } from 'lucide-react';
import { supabase, DailyGoal, Call, Email, FuelDeal, Contact, ContactPerson } from '../lib/supabase';
import { useAuth } from '../lib/auth';

interface GoalProgressBoxProps {
  onSelectContact?: (contactId: string) => void;
}

export default function GoalProgressBox({ onSelectContact }: GoalProgressBoxProps) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [deals, setDeals] = useState<FuelDeal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<DailyGoal | null>(null);
  const [showAddActivity, setShowAddActivity] = useState(false);

  const [newCall, setNewCall] = useState({
    contact_id: '',
    call_date: new Date().toISOString(),
    spoke_with: '',
    phone_number: '',
    duration: '',
    notes: '',
    use_manual_entry: false,
    selected_person_id: ''
  });

  const [newEmail, setNewEmail] = useState({
    contact_id: '',
    email_date: new Date().toISOString(),
    emailed_to: '',
    email_address: '',
    subject: '',
    notes: ''
  });

  const [newDeal, setNewDeal] = useState({
    contact_id: '',
    deal_date: new Date().toISOString(),
    vessel_name: '',
    fuel_type: '',
    fuel_quantity: '',
    port: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      loadGoals();
      loadActivities();
      loadContacts();
      loadContactPersons();

      const callsSubscription = supabase
        .channel('calls_progress')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'calls', filter: `user_id=eq.${user.id}` }, () => {
          loadActivities();
        })
        .subscribe();

      const emailsSubscription = supabase
        .channel('emails_progress')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'emails', filter: `user_id=eq.${user.id}` }, () => {
          loadActivities();
        })
        .subscribe();

      const dealsSubscription = supabase
        .channel('deals_progress')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'fuel_deals', filter: `user_id=eq.${user.id}` }, () => {
          loadActivities();
        })
        .subscribe();

      const goalsSubscription = supabase
        .channel('goals_progress')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_goals', filter: `user_id=eq.${user.id}` }, () => {
          loadGoals();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(callsSubscription);
        supabase.removeChannel(emailsSubscription);
        supabase.removeChannel(dealsSubscription);
        supabase.removeChannel(goalsSubscription);
      };
    }
  }, [user]);

  const loadGoals = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('target_date', today)
      .eq('is_active', true);

    if (!error) {
      setGoals(data || []);
    }
  };

  const loadActivities = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    const [callsResult, emailsResult, dealsResult] = await Promise.all([
      supabase
        .from('calls')
        .select('*')
        .eq('user_id', user.id)
        .gte('call_date', today)
        .order('call_date', { ascending: false }),
      supabase
        .from('emails')
        .select('*')
        .eq('user_id', user.id)
        .gte('email_date', today)
        .order('email_date', { ascending: false }),
      supabase
        .from('fuel_deals')
        .select('*')
        .eq('user_id', user.id)
        .gte('deal_date', today)
        .order('deal_date', { ascending: false })
    ]);

    if (!callsResult.error) setCalls(callsResult.data || []);
    if (!emailsResult.error) setEmails(emailsResult.data || []);
    if (!dealsResult.error) setDeals(dealsResult.data || []);
  };

  const loadContacts = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (!error) {
      setContacts(data || []);
    }
  };

  const loadContactPersons = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('contact_persons')
      .select('*')
      .eq('user_id', user.id);

    if (!error) {
      setContactPersons(data || []);
    }
  };

  const handleAddCall = async () => {
    if (!user || !selectedGoal || !newCall.contact_id) return;

    if (newCall.use_manual_entry && newCall.spoke_with && newCall.phone_number) {
      const existingPerson = contactPersons.find(cp =>
        cp.contact_id === newCall.contact_id &&
        cp.name.toLowerCase() === newCall.spoke_with.toLowerCase()
      );

      if (!existingPerson) {
        await supabase.from('contact_persons').insert([{
          user_id: user.id,
          contact_id: newCall.contact_id,
          name: newCall.spoke_with,
          phone: newCall.phone_number
        }]);
        await loadContactPersons();
      }
    }

    const { error } = await supabase.from('calls').insert([{
      user_id: user.id,
      contact_id: newCall.contact_id,
      call_date: newCall.call_date,
      spoke_with: newCall.spoke_with || null,
      phone_number: newCall.phone_number || null,
      duration: newCall.duration ? parseInt(newCall.duration) : null,
      notes: newCall.notes || null
    }]);

    if (!error) {
      await supabase
        .from('contacts')
        .update({
          last_activity_date: newCall.call_date,
          last_activity_type: 'call'
        })
        .eq('id', newCall.contact_id);

      setNewCall({
        contact_id: '',
        call_date: new Date().toISOString(),
        spoke_with: '',
        phone_number: '',
        duration: '',
        notes: '',
        use_manual_entry: false,
        selected_person_id: ''
      });
      setShowAddActivity(false);
      loadActivities();
    }
  };

  const handleAddEmail = async () => {
    if (!user || !selectedGoal || !newEmail.contact_id) return;

    const { error } = await supabase.from('emails').insert([{
      user_id: user.id,
      contact_id: newEmail.contact_id,
      email_date: newEmail.email_date,
      emailed_to: newEmail.emailed_to || null,
      email_address: newEmail.email_address || null,
      subject: newEmail.subject || null,
      notes: newEmail.notes || null
    }]);

    if (!error) {
      await supabase
        .from('contacts')
        .update({
          last_activity_date: newEmail.email_date,
          last_activity_type: 'email'
        })
        .eq('id', newEmail.contact_id);

      setNewEmail({
        contact_id: '',
        email_date: new Date().toISOString(),
        emailed_to: '',
        email_address: '',
        subject: '',
        notes: ''
      });
      setShowAddActivity(false);
      loadActivities();
    }
  };

  const handleAddDeal = async () => {
    if (!user || !selectedGoal || !newDeal.contact_id) return;

    const { error } = await supabase.from('fuel_deals').insert([{
      user_id: user.id,
      contact_id: newDeal.contact_id,
      deal_date: newDeal.deal_date,
      vessel_name: newDeal.vessel_name || null,
      fuel_type: newDeal.fuel_type || null,
      fuel_quantity: newDeal.fuel_quantity ? parseFloat(newDeal.fuel_quantity) : null,
      port: newDeal.port || null,
      notes: newDeal.notes || null
    }]);

    if (!error) {
      await supabase
        .from('contacts')
        .update({
          last_activity_date: newDeal.deal_date,
          last_activity_type: 'deal'
        })
        .eq('id', newDeal.contact_id);

      setNewDeal({
        contact_id: '',
        deal_date: new Date().toISOString(),
        vessel_name: '',
        fuel_type: '',
        fuel_quantity: '',
        port: '',
        notes: ''
      });
      setShowAddActivity(false);
      loadActivities();
    }
  };

  const calculateProgress = (goal: DailyGoal) => {
    let currentCount = 0;
    const today = new Date().toISOString().split('T')[0];

    if (goal.goal_type === 'calls') {
      currentCount = calls.filter(c => {
        const callDate = new Date(c.call_date).toISOString().split('T')[0];
        return callDate === today;
      }).length;
    } else if (goal.goal_type === 'emails') {
      currentCount = emails.filter(e => {
        const emailDate = new Date(e.email_date).toISOString().split('T')[0];
        return emailDate === today;
      }).length;
    } else if (goal.goal_type === 'deals') {
      currentCount = deals.filter(d => {
        const dealDate = new Date(d.deal_date).toISOString().split('T')[0];
        return dealDate === today;
      }).length;
    }

    currentCount += goal.manual_count;

    const percentComplete = (currentCount / goal.target_amount) * 100;

    const now = new Date();
    const [targetHour, targetMinute] = goal.target_time.split(':').map(Number);
    const targetDateTime = new Date(now);
    targetDateTime.setHours(targetHour, targetMinute, 0, 0);
    const timeRemaining = targetDateTime.getTime() - now.getTime();

    let timeRemainingStr = '';
    if (timeRemaining <= 0) {
      timeRemainingStr = 'Expired';
    } else {
      const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      timeRemainingStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }

    const timeElapsed = now.getTime() - new Date(now.setHours(0, 0, 0, 0)).getTime();
    const totalTimeAvailable = targetDateTime.getTime() - new Date(now.setHours(0, 0, 0, 0)).getTime();
    const expectedProgress = (timeElapsed / totalTimeAvailable) * goal.target_amount;
    const onTrack = currentCount >= expectedProgress;

    return {
      currentAmount: currentCount,
      targetAmount: goal.target_amount,
      percentComplete,
      timeRemaining: timeRemainingStr,
      onTrack
    };
  };

  const getGoalIcon = (type: 'calls' | 'emails' | 'deals') => {
    switch (type) {
      case 'calls': return <Phone className="w-4 h-4" />;
      case 'emails': return <Mail className="w-4 h-4" />;
      case 'deals': return <Fuel className="w-4 h-4" />;
    }
  };

  const getGoalLabel = (type: 'calls' | 'emails' | 'deals') => {
    switch (type) {
      case 'calls': return 'Calls';
      case 'emails': return 'Emails';
      case 'deals': return 'Deals';
    }
  };

  if (goals.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-40 w-80">
      <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            <h3 className="font-semibold">Today's Goals</h3>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isExpanded && (
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {goals.map(goal => {
              const progress = calculateProgress(goal);
              return (
                <div
                  key={goal.id}
                  onClick={() => setSelectedGoal(goal)}
                  className={`p-3 rounded-lg border-2 cursor-pointer hover:shadow-md transition-shadow ${
                    progress.percentComplete >= 100
                      ? 'bg-green-50 border-green-200'
                      : progress.onTrack
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-orange-50 border-orange-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`${
                        progress.percentComplete >= 100
                          ? 'text-green-600'
                          : progress.onTrack
                          ? 'text-blue-600'
                          : 'text-orange-600'
                      }`}>
                        {getGoalIcon(goal.goal_type)}
                      </div>
                      <span className="font-semibold text-gray-900 text-sm">
                        {getGoalLabel(goal.goal_type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Clock className="w-3 h-3" />
                      <span>{progress.timeRemaining}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">
                        {progress.currentAmount} / {progress.targetAmount}
                      </span>
                      <span className={`font-semibold ${
                        progress.percentComplete >= 100
                          ? 'text-green-600'
                          : progress.onTrack
                          ? 'text-blue-600'
                          : 'text-orange-600'
                      }`}>
                        {Math.round(progress.percentComplete)}%
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          progress.percentComplete >= 100
                            ? 'bg-green-500'
                            : progress.onTrack
                            ? 'bg-blue-500'
                            : 'bg-orange-500'
                        }`}
                        style={{ width: `${Math.min(progress.percentComplete, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-xs text-gray-600">
                      <span>Target: {goal.target_time}</span>
                      {progress.onTrack ? (
                        <span className="text-green-600 font-medium">On Track</span>
                      ) : progress.timeRemaining === 'Expired' ? (
                        <span className="text-red-600 font-medium">Time Up</span>
                      ) : (
                        <span className="text-orange-600 font-medium">Behind</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedGoal && (() => {
        const goalDate = selectedGoal.target_date;

        const goalCalls = calls.filter(call => {
          const callDate = new Date(call.call_date).toISOString().split('T')[0];
          return callDate === goalDate;
        });

        const goalEmails = emails.filter(email => {
          const emailDate = new Date(email.email_date).toISOString().split('T')[0];
          return emailDate === goalDate;
        });

        const goalDeals = deals.filter(deal => {
          const dealDate = new Date(deal.deal_date).toISOString().split('T')[0];
          return dealDate === goalDate;
        });

        const goalTypeLabel = selectedGoal.goal_type === 'calls' ? 'Calls' :
                              selectedGoal.goal_type === 'emails' ? 'Emails' : 'Deals';
        const goalIcon = selectedGoal.goal_type === 'calls' ? <Phone className="w-6 h-6" /> :
                         selectedGoal.goal_type === 'emails' ? <Mail className="w-6 h-6" /> :
                         <Fuel className="w-6 h-6" />;

        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {goalIcon}
                  <div>
                    <h3 className="text-xl font-bold">{goalTypeLabel} Goal Details</h3>
                    <p className="text-blue-100 text-sm mt-1">
                      {new Date(goalDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to delete this goal?')) {
                        await supabase.from('daily_goals').delete().eq('id', selectedGoal.id);
                        setSelectedGoal(null);
                        loadGoals();
                      }
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Delete goal"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedGoal(null)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Goal Summary</h4>
                    <span className="text-sm text-gray-600">Target: {selectedGoal.target_time}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {calculateProgress(selectedGoal).currentAmount} / {selectedGoal.target_amount}
                      </p>
                      <p className="text-sm text-gray-600">
                        {Math.round(calculateProgress(selectedGoal).percentComplete)}% Complete
                      </p>
                    </div>
                    {selectedGoal.manual_count > 0 && (
                      <div className="ml-auto text-right">
                        <p className="text-sm text-gray-600">Manual Count</p>
                        <p className="text-xl font-semibold text-purple-600">{selectedGoal.manual_count}</p>
                      </div>
                    )}
                  </div>
                  {selectedGoal.notes && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-sm text-gray-700">{selectedGoal.notes}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {selectedGoal.goal_type === 'calls' && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <Phone className="w-5 h-5 text-green-600" />
                          Calls Made ({goalCalls.length})
                        </h4>
                        <button
                          onClick={() => setShowAddActivity(!showAddActivity)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Add Call
                        </button>
                      </div>

                      {showAddActivity && selectedGoal.goal_type === 'calls' && (
                        <div className="mb-4 p-4 bg-white rounded-lg border-2 border-green-300 shadow-sm">
                          <h5 className="font-semibold text-gray-900 mb-3">Add New Call</h5>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Contact *</label>
                              <select
                                value={newCall.contact_id}
                                onChange={(e) => setNewCall({ ...newCall, contact_id: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                              >
                                <option value="">Select a contact</option>
                                {contacts.map(contact => (
                                  <option key={contact.id} value={contact.id}>{contact.name}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                              <input
                                type="datetime-local"
                                value={newCall.call_date.slice(0, 16)}
                                onChange={(e) => setNewCall({ ...newCall, call_date: new Date(e.target.value).toISOString() })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                            </div>

                            {newCall.contact_id && contactPersons.filter(cp => cp.contact_id === newCall.contact_id).length > 0 && (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setNewCall({ ...newCall, use_manual_entry: false, spoke_with: '', phone_number: '' })}
                                  className={`flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                    !newCall.use_manual_entry
                                      ? 'bg-green-100 text-green-700 font-medium'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  Select PIC
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setNewCall({ ...newCall, use_manual_entry: true, selected_person_id: '', spoke_with: '', phone_number: '' })}
                                  className={`flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                    newCall.use_manual_entry
                                      ? 'bg-green-100 text-green-700 font-medium'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  Type Manually
                                </button>
                              </div>
                            )}

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Spoke With</label>
                              {!newCall.use_manual_entry && newCall.contact_id && contactPersons.filter(cp => cp.contact_id === newCall.contact_id).length > 0 ? (
                                <select
                                  value={newCall.selected_person_id}
                                  onChange={(e) => {
                                    const personId = e.target.value;
                                    const person = contactPersons.find(cp => cp.id === personId);
                                    if (person) {
                                      const phones = [];
                                      if (person.mobile) phones.push(person.mobile);
                                      if (person.phone) phones.push(person.phone);
                                      if (person.direct_line) phones.push(person.direct_line);
                                      setNewCall({
                                        ...newCall,
                                        selected_person_id: personId,
                                        spoke_with: person.name,
                                        phone_number: phones.length > 0 ? phones[0] : ''
                                      });
                                    } else {
                                      setNewCall({ ...newCall, selected_person_id: '', spoke_with: '', phone_number: '' });
                                    }
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                  <option value="">Select a person</option>
                                  {contactPersons
                                    .filter(cp => cp.contact_id === newCall.contact_id)
                                    .map(cp => (
                                      <option key={cp.id} value={cp.id}>{cp.name}{cp.job_title ? ` - ${cp.job_title}` : ''}</option>
                                    ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={newCall.spoke_with}
                                  onChange={(e) => setNewCall({ ...newCall, spoke_with: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  placeholder="Name of person"
                                />
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                              {newCall.selected_person_id && (() => {
                                const person = contactPersons.find(cp => cp.id === newCall.selected_person_id);
                                const phones = [];
                                if (person?.mobile) phones.push({ label: 'Mobile', number: person.mobile });
                                if (person?.phone) phones.push({ label: 'Phone', number: person.phone });
                                if (person?.direct_line) phones.push({ label: 'Direct Line', number: person.direct_line });
                                return phones.length > 1 ? (
                                  <select
                                    value={newCall.phone_number}
                                    onChange={(e) => setNewCall({ ...newCall, phone_number: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mb-2"
                                  >
                                    {phones.map((phone, idx) => (
                                      <option key={idx} value={phone.number}>
                                        {phone.label}: {phone.number}
                                      </option>
                                    ))}
                                  </select>
                                ) : null;
                              })()}
                              <input
                                type="text"
                                value={newCall.phone_number}
                                onChange={(e) => setNewCall({ ...newCall, phone_number: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="Phone number"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                              <input
                                type="number"
                                value={newCall.duration}
                                onChange={(e) => setNewCall({ ...newCall, duration: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="Duration in minutes"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                              <textarea
                                value={newCall.notes}
                                onChange={(e) => setNewCall({ ...newCall, notes: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                rows={3}
                                placeholder="Call notes"
                              />
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={handleAddCall}
                                disabled={!newCall.contact_id}
                                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                              >
                                Save Call
                              </button>
                              <button
                                onClick={() => setShowAddActivity(false)}
                                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        {goalCalls.map(call => (
                          <div key={call.id} className="bg-green-50 rounded-lg p-4 border border-green-100">
                            <div className="flex items-start justify-between mb-2">
                              <button
                                onClick={() => onSelectContact?.(call.contact_id)}
                                className="text-lg font-bold text-gray-900 hover:text-green-700 underline decoration-transparent hover:decoration-green-700 transition-all cursor-pointer text-left"
                              >
                                {contacts.find(c => c.id === call.contact_id)?.name || 'Unknown Contact'}
                              </button>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Clock className="w-4 h-4" />
                                  {new Date(call.call_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <button
                                  onClick={async () => {
                                    if (confirm('Are you sure you want to delete this call?')) {
                                      await supabase.from('calls').delete().eq('id', call.id);
                                      loadActivities();
                                    }
                                  }}
                                  className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete call"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            {call.spoke_with && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2 ml-1">
                                <User className="w-4 h-4" />
                                <span className="font-medium">Contact Person: {call.spoke_with}</span>
                              </div>
                            )}
                            {call.phone_number && (
                              <div className="text-sm text-gray-600 mb-1">
                                Phone: {call.phone_number}
                              </div>
                            )}
                            {call.duration && (
                              <div className="text-sm text-gray-600 mb-1">
                                Duration: {call.duration} minutes
                              </div>
                            )}
                            {call.notes && (
                              <div className="mt-2 text-sm text-gray-700 bg-white p-2 rounded">
                                {call.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedGoal.goal_type === 'emails' && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <Mail className="w-5 h-5 text-orange-600" />
                          Emails Sent ({goalEmails.length})
                        </h4>
                        <button
                          onClick={() => setShowAddActivity(!showAddActivity)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Add Email
                        </button>
                      </div>

                      {showAddActivity && selectedGoal.goal_type === 'emails' && (
                        <div className="mb-4 p-4 bg-white rounded-lg border-2 border-orange-300 shadow-sm">
                          <h5 className="font-semibold text-gray-900 mb-3">Add New Email</h5>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Contact *</label>
                              <select
                                value={newEmail.contact_id}
                                onChange={(e) => setNewEmail({ ...newEmail, contact_id: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                required
                              >
                                <option value="">Select a contact</option>
                                {contacts.map(contact => (
                                  <option key={contact.id} value={contact.id}>{contact.name}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                              <input
                                type="datetime-local"
                                value={newEmail.email_date.slice(0, 16)}
                                onChange={(e) => setNewEmail({ ...newEmail, email_date: new Date(e.target.value).toISOString() })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                              <select
                                value={newEmail.emailed_to}
                                onChange={(e) => setNewEmail({ ...newEmail, emailed_to: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              >
                                <option value="">Select contact person (optional)</option>
                                {newEmail.contact_id && contactPersons
                                  .filter(cp => cp.contact_id === newEmail.contact_id)
                                  .map(cp => (
                                    <option key={cp.id} value={cp.name}>{cp.name}</option>
                                  ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                              <input
                                type="email"
                                value={newEmail.email_address}
                                onChange={(e) => setNewEmail({ ...newEmail, email_address: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="email@example.com"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                              <input
                                type="text"
                                value={newEmail.subject}
                                onChange={(e) => setNewEmail({ ...newEmail, subject: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="Email subject"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                              <textarea
                                value={newEmail.notes}
                                onChange={(e) => setNewEmail({ ...newEmail, notes: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                rows={3}
                                placeholder="Email notes"
                              />
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={handleAddEmail}
                                disabled={!newEmail.contact_id}
                                className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                              >
                                Save Email
                              </button>
                              <button
                                onClick={() => setShowAddActivity(false)}
                                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        {goalEmails.map(email => (
                          <div key={email.id} className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                            <div className="flex items-start justify-between mb-2">
                              <button
                                onClick={() => onSelectContact?.(email.contact_id)}
                                className="text-lg font-bold text-gray-900 hover:text-orange-700 underline decoration-transparent hover:decoration-orange-700 transition-all cursor-pointer text-left"
                              >
                                {contacts.find(c => c.id === email.contact_id)?.name || 'Unknown Contact'}
                              </button>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Clock className="w-4 h-4" />
                                  {new Date(email.email_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <button
                                  onClick={async () => {
                                    if (confirm('Are you sure you want to delete this email?')) {
                                      await supabase.from('emails').delete().eq('id', email.id);
                                      loadActivities();
                                    }
                                  }}
                                  className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete email"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            {email.emailed_to && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2 ml-1">
                                <User className="w-4 h-4" />
                                <span className="font-medium">Contact Person: {email.emailed_to}</span>
                              </div>
                            )}
                            {email.subject && (
                              <div className="text-sm font-medium text-gray-900 mb-1">
                                Subject: {email.subject}
                              </div>
                            )}
                            {email.email_address && (
                              <div className="text-sm text-gray-600 mb-1">
                                Email: {email.email_address}
                              </div>
                            )}
                            {email.notes && (
                              <div className="mt-2 text-sm text-gray-700 bg-white p-2 rounded">
                                {email.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedGoal.goal_type === 'deals' && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <Fuel className="w-5 h-5 text-blue-600" />
                          Deals Closed ({goalDeals.length})
                        </h4>
                        <button
                          onClick={() => setShowAddActivity(!showAddActivity)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Add Deal
                        </button>
                      </div>

                      {showAddActivity && selectedGoal.goal_type === 'deals' && (
                        <div className="mb-4 p-4 bg-white rounded-lg border-2 border-blue-300 shadow-sm">
                          <h5 className="font-semibold text-gray-900 mb-3">Add New Deal</h5>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Contact *</label>
                              <select
                                value={newDeal.contact_id}
                                onChange={(e) => setNewDeal({ ...newDeal, contact_id: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                              >
                                <option value="">Select a contact</option>
                                {contacts.map(contact => (
                                  <option key={contact.id} value={contact.id}>{contact.name}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                              <input
                                type="datetime-local"
                                value={newDeal.deal_date.slice(0, 16)}
                                onChange={(e) => setNewDeal({ ...newDeal, deal_date: new Date(e.target.value).toISOString() })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Vessel Name</label>
                              <input
                                type="text"
                                value={newDeal.vessel_name}
                                onChange={(e) => setNewDeal({ ...newDeal, vessel_name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Vessel name"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
                              <select
                                value={newDeal.fuel_type}
                                onChange={(e) => setNewDeal({ ...newDeal, fuel_type: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">Select fuel type</option>
                                <option value="MGO">MGO</option>
                                <option value="VLSFO">VLSFO</option>
                                <option value="LSMGO">LSMGO</option>
                                <option value="HFO">HFO</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (MT)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={newDeal.fuel_quantity}
                                onChange={(e) => setNewDeal({ ...newDeal, fuel_quantity: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Quantity in metric tons"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                              <input
                                type="text"
                                value={newDeal.port}
                                onChange={(e) => setNewDeal({ ...newDeal, port: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Port name"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                              <textarea
                                value={newDeal.notes}
                                onChange={(e) => setNewDeal({ ...newDeal, notes: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={3}
                                placeholder="Deal notes"
                              />
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={handleAddDeal}
                                disabled={!newDeal.contact_id}
                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                              >
                                Save Deal
                              </button>
                              <button
                                onClick={() => setShowAddActivity(false)}
                                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        {goalDeals.map(deal => (
                          <div key={deal.id} className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                            <div className="flex items-start justify-between mb-2">
                              <button
                                onClick={() => onSelectContact?.(deal.contact_id)}
                                className="text-lg font-bold text-gray-900 hover:text-blue-700 underline decoration-transparent hover:decoration-blue-700 transition-all cursor-pointer text-left"
                              >
                                {contacts.find(c => c.id === deal.contact_id)?.name || 'Unknown Contact'}
                              </button>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Clock className="w-4 h-4" />
                                  {new Date(deal.deal_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <button
                                  onClick={async () => {
                                    if (confirm('Are you sure you want to delete this deal?')) {
                                      await supabase.from('fuel_deals').delete().eq('id', deal.id);
                                      loadActivities();
                                    }
                                  }}
                                  className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete deal"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            {deal.vessel_name && (
                              <div className="text-sm text-gray-600 mb-1">
                                Vessel: {deal.vessel_name}
                              </div>
                            )}
                            {deal.fuel_type && (
                              <div className="text-sm text-gray-600 mb-1">
                                Fuel Type: {deal.fuel_type}
                              </div>
                            )}
                            {deal.fuel_quantity && (
                              <div className="text-sm text-gray-600 mb-1">
                                Quantity: {deal.fuel_quantity} MT
                              </div>
                            )}
                            {deal.port && (
                              <div className="text-sm text-gray-600 mb-1">
                                Port: {deal.port}
                              </div>
                            )}
                            {deal.notes && (
                              <div className="mt-2 text-sm text-gray-700 bg-white p-2 rounded">
                                {deal.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {((selectedGoal.goal_type === 'calls' && goalCalls.length === 0) ||
                    (selectedGoal.goal_type === 'emails' && goalEmails.length === 0) ||
                    (selectedGoal.goal_type === 'deals' && goalDeals.length === 0)) && (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-3">
                        <Calendar className="w-16 h-16 mx-auto" />
                      </div>
                      <p className="text-gray-500 text-lg">No {goalTypeLabel.toLowerCase()} recorded for this day</p>
                      {selectedGoal.manual_count > 0 && (
                        <p className="text-sm text-gray-400 mt-2">
                          Manual count: {selectedGoal.manual_count}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
