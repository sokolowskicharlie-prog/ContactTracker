import { useState, useEffect } from 'react';
import { Target, Plus, Trash2, Bell, BellOff, Clock, TrendingUp, TrendingDown, Minus, CheckCircle, Edit2, X, Phone, Mail, Fuel, User, Calendar, CheckSquare, Check, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import { supabase, DailyGoal, GoalNotificationSettings, Call, Email, FuelDeal, Contact, ContactPerson, CallSchedule } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { generateCallSchedule, ScheduleParams } from '../lib/scheduleGenerator';

interface DailyGoalsProps {
  calls: Call[];
  emails: Email[];
  deals: FuelDeal[];
  contacts?: Contact[];
  onAddTask?: () => void;
  onSelectContact?: (contactId: string) => void;
  onLogCall?: (contactId: string) => void;
}

type GoalType = 'calls' | 'emails' | 'deals';

interface GoalProgress {
  type: GoalType;
  targetAmount: number;
  targetTime: string;
  currentAmount: number;
  percentComplete: number;
  onTrack: boolean;
  timeRemaining: string;
  requiredRate: number;
}

export default function DailyGoals({ calls, emails, deals, contacts = [], onAddTask, onSelectContact, onLogCall }: DailyGoalsProps) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [settings, setSettings] = useState<GoalNotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingGoal, setEditingGoal] = useState<DailyGoal | null>(null);

  const [newGoalType, setNewGoalType] = useState<GoalType>('calls');
  const [newGoalAmount, setNewGoalAmount] = useState(10);
  const [newGoalTime, setNewGoalTime] = useState('17:00');
  const [newGoalDate, setNewGoalDate] = useState(new Date().toISOString().split('T')[0]);
  const [newGoalNotes, setNewGoalNotes] = useState('');

  const [editGoalType, setEditGoalType] = useState<GoalType>('calls');
  const [editGoalAmount, setEditGoalAmount] = useState(10);
  const [editGoalTime, setEditGoalTime] = useState('17:00');
  const [editGoalDate, setEditGoalDate] = useState(new Date().toISOString().split('T')[0]);
  const [editGoalNotes, setEditGoalNotes] = useState('');

  const [notificationFrequency, setNotificationFrequency] = useState(30);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState<GoalProgress[]>([]);
  const [completedGoals, setCompletedGoals] = useState<Set<string>>(new Set());
  const [motivationalMessages, setMotivationalMessages] = useState<Array<{id: string; message: string; type: 'success' | 'warning' | 'info'}>>([]);
  const [selectedGoal, setSelectedGoal] = useState<DailyGoal | null>(null);
  const [showAddActivityForGoal, setShowAddActivityForGoal] = useState<string | null>(null);
  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([]);

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

  const [createCallTask, setCreateCallTask] = useState(false);
  const [callTaskType, setCallTaskType] = useState('call_back');
  const [callTaskTitle, setCallTaskTitle] = useState('');
  const [callTaskDueDate, setCallTaskDueDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 16);
  });
  const [callTaskNotes, setCallTaskNotes] = useState('');

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
  const [autoGenerateSchedule, setAutoGenerateSchedule] = useState(false);
  const [scheduleDuration, setScheduleDuration] = useState(20);
  const [emailDuration, setEmailDuration] = useState(15);
  const [dealDuration, setDealDuration] = useState(30);
  const [statusFilters, setStatusFilters] = useState<('none' | 'jammed' | 'traction' | 'client')[]>(['none', 'traction', 'client']);

  useEffect(() => {
    if (user) {
      loadGoals();
      loadSettings();
      loadContactPersons();
    }
  }, [user]);

  useEffect(() => {
    if (selectedGoal && selectedGoal.goal_type === 'calls') {
      loadSchedulesForGoal(selectedGoal.id);
    }
  }, [selectedGoal]);

  useEffect(() => {
    if (!user || !settings?.enable_notifications) return;

    const interval = setInterval(() => {
      checkGoalsAndNotify();
    }, settings.notification_frequency * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, settings, goals, calls, emails, deals]);

  useEffect(() => {
    if (!goals.length) return;

    goals.forEach(goal => {
      const today = new Date().toISOString().split('T')[0];
      if (goal.target_date === today) {
        const progress = calculateProgress(goal);
        const automaticCount = getActivityForDate(goal.goal_type, goal.target_date, goal.target_time);

        if (automaticCount > 0) {
          const previousAutoCount = goal.manual_count ? progress.currentAmount - goal.manual_count : progress.currentAmount;
          if (automaticCount > previousAutoCount) {
            showMotivationalMessage(goal.id, progress);
          }
        }
      }
    });
  }, [calls.length, emails.length, deals.length]);

  useEffect(() => {
    if (autoGenerateSchedule && newGoalType === 'calls') {
      const deadlineGMT = `${newGoalDate}T${newGoalTime}:00.000Z`;
      const deadline = new Date(deadlineGMT);
      const now = new Date();
      const timeAvailable = deadline.getTime() - now.getTime();
      const durationMs = scheduleDuration * 60 * 1000;
      const calculatedAmount = Math.max(1, Math.floor(timeAvailable / durationMs));
      setNewGoalAmount(calculatedAmount);
    }
  }, [autoGenerateSchedule, newGoalDate, newGoalTime, scheduleDuration, newGoalType]);

  const loadGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_goals')
        .select('*')
        .eq('is_active', true)
        .order('target_date', { ascending: true })
        .order('target_time', { ascending: true });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('goal_notification_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
        setNotificationFrequency(data.notification_frequency);
        setEnableNotifications(data.enable_notifications);
      } else {
        const defaultSettings = {
          user_id: user!.id,
          notification_frequency: 30,
          enable_notifications: true
        };

        const { data: newSettings, error: insertError } = await supabase
          .from('goal_notification_settings')
          .insert(defaultSettings)
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
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
      .order('display_order', { ascending: true});

    if (!error) {
      setCallSchedules(data || []);
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

  const replaceScheduleContact = async (scheduleId: string, newContactId: string) => {
    const newContact = contacts.find(c => c.id === newContactId);
    if (!newContact) return;

    const { error } = await supabase
      .from('call_schedules')
      .update({
        contact_id: newContactId,
        contact_name: newContact.company_name
      })
      .eq('id', scheduleId);

    if (!error) {
      setCallSchedules(callSchedules.map(s =>
        s.id === scheduleId
          ? { ...s, contact_id: newContactId, contact_name: newContact.company_name, contact_status: newContact.status }
          : s
      ));
    }
  };

  const moveSchedule = async (scheduleId: string, direction: 'up' | 'down') => {
    const currentIndex = callSchedules.findIndex(s => s.id === scheduleId);
    if (currentIndex === -1) return;
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === callSchedules.length - 1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const newSchedules = [...callSchedules];
    [newSchedules[currentIndex], newSchedules[newIndex]] = [newSchedules[newIndex], newSchedules[currentIndex]];

    // Update display_order for both schedules
    const updates = [
      supabase.from('call_schedules').update({ display_order: newIndex }).eq('id', newSchedules[newIndex].id),
      supabase.from('call_schedules').update({ display_order: currentIndex }).eq('id', newSchedules[currentIndex].id)
    ];

    await Promise.all(updates);
    setCallSchedules(newSchedules);
  };

  const handleAddCall = async (goalId: string) => {
    if (!user || !newCall.contact_id) return;

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

      if (createCallTask && callTaskTitle.trim()) {
        const taskInsert: any = {
          user_id: user.id,
          task_type: callTaskType,
          title: callTaskTitle,
          notes: callTaskNotes || null,
          completed: false,
          contact_id: newCall.contact_id,
        };

        if (callTaskDueDate) {
          taskInsert.due_date = callTaskDueDate;
        }

        await supabase.from('tasks').insert([taskInsert]);
      }

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
      setCreateCallTask(false);
      setCallTaskType('call_back');
      setCallTaskTitle('');
      setCallTaskDueDate(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().slice(0, 16);
      });
      setCallTaskNotes('');
      setShowAddActivityForGoal(null);
    }
  };

  const handleAddEmail = async (goalId: string) => {
    if (!user || !newEmail.contact_id) return;

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
      setShowAddActivityForGoal(null);
    }
  };

  const handleAddDeal = async (goalId: string) => {
    if (!user || !newDeal.contact_id) return;

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
      setShowAddActivityForGoal(null);
    }
  };

  const addGoal = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_goals')
        .insert({
          user_id: user!.id,
          goal_type: newGoalType,
          target_amount: newGoalAmount,
          target_time: newGoalTime,
          target_date: newGoalDate,
          manual_count: 0,
          notes: newGoalNotes.trim() || null,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      if (autoGenerateSchedule && newGoalType === 'calls' && data) {
        const deadlineGMT = `${newGoalDate}T${newGoalTime}:00.000Z`;
        const scheduleParams: ScheduleParams = {
          totalCalls: newGoalAmount,
          deadlineGMT,
          callDurationMins: scheduleDuration,
          fillRestOfDay: true,
          statusFilters: statusFilters.length > 0 ? statusFilters : undefined
        };

        // Fetch call_back tasks that are not completed and due today
        const { data: tasksData } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user!.id)
          .eq('task_type', 'call_back')
          .eq('completed', false)
          .gte('due_date', new Date().toISOString())
          .lte('due_date', deadlineGMT);

        const schedule = generateCallSchedule(scheduleParams, contacts, user!.id, data.id, tasksData || []);

        const { error: scheduleError } = await supabase
          .from('call_schedules')
          .insert(schedule);

        if (scheduleError) {
          console.error('Error creating schedule:', scheduleError);
        }
      }

      setGoals([...goals, data]);
      setShowAddGoal(false);
      resetForm();
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('daily_goals')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      setGoals(goals.filter(g => g.id !== id));
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const markGoalComplete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('daily_goals')
        .update({
          is_active: false,
          completed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      setGoals(goals.filter(g => g.id !== id));
      setCompletedGoals(prev => new Set(prev).add(id));
      setInAppNotifications(prev => prev.filter(n => {
        const goal = goals.find(g => g.id === id);
        if (!goal) return true;
        return n.type !== goal.goal_type;
      }));
    } catch (error) {
      console.error('Error marking goal complete:', error);
    }
  };

  const startEditGoal = (goal: DailyGoal) => {
    setEditingGoal(goal);
    setEditGoalType(goal.goal_type);
    setEditGoalAmount(goal.target_amount);
    setEditGoalTime(goal.target_time);
    setEditGoalDate(goal.target_date);
    setEditGoalNotes(goal.notes || '');
    setShowAddGoal(false);
  };

  const updateGoal = async () => {
    if (!editingGoal) return;

    try {
      const { data, error } = await supabase
        .from('daily_goals')
        .update({
          goal_type: editGoalType,
          target_amount: editGoalAmount,
          target_time: editGoalTime,
          target_date: editGoalDate,
          notes: editGoalNotes.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingGoal.id)
        .select()
        .single();

      if (error) throw error;
      setGoals(goals.map(g => g.id === editingGoal.id ? data : g));
      setEditingGoal(null);
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const cancelEdit = () => {
    setEditingGoal(null);
  };

  const showMotivationalMessage = (goalId: string, progress: GoalProgress) => {
    let message = '';
    let type: 'success' | 'warning' | 'info' = 'info';

    if (progress.percentComplete >= 100) {
      message = "Goal completed! You're on fire!";
      type = 'success';
    } else if (progress.percentComplete >= 75) {
      message = "Great work! Almost there!";
      type = 'success';
    } else if (progress.percentComplete >= 50) {
      message = "Nice! You're halfway there!";
      type = 'info';
    } else if (progress.percentComplete >= 25) {
      message = "Good start! Keep it up!";
      type = 'info';
    } else {
      message = "Every step counts! Keep going!";
      type = 'info';
    }

    const msgId = `${goalId}-${Date.now()}`;
    setMotivationalMessages(prev => [...prev, { id: msgId, message, type }]);

    setTimeout(() => {
      setMotivationalMessages(prev => prev.filter(m => m.id !== msgId));
    }, 3000);
  };

  const updateManualCount = async (goalId: string, delta: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const newCount = Math.max(0, (goal.manual_count || 0) + delta);

    try {
      const { data, error } = await supabase
        .from('daily_goals')
        .update({ manual_count: newCount })
        .eq('id', goalId)
        .select()
        .single();

      if (error) throw error;
      setGoals(goals.map(g => g.id === goalId ? data : g));

      if (delta > 0) {
        const updatedProgress = calculateProgress(data);
        showMotivationalMessage(goalId, updatedProgress);
      }
    } catch (error) {
      console.error('Error updating manual count:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const { error } = await supabase
        .from('goal_notification_settings')
        .update({
          notification_frequency: notificationFrequency,
          enable_notifications: enableNotifications
        })
        .eq('user_id', user!.id);

      if (error) throw error;

      setSettings({
        ...settings!,
        notification_frequency: notificationFrequency,
        enable_notifications: enableNotifications
      });

      setShowSettings(false);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const resetForm = () => {
    setNewGoalType('calls');
    setNewGoalAmount(10);
    setNewGoalTime('17:00');
    setNewGoalDate(new Date().toISOString().split('T')[0]);
    setNewGoalNotes('');
    setAutoGenerateSchedule(false);
    setScheduleDuration(20);
    setEmailDuration(15);
    setDealDuration(30);
  };

  const getActivityForDate = (type: GoalType, targetDate: string, targetTime: string): number => {
    const deadline = new Date(`${targetDate}T${targetTime}:00.000Z`);

    if (type === 'calls') {
      return calls.filter(c => {
        const callDate = new Date(c.call_date);
        return callDate <= deadline;
      }).length;
    } else if (type === 'emails') {
      return emails.filter(e => {
        const emailDate = new Date(e.email_date);
        return emailDate <= deadline;
      }).length;
    } else {
      return deals.filter(d => {
        const dealDate = new Date(d.deal_date);
        return dealDate <= deadline;
      }).length;
    }
  };

  const calculateProgress = (goal: DailyGoal): GoalProgress => {
    const automaticCount = getActivityForDate(goal.goal_type, goal.target_date, goal.target_time);
    const currentAmount = automaticCount;
    const percentComplete = Math.min(100, (currentAmount / goal.target_amount) * 100);

    const now = new Date();
    const [targetHours, targetMinutes] = goal.target_time.split(':').map(Number);
    const targetDateTime = new Date(goal.target_date);
    targetDateTime.setHours(targetHours, targetMinutes, 0, 0);

    const timeRemainingMs = targetDateTime.getTime() - now.getTime();
    const hoursRemaining = Math.max(0, timeRemainingMs / (1000 * 60 * 60));

    const remaining = goal.target_amount - currentAmount;
    const requiredRate = hoursRemaining > 0 ? remaining / hoursRemaining : 0;

    const currentRate = currentAmount / ((now.getHours() + now.getMinutes() / 60) || 1);
    const onTrack = hoursRemaining <= 0 ? currentAmount >= goal.target_amount : currentRate >= requiredRate;

    const hours = Math.floor(Math.abs(hoursRemaining));
    const minutes = Math.floor((Math.abs(hoursRemaining) % 1) * 60);
    const timeRemaining = hoursRemaining <= 0
      ? 'Time expired'
      : `${hours}h ${minutes}m`;

    return {
      type: goal.goal_type,
      targetAmount: goal.target_amount,
      targetTime: goal.target_time,
      currentAmount,
      percentComplete,
      onTrack,
      timeRemaining,
      requiredRate
    };
  };

  const checkGoalsAndNotify = () => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    goals.forEach(goal => {
      if (goal.target_date !== today) return;

      const progress = calculateProgress(goal);

      const [targetHours, targetMinutes] = goal.target_time.split(':').map(Number);
      const targetDateTime = new Date(goal.target_date);
      targetDateTime.setHours(targetHours, targetMinutes, 0, 0);
      const timeExpired = now.getTime() >= targetDateTime.getTime();

      if (timeExpired && !completedGoals.has(goal.id)) {
        showCompletionNotification(goal, progress);
        setCompletedGoals(prev => new Set(prev).add(goal.id));
      } else if (!progress.onTrack && progress.timeRemaining !== 'Time expired') {
        showNotification(progress);
      }
    });
  };

  const showNotification = async (progress: GoalProgress) => {
    const isDuplicate = inAppNotifications.some(
      n => n.type === progress.type && n.targetTime === progress.targetTime && 'isCompletion' in n === false
    );

    if (!isDuplicate) {
      setInAppNotifications(prev => [...prev, progress]);

      setTimeout(() => {
        setInAppNotifications(prev =>
          prev.filter(n => !(n.type === progress.type && n.targetTime === progress.targetTime && 'isCompletion' in n === false))
        );
      }, 10000);
    }
  };

  const showCompletionNotification = (goal: DailyGoal, progress: GoalProgress) => {
    const completionData = {
      ...progress,
      isCompletion: true,
      goalId: goal.id
    } as any;

    setInAppNotifications(prev => [...prev, completionData]);

    setTimeout(() => {
      setInAppNotifications(prev =>
        prev.filter(n => !('isCompletion' in n && (n as any).goalId === goal.id))
      );
    }, 20000);
  };

  const getGoalIcon = (type: GoalType) => {
    switch (type) {
      case 'calls': return '📞';
      case 'emails': return '✉️';
      case 'deals': return '🤝';
    }
  };

  const getGoalLabel = (type: GoalType) => {
    switch (type) {
      case 'calls': return 'Calls';
      case 'emails': return 'Emails';
      case 'deals': return 'Deals';
    }
  };

  if (loading) {
    return <div className="text-center py-4 text-gray-500">Loading goals...</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="text-blue-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">Daily Goals</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {enableNotifications ? <Bell size={16} /> : <BellOff size={16} />}
            Notifications
          </button>
          <button
            onClick={() => setShowAddGoal(!showAddGoal)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Add Goal
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Notification Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enableNotifications"
                checked={enableNotifications}
                onChange={(e) => setEnableNotifications(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="enableNotifications" className="text-sm text-gray-700">
                Enable progress notifications
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check progress every (minutes)
              </label>
              <input
                type="number"
                value={notificationFrequency}
                onChange={(e) => setNotificationFrequency(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveSettings}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Settings
              </button>
              <button
                onClick={async () => {
                  const testProgress: GoalProgress = {
                    type: 'calls',
                    targetAmount: 10,
                    targetTime: '17:00',
                    currentAmount: 3,
                    percentComplete: 30,
                    onTrack: false,
                    timeRemaining: '3h 30m',
                    requiredRate: 2.5
                  };
                  await showNotification(testProgress);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                Test Notification
              </button>
              <button
                onClick={() => {
                  setShowSettings(false);
                  setNotificationFrequency(settings?.notification_frequency || 30);
                  setEnableNotifications(settings?.enable_notifications || true);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddGoal && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Add New Goal</h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={newGoalType}
                onChange={(e) => setNewGoalType(e.target.value as GoalType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="calls">Calls</option>
                <option value="emails">Emails</option>
                <option value="deals">Deals</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Amount
                {autoGenerateSchedule && newGoalType === 'calls' && (
                  <span className="ml-2 text-xs text-blue-600 font-normal">(Auto-calculated)</span>
                )}
              </label>
              <input
                type="number"
                value={newGoalAmount}
                onChange={(e) => {
                  setAutoGenerateSchedule(false);
                  setNewGoalAmount(Math.max(1, parseInt(e.target.value) || 1));
                }}
                min="1"
                readOnly={autoGenerateSchedule && newGoalType === 'calls'}
                className={`w-full px-3 py-2 border rounded-lg ${
                  autoGenerateSchedule && newGoalType === 'calls'
                    ? 'bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed'
                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Date</label>
              <input
                type="date"
                value={newGoalDate}
                onChange={(e) => setNewGoalDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Time</label>
              <input
                type="time"
                value={newGoalTime}
                onChange={(e) => setNewGoalTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
            <textarea
              value={newGoalNotes}
              onChange={(e) => setNewGoalNotes(e.target.value)}
              placeholder="Add any notes or reminders for this goal..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
          {newGoalType === 'calls' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={autoGenerateSchedule}
                  onChange={(e) => setAutoGenerateSchedule(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">Auto-generate call schedule</span>
              </label>
              {autoGenerateSchedule && (
                <div className="pl-6 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Call Duration (minutes)</label>
                    <input
                      type="number"
                      value={scheduleDuration}
                      onChange={(e) => setScheduleDuration(Math.max(5, parseInt(e.target.value) || 20))}
                      min="5"
                      max="60"
                      className="w-32 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-2 text-xs text-gray-600">
                      Calls will be scheduled every {scheduleDuration} minutes until target time
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Include Contact Status</label>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { value: 'none' as const, label: 'None', color: 'gray' },
                        { value: 'traction' as const, label: 'Traction', color: 'yellow' },
                        { value: 'client' as const, label: 'Client', color: 'green' },
                        { value: 'jammed' as const, label: 'Jammed', color: 'red' }
                      ].map(status => (
                        <label key={status.value} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={statusFilters.includes(status.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setStatusFilters([...statusFilters, status.value]);
                              } else {
                                setStatusFilters(statusFilters.filter(s => s !== status.value));
                              }
                            }}
                            className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className={`text-xs font-medium px-2 py-0.5 rounded border ${
                            status.color === 'gray' ? 'bg-gray-100 text-gray-800 border-gray-300' :
                            status.color === 'yellow' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                            status.color === 'green' ? 'bg-green-100 text-green-800 border-green-300' :
                            'bg-red-100 text-red-800 border-red-300'
                          }`}>
                            {status.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">
                    Schedule will prioritize by timezone and suggest contacts based on activity
                  </p>
                </div>
              )}
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <button
              onClick={addGoal}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Goal
            </button>
            <button
              onClick={() => {
                setShowAddGoal(false);
                resetForm();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {editingGoal && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
          <h3 className="text-sm font-semibold text-blue-900 mb-4">Edit Goal</h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={editGoalType}
                onChange={(e) => setEditGoalType(e.target.value as GoalType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="calls">Calls</option>
                <option value="emails">Emails</option>
                <option value="deals">Deals</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Amount</label>
              <input
                type="number"
                value={editGoalAmount}
                onChange={(e) => setEditGoalAmount(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Date</label>
              <input
                type="date"
                value={editGoalDate}
                onChange={(e) => setEditGoalDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Time</label>
              <input
                type="time"
                value={editGoalTime}
                onChange={(e) => setEditGoalTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
            <textarea
              value={editGoalNotes}
              onChange={(e) => setEditGoalNotes(e.target.value)}
              placeholder="Add any notes or reminders for this goal..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={updateGoal}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Update Goal
            </button>
            <button
              onClick={cancelEdit}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {goals.length === 0 ? (
        <div className="text-center py-8">
          <Target className="mx-auto text-gray-400 mb-3" size={48} />
          <p className="text-gray-500 mb-2">No daily goals set</p>
          <p className="text-sm text-gray-400">Add your first goal to start tracking your progress</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map(goal => {
            const progress = calculateProgress(goal);
            return (
              <div
                key={goal.id}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                  progress.percentComplete >= 100
                    ? 'bg-green-50 border-green-200'
                    : progress.onTrack
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-orange-50 border-orange-200'
                }`}
                onClick={() => setSelectedGoal(goal)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getGoalIcon(goal.goal_type)}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {progress.currentAmount} / {goal.target_amount} {getGoalLabel(goal.goal_type)}
                        </h3>
                        {progress.percentComplete >= 100 ? (
                          <CheckCircle className="text-green-600" size={20} />
                        ) : progress.onTrack ? (
                          <TrendingUp className="text-blue-600" size={20} />
                        ) : (
                          <TrendingDown className="text-orange-600" size={20} />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Clock size={14} />
                        <span>
                          {new Date(goal.target_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: new Date(goal.target_date).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                          })} at {progress.targetTime} ({progress.timeRemaining})
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => markGoalComplete(goal.id)}
                      className="text-gray-400 hover:text-green-600 transition-colors"
                      title="Mark as complete"
                    >
                      <CheckCircle size={18} />
                    </button>
                    <button
                      onClick={() => startEditGoal(goal)}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit goal"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete goal"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        progress.percentComplete >= 100
                          ? 'bg-green-500'
                          : progress.onTrack
                          ? 'bg-blue-500'
                          : 'bg-orange-500'
                      }`}
                      style={{ width: `${progress.percentComplete}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">
                        {getActivityForDate(goal.goal_type, goal.target_date, goal.target_time)} logged
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowAddActivityForGoal(showAddActivityForGoal === goal.id ? null : goal.id)}
                        className="p-1 rounded bg-purple-100 hover:bg-purple-200 transition-colors"
                        title="Add activity"
                      >
                        <Plus size={14} className="text-purple-700" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className={`font-medium ${
                      progress.percentComplete >= 100
                        ? 'text-green-700'
                        : progress.onTrack
                        ? 'text-blue-700'
                        : 'text-orange-700'
                    }`}>
                      {Math.round(progress.percentComplete)}% complete
                    </span>
                    {progress.timeRemaining !== 'Time expired' && progress.percentComplete < 100 && (
                      <span className="text-gray-600">
                        {progress.onTrack ? (
                          <span className="text-blue-600">On track</span>
                        ) : (
                          <span className="text-orange-600">
                            Need {Math.ceil(progress.requiredRate)} {getGoalLabel(goal.goal_type).toLowerCase()} per hour
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  {progress.timeRemaining !== 'Time expired' && (
                    <div className={`mt-2 px-3 py-1.5 rounded-md text-xs font-medium ${
                      progress.percentComplete >= 100
                        ? 'bg-green-100 text-green-800'
                        : progress.percentComplete >= 75
                        ? 'bg-blue-100 text-blue-800'
                        : progress.percentComplete >= 50
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {progress.percentComplete >= 100 ? (
                        "Goal achieved! Keep going!"
                      ) : progress.percentComplete >= 75 ? (
                        "You're doing great! Almost there!"
                      ) : progress.percentComplete >= 50 ? (
                        "Good progress! Keep pushing!"
                      ) : progress.percentComplete >= 25 ? (
                        "You can do it! Stay focused!"
                      ) : (
                        "Let's get started! Time to hustle!"
                      )}
                    </div>
                  )}

                  {goal.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                      <p className="text-xs text-gray-700 italic">{goal.notes}</p>
                    </div>
                  )}

                  {showAddActivityForGoal === goal.id && (
                    <div className="mt-4 p-4 bg-white rounded-lg border-2 border-purple-300 shadow-sm">
                      {goal.goal_type === 'calls' && (
                        <>
                          <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-green-600" />
                            Add New Call
                          </h5>
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Contact *</label>
                              <select
                                value={newCall.contact_id}
                                onChange={(e) => setNewCall({ ...newCall, contact_id: e.target.value })}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                              >
                                <option value="">Select a contact</option>
                                {contacts.map(contact => (
                                  <option key={contact.id} value={contact.id}>{contact.name}</option>
                                ))}
                              </select>
                            </div>
                            {newCall.contact_id && contactPersons.filter(cp => cp.contact_id === newCall.contact_id).length > 0 && (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setNewCall({ ...newCall, use_manual_entry: false, spoke_with: '', phone_number: '' })}
                                  className={`flex-1 px-2 py-1 text-xs rounded-lg transition-colors ${
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
                                  className={`flex-1 px-2 py-1 text-xs rounded-lg transition-colors ${
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
                              <label className="block text-xs font-medium text-gray-700 mb-1">Spoke With</label>
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
                                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  placeholder="Name of person"
                                />
                              )}
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
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
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mb-1"
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
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="Phone number"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Duration (min)</label>
                              <input
                                type="number"
                                value={newCall.duration}
                                onChange={(e) => setNewCall({ ...newCall, duration: e.target.value })}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="Minutes"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                              <textarea
                                value={newCall.notes}
                                onChange={(e) => setNewCall({ ...newCall, notes: e.target.value })}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                rows={2}
                                placeholder="Call notes"
                              />
                            </div>

                            <div className="border-t pt-3 mt-3">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={createCallTask}
                                  onChange={(e) => setCreateCallTask(e.target.checked)}
                                  className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                                />
                                <CheckSquare className="w-4 h-4 text-green-600" />
                                <span className="text-xs font-medium text-gray-700">Create follow-up task</span>
                              </label>

                              {createCallTask && (
                                <div className="mt-3 space-y-2 pl-6 border-l-2 border-green-200">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Task Type *
                                    </label>
                                    <select
                                      value={callTaskType}
                                      onChange={(e) => setCallTaskType(e.target.value)}
                                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                      required={createCallTask}
                                    >
                                      <option value="call_back">Call Back</option>
                                      <option value="email_back">Email Back</option>
                                      <option value="text_back">Text Back</option>
                                      <option value="other">Other</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Task Title *
                                    </label>
                                    <input
                                      type="text"
                                      value={callTaskTitle}
                                      onChange={(e) => setCallTaskTitle(e.target.value)}
                                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                      placeholder="Follow up on..."
                                      required={createCallTask}
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Due Date & Time
                                    </label>
                                    <input
                                      type="datetime-local"
                                      value={callTaskDueDate}
                                      onChange={(e) => setCallTaskDueDate(e.target.value)}
                                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Task Notes
                                    </label>
                                    <textarea
                                      value={callTaskNotes}
                                      onChange={(e) => setCallTaskNotes(e.target.value)}
                                      rows={2}
                                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                      placeholder="Task details..."
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleAddCall(goal.id)}
                                disabled={!newCall.contact_id}
                                className="flex-1 bg-green-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                              >
                                Save Call
                              </button>
                              <button
                                onClick={() => setShowAddActivityForGoal(null)}
                                className="flex-1 bg-gray-200 text-gray-700 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {goal.goal_type === 'emails' && (
                        <>
                          <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-orange-600" />
                            Add New Email
                          </h5>
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Contact *</label>
                              <select
                                value={newEmail.contact_id}
                                onChange={(e) => setNewEmail({ ...newEmail, contact_id: e.target.value })}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                required
                              >
                                <option value="">Select a contact</option>
                                {contacts.map(contact => (
                                  <option key={contact.id} value={contact.id}>{contact.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Contact Person</label>
                              <select
                                value={newEmail.emailed_to}
                                onChange={(e) => setNewEmail({ ...newEmail, emailed_to: e.target.value })}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                              <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                              <input
                                type="email"
                                value={newEmail.email_address}
                                onChange={(e) => setNewEmail({ ...newEmail, email_address: e.target.value })}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="email@example.com"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
                              <input
                                type="text"
                                value={newEmail.subject}
                                onChange={(e) => setNewEmail({ ...newEmail, subject: e.target.value })}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="Subject"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                              <textarea
                                value={newEmail.notes}
                                onChange={(e) => setNewEmail({ ...newEmail, notes: e.target.value })}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                rows={2}
                                placeholder="Email notes"
                              />
                            </div>
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleAddEmail(goal.id)}
                                disabled={!newEmail.contact_id}
                                className="flex-1 bg-orange-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                              >
                                Save Email
                              </button>
                              <button
                                onClick={() => setShowAddActivityForGoal(null)}
                                className="flex-1 bg-gray-200 text-gray-700 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {goal.goal_type === 'deals' && (
                        <>
                          <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Fuel className="w-4 h-4 text-blue-600" />
                            Add New Deal
                          </h5>
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Contact *</label>
                              <select
                                value={newDeal.contact_id}
                                onChange={(e) => setNewDeal({ ...newDeal, contact_id: e.target.value })}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                              >
                                <option value="">Select a contact</option>
                                {contacts.map(contact => (
                                  <option key={contact.id} value={contact.id}>{contact.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Vessel Name</label>
                              <input
                                type="text"
                                value={newDeal.vessel_name}
                                onChange={(e) => setNewDeal({ ...newDeal, vessel_name: e.target.value })}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Vessel name"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Fuel Type</label>
                              <select
                                value={newDeal.fuel_type}
                                onChange={(e) => setNewDeal({ ...newDeal, fuel_type: e.target.value })}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">Select type</option>
                                <option value="MGO">MGO</option>
                                <option value="VLSFO">VLSFO</option>
                                <option value="LSMGO">LSMGO</option>
                                <option value="HFO">HFO</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Quantity (MT)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={newDeal.fuel_quantity}
                                onChange={(e) => setNewDeal({ ...newDeal, fuel_quantity: e.target.value })}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Quantity"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Port</label>
                              <input
                                type="text"
                                value={newDeal.port}
                                onChange={(e) => setNewDeal({ ...newDeal, port: e.target.value })}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Port name"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                              <textarea
                                value={newDeal.notes}
                                onChange={(e) => setNewDeal({ ...newDeal, notes: e.target.value })}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={2}
                                placeholder="Deal notes"
                              />
                            </div>
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleAddDeal(goal.id)}
                                disabled={!newDeal.contact_id}
                                className="flex-1 bg-blue-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                              >
                                Save Deal
                              </button>
                              <button
                                onClick={() => setShowAddActivityForGoal(null)}
                                className="flex-1 bg-gray-200 text-gray-700 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {inAppNotifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
          {inAppNotifications.map((notification, index) => {
            const isCompletion = 'isCompletion' in notification;
            const remaining = notification.targetAmount - notification.currentAmount;
            const typeLabel = notification.type === 'calls' ? 'calls' : notification.type === 'emails' ? 'emails' : 'deals';
            const icon = notification.type === 'calls' ? '📞' : notification.type === 'emails' ? '✉️' : '🤝';

            if (isCompletion) {
              const achieved = notification.currentAmount >= notification.targetAmount;
              const difference = Math.abs(notification.targetAmount - notification.currentAmount);
              const percentage = notification.percentComplete;

              const getMotivationalMessage = () => {
                if (achieved) {
                  if (percentage >= 150) return "Outstanding! You're crushing it!";
                  if (percentage >= 120) return "Excellent work! Keep this momentum going!";
                  return "Great job! You hit your target!";
                } else {
                  if (percentage >= 80) return "Almost there! Push a bit harder next time.";
                  if (percentage >= 50) return "Good effort, but you can do better!";
                  return "Time to step it up! You've got this!";
                }
              };

              return (
                <div
                  key={index}
                  className={`border-2 rounded-lg p-4 shadow-lg animate-slide-in-right ${
                    achieved
                      ? 'bg-green-50 border-green-300'
                      : 'bg-red-50 border-red-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`font-semibold ${achieved ? 'text-green-900' : 'text-red-900'}`}>
                          {achieved ? '🎉 Goal Completed!' : '⏰ Time\'s Up!'}
                        </h4>
                        <button
                          onClick={() => {
                            setInAppNotifications(prev =>
                              prev.filter((_, i) => i !== index)
                            );
                          }}
                          className={achieved ? 'text-green-400 hover:text-green-600' : 'text-red-400 hover:text-red-600'}
                        >
                          <Minus size={18} />
                        </button>
                      </div>
                      <p className={`text-sm ${achieved ? 'text-green-800' : 'text-red-800'}`}>
                        {achieved ? (
                          <>
                            You completed <span className="font-semibold">{notification.currentAmount} {typeLabel}</span> and{' '}
                            {difference > 0 ? (
                              <>exceeded your target by <span className="font-semibold">{difference}</span>!</>
                            ) : (
                              <>hit your target of <span className="font-semibold">{notification.targetAmount}</span>!</>
                            )}
                          </>
                        ) : (
                          <>
                            You completed <span className="font-semibold">{notification.currentAmount} {typeLabel}</span> but{' '}
                            missed your target by <span className="font-semibold">{difference}</span>.
                          </>
                        )}
                      </p>
                      <div className={`mt-2 text-xs ${achieved ? 'text-green-700' : 'text-red-700'}`}>
                        Final: {notification.currentAmount}/{notification.targetAmount} ({Math.round(notification.percentComplete)}%)
                      </div>
                      <div className={`mt-2 px-3 py-2 rounded-md font-medium text-sm ${
                        achieved ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'
                      }`}>
                        {getMotivationalMessage()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={index}
                className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 shadow-lg animate-slide-in-right"
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-orange-900">Goal Progress Alert</h4>
                      <button
                        onClick={() => {
                          setInAppNotifications(prev =>
                            prev.filter((_, i) => i !== index)
                          );
                        }}
                        className="text-orange-400 hover:text-orange-600"
                      >
                        <Minus size={18} />
                      </button>
                    </div>
                    <p className="text-sm text-orange-800">
                      You need <span className="font-semibold">{remaining} more {typeLabel}</span> by{' '}
                      <span className="font-semibold">{notification.targetTime}</span> to stay on track.
                    </p>
                    <div className="mt-2 text-xs text-orange-700">
                      Currently at {notification.currentAmount}/{notification.targetAmount} ({Math.round(notification.percentComplete)}%)
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {motivationalMessages.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-xs">
          {motivationalMessages.map((msg) => (
            <div
              key={msg.id}
              className={`px-4 py-3 rounded-lg shadow-lg animate-slide-in-right border-2 ${
                msg.type === 'success'
                  ? 'bg-green-50 border-green-400 text-green-800'
                  : msg.type === 'warning'
                  ? 'bg-orange-50 border-orange-400 text-orange-800'
                  : 'bg-blue-50 border-blue-400 text-blue-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {msg.type === 'success' ? '🎉' : msg.type === 'warning' ? '⚠️' : '💪'}
                </span>
                <p className="font-medium text-sm">{msg.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedGoal && (() => {
        const goalDate = selectedGoal.target_date;
        const deadline = new Date(`${selectedGoal.target_date}T${selectedGoal.target_time}:00.000Z`);

        const goalCalls = calls.filter(call => {
          const callDate = new Date(call.call_date);
          return callDate <= deadline;
        });

        const goalEmails = emails.filter(email => {
          const emailDate = new Date(email.email_date);
          return emailDate <= deadline;
        });

        const goalDeals = deals.filter(deal => {
          const dealDate = new Date(deal.deal_date);
          return dealDate <= deadline;
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
                <button
                  onClick={() => setSelectedGoal(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
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
                  </div>
                  {selectedGoal.notes && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-sm text-gray-700">{selectedGoal.notes}</p>
                    </div>
                  )}
                  {selectedGoal.goal_type === 'calls' && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <button
                        onClick={() => setShowAddActivityForGoal(showAddActivityForGoal === selectedGoal.id ? null : selectedGoal.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add New Call
                      </button>
                    </div>
                  )}
                </div>

                {selectedGoal.goal_type === 'calls' && callSchedules.length > 0 && (() => {
                  const now = new Date();
                  const [targetHours, targetMinutes] = selectedGoal.target_time.split(':').map(Number);
                  const targetDateTime = new Date(selectedGoal.target_date);
                  targetDateTime.setHours(targetHours, targetMinutes, 0, 0);

                  const filteredSchedules = callSchedules.filter(schedule => {
                    const schedTime = new Date(schedule.scheduled_time);
                    return schedTime >= now && schedTime <= targetDateTime;
                  });

                  return (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Call Schedule ({filteredSchedules.filter(s => !s.completed).length} remaining until {selectedGoal.target_time})
                      </h4>
                      {filteredSchedules.length === 0 ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                          <p className="text-gray-600">No scheduled calls between now and {selectedGoal.target_time}</p>
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                          <div className="max-h-96 overflow-y-auto">
                            {filteredSchedules.map((schedule, idx) => {
                          const schedTime = new Date(schedule.scheduled_time);
                          const isPast = schedTime < new Date();
                          const statusColors = {
                            'client': 'bg-green-100 text-green-800 border-green-300',
                            'traction': 'bg-yellow-100 text-yellow-800 border-yellow-300',
                            'jammed': 'bg-red-100 text-red-800 border-red-300',
                            'none': 'bg-gray-100 text-gray-800 border-gray-300'
                          };
                          const statusLabels = {
                            'client': 'Client',
                            'traction': 'Traction',
                            'jammed': 'Jammed',
                            'none': 'None'
                          };

                          // Calculate local time based on timezone offset
                          let localTime = '';
                          if (schedule.timezone_label) {
                            const match = schedule.timezone_label.match(/GMT([+-]\d+)/);
                            if (match) {
                              const offset = parseInt(match[1]);
                              const localDate = new Date(schedTime.getTime() + offset * 60 * 60 * 1000);
                              localTime = localDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
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
                                      onClick={() => schedule.contact_id && onSelectContact?.(schedule.contact_id)}
                                      className="font-semibold text-gray-900 hover:text-blue-600 underline decoration-transparent hover:decoration-blue-600 transition-colors"
                                    >
                                      {schedule.contact_name}
                                    </button>
                                  </div>
                                  {schedule.contact_status && (
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${statusColors[schedule.contact_status]}`}>
                                      {statusLabels[schedule.contact_status]}
                                    </span>
                                  )}
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
                                {!schedule.completed && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => moveSchedule(schedule.id, 'up')}
                                        disabled={idx === 0}
                                        className={`p-1 rounded hover:bg-gray-200 transition-colors ${
                                          idx === 0 ? 'opacity-30 cursor-not-allowed' : ''
                                        }`}
                                        title="Move up"
                                      >
                                        <ArrowUp className="w-3.5 h-3.5 text-gray-600" />
                                      </button>
                                      <button
                                        onClick={() => moveSchedule(schedule.id, 'down')}
                                        disabled={idx === filteredSchedules.length - 1}
                                        className={`p-1 rounded hover:bg-gray-200 transition-colors ${
                                          idx === filteredSchedules.length - 1 ? 'opacity-30 cursor-not-allowed' : ''
                                        }`}
                                        title="Move down"
                                      >
                                        <ArrowDown className="w-3.5 h-3.5 text-gray-600" />
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <RefreshCw className="w-3 h-3 text-gray-500" />
                                      <select
                                        value={schedule.contact_id || ''}
                                        onChange={(e) => replaceScheduleContact(schedule.id, e.target.value)}
                                        className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      >
                                        <option value="">Select contact...</option>
                                        {contacts.map(contact => (
                                          <option key={contact.id} value={contact.id}>
                                            {contact.company_name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="p-3 bg-gray-100 border-t border-gray-300">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-700">
                            Progress: {filteredSchedules.filter(s => s.completed).length} / {filteredSchedules.length} completed
                          </span>
                          <span className="text-gray-600">
                            {filteredSchedules.length > 0 ? Math.round((filteredSchedules.filter(s => s.completed).length / filteredSchedules.length) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                      )}
                    </div>
                  );
                })()}

                <div className="space-y-6">
                  {selectedGoal.goal_type === 'calls' && goalCalls.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <Phone className="w-5 h-5 text-green-600" />
                          Calls Made ({goalCalls.length})
                        </h4>
                        <button
                          onClick={() => setShowAddActivityForGoal(showAddActivityForGoal === selectedGoal.id ? null : selectedGoal.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add New Call
                        </button>
                      </div>

                      {showAddActivityForGoal === selectedGoal.id && selectedGoal.goal_type === 'calls' && (
                        <div className="mb-4 p-4 bg-white rounded-lg border-2 border-green-300 shadow-sm">
                          <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Phone className="w-5 h-5 text-green-600" />
                            Add New Call
                          </h5>
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

                            <div className="border-t pt-3 mt-3">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={createCallTask}
                                  onChange={(e) => setCreateCallTask(e.target.checked)}
                                  className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                                />
                                <CheckSquare className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-gray-700">Create follow-up task</span>
                              </label>

                              {createCallTask && (
                                <div className="mt-3 space-y-2 pl-6 border-l-2 border-green-200">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Task Type *
                                    </label>
                                    <select
                                      value={callTaskType}
                                      onChange={(e) => setCallTaskType(e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                      required={createCallTask}
                                    >
                                      <option value="call_back">Call Back</option>
                                      <option value="email_back">Email Back</option>
                                      <option value="text_back">Text Back</option>
                                      <option value="other">Other</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Task Title *
                                    </label>
                                    <input
                                      type="text"
                                      value={callTaskTitle}
                                      onChange={(e) => setCallTaskTitle(e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                      placeholder="Follow up on..."
                                      required={createCallTask}
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Due Date & Time
                                    </label>
                                    <input
                                      type="datetime-local"
                                      value={callTaskDueDate}
                                      onChange={(e) => setCallTaskDueDate(e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Task Notes
                                    </label>
                                    <textarea
                                      value={callTaskNotes}
                                      onChange={(e) => setCallTaskNotes(e.target.value)}
                                      rows={2}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                      placeholder="Task details..."
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAddCall(selectedGoal.id)}
                                disabled={!newCall.contact_id}
                                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                              >
                                Save Call
                              </button>
                              <button
                                onClick={() => setShowAddActivityForGoal(null)}
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
                              <div className="text-lg font-bold text-gray-900">
                                {contacts.find(c => c.id === call.contact_id)?.name || 'Unknown Contact'}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                {new Date(call.call_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
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

                  {selectedGoal.goal_type === 'emails' && goalEmails.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-orange-600" />
                        Emails Sent ({goalEmails.length})
                      </h4>
                      <div className="space-y-3">
                        {goalEmails.map(email => (
                          <div key={email.id} className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                            <div className="flex items-start justify-between mb-2">
                              <div className="text-lg font-bold text-gray-900">
                                {contacts.find(c => c.id === email.contact_id)?.name || 'Unknown Contact'}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                {new Date(email.email_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
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

                  {selectedGoal.goal_type === 'deals' && goalDeals.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Fuel className="w-5 h-5 text-blue-600" />
                        Deals Closed ({goalDeals.length})
                      </h4>
                      <div className="space-y-3">
                        {goalDeals.map(deal => (
                          <div key={deal.id} className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                            <div className="flex items-start justify-between mb-2">
                              <div className="text-lg font-bold text-gray-900">
                                {contacts.find(c => c.id === deal.contact_id)?.name || 'Unknown Contact'}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                {new Date(deal.deal_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
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
                      {selectedGoal.goal_type === 'calls' && (
                        <button
                          onClick={() => setShowAddActivityForGoal(showAddActivityForGoal === selectedGoal.id ? null : selectedGoal.id)}
                          className="mt-4 flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors mx-auto"
                        >
                          <Plus className="w-5 h-5" />
                          Add New Call
                        </button>
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
