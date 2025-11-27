import { useState, useEffect } from 'react';
import { Minus } from 'lucide-react';
import { supabase, DailyGoal, Call, Email, FuelDeal } from '../lib/supabase';
import { useAuth } from '../lib/auth';

interface GoalProgress {
  type: 'calls' | 'emails' | 'deals';
  targetAmount: number;
  currentAmount: number;
  targetTime: string;
  percentComplete: number;
  onTrack: boolean;
  timeRemaining: string;
}

export default function GlobalGoalNotifications() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [deals, setDeals] = useState<FuelDeal[]>([]);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [notificationFrequency, setNotificationFrequency] = useState(30);
  const [inAppNotifications, setInAppNotifications] = useState<GoalProgress[]>([]);
  const [completedGoals, setCompletedGoals] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadGoals();
      loadActivities();
      loadNotificationSettings();

      const callsSubscription = supabase
        .channel('calls_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'calls', filter: `user_id=eq.${user.id}` }, () => {
          loadActivities();
        })
        .subscribe();

      const emailsSubscription = supabase
        .channel('emails_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'emails', filter: `user_id=eq.${user.id}` }, () => {
          loadActivities();
        })
        .subscribe();

      const dealsSubscription = supabase
        .channel('deals_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'fuel_deals', filter: `user_id=eq.${user.id}` }, () => {
          loadActivities();
        })
        .subscribe();

      const goalsSubscription = supabase
        .channel('goals_changes')
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

  useEffect(() => {
    if (!user || !enableNotifications) return;

    const checkInterval = setInterval(() => {
      loadGoals();
      loadActivities();
      checkGoalsProgress();
    }, notificationFrequency * 60 * 1000);

    const initialCheck = setTimeout(() => {
      checkGoalsProgress();
    }, 1000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(initialCheck);
    };
  }, [user, enableNotifications, notificationFrequency]);

  useEffect(() => {
    if (goals.length > 0 && enableNotifications) {
      checkGoalsProgress();
    }
  }, [goals, calls, emails, deals]);

  const loadGoals = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('target_date', today)
      .eq('is_active', true);

    if (error) {
      console.error('[GlobalGoalNotifications] Error loading goals:', error);
      return;
    }

    console.log('[GlobalGoalNotifications] Loaded goals:', data?.length || 0);
    setGoals(data || []);
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

    console.log('[GlobalGoalNotifications] Loaded activities:', {
      calls: callsResult.data?.length || 0,
      emails: emailsResult.data?.length || 0,
      deals: dealsResult.data?.length || 0
    });

    if (!callsResult.error) setCalls(callsResult.data || []);
    if (!emailsResult.error) setEmails(emailsResult.data || []);
    if (!dealsResult.error) setDeals(dealsResult.data || []);
  };

  const loadNotificationSettings = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_preferences')
      .select('enable_goal_notifications, goal_notification_frequency')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      console.log('[GlobalGoalNotifications] Loaded settings:', {
        enabled: data.enable_goal_notifications ?? true,
        frequency: data.goal_notification_frequency ?? 30
      });
      setEnableNotifications(data.enable_goal_notifications ?? true);
      setNotificationFrequency(data.goal_notification_frequency ?? 30);
    } else {
      console.log('[GlobalGoalNotifications] Using default settings');
      setEnableNotifications(true);
      setNotificationFrequency(30);
    }
  };

  const calculateProgress = (goal: DailyGoal): GoalProgress => {
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

    const now = new Date();
    const [targetHour, targetMinute] = goal.target_time.split(':').map(Number);
    const targetDateTime = new Date(now);
    targetDateTime.setHours(targetHour, targetMinute, 0, 0);
    const timeRemaining = targetDateTime.getTime() - now.getTime();

    let timeRemainingStr = '';
    if (timeRemaining <= 0) {
      timeRemainingStr = 'Time expired';
    } else {
      const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      timeRemainingStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }

    const percentComplete = (currentCount / goal.target_amount) * 100;
    const timeElapsed = now.getTime() - new Date(now.setHours(0, 0, 0, 0)).getTime();
    const totalTimeAvailable = targetDateTime.getTime() - new Date(now.setHours(0, 0, 0, 0)).getTime();
    const expectedProgress = (timeElapsed / totalTimeAvailable) * goal.target_amount;
    const onTrack = currentCount >= expectedProgress;

    return {
      type: goal.goal_type,
      targetAmount: goal.target_amount,
      currentAmount: currentCount,
      targetTime: goal.target_time,
      percentComplete,
      onTrack,
      timeRemaining: timeRemainingStr
    };
  };

  const checkGoalsProgress = () => {
    console.log('[GlobalGoalNotifications] Checking goals progress', {
      goalsCount: goals.length,
      enableNotifications,
      notificationFrequency
    });

    goals.forEach(goal => {
      const progress = calculateProgress(goal);
      const now = new Date();
      const [targetHour, targetMinute] = goal.target_time.split(':').map(Number);
      const targetDateTime = new Date(now);
      targetDateTime.setHours(targetHour, targetMinute, 0, 0);
      const timeExpired = now >= targetDateTime;

      console.log('[GlobalGoalNotifications] Goal progress', {
        goalId: goal.id,
        type: goal.goal_type,
        progress: progress.currentAmount,
        target: progress.targetAmount,
        onTrack: progress.onTrack,
        timeExpired,
        timeRemaining: progress.timeRemaining
      });

      if (timeExpired && !completedGoals.has(goal.id)) {
        console.log('[GlobalGoalNotifications] Showing completion notification');
        showCompletionNotification(goal, progress);
        setCompletedGoals(prev => new Set(prev).add(goal.id));
      } else if (!progress.onTrack && progress.timeRemaining !== 'Time expired') {
        console.log('[GlobalGoalNotifications] Showing behind schedule notification');
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

  if (!enableNotifications || inAppNotifications.length === 0) {
    return null;
  }

  return (
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
            className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 shadow-lg animate-slide-in-right"
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl">{icon}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-yellow-900">⚠️ Behind Schedule</h4>
                  <button
                    onClick={() => {
                      setInAppNotifications(prev =>
                        prev.filter((_, i) => i !== index)
                      );
                    }}
                    className="text-yellow-400 hover:text-yellow-600"
                  >
                    <Minus size={18} />
                  </button>
                </div>
                <p className="text-sm text-yellow-800 mb-2">
                  You need <span className="font-semibold">{remaining} more {typeLabel}</span> by{' '}
                  <span className="font-semibold">{notification.targetTime}</span>
                </p>
                <div className="flex justify-between items-center text-xs text-yellow-700">
                  <span>Progress: {notification.currentAmount}/{notification.targetAmount}</span>
                  <span>{Math.round(notification.percentComplete)}%</span>
                </div>
                <div className="w-full bg-yellow-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(notification.percentComplete, 100)}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-xs text-yellow-700">
                  Time remaining: {notification.timeRemaining}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
