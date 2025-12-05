import { useState, useEffect } from 'react';
import { Target, ChevronDown, ChevronUp, Phone, Mail, Fuel, Clock, X, User, Calendar, Plus, Trash2, Edit2, Check, ArrowUp, ArrowDown, RefreshCw, CheckSquare } from 'lucide-react';
import { supabase, DailyGoal, Call, Email, FuelDeal, Contact, ContactPerson, CallSchedule, Task } from '../lib/supabase';
import { useAuth } from '../lib/auth';

interface GoalProgressBoxProps {
  onSelectContact?: (contactId: string) => void;
  onLogCall?: (contactId: string) => void;
  onLogEmail?: (contactId: string) => void;
}

export default function GoalProgressBox({ onSelectContact, onLogCall, onLogEmail }: GoalProgressBoxProps) {
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
  const [editingCall, setEditingCall] = useState<Call | null>(null);
  const [editingEmail, setEditingEmail] = useState<Email | null>(null);
  const [editingDeal, setEditingDeal] = useState<FuelDeal | null>(null);

  const [newCall, setNewCall] = useState({
    contact_id: '',
    call_date: new Date().toISOString(),
    spoke_with: '',
    phone_number: '',
    duration: '',
    notes: '',
    use_manual_entry: false,
    selected_person_id: '',
    create_task: false
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

  const [callSchedules, setCallSchedules] = useState<CallSchedule[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<Task[]>([]);
  const [replacingScheduleId, setReplacingScheduleId] = useState<string | null>(null);
  const [replaceContactId, setReplaceContactId] = useState<string>('');
  const [scheduleDuration] = useState(20);

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

      const schedulesSubscription = supabase
        .channel('schedules_progress')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'call_schedules', filter: `user_id=eq.${user.id}` }, () => {
          if (selectedGoal) {
            loadSchedulesForGoal(selectedGoal.id);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(callsSubscription);
        supabase.removeChannel(emailsSubscription);
        supabase.removeChannel(dealsSubscription);
        supabase.removeChannel(goalsSubscription);
        supabase.removeChannel(schedulesSubscription);
      };
    }
  }, [user, selectedGoal]);

  useEffect(() => {
    if (selectedGoal && selectedGoal.goal_type === 'calls') {
      loadSchedulesForGoal(selectedGoal.id);
      loadScheduledTasksForGoal(selectedGoal);
    }
  }, [selectedGoal]);

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

  const loadSchedulesForGoal = async (goalId: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('call_schedules')
      .select('*')
      .eq('goal_id', goalId)
      .order('display_order', { ascending: true });

    if (!error) {
      setCallSchedules(data || []);
    }
  };

  const loadScheduledTasksForGoal = async (goal: DailyGoal) => {
    if (!user) return;

    const startOfDay = new Date(goal.target_date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(goal.target_date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .not('due_date', 'is', null)
      .gte('due_date', startOfDay.toISOString())
      .lte('due_date', endOfDay.toISOString())
      .order('due_date', { ascending: true });

    if (!error) {
      setScheduledTasks(data || []);
    }
  };

  const toggleTaskComplete = async (taskId: string) => {
    const task = scheduledTasks.find(t => t.id === taskId);
    if (!task) return;

    const isMarkingComplete = !task.completed;

    const { error } = await supabase
      .from('tasks')
      .update({
        completed: isMarkingComplete,
        completed_at: isMarkingComplete ? new Date().toISOString() : null
      })
      .eq('id', taskId);

    if (!error) {
      setScheduledTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, completed: isMarkingComplete, completed_at: isMarkingComplete ? new Date().toISOString() : null } : t
      ));

      if (isMarkingComplete && task.contact_id) {
        if (task.task_type === 'call_back' && onLogCall) {
          onLogCall(task.contact_id);
        } else if (task.task_type === 'email_back' && onLogEmail) {
          onLogEmail(task.contact_id);
        }
      }
    }
  };

  const toggleScheduleComplete = async (scheduleId: string) => {
    const schedule = callSchedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    const isMarkingComplete = !schedule.completed;

    const { error } = await supabase
      .from('call_schedules')
      .update({
        completed: isMarkingComplete,
        completed_at: isMarkingComplete ? new Date().toISOString() : null
      })
      .eq('id', scheduleId);

    if (!error) {
      setCallSchedules(callSchedules.map(s =>
        s.id === scheduleId
          ? { ...s, completed: isMarkingComplete, completed_at: isMarkingComplete ? new Date().toISOString() : null }
          : s
      ));

      if (isMarkingComplete && schedule.contact_id && onLogCall) {
        onLogCall(schedule.contact_id);
      }
    }
  };

  const handleReplaceContact = async (scheduleId: string) => {
    if (!replaceContactId) return;

    const contact = contacts.find(c => c.id === replaceContactId);
    if (!contact) return;

    const schedule = callSchedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    const currentStatus = contact.is_jammed ? 'jammed' : contact.is_client ? 'client' : contact.has_traction ? 'traction' : 'none';

    const { error } = await supabase
      .from('call_schedules')
      .update({
        contact_id: replaceContactId,
        contact_name: contact.name,
        timezone_label: contact.timezone || null,
        contact_status: currentStatus
      })
      .eq('id', scheduleId);

    if (!error && selectedGoal) {
      setReplacingScheduleId(null);
      setReplaceContactId('');
      loadSchedulesForGoal(selectedGoal.id);
    }
  };

  const handleAddCallAfterLast = async () => {
    if (!selectedGoal) return;

    const sortedSchedules = [...callSchedules].sort((a, b) =>
      new Date(b.scheduled_time).getTime() - new Date(a.scheduled_time).getTime()
    );

    const lastSchedule = sortedSchedules[0];
    if (!lastSchedule) return;

    const scheduledContactIds = new Set(callSchedules.map(s => s.contact_id).filter(Boolean));

    const eligibleContacts = contacts.filter(c => {
      if (scheduledContactIds.has(c.id)) return false;
      return true;
    });

    if (eligibleContacts.length === 0) return;

    const randomContact = eligibleContacts[Math.floor(Math.random() * eligibleContacts.length)];

    const lastCallEnd = new Date(lastSchedule.scheduled_time);
    lastCallEnd.setMinutes(lastCallEnd.getMinutes() + lastSchedule.call_duration_mins);

    const currentStatus = randomContact.is_jammed ? 'jammed' : randomContact.is_client ? 'client' : randomContact.has_traction ? 'traction' : 'none';
    const priorityLabel = randomContact.is_client ? 'High Value' : randomContact.has_traction ? 'Warm' : randomContact.last_activity_date ? 'Follow-Up' : 'Cold';

    const maxDisplayOrder = Math.max(...callSchedules.map(s => s.display_order), 0);

    const { error } = await supabase
      .from('call_schedules')
      .insert({
        goal_id: selectedGoal.id,
        scheduled_time: lastCallEnd.toISOString(),
        contact_id: randomContact.id,
        contact_name: randomContact.name,
        priority_label: priorityLabel,
        contact_status: currentStatus,
        is_suggested: false,
        completed: false,
        call_duration_mins: scheduleDuration,
        timezone_label: randomContact.timezone || null,
        display_order: maxDisplayOrder + 1,
        user_id: user!.id
      });

    if (!error) {
      const newCallEnd = new Date(lastCallEnd);
      newCallEnd.setMinutes(newCallEnd.getMinutes() + scheduleDuration);

      const [currentHours, currentMinutes] = selectedGoal.target_time.split(':').map(Number);
      const currentTargetTime = new Date(selectedGoal.target_date);
      currentTargetTime.setHours(currentHours, currentMinutes, 0, 0);

      if (newCallEnd > currentTargetTime) {
        const newTargetHours = newCallEnd.getHours();
        const newTargetMinutes = newCallEnd.getMinutes();
        const newTargetTime = `${String(newTargetHours).padStart(2, '0')}:${String(newTargetMinutes).padStart(2, '0')}`;

        await supabase
          .from('daily_goals')
          .update({ target_time: newTargetTime })
          .eq('id', selectedGoal.id);

        setGoals(goals.map(g => g.id === selectedGoal.id ? { ...g, target_time: newTargetTime } : g));
        setSelectedGoal({ ...selectedGoal, target_time: newTargetTime });
      }

      loadSchedulesForGoal(selectedGoal.id);
    }
  };

  const handleReorderSchedule = async (scheduleId: string, direction: 'up' | 'down') => {
    const currentIndex = callSchedules.findIndex(s => s.id === scheduleId);
    if (currentIndex === -1) return;
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === callSchedules.length - 1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentSchedule = callSchedules[currentIndex];
    const swapSchedule = callSchedules[newIndex];

    const updates = [
      supabase
        .from('call_schedules')
        .update({ display_order: newIndex })
        .eq('id', currentSchedule.id),
      supabase
        .from('call_schedules')
        .update({ display_order: currentIndex })
        .eq('id', swapSchedule.id)
    ];

    await Promise.all(updates);

    if (selectedGoal) {
      loadSchedulesForGoal(selectedGoal.id);
    }
  };

  const handleAddCall = async () => {
    if (!user || !selectedGoal || !newCall.contact_id) return;

    if (newCall.use_manual_entry && newCall.spoke_with && newCall.phone_number && !editingCall) {
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

    let error;
    if (editingCall) {
      const { error: updateError } = await supabase
        .from('calls')
        .update({
          call_date: newCall.call_date,
          spoke_with: newCall.spoke_with || null,
          phone_number: newCall.phone_number || null,
          duration: newCall.duration ? parseInt(newCall.duration) : null,
          notes: newCall.notes || null
        })
        .eq('id', editingCall.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('calls').insert([{
        user_id: user.id,
        contact_id: newCall.contact_id,
        call_date: newCall.call_date,
        spoke_with: newCall.spoke_with || null,
        phone_number: newCall.phone_number || null,
        duration: newCall.duration ? parseInt(newCall.duration) : null,
        notes: newCall.notes || null
      }]);
      error = insertError;
    }

    if (!error) {
      await supabase
        .from('contacts')
        .update({
          last_activity_date: newCall.call_date,
          last_activity_type: 'call'
        })
        .eq('id', newCall.contact_id);

      if (newCall.create_task && !editingCall) {
        const contactName = contacts.find(c => c.id === newCall.contact_id)?.name || 'Contact';
        await supabase.from('tasks').insert([{
          user_id: user.id,
          contact_id: newCall.contact_id,
          task_type: 'call_back',
          title: `Follow up call with ${contactName}`,
          notes: newCall.notes || '',
          completed: false
        }]);
      }

      setNewCall({
        contact_id: '',
        call_date: new Date().toISOString(),
        spoke_with: '',
        phone_number: '',
        duration: '',
        notes: '',
        use_manual_entry: false,
        selected_person_id: '',
        create_task: false
      });
      setEditingCall(null);
      setShowAddActivity(false);
      loadActivities();
    }
  };

  const handleAddEmail = async () => {
    if (!user || !selectedGoal || !newEmail.contact_id) return;

    let error;
    if (editingEmail) {
      const { error: updateError } = await supabase
        .from('emails')
        .update({
          email_date: newEmail.email_date,
          emailed_to: newEmail.emailed_to || null,
          email_address: newEmail.email_address || null,
          subject: newEmail.subject || null,
          notes: newEmail.notes || null
        })
        .eq('id', editingEmail.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('emails').insert([{
        user_id: user.id,
        contact_id: newEmail.contact_id,
        email_date: newEmail.email_date,
        emailed_to: newEmail.emailed_to || null,
        email_address: newEmail.email_address || null,
        subject: newEmail.subject || null,
        notes: newEmail.notes || null
      }]);
      error = insertError;
    }

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
      setEditingEmail(null);
      setShowAddActivity(false);
      loadActivities();
    }
  };

  const handleAddDeal = async () => {
    if (!user || !selectedGoal || !newDeal.contact_id) return;

    let error;
    if (editingDeal) {
      const { error: updateError } = await supabase
        .from('fuel_deals')
        .update({
          deal_date: newDeal.deal_date,
          vessel_name: newDeal.vessel_name || null,
          fuel_type: newDeal.fuel_type || null,
          fuel_quantity: newDeal.fuel_quantity ? parseFloat(newDeal.fuel_quantity) : null,
          port: newDeal.port || null,
          notes: newDeal.notes || null
        })
        .eq('id', editingDeal.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('fuel_deals').insert([{
        user_id: user.id,
        contact_id: newDeal.contact_id,
        deal_date: newDeal.deal_date,
        vessel_name: newDeal.vessel_name || null,
        fuel_type: newDeal.fuel_type || null,
        fuel_quantity: newDeal.fuel_quantity ? parseFloat(newDeal.fuel_quantity) : null,
        port: newDeal.port || null,
        notes: newDeal.notes || null
      }]);
      error = insertError;
    }

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
      setEditingDeal(null);
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
                    <div className="flex items-center gap-2">
                      {selectedGoal.goal_type === 'calls' && (
                        <button
                          onClick={() => {
                            setEditingCall(null);
                            setNewCall({
                              contact_id: '',
                              call_date: new Date().toISOString(),
                              spoke_with: '',
                              phone_number: '',
                              duration: '',
                              notes: '',
                              use_manual_entry: false,
                              selected_person_id: '',
                              create_task: false
                            });
                            setShowAddActivity(!showAddActivity);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add New Call
                        </button>
                      )}
                      <span className="text-sm text-gray-600">Target: {selectedGoal.target_time}</span>
                    </div>
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
                  </div>
                  {selectedGoal.notes && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-sm text-gray-700">{selectedGoal.notes}</p>
                    </div>
                  )}
                </div>

                {showAddActivity && selectedGoal.goal_type === 'calls' && (
                  <div className="mb-6 p-4 bg-white rounded-lg border-2 border-green-300 shadow-sm">
                    <h5 className="font-semibold text-gray-900 mb-3">{editingCall ? 'Edit Call' : 'Add New Call'}</h5>
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

                      {!editingCall && (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <input
                            type="checkbox"
                            id="create-task"
                            checked={newCall.create_task}
                            onChange={(e) => setNewCall({ ...newCall, create_task: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <label htmlFor="create-task" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Add new task for follow-up call
                          </label>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={handleAddCall}
                          disabled={!newCall.contact_id}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                          {editingCall ? 'Update Call' : 'Save Call'}
                        </button>
                        <button
                          onClick={() => {
                            setShowAddActivity(false);
                            setEditingCall(null);
                            setNewCall({
                              contact_id: '',
                              call_date: new Date().toISOString(),
                              spoke_with: '',
                              phone_number: '',
                              duration: '',
                              notes: '',
                              use_manual_entry: false,
                              selected_person_id: '',
                              create_task: false
                            });
                          }}
                          className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedGoal.goal_type === 'calls' && (callSchedules.length > 0 || scheduledTasks.length > 0) && (() => {
                  const now = new Date();
                  const [targetHours, targetMinutes] = selectedGoal.target_time.split(':').map(Number);
                  const targetDateTime = new Date(selectedGoal.target_date);
                  targetDateTime.setHours(targetHours, targetMinutes, 0, 0);

                  const filteredSchedules = callSchedules.filter(schedule => {
                    const schedTime = new Date(schedule.scheduled_time);
                    return schedTime >= now && schedTime <= targetDateTime;
                  });

                  type ScheduleItem = {
                    type: 'call' | 'task';
                    time: Date;
                    data: CallSchedule | Task;
                  };

                  const mergedSchedule: ScheduleItem[] = [
                    ...filteredSchedules.map(s => ({ type: 'call' as const, time: new Date(s.scheduled_time), data: s })),
                    ...scheduledTasks.map(t => ({ type: 'task' as const, time: new Date(t.due_date!), data: t }))
                  ].sort((a, b) => a.time.getTime() - b.time.getTime());

                  const remainingCalls = filteredSchedules.filter(s => !s.completed).length;
                  const remainingTasks = scheduledTasks.filter(t => !t.completed).length;

                  return (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Schedule ({remainingCalls} calls, {remainingTasks} tasks until {selectedGoal.target_time})
                      </h4>
                      {mergedSchedule.length === 0 ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                          <p className="text-gray-600">No scheduled activities between now and {selectedGoal.target_time}</p>
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                          <div className="max-h-96 overflow-y-auto">
                            {mergedSchedule.map((item, idx) => {
                              if (item.type === 'task') {
                                const task = item.data as Task;
                                const taskTime = new Date(task.due_date!);
                                const taskContact = contacts.find(c => c.id === task.contact_id);

                                let taskLocalTime = '';
                                if (taskContact?.timezone) {
                                  const match = taskContact.timezone.match(/GMT([+-]\d+)/);
                                  if (match) {
                                    const offset = parseInt(match[1]);
                                    const localDate = new Date(taskTime.getTime() + offset * 60 * 60 * 1000);
                                    taskLocalTime = localDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                                  }
                                }

                                return (
                                  <div
                                    key={`task-${task.id}`}
                                    className={`flex items-start gap-3 p-3 border-b border-gray-200 last:border-b-0 ${
                                      task.completed ? 'bg-gray-100 opacity-60' : 'bg-purple-50 hover:bg-purple-100'
                                    }`}
                                  >
                                    <div className="flex items-center pt-1">
                                      <button
                                        onClick={() => toggleTaskComplete(task.id)}
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                          task.completed
                                            ? 'bg-purple-600 border-purple-600'
                                            : 'border-purple-500 hover:border-purple-700 bg-white'
                                        }`}
                                      >
                                        {task.completed && <Check className="w-3.5 h-3.5 text-white" />}
                                      </button>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2 mb-1">
                                        <div className={task.completed ? 'line-through text-gray-500' : ''}>
                                          <span className="font-medium text-gray-900">
                                            {taskTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} GMT
                                          </span>
                                          <span className="mx-2 text-gray-400">–</span>
                                          <span className="font-semibold text-purple-700">TASK: {task.title}</span>
                                          {taskContact && (
                                            <>
                                              <span className="mx-2 text-gray-400">•</span>
                                              <button
                                                onClick={() => onSelectContact?.(task.contact_id!)}
                                                className="text-gray-900 hover:text-blue-600 underline decoration-transparent hover:decoration-blue-600 transition-colors"
                                              >
                                                {taskContact.name}
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      {task.notes && (
                                        <p className="text-xs text-gray-600 mt-1 italic">{task.notes}</p>
                                      )}
                                      <div className="flex items-center gap-2 text-xs text-purple-700 mt-1">
                                        <span className="px-2 py-0.5 bg-purple-200 rounded font-medium">
                                          {task.task_type.replace('_', ' ').toUpperCase()}
                                        </span>
                                        {taskContact?.timezone && taskLocalTime && (
                                          <span className="flex items-center gap-1 text-gray-600">
                                            <Clock className="w-3 h-3" />
                                            {taskLocalTime} {taskContact.timezone}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              }

                              const schedule = item.data as CallSchedule;
                          const schedTime = new Date(schedule.scheduled_time);
                          const isPast = schedTime < new Date();
                          const statusColors = {
                            'jammed': 'bg-red-100 text-red-800 border-red-300',
                            'traction': 'bg-yellow-100 text-yellow-800 border-yellow-300',
                            'client': 'bg-green-100 text-green-800 border-green-300',
                            'none': 'bg-gray-100 text-gray-800 border-gray-300'
                          };
                          const statusLabels = {
                            'jammed': 'Jammed',
                            'traction': 'Traction',
                            'client': 'Client',
                            'none': 'None'
                          };

                          let localTime = '';
                          if (schedule.timezone_label) {
                            const match = schedule.timezone_label.match(/GMT([+-]\d+)/);
                            if (match) {
                              const offset = parseInt(match[1]);
                              const localDate = new Date(schedTime.getTime() + offset * 60 * 60 * 1000);
                              localTime = localDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                            }
                          }

                          const contact = schedule.contact_id ? contacts.find(c => c.id === schedule.contact_id) : null;
                          let currentStatus: 'jammed' | 'traction' | 'client' | 'none' = 'none';
                          if (contact) {
                            if (contact.is_jammed) {
                              currentStatus = 'jammed';
                            } else if (contact.is_client) {
                              currentStatus = 'client';
                            } else if (contact.has_traction) {
                              currentStatus = 'traction';
                            }
                          }

                          return (
                            <div
                              key={schedule.id}
                              className={`flex items-start gap-3 p-3 border-b border-gray-200 last:border-b-0 ${
                                schedule.completed ? 'bg-gray-100 opacity-60' : 'bg-white hover:bg-gray-50'
                              } ${isPast && !schedule.completed ? 'bg-red-50' : ''}`}
                            >
                              <div className="flex items-center pt-1">
                                <button
                                  onClick={() => toggleScheduleComplete(schedule.id)}
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                    schedule.completed
                                      ? 'bg-green-600 border-green-600'
                                      : 'border-gray-300 hover:border-green-500'
                                  }`}
                                >
                                  {schedule.completed && <Check className="w-3.5 h-3.5 text-white" />}
                                </button>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <div className={schedule.completed ? 'line-through text-gray-500' : ''}>
                                    <span className="font-medium text-gray-900">
                                      {schedTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} GMT
                                    </span>
                                    <span className="mx-2 text-gray-400">–</span>
                                    <button
                                      onClick={() => onSelectContact?.(schedule.contact_id)}
                                      className="font-semibold text-gray-900 hover:text-blue-600 underline decoration-transparent hover:decoration-blue-600 transition-all"
                                    >
                                      {schedule.contact_name}
                                    </button>
                                    <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded border ${statusColors[currentStatus]}`}>
                                      {statusLabels[currentStatus]}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-600">
                                  {schedule.timezone_label && localTime && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {localTime} {schedule.timezone_label}
                                    </span>
                                  )}
                                  <span>{schedule.call_duration_mins} min</span>
                                  {schedule.is_suggested && (
                                    <span className="text-blue-600 font-medium">• Suggested</span>
                                  )}
                                </div>
                                {schedule.notes && (
                                  <p className="text-xs text-gray-600 mt-1 italic">{schedule.notes}</p>
                                )}
                                {schedule.completed_at && (
                                  <p className="text-xs text-green-600 mt-1">
                                    ✓ Completed at {new Date(schedule.completed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                )}
                                {replacingScheduleId === schedule.id ? (
                                  <div className="mt-2 flex items-center gap-2">
                                    <button
                                      onClick={() => handleReplaceContact(schedule.id)}
                                      disabled={!replaceContactId}
                                      className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={() => {
                                        setReplacingScheduleId(null);
                                        setReplaceContactId('');
                                      }}
                                      className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                    >
                                      ✕
                                    </button>
                                    <select
                                      value={replaceContactId}
                                      onChange={(e) => setReplaceContactId(e.target.value)}
                                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                      <option value="">Select replacement contact</option>
                                      {contacts.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                ) : null}
                              </div>
                              <div className="flex gap-1">
                                <div className="flex flex-col gap-1">
                                  <button
                                    onClick={() => handleReorderSchedule(schedule.id, 'up')}
                                    disabled={idx === 0}
                                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Move up"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleReorderSchedule(schedule.id, 'down')}
                                    disabled={idx === filteredSchedules.length - 1}
                                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Move down"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <button
                                  onClick={() => {
                                    setReplacingScheduleId(schedule.id);
                                    setReplaceContactId('');
                                  }}
                                  className="p-1 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors self-start"
                                  title="Replace contact"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="p-3 bg-gray-100 border-t border-gray-300">
                        <div className="flex items-center justify-between text-sm mb-3">
                          <span className="font-medium text-gray-700">
                            Calls: {filteredSchedules.filter(s => s.completed).length} / {filteredSchedules.length} completed
                            {scheduledTasks.length > 0 && ` • Tasks: ${scheduledTasks.filter(t => t.completed).length} / ${scheduledTasks.length} completed`}
                          </span>
                          <span className="text-gray-600">
                            {filteredSchedules.length > 0 ? Math.round((filteredSchedules.filter(s => s.completed).length / filteredSchedules.length) * 100) : 0}%
                          </span>
                        </div>
                        {filteredSchedules.length > 0 && (
                          <button
                            onClick={handleAddCallAfterLast}
                            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Add Call After Last
                          </button>
                        )}
                      </div>
                    </div>
                          )}
                    </div>
                  );
                })()}

                <div className="space-y-6">
                  {selectedGoal.goal_type === 'calls' && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <Phone className="w-5 h-5 text-green-600" />
                          Calls Made ({goalCalls.length})
                        </h4>
                        <button
                          onClick={() => {
                            setEditingCall(null);
                            setNewCall({
                              contact_id: '',
                              call_date: new Date().toISOString(),
                              spoke_with: '',
                              phone_number: '',
                              duration: '',
                              notes: '',
                              use_manual_entry: false,
                              selected_person_id: '',
                              create_task: false
                            });
                            setShowAddActivity(!showAddActivity);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Add Call
                        </button>
                      </div>

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
                                  onClick={() => {
                                    setEditingCall(call);
                                    setShowAddActivity(true);
                                    const matchedPerson = contactPersons.find(p => p.name === call.spoke_with);
                                    setNewCall({
                                      contact_id: call.contact_id,
                                      call_date: call.call_date,
                                      spoke_with: call.spoke_with || '',
                                      phone_number: call.phone_number || '',
                                      duration: call.duration ? call.duration.toString() : '',
                                      notes: call.notes || '',
                                      use_manual_entry: !matchedPerson,
                                      selected_person_id: matchedPerson?.id || '',
                                      create_task: false
                                    });
                                  }}
                                  className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Edit call"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
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
                          <h5 className="font-semibold text-gray-900 mb-3">{editingEmail ? 'Edit Email' : 'Add New Email'}</h5>
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
                                {editingEmail ? 'Update Email' : 'Save Email'}
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
                                  onClick={() => {
                                    setEditingEmail(email);
                                    setShowAddActivity(true);
                                    setNewEmail({
                                      contact_id: email.contact_id,
                                      email_date: email.email_date,
                                      emailed_to: email.emailed_to || '',
                                      email_address: email.email_address || '',
                                      subject: email.subject || '',
                                      notes: email.notes || ''
                                    });
                                  }}
                                  className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Edit email"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
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
                          <h5 className="font-semibold text-gray-900 mb-3">{editingDeal ? 'Edit Deal' : 'Add New Deal'}</h5>
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
                                {editingDeal ? 'Update Deal' : 'Save Deal'}
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
                                  onClick={() => {
                                    setEditingDeal(deal);
                                    setShowAddActivity(true);
                                    setNewDeal({
                                      contact_id: deal.contact_id,
                                      deal_date: deal.deal_date,
                                      vessel_name: deal.vessel_name || '',
                                      fuel_type: deal.fuel_type || '',
                                      fuel_quantity: deal.fuel_quantity ? deal.fuel_quantity.toString() : '',
                                      port: deal.port || '',
                                      notes: deal.notes || ''
                                    });
                                  }}
                                  className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Edit deal"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
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
