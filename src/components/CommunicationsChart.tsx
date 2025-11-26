import { useState } from 'react';
import { Phone, Mail, Fuel, X, Calendar, Clock, User, Target } from 'lucide-react';
import { Call, Email, FuelDeal, DailyGoal } from '../lib/supabase';

interface DailyStats {
  date: string;
  calls: number;
  emails: number;
  deals: number;
  goals: number;
}

interface CommunicationsChartProps {
  calls: Call[];
  emails: Email[];
  deals: FuelDeal[];
  goals: DailyGoal[];
}

type TimePeriod = 'daily' | 'monthly' | 'annual' | 'custom';

export default function CommunicationsChart({ calls, emails, deals, goals }: CommunicationsChartProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');
  const [summaryPeriod, setSummaryPeriod] = useState<TimePeriod>('monthly');
  const [showCalls, setShowCalls] = useState(true);
  const [showEmails, setShowEmails] = useState(true);
  const [showDeals, setShowDeals] = useState(true);
  const [showGoals, setShowGoals] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summaryStartDate, setSummaryStartDate] = useState('');
  const [summaryEndDate, setSummaryEndDate] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  console.log('Chart Props:', {
    callsCount: calls.length,
    emailsCount: emails.length,
    dealsCount: deals.length,
    sampleCall: calls[0],
    sampleEmail: emails[0],
    sampleDeal: deals[0]
  });

  const getStats = (): DailyStats[] => {
    const now = new Date();
    const statsMap = new Map<string, DailyStats>();

    if (timePeriod === 'custom') {
      if (!startDate || !endDate) return [];

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start > end) return [];

      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      for (let i = 0; i < daysDiff; i++) {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        const dateKey = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
        statsMap.set(dateKey, { date: dateKey, calls: 0, emails: 0, deals: 0, goals: 0 });
      }

      calls.forEach(call => {
        const date = new Date(call.call_date);
        if (date >= start && date <= end) {
          const dateKey = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
          if (statsMap.has(dateKey)) {
            statsMap.get(dateKey)!.calls++;
          }
        }
      });

      emails.forEach(email => {
        const date = new Date(email.email_date);
        if (date >= start && date <= end) {
          const dateKey = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
          if (statsMap.has(dateKey)) {
            statsMap.get(dateKey)!.emails++;
          }
        }
      });

      deals.forEach(deal => {
        const date = new Date(deal.deal_date);
        if (date >= start && date <= end) {
          const dateKey = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
          if (statsMap.has(dateKey)) {
            statsMap.get(dateKey)!.deals++;
          }
        }
      });

      goals.forEach(goal => {
        const date = new Date(goal.completed_at || goal.created_at);
        if (date >= start && date <= end) {
          const dateKey = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
          if (statsMap.has(dateKey)) {
            statsMap.get(dateKey)!.goals++;
          }
        }
      });
    } else if (timePeriod === 'daily') {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateKey = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
        statsMap.set(dateKey, { date: dateKey, calls: 0, emails: 0, deals: 0, goals: 0 });
      }

      calls.forEach(call => {
        const date = new Date(call.call_date);
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          const dateKey = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
          if (statsMap.has(dateKey)) {
            statsMap.get(dateKey)!.calls++;
          }
        }
      });

      emails.forEach(email => {
        const date = new Date(email.email_date);
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          const dateKey = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
          if (statsMap.has(dateKey)) {
            statsMap.get(dateKey)!.emails++;
          }
        }
      });

      deals.forEach(deal => {
        const date = new Date(deal.deal_date);
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          const dateKey = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
          if (statsMap.has(dateKey)) {
            statsMap.get(dateKey)!.deals++;
          }
        }
      });

      goals.forEach(goal => {
        const date = new Date(goal.completed_at || goal.created_at);
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          const dateKey = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
          if (statsMap.has(dateKey)) {
            statsMap.get(dateKey)!.goals++;
          }
        }
      });
    } else if (timePeriod === 'monthly') {
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const dateKey = date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
        statsMap.set(dateKey, { date: dateKey, calls: 0, emails: 0, deals: 0, goals: 0 });
      }

      calls.forEach(call => {
        const date = new Date(call.call_date);
        const monthsDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
        const dateKey = date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
        console.log('Processing call:', {
          call_date: call.call_date,
          parsed_date: date,
          monthsDiff,
          dateKey,
          hasKey: statsMap.has(dateKey),
          inRange: monthsDiff >= 0 && monthsDiff < 12
        });
        if (monthsDiff >= 0 && monthsDiff < 12) {
          if (statsMap.has(dateKey)) {
            statsMap.get(dateKey)!.calls++;
          }
        }
      });

      emails.forEach(email => {
        const date = new Date(email.email_date);
        const monthsDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
        if (monthsDiff >= 0 && monthsDiff < 12) {
          const dateKey = date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
          if (statsMap.has(dateKey)) {
            statsMap.get(dateKey)!.emails++;
          }
        }
      });

      deals.forEach(deal => {
        const date = new Date(deal.deal_date);
        const monthsDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
        if (monthsDiff >= 0 && monthsDiff < 12) {
          const dateKey = date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
          if (statsMap.has(dateKey)) {
            statsMap.get(dateKey)!.deals++;
          }
        }
      });

      goals.forEach(goal => {
        const date = new Date(goal.completed_at || goal.created_at);
        const monthsDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
        if (monthsDiff >= 0 && monthsDiff < 12) {
          const dateKey = date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
          if (statsMap.has(dateKey)) {
            statsMap.get(dateKey)!.goals++;
          }
        }
      });
    } else {
      for (let i = 4; i >= 0; i--) {
        const year = now.getFullYear() - i;
        const dateKey = year.toString();
        statsMap.set(dateKey, { date: dateKey, calls: 0, emails: 0, deals: 0, goals: 0 });
      }

      calls.forEach(call => {
        const date = new Date(call.call_date);
        const year = date.getFullYear();
        const dateKey = year.toString();
        if (statsMap.has(dateKey)) {
          statsMap.get(dateKey)!.calls++;
        }
      });

      emails.forEach(email => {
        const date = new Date(email.email_date);
        const year = date.getFullYear();
        const dateKey = year.toString();
        if (statsMap.has(dateKey)) {
          statsMap.get(dateKey)!.emails++;
        }
      });

      deals.forEach(deal => {
        const date = new Date(deal.deal_date);
        const year = date.getFullYear();
        const dateKey = year.toString();
        if (statsMap.has(dateKey)) {
          statsMap.get(dateKey)!.deals++;
        }
      });

      goals.forEach(goal => {
        const date = new Date(goal.completed_at || goal.created_at);
        const year = date.getFullYear();
        const dateKey = year.toString();
        if (statsMap.has(dateKey)) {
          statsMap.get(dateKey)!.goals++;
        }
      });
    }

    return Array.from(statsMap.values());
  };

  const stats = getStats();

  const allValues: number[] = [];
  stats.forEach(stat => {
    if (showCalls) allValues.push(stat.calls);
    if (showEmails) allValues.push(stat.emails);
    if (showDeals) allValues.push(stat.deals);
    if (showGoals) allValues.push(stat.goals);
  });

  const dataMaxValue = allValues.length > 0 ? Math.max(...allValues) : 1;
  const maxValue = Math.max(dataMaxValue, 5);

  const yAxisMax = Math.ceil(maxValue * 1.2);
  const yAxisSteps = 20;
  const stepSize = Math.max(1, Math.ceil(yAxisMax / yAxisSteps));
  const yAxisLabels = Array.from({ length: yAxisSteps + 1 }, (_, i) => i * stepSize);

  console.log('Chart Debug:', {
    allValues,
    dataMaxValue,
    maxValue,
    yAxisMax,
    stepSize,
    stats: stats.map(s => ({ date: s.date, calls: s.calls, emails: s.emails, deals: s.deals }))
  });

  const getSummaryTotals = () => {
    const now = new Date();
    let filteredCalls = calls;
    let filteredEmails = emails;
    let filteredDeals = deals;
    let filteredGoals = goals;

    if (summaryPeriod === 'custom') {
      if (summaryStartDate && summaryEndDate) {
        const start = new Date(summaryStartDate);
        const end = new Date(summaryEndDate);
        end.setHours(23, 59, 59, 999);

        filteredCalls = calls.filter(c => {
          const date = new Date(c.call_date);
          return date >= start && date <= end;
        });
        filteredEmails = emails.filter(e => {
          const date = new Date(e.email_date);
          return date >= start && date <= end;
        });
        filteredDeals = deals.filter(d => {
          const date = new Date(d.deal_date);
          return date >= start && date <= end;
        });
        filteredGoals = goals.filter(g => {
          const date = new Date(g.completed_at || g.created_at);
          return date >= start && date <= end;
        });
      }
    } else if (summaryPeriod === 'daily') {
      const currentDay = now.getDate();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      filteredCalls = calls.filter(c => {
        const date = new Date(c.call_date);
        return date.getDate() === currentDay && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
      filteredEmails = emails.filter(e => {
        const date = new Date(e.email_date);
        return date.getDate() === currentDay && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
      filteredDeals = deals.filter(d => {
        const date = new Date(d.deal_date);
        return date.getDate() === currentDay && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
      filteredGoals = goals.filter(g => {
        const date = new Date(g.completed_at || g.created_at);
        return date.getDate() === currentDay && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
    } else if (summaryPeriod === 'monthly') {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      filteredCalls = calls.filter(c => {
        const date = new Date(c.call_date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
      filteredEmails = emails.filter(e => {
        const date = new Date(e.email_date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
      filteredDeals = deals.filter(d => {
        const date = new Date(d.deal_date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
      filteredGoals = goals.filter(g => {
        const date = new Date(g.completed_at || g.created_at);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
    } else if (summaryPeriod === 'annual') {
      const currentYear = now.getFullYear();

      filteredCalls = calls.filter(c => {
        const date = new Date(c.call_date);
        return date.getFullYear() === currentYear;
      });
      filteredEmails = emails.filter(e => {
        const date = new Date(e.email_date);
        return date.getFullYear() === currentYear;
      });
      filteredDeals = deals.filter(d => {
        const date = new Date(d.deal_date);
        return date.getFullYear() === currentYear;
      });
      filteredGoals = goals.filter(g => {
        const date = new Date(g.completed_at || g.created_at);
        return date.getFullYear() === currentYear;
      });
    }

    return {
      calls: filteredCalls.length,
      emails: filteredEmails.length,
      deals: filteredDeals.length,
      goals: filteredGoals.length
    };
  };

  const summaryTotals = getSummaryTotals();
  const totalCalls = summaryTotals.calls;
  const totalEmails = summaryTotals.emails;
  const totalDeals = summaryTotals.deals;
  const totalGoals = summaryTotals.goals;

  const getPeriodLabel = () => {
    if (timePeriod === 'daily') {
      const now = new Date();
      return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    if (timePeriod === 'monthly') return 'Last 12 months';
    if (timePeriod === 'annual') return 'Last 5 years';
    if (timePeriod === 'custom' && startDate && endDate) {
      return `${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return 'Custom range';
  };

  const getSummaryPeriodLabel = () => {
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

  const periodLabel = getPeriodLabel();
  const summaryPeriodLabel = getSummaryPeriodLabel();

  const barsPerGroup = [showCalls, showEmails, showDeals, showGoals].filter(Boolean).length;
  const barWidth = 20;
  const groupWidth = barsPerGroup > 0 ? barWidth * barsPerGroup + (barsPerGroup - 1) * 4 : barWidth;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Activity Overview</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setTimePeriod('daily')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                timePeriod === 'daily'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setTimePeriod('monthly')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                timePeriod === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setTimePeriod('annual')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                timePeriod === 'annual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Annual
            </button>
            <button
              onClick={() => setTimePeriod('custom')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                timePeriod === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        {timePeriod === 'custom' && (
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showCalls}
            onChange={(e) => setShowCalls(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            Calls
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showEmails}
            onChange={(e) => setShowEmails(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
          />
          <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            Emails
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showDeals}
            onChange={(e) => setShowDeals(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            Deals
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showGoals}
            onChange={(e) => setShowGoals(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            Goals
          </span>
        </label>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-4">
          <div className="flex flex-col justify-between py-2" style={{ height: '224px' }}>
            {yAxisLabels.reverse().map((label) => (
              <div key={label} className="text-xs text-gray-500 text-right pr-2">
                {label}
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-x-auto">
            <div className="flex items-end gap-2 justify-start" style={{ minWidth: '100%', height: '224px' }}>
                {stats.map((stat, index) => {
                  const callHeight = (stat.calls / yAxisMax) * 100;
                  const emailHeight = (stat.emails / yAxisMax) * 100;
                  const dealHeight = (stat.deals / yAxisMax) * 100;
                  const goalHeight = (stat.goals / yAxisMax) * 100;

                  if (index === 0) {
                    console.log('First bar heights:', {
                      date: stat.date,
                      calls: stat.calls,
                      emails: stat.emails,
                      deals: stat.deals,
                      yAxisMax,
                      callHeight: `${callHeight}%`,
                      emailHeight: `${emailHeight}%`,
                      dealHeight: `${dealHeight}%`
                    });
                  }

                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center flex-1 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors p-1 relative group"
                      style={{ minWidth: `${groupWidth}px`, maxWidth: '100px' }}
                      onClick={() => setSelectedDate(stat.date)}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl">
                        <div className="font-semibold mb-1 text-center">{stat.date}</div>
                        <div className="space-y-0.5">
                          {showCalls && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded"></div>
                              <span>Calls: {stat.calls}</span>
                            </div>
                          )}
                          {showEmails && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-orange-500 rounded"></div>
                              <span>Emails: {stat.emails}</span>
                            </div>
                          )}
                          {showDeals && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded"></div>
                              <span>Deals: {stat.deals}</span>
                            </div>
                          )}
                          {showGoals && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-purple-500 rounded"></div>
                              <span>Goals: {stat.goals}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-end justify-center gap-1 w-full relative" style={{ height: '224px' }}>
                        {showCalls && (
                          <div style={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                            <div
                              className="bg-green-500 hover:bg-green-600 transition-colors rounded-t"
                              style={{
                                height: `${callHeight}%`,
                                minHeight: stat.calls > 0 ? '4px' : '0px',
                                width: `${barWidth}px`
                              }}
                            />
                          </div>
                        )}

                        {showEmails && (
                          <div style={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                            <div
                              className="bg-orange-500 hover:bg-orange-600 transition-colors rounded-t"
                              style={{
                                height: `${emailHeight}%`,
                                minHeight: stat.emails > 0 ? '4px' : '0px',
                                width: `${barWidth}px`
                              }}
                            />
                          </div>
                        )}

                        {showDeals && (
                          <div style={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                            <div
                              className="bg-blue-500 hover:bg-blue-600 transition-colors rounded-t"
                              style={{
                                height: `${dealHeight}%`,
                                minHeight: stat.deals > 0 ? '4px' : '0px',
                                width: `${barWidth}px`
                              }}
                            />
                          </div>
                        )}

                        {showGoals && (
                          <div style={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                            <div
                              className="bg-purple-500 hover:bg-purple-600 transition-colors rounded-t"
                              style={{
                                height: `${goalHeight}%`,
                                minHeight: stat.goals > 0 ? '4px' : '0px',
                                width: `${barWidth}px`
                              }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-gray-700 font-medium mt-2 text-center">
                        {timePeriod === 'daily' ? stat.date : timePeriod === 'monthly' ? stat.date : stat.date}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-semibold text-gray-900">Summary Totals</h4>
          <div className="flex gap-2">
            <button
              onClick={() => setSummaryPeriod('daily')}
              className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors ${
                summaryPeriod === 'daily'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setSummaryPeriod('monthly')}
              className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors ${
                summaryPeriod === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setSummaryPeriod('annual')}
              className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors ${
                summaryPeriod === 'annual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Year
            </button>
            <button
              onClick={() => setSummaryPeriod('custom')}
              className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors ${
                summaryPeriod === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        {summaryPeriod === 'custom' && (
          <div className="flex gap-4 items-end mb-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={summaryStartDate}
                onChange={(e) => setSummaryStartDate(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={summaryEndDate}
                onChange={(e) => setSummaryEndDate(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-6">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Calls</span>
            </div>
            <div className="text-3xl font-bold text-green-600">{totalCalls}</div>
            <div className="text-xs text-gray-500 mt-1">{summaryPeriodLabel}</div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Emails</span>
            </div>
            <div className="text-3xl font-bold text-orange-600">{totalEmails}</div>
            <div className="text-xs text-gray-500 mt-1">{summaryPeriodLabel}</div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Deals</span>
            </div>
            <div className="text-3xl font-bold text-blue-600">{totalDeals}</div>
            <div className="text-xs text-gray-500 mt-1">{summaryPeriodLabel}</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Goals</span>
            </div>
            <div className="text-3xl font-bold text-purple-600">{totalGoals}</div>
            <div className="text-xs text-gray-500 mt-1">{summaryPeriodLabel}</div>
          </div>
        </div>
      </div>

      {selectedDate && (() => {
        const parseDate = (dateStr: string) => {
          if (timePeriod === 'daily' || timePeriod === 'custom') {
            const [day, month] = dateStr.split('/');
            const now = new Date();
            return new Date(now.getFullYear(), parseInt(month) - 1, parseInt(day));
          } else if (timePeriod === 'monthly') {
            const [monthStr, yearStr] = dateStr.split(' ');
            const monthMap: { [key: string]: number } = {
              'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
              'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
            };
            return new Date(2000 + parseInt(yearStr), monthMap[monthStr], 1);
          } else {
            return new Date(parseInt(dateStr), 0, 1);
          }
        };

        const selectedDateObj = parseDate(selectedDate);

        const filterByDate = (date: Date) => {
          if (timePeriod === 'daily' || timePeriod === 'custom') {
            return date.getDate() === selectedDateObj.getDate() &&
                   date.getMonth() === selectedDateObj.getMonth() &&
                   date.getFullYear() === selectedDateObj.getFullYear();
          } else if (timePeriod === 'monthly') {
            return date.getMonth() === selectedDateObj.getMonth() &&
                   date.getFullYear() === selectedDateObj.getFullYear();
          } else {
            return date.getFullYear() === selectedDateObj.getFullYear();
          }
        };

        const daysCalls = calls.filter(call => filterByDate(new Date(call.call_date)));
        const daysEmails = emails.filter(email => filterByDate(new Date(email.email_date)));
        const daysDeals = deals.filter(deal => filterByDate(new Date(deal.deal_date)));

        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6" />
                  <div>
                    <h3 className="text-xl font-bold">Activity Details</h3>
                    <p className="text-blue-100 text-sm">{selectedDate}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Calls</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">{daysCalls.length}</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium text-gray-700">Emails</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-600">{daysEmails.length}</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Fuel className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Deals</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{daysDeals.length}</div>
                  </div>
                </div>

                <div className="space-y-6">
                  {daysCalls.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Phone className="w-5 h-5 text-green-600" />
                        Calls ({daysCalls.length})
                      </h4>
                      <div className="space-y-3">
                        {daysCalls.map(call => (
                          <div key={call.id} className="bg-green-50 rounded-lg p-4 border border-green-100">
                            <div className="flex items-start justify-between mb-3">
                              <div className="text-lg font-bold text-gray-900">{call.contact_name}</div>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                {new Date(call.call_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            {call.spoke_with && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                <User className="w-4 h-4" />
                                {call.spoke_with}
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

                  {daysEmails.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-orange-600" />
                        Emails ({daysEmails.length})
                      </h4>
                      <div className="space-y-3">
                        {daysEmails.map(email => (
                          <div key={email.id} className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                            <div className="flex items-start justify-between mb-3">
                              <div className="text-lg font-bold text-gray-900">{email.contact_name}</div>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                {new Date(email.email_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            {email.subject && (
                              <div className="text-sm font-medium text-gray-900 mb-1">
                                Subject: {email.subject}
                              </div>
                            )}
                            {email.emailed_to && (
                              <div className="text-sm text-gray-600 mb-1">
                                To: {email.emailed_to}
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

                  {daysDeals.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Fuel className="w-5 h-5 text-blue-600" />
                        Deals ({daysDeals.length})
                      </h4>
                      <div className="space-y-3">
                        {daysDeals.map(deal => (
                          <div key={deal.id} className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                            <div className="flex items-start justify-between mb-3">
                              <div className="text-lg font-bold text-gray-900">{deal.contact_name}</div>
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

                  {daysCalls.length === 0 && daysEmails.length === 0 && daysDeals.length === 0 && (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-500 text-lg">No activity recorded for this date</p>
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
