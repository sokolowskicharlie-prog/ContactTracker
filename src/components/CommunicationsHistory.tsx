import { useEffect, useState } from 'react';
import { Phone, Mail, ArrowLeft, Calendar, Clock, User, MessageSquare, Fuel, Target } from 'lucide-react';
import { Call, Email, Contact, FuelDeal, DailyGoal } from '../lib/supabase';
import CommunicationsChart from './CommunicationsChart';

interface CommunicationItem {
  id: string;
  type: 'call' | 'email' | 'deal' | 'goal';
  date: string;
  contact?: Contact;
  details: Call | Email | FuelDeal | DailyGoal;
}

interface CommunicationsHistoryProps {
  calls: Call[];
  emails: Email[];
  deals: FuelDeal[];
  contacts: Contact[];
  completedGoals: DailyGoal[];
  onClose: () => void;
}

type TimePeriod = 'all' | 'hourly' | 'daily' | 'monthly' | 'annual' | 'custom';

export default function CommunicationsHistory({ calls, emails, deals, contacts, completedGoals, onClose }: CommunicationsHistoryProps) {
  const [items, setItems] = useState<CommunicationItem[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'call' | 'email' | 'deal' | 'goal'>('all');
  const [summaryPeriod, setSummaryPeriod] = useState<TimePeriod>('all');
  const [summaryStartDate, setSummaryStartDate] = useState('');
  const [summaryEndDate, setSummaryEndDate] = useState('');
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const callItems: CommunicationItem[] = calls.map(call => ({
      id: call.id,
      type: 'call' as const,
      date: call.call_date,
      contact: contacts.find(c => c.id === call.contact_id)!,
      details: call,
    }));

    const emailItems: CommunicationItem[] = emails.map(email => ({
      id: email.id,
      type: 'email' as const,
      date: email.email_date,
      contact: contacts.find(c => c.id === email.contact_id)!,
      details: email,
    }));

    const dealItems: CommunicationItem[] = deals.map(deal => ({
      id: deal.id,
      type: 'deal' as const,
      date: deal.deal_date,
      contact: contacts.find(c => c.id === deal.contact_id)!,
      details: deal,
    }));

    const goalItems: CommunicationItem[] = completedGoals.map(goal => ({
      id: goal.id,
      type: 'goal' as const,
      date: goal.completed_at || goal.created_at,
      details: goal,
    }));

    const combined = [...callItems, ...emailItems, ...dealItems, ...goalItems].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setItems(combined);
  }, [calls, emails, deals, contacts, completedGoals]);

  const getSummaryFilteredItems = () => {
    const now = new Date();
    let filtered = items;

    if (summaryPeriod === 'all') {
      return items;
    } else if (summaryPeriod === 'custom') {
      if (summaryStartDate && summaryEndDate) {
        const start = new Date(summaryStartDate);
        const end = new Date(summaryEndDate);
        end.setHours(23, 59, 59, 999);

        filtered = items.filter(item => {
          const date = new Date(item.date);
          return date >= start && date <= end;
        });
      }
    } else if (summaryPeriod === 'daily') {
      const currentDay = now.getDate();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      filtered = items.filter(item => {
        const date = new Date(item.date);
        return date.getDate() === currentDay && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
    } else if (summaryPeriod === 'monthly') {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      filtered = items.filter(item => {
        const date = new Date(item.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
    } else if (summaryPeriod === 'annual') {
      const currentYear = now.getFullYear();

      filtered = items.filter(item => {
        const date = new Date(item.date);
        return date.getFullYear() === currentYear;
      });
    }

    return filtered;
  };

  const summaryFilteredItems = getSummaryFilteredItems();

  const filteredItems = summaryFilteredItems.filter(item =>
    filterType === 'all' || item.type === filterType
  );

  const getSummaryPeriodLabel = () => {
    if (summaryPeriod === 'all') {
      return 'All Time';
    }
    if (summaryPeriod === 'daily') {
      const now = new Date();
      return now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    if (summaryPeriod === 'monthly') {
      const now = new Date();
      return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    if (summaryPeriod === 'annual') {
      const now = new Date();
      return now.getFullYear().toString();
    }
    if (summaryPeriod === 'custom' && summaryStartDate && summaryEndDate) {
      return `${new Date(summaryStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(summaryEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return 'Custom range';
  };

  const summaryPeriodLabel = getSummaryPeriodLabel();

  const periodCallsCount = summaryFilteredItems.filter(i => i.type === 'call').length;
  const periodEmailsCount = summaryFilteredItems.filter(i => i.type === 'email').length;
  const periodDealsCount = summaryFilteredItems.filter(i => i.type === 'deal').length;
  const periodGoalsCount = summaryFilteredItems.filter(i => i.type === 'goal').length;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full h-full max-w-full max-h-full flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold">Communications History</h2>
              <p className="text-blue-100 text-sm">View all calls, emails, deals, and goals</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setSummaryPeriod('all')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  summaryPeriod === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setSummaryPeriod('hourly');
                  setSelectedDay(new Date().toISOString().split('T')[0]);
                }}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  summaryPeriod === 'hourly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Hourly
              </button>
              <button
                onClick={() => setSummaryPeriod('daily')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  summaryPeriod === 'daily'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setSummaryPeriod('monthly')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  summaryPeriod === 'monthly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setSummaryPeriod('annual')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  summaryPeriod === 'annual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Year
              </button>
              <button
                onClick={() => setSummaryPeriod('custom')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  summaryPeriod === 'custom'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Custom
              </button>
            </div>
            <div className="text-sm font-medium text-gray-700">
              {summaryPeriodLabel}
            </div>
          </div>

          {summaryPeriod === 'hourly' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Day
              </label>
              <input
                type="date"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {summaryPeriod === 'custom' && (
            <div className="flex gap-4 items-end mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={summaryStartDate}
                  onChange={(e) => setSummaryStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={summaryEndDate}
                  onChange={(e) => setSummaryEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setFilterType('all')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({summaryFilteredItems.length})
            </button>
            <button
              onClick={() => setFilterType('call')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                filterType === 'call'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Phone className="w-4 h-4" />
              Calls ({periodCallsCount})
            </button>
            <button
              onClick={() => setFilterType('email')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                filterType === 'email'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Mail className="w-4 h-4" />
              Emails ({periodEmailsCount})
            </button>
            <button
              onClick={() => setFilterType('deal')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                filterType === 'deal'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Fuel className="w-4 h-4" />
              Deals ({periodDealsCount})
            </button>
            <button
              onClick={() => setFilterType('goal')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                filterType === 'goal'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Target className="w-4 h-4" />
              Goals ({periodGoalsCount})
            </button>
          </div>

          <CommunicationsChart
            calls={calls}
            emails={emails}
            deals={deals}
            goals={completedGoals}
            contacts={contacts}
            externalSummaryPeriod={summaryPeriod}
            externalSummaryStartDate={summaryStartDate}
            externalSummaryEndDate={summaryEndDate}
            onSummaryPeriodChange={setSummaryPeriod}
            onSummaryStartDateChange={setSummaryStartDate}
            onSummaryEndDateChange={setSummaryEndDate}
            hideChartPeriodButtons={true}
            externalFilterType={filterType}
            selectedDay={selectedDay}
          />

          {summaryPeriod === 'hourly' && (
            <div className="px-6 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Hourly Activity for {new Date(selectedDay).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {Array.from({ length: 24 }, (_, hour) => {
                    const targetDate = new Date(selectedDay);
                    targetDate.setHours(0, 0, 0, 0);

                    const hourCalls = calls.filter(call => {
                      const date = new Date(call.call_date);
                      const callDay = new Date(date);
                      callDay.setHours(0, 0, 0, 0);
                      return callDay.getTime() === targetDate.getTime() && date.getHours() === hour;
                    }).length;

                    const hourEmails = emails.filter(email => {
                      const date = new Date(email.email_date);
                      const emailDay = new Date(date);
                      emailDay.setHours(0, 0, 0, 0);
                      return emailDay.getTime() === targetDate.getTime() && date.getHours() === hour;
                    }).length;

                    const hourDeals = deals.filter(deal => {
                      const date = new Date(deal.deal_date);
                      const dealDay = new Date(date);
                      dealDay.setHours(0, 0, 0, 0);
                      return dealDay.getTime() === targetDate.getTime() && date.getHours() === hour;
                    }).length;

                    const hourGoals = completedGoals.filter(goal => {
                      const date = new Date(goal.completed_at || goal.created_at);
                      const goalDay = new Date(date);
                      goalDay.setHours(0, 0, 0, 0);
                      return goalDay.getTime() === targetDate.getTime() && date.getHours() === hour;
                    }).length;

                    const total = hourCalls + hourEmails + hourDeals + hourGoals;

                    if (total === 0) return null;

                    return (
                      <div key={hour} className="flex items-center gap-4 text-sm">
                        <div className="w-20 font-medium text-gray-700">
                          {hour.toString().padStart(2, '0')}:00
                        </div>
                        <div className="flex-1 flex gap-3">
                          {hourCalls > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded">
                              <Phone className="w-3 h-3" />
                              {hourCalls}
                            </span>
                          )}
                          {hourEmails > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded">
                              <Mail className="w-3 h-3" />
                              {hourEmails}
                            </span>
                          )}
                          {hourDeals > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              <Fuel className="w-3 h-3" />
                              {hourDeals}
                            </span>
                          )}
                          {hourGoals > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded">
                              <Target className="w-3 h-3" />
                              {hourGoals}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-3">
                {filterType === 'call' ? (
                  <Phone className="w-16 h-16 mx-auto" />
                ) : filterType === 'email' ? (
                  <Mail className="w-16 h-16 mx-auto" />
                ) : filterType === 'deal' ? (
                  <Fuel className="w-16 h-16 mx-auto" />
                ) : filterType === 'goal' ? (
                  <Target className="w-16 h-16 mx-auto" />
                ) : (
                  <MessageSquare className="w-16 h-16 mx-auto" />
                )}
              </div>
              <p className="text-gray-500 text-lg">
                No {filterType === 'all' ? 'communications' : filterType === 'deal' ? 'deals' : filterType === 'goal' ? 'goals' : filterType + 's'} found
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => {
                const { date, time } = formatDateTime(item.date);
                const isCall = item.type === 'call';
                const isEmail = item.type === 'email';
                const isDeal = item.type === 'deal';
                const isGoal = item.type === 'goal';
                const details = item.details as (Call | Email | FuelDeal | DailyGoal);

                if (isGoal) {
                  const goalDetails = details as DailyGoal;
                  const goalTypeLabel = goalDetails.goal_type === 'calls' ? 'Calls' :
                                       goalDetails.goal_type === 'emails' ? 'Emails' : 'Deals';

                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-purple-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-purple-100">
                          <Target className="w-5 h-5 text-purple-600" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 text-lg">
                                {goalTypeLabel} Goal Completed
                              </h3>
                              <p className="text-gray-600 text-sm">Target: {goalDetails.target_amount} {goalDetails.goal_type}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="flex items-center gap-1 text-gray-600 text-sm">
                                <Calendar className="w-4 h-4" />
                                {date}
                              </div>
                              <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                                <Clock className="w-4 h-4" />
                                {time}
                              </div>
                            </div>
                          </div>

                          {goalDetails.notes && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                              <p className="text-sm text-gray-700 italic">{goalDetails.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${
                        isCall ? 'bg-green-100' : isEmail ? 'bg-orange-100' : 'bg-purple-100'
                      }`}>
                        {isCall ? (
                          <Phone className="w-5 h-5 text-green-600" />
                        ) : isEmail ? (
                          <Mail className="w-5 h-5 text-orange-600" />
                        ) : (
                          <Fuel className="w-5 h-5 text-purple-600" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {item.contact?.name || 'Unknown Contact'}
                            </h3>
                            {item.contact?.company && (
                              <p className="text-gray-600 text-sm">{item.contact.company}</p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <div className="flex items-center gap-1 text-gray-600 text-sm">
                              <Calendar className="w-4 h-4" />
                              {date}
                            </div>
                            <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                              <Clock className="w-4 h-4" />
                              {time}
                            </div>
                          </div>
                        </div>

                        {isCall ? (
                          <div className="space-y-2">
                            {(details as Call).spoke_with && (
                              <div className="flex items-center gap-2 text-sm">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">Spoke with:</span>
                                <span className="font-medium text-gray-900">
                                  {(details as Call).spoke_with}
                                </span>
                              </div>
                            )}
                            {(details as Call).phone_number && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">Phone:</span>
                                <span className="font-medium text-gray-900">
                                  {(details as Call).phone_number}
                                </span>
                              </div>
                            )}
                            {(details as Call).duration !== null && (details as Call).duration !== undefined && (
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">Duration:</span>
                                <span className="font-medium text-gray-900">
                                  {(details as Call).duration} minutes
                                </span>
                              </div>
                            )}
                            {(details as Call).notes && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {(details as Call).notes}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : isEmail ? (
                          <div className="space-y-2">
                            {(details as Email).subject && (
                              <div className="mb-2">
                                <span className="text-sm text-gray-600">Subject:</span>
                                <p className="font-medium text-gray-900 mt-1">
                                  {(details as Email).subject}
                                </p>
                              </div>
                            )}
                            {(details as Email).emailed_to && (
                              <div className="flex items-center gap-2 text-sm">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">To:</span>
                                <span className="font-medium text-gray-900">
                                  {(details as Email).emailed_to}
                                </span>
                              </div>
                            )}
                            {(details as Email).email_address && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">Email:</span>
                                <span className="font-medium text-gray-900">
                                  {(details as Email).email_address}
                                </span>
                              </div>
                            )}
                            {(details as Email).notes && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {(details as Email).notes}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {(details as FuelDeal).vessel_name && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600">Vessel:</span>
                                <span className="font-medium text-gray-900">
                                  {(details as FuelDeal).vessel_name}
                                </span>
                              </div>
                            )}
                            {(details as FuelDeal).fuel_type && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600">Fuel Type:</span>
                                <span className="font-medium text-gray-900">
                                  {(details as FuelDeal).fuel_type}
                                </span>
                              </div>
                            )}
                            {(details as FuelDeal).fuel_quantity && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600">Quantity:</span>
                                <span className="font-medium text-gray-900">
                                  {(details as FuelDeal).fuel_quantity} MT
                                </span>
                              </div>
                            )}
                            {(details as FuelDeal).port && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600">Port:</span>
                                <span className="font-medium text-gray-900">
                                  {(details as FuelDeal).port}
                                </span>
                              </div>
                            )}
                            {(details as FuelDeal).notes && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {(details as FuelDeal).notes}
                                </p>
                              </div>
                            )}
                          </div>
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
    </div>
  );
}
