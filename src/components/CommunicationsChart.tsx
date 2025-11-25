import { useState } from 'react';
import { Call, Email, FuelDeal } from '../lib/supabase';

interface DailyStats {
  date: string;
  calls: number;
  emails: number;
  deals: number;
}

interface CommunicationsChartProps {
  calls: Call[];
  emails: Email[];
  deals: FuelDeal[];
}

type TimePeriod = 'daily' | 'monthly' | 'annual' | 'custom';

export default function CommunicationsChart({ calls, emails, deals }: CommunicationsChartProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');
  const [showCalls, setShowCalls] = useState(true);
  const [showEmails, setShowEmails] = useState(true);
  const [showDeals, setShowDeals] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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
        statsMap.set(dateKey, { date: dateKey, calls: 0, emails: 0, deals: 0 });
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
    } else if (timePeriod === 'daily') {
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateKey = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
        statsMap.set(dateKey, { date: dateKey, calls: 0, emails: 0, deals: 0 });
      }

      calls.forEach(call => {
        const date = new Date(call.call_date);
        const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 0 && daysDiff < 30) {
          const dateKey = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
          if (statsMap.has(dateKey)) {
            statsMap.get(dateKey)!.calls++;
          }
        }
      });

      emails.forEach(email => {
        const date = new Date(email.email_date);
        const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 0 && daysDiff < 30) {
          const dateKey = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
          if (statsMap.has(dateKey)) {
            statsMap.get(dateKey)!.emails++;
          }
        }
      });

      deals.forEach(deal => {
        const date = new Date(deal.deal_date);
        const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 0 && daysDiff < 30) {
          const dateKey = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
          if (statsMap.has(dateKey)) {
            statsMap.get(dateKey)!.deals++;
          }
        }
      });
    } else if (timePeriod === 'monthly') {
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const dateKey = date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
        statsMap.set(dateKey, { date: dateKey, calls: 0, emails: 0, deals: 0 });
      }

      calls.forEach(call => {
        const date = new Date(call.call_date);
        const monthsDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
        if (monthsDiff >= 0 && monthsDiff < 12) {
          const dateKey = date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
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
    } else {
      for (let i = 4; i >= 0; i--) {
        const year = now.getFullYear() - i;
        const dateKey = year.toString();
        statsMap.set(dateKey, { date: dateKey, calls: 0, emails: 0, deals: 0 });
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
    }

    return Array.from(statsMap.values());
  };

  const stats = getStats();
  const maxValue = Math.max(
    ...stats.map(stat => {
      let max = 0;
      if (showCalls) max = Math.max(max, stat.calls);
      if (showEmails) max = Math.max(max, stat.emails);
      if (showDeals) max = Math.max(max, stat.deals);
      return max;
    }),
    1
  );

  const totalCalls = stats.reduce((sum, stat) => sum + stat.calls, 0);
  const totalEmails = stats.reduce((sum, stat) => sum + stat.emails, 0);
  const totalDeals = stats.reduce((sum, stat) => sum + stat.deals, 0);

  const periodLabel = timePeriod === 'daily' ? 'Last 30 days' : timePeriod === 'monthly' ? 'Last 12 months' : timePeriod === 'annual' ? 'Last 5 years' : 'Custom range';

  const barsPerGroup = [showCalls, showEmails, showDeals].filter(Boolean).length;
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
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: `${stats.length * (groupWidth + 8)}px` }}>
          <div className="flex items-end h-64 gap-2">
            {stats.map((stat, index) => {
              const callHeight = (stat.calls / maxValue) * 100;
              const emailHeight = (stat.emails / maxValue) * 100;
              const dealHeight = (stat.deals / maxValue) * 100;

              return (
                <div key={index} className="flex flex-col items-center" style={{ width: `${groupWidth}px` }}>
                  <div className="flex items-end justify-center gap-1 h-56 w-full">
                    {showCalls && (
                      <div className="relative group">
                        <div
                          className="bg-green-500 hover:bg-green-600 transition-colors rounded-t"
                          style={{
                            height: `${callHeight}%`,
                            minHeight: stat.calls > 0 ? '4px' : '0px',
                            width: `${barWidth}px`
                          }}
                        />
                        {stat.calls > 0 && (
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {stat.calls}
                          </div>
                        )}
                      </div>
                    )}

                    {showEmails && (
                      <div className="relative group">
                        <div
                          className="bg-orange-500 hover:bg-orange-600 transition-colors rounded-t"
                          style={{
                            height: `${emailHeight}%`,
                            minHeight: stat.emails > 0 ? '4px' : '0px',
                            width: `${barWidth}px`
                          }}
                        />
                        {stat.emails > 0 && (
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {stat.emails}
                          </div>
                        )}
                      </div>
                    )}

                    {showDeals && (
                      <div className="relative group">
                        <div
                          className="bg-blue-500 hover:bg-blue-600 transition-colors rounded-t"
                          style={{
                            height: `${dealHeight}%`,
                            minHeight: stat.deals > 0 ? '4px' : '0px',
                            width: `${barWidth}px`
                          }}
                        />
                        {stat.deals > 0 && (
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {stat.deals}
                          </div>
                        )}
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

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Calls</span>
            </div>
            <div className="text-3xl font-bold text-green-600">{totalCalls}</div>
            <div className="text-xs text-gray-500 mt-1">{periodLabel}</div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Emails</span>
            </div>
            <div className="text-3xl font-bold text-orange-600">{totalEmails}</div>
            <div className="text-xs text-gray-500 mt-1">{periodLabel}</div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Deals</span>
            </div>
            <div className="text-3xl font-bold text-blue-600">{totalDeals}</div>
            <div className="text-xs text-gray-500 mt-1">{periodLabel}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
