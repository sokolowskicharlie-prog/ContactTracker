import { useState, useEffect } from 'react';
import { Target, ChevronDown, ChevronUp, Phone, Mail, Fuel, Clock, X, User, Calendar } from 'lucide-react';
import { supabase, DailyGoal, Call, Email, FuelDeal, Contact } from '../lib/supabase';
import { useAuth } from '../lib/auth';

export default function GoalProgressBox() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [deals, setDeals] = useState<FuelDeal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<DailyGoal | null>(null);

  useEffect(() => {
    if (user) {
      loadGoals();
      loadActivities();
      loadContacts();

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
                  {selectedGoal.goal_type === 'calls' && goalCalls.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Phone className="w-5 h-5 text-green-600" />
                        Calls Made ({goalCalls.length})
                      </h4>
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
