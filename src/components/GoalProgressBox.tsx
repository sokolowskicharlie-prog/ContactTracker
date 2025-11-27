import { useState, useEffect } from 'react';
import { Target, ChevronDown, ChevronUp, Phone, Mail, Fuel, Clock } from 'lucide-react';
import { supabase, DailyGoal, Call, Email, FuelDeal } from '../lib/supabase';
import { useAuth } from '../lib/auth';

export default function GoalProgressBox() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [deals, setDeals] = useState<FuelDeal[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (user) {
      loadGoals();
      loadActivities();

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
                  className={`p-3 rounded-lg border-2 ${
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
    </div>
  );
}
