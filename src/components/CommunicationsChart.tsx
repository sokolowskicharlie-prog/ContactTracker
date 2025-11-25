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

export default function CommunicationsChart({ calls, emails, deals }: CommunicationsChartProps) {
  const getDailyStats = (): DailyStats[] => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const statsMap = new Map<string, DailyStats>();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateKey = date.toLocaleDateString('en-GB');
      statsMap.set(dateKey, { date: dateKey, calls: 0, emails: 0, deals: 0 });
    }

    calls.forEach(call => {
      const date = new Date(call.call_date);
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        const dateKey = date.toLocaleDateString('en-GB');
        if (statsMap.has(dateKey)) {
          statsMap.get(dateKey)!.calls++;
        }
      }
    });

    emails.forEach(email => {
      const date = new Date(email.email_date);
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        const dateKey = date.toLocaleDateString('en-GB');
        if (statsMap.has(dateKey)) {
          statsMap.get(dateKey)!.emails++;
        }
      }
    });

    deals.forEach(deal => {
      const date = new Date(deal.deal_date);
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        const dateKey = date.toLocaleDateString('en-GB');
        if (statsMap.has(dateKey)) {
          statsMap.get(dateKey)!.deals++;
        }
      }
    });

    return Array.from(statsMap.values())
      .sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split('/').map(Number);
        const [dayB, monthB, yearB] = b.date.split('/').map(Number);
        const dateA = new Date(yearA, monthA - 1, dayA);
        const dateB = new Date(yearB, monthB - 1, dayB);
        return dateA.getTime() - dateB.getTime();
      });
  };

  const dailyStats = getDailyStats();
  const maxValue = Math.max(
    ...dailyStats.map(stat => Math.max(stat.calls, stat.emails, stat.deals)),
    1
  );

  const totalCalls = dailyStats.reduce((sum, stat) => sum + stat.calls, 0);
  const totalEmails = dailyStats.reduce((sum, stat) => sum + stat.emails, 0);
  const totalDeals = dailyStats.reduce((sum, stat) => sum + stat.deals, 0);

  const barWidth = 20;
  const groupWidth = barWidth * 3 + 16;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Daily Activity</h3>

      <div className="overflow-x-auto">
        <div style={{ minWidth: `${dailyStats.length * groupWidth}px` }}>
          <div className="flex items-end h-64 gap-1">
            {dailyStats.map((stat, index) => {
              const callHeight = (stat.calls / maxValue) * 100;
              const emailHeight = (stat.emails / maxValue) * 100;
              const dealHeight = (stat.deals / maxValue) * 100;

              return (
                <div key={index} className="flex flex-col items-center" style={{ width: `${groupWidth}px` }}>
                  <div className="flex items-end justify-center gap-1 h-56 w-full">
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
                  </div>

                  <div className="text-xs text-gray-700 font-medium mt-2 text-center">
                    {stat.date.split('/')[0]}
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
            <div className="text-xs text-gray-500 mt-1">This month</div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Emails</span>
            </div>
            <div className="text-3xl font-bold text-orange-600">{totalEmails}</div>
            <div className="text-xs text-gray-500 mt-1">This month</div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Deals</span>
            </div>
            <div className="text-3xl font-bold text-blue-600">{totalDeals}</div>
            <div className="text-xs text-gray-500 mt-1">This month</div>
          </div>
        </div>
      </div>
    </div>
  );
}
