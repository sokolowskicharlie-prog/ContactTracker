import { useState, useEffect } from 'react';
import { Target, Plus, Trash2, Bell, BellOff, Clock, TrendingUp, TrendingDown, Minus, CheckCircle, Edit2 } from 'lucide-react';
import { supabase, DailyGoal, GoalNotificationSettings, Call, Email, FuelDeal } from '../lib/supabase';
import { useAuth } from '../lib/auth';

interface DailyGoalsProps {
  calls: Call[];
  emails: Email[];
  deals: FuelDeal[];
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

export default function DailyGoals({ calls, emails, deals }: DailyGoalsProps) {
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

  const [editGoalType, setEditGoalType] = useState<GoalType>('calls');
  const [editGoalAmount, setEditGoalAmount] = useState(10);
  const [editGoalTime, setEditGoalTime] = useState('17:00');
  const [editGoalDate, setEditGoalDate] = useState(new Date().toISOString().split('T')[0]);

  const [notificationFrequency, setNotificationFrequency] = useState(30);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState<GoalProgress[]>([]);
  const [completedGoals, setCompletedGoals] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadGoals();
      loadSettings();
    }
  }, [user]);

  useEffect(() => {
    if (!user || !settings?.enable_notifications) return;

    const interval = setInterval(() => {
      checkGoalsAndNotify();
    }, settings.notification_frequency * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, settings, goals, calls, emails, deals]);

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
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
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

  const startEditGoal = (goal: DailyGoal) => {
    setEditingGoal(goal);
    setEditGoalType(goal.goal_type);
    setEditGoalAmount(goal.target_amount);
    setEditGoalTime(goal.target_time);
    setEditGoalDate(goal.target_date);
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
  };

  const getActivityForDate = (type: GoalType, targetDate: string): number => {
    const goalDate = new Date(targetDate);
    goalDate.setHours(0, 0, 0, 0);

    if (type === 'calls') {
      return calls.filter(c => {
        const callDate = new Date(c.call_date);
        callDate.setHours(0, 0, 0, 0);
        return callDate.getTime() === goalDate.getTime();
      }).length;
    } else if (type === 'emails') {
      return emails.filter(e => {
        const emailDate = new Date(e.email_date);
        emailDate.setHours(0, 0, 0, 0);
        return emailDate.getTime() === goalDate.getTime();
      }).length;
    } else {
      return deals.filter(d => {
        const dealDate = new Date(d.deal_date);
        dealDate.setHours(0, 0, 0, 0);
        return dealDate.getTime() === goalDate.getTime();
      }).length;
    }
  };

  const calculateProgress = (goal: DailyGoal): GoalProgress => {
    const automaticCount = getActivityForDate(goal.goal_type, goal.target_date);
    const currentAmount = automaticCount + (goal.manual_count || 0);
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Amount</label>
              <input
                type="number"
                value={newGoalAmount}
                onChange={(e) => setNewGoalAmount(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className={`p-4 rounded-lg border-2 transition-all ${
                  progress.percentComplete >= 100
                    ? 'bg-green-50 border-green-200'
                    : progress.onTrack
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-orange-50 border-orange-200'
                }`}
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
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditGoal(goal)}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
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
                        Auto: {getActivityForDate(goal.goal_type, goal.target_date)}
                      </span>
                      {goal.manual_count > 0 && (
                        <span className="text-xs text-purple-600 font-medium">
                          + Manual: {goal.manual_count}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateManualCount(goal.id, -1)}
                        disabled={!goal.manual_count}
                        className="p-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Decrease manual count"
                      >
                        <Minus size={14} className="text-gray-700" />
                      </button>
                      <button
                        onClick={() => updateManualCount(goal.id, 1)}
                        className="p-1 rounded bg-purple-100 hover:bg-purple-200 transition-colors"
                        title="Increase manual count"
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
                            Need {Math.ceil(progress.requiredRate)} per hour
                          </span>
                        )}
                      </span>
                    )}
                  </div>
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
    </div>
  );
}
