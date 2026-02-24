import { X, Clock, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TimezoneModalProps {
  onClose: () => void;
  showGoals?: boolean;
  showNotepad?: boolean;
  showPriority?: boolean;
  showOilPrices?: boolean;
  panelOrder?: string[];
  notepadExpanded?: boolean;
  goalsExpanded?: boolean;
  priorityExpanded?: boolean;
  oilPricesExpanded?: boolean;
  panelSpacing?: number;
  isOpen: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

interface Timezone {
  name: string;
  city: string;
  offset: string;
  time: string;
  date: string;
  isDST: boolean;
  isLondon?: boolean;
}

const majorTimezones = [
  { name: 'Pacific/Honolulu', city: 'Honolulu' },
  { name: 'America/Anchorage', city: 'Anchorage' },
  { name: 'America/Los_Angeles', city: 'Los Angeles' },
  { name: 'America/Denver', city: 'Denver' },
  { name: 'America/Chicago', city: 'Chicago' },
  { name: 'America/New_York', city: 'New York' },
  { name: 'America/Caracas', city: 'Caracas' },
  { name: 'America/St_Johns', city: 'St. Johns' },
  { name: 'America/Sao_Paulo', city: 'São Paulo' },
  { name: 'Atlantic/Azores', city: 'Azores' },
  { name: 'Europe/London', city: 'London', isLondon: true },
  { name: 'Europe/Paris', city: 'Paris' },
  { name: 'Europe/Athens', city: 'Athens' },
  { name: 'Europe/Moscow', city: 'Moscow' },
  { name: 'Asia/Dubai', city: 'Dubai' },
  { name: 'Asia/Karachi', city: 'Karachi' },
  { name: 'Asia/Dhaka', city: 'Dhaka' },
  { name: 'Asia/Bangkok', city: 'Bangkok' },
  { name: 'Asia/Shanghai', city: 'Shanghai' },
  { name: 'Asia/Tokyo', city: 'Tokyo' },
  { name: 'Australia/Sydney', city: 'Sydney' },
  { name: 'Pacific/Auckland', city: 'Auckland' },
];

export default function TimezoneModal({
  onClose,
  showGoals,
  showNotepad,
  showPriority,
  showOilPrices,
  panelOrder = ['notes', 'goals', 'priority', 'mgo', 'timezones'],
  notepadExpanded = true,
  goalsExpanded = true,
  priorityExpanded = true,
  oilPricesExpanded = true,
  panelSpacing = 2,
  isOpen,
  expanded = true,
  onExpandedChange
}: TimezoneModalProps) {
  const [timezones, setTimezones] = useState<Timezone[]>([]);
  const isExpanded = expanded;

  useEffect(() => {
    if (!isOpen) return;

    const updateTimezones = () => {
      const now = new Date();

      const londonFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/London',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      });

      const londonTimeStr = londonFormatter.format(now);
      const [londonHour, londonMinute] = londonTimeStr.split(':').map(Number);
      const londonTotalMinutes = londonHour * 60 + londonMinute;

      const updatedTimezones = majorTimezones.map(tz => {
        try {
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: tz.name,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          });

          const dateFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: tz.name,
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });

          const hourFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: tz.name,
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
          });

          const time = formatter.format(now);
          const date = dateFormatter.format(now);

          const tzTimeStr = hourFormatter.format(now);
          const [tzHour, tzMinute] = tzTimeStr.split(':').map(Number);
          const tzTotalMinutes = tzHour * 60 + tzMinute;

          let diffMinutes = tzTotalMinutes - londonTotalMinutes;

          if (diffMinutes > 720) diffMinutes -= 1440;
          if (diffMinutes < -720) diffMinutes += 1440;

          const diffHours = Math.floor(Math.abs(diffMinutes) / 60);
          const diffMins = Math.abs(diffMinutes) % 60;

          let offsetStr;
          if (tz.isLondon) {
            offsetStr = 'London Time';
          } else if (diffMinutes === 0) {
            offsetStr = 'Same as London';
          } else {
            const sign = diffMinutes >= 0 ? '+' : '-';
            if (diffMins === 0) {
              offsetStr = `${sign}${diffHours}h`;
            } else {
              offsetStr = `${sign}${diffHours}h ${diffMins}m`;
            }
          }

          return {
            name: tz.name,
            city: tz.city,
            offset: offsetStr,
            time,
            date,
            isDST: false,
            isLondon: tz.isLondon,
          };
        } catch (error) {
          console.error(`Error formatting timezone ${tz.name}:`, error);
          return {
            name: tz.name,
            city: tz.city,
            offset: 'N/A',
            time: '--:--:--',
            date: '--',
            isDST: false,
            isLondon: tz.isLondon,
          };
        }
      });

      setTimezones(updatedTimezones);
    };

    updateTimezones();
    const interval = setInterval(updateTimezones, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const calculatePosition = () => {
    const visiblePanels = [];
    const order = panelOrder || ['notes', 'goals', 'priority', 'mgo', 'timezones'];

    if (showNotepad && order.includes('notes')) visiblePanels.push('notes');
    if (showGoals && order.includes('goals')) visiblePanels.push('goals');
    if (showPriority && order.includes('priority')) visiblePanels.push('priority');
    if (showOilPrices && order.includes('mgo')) visiblePanels.push('mgo');

    const sortedPanels = visiblePanels.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    const position = sortedPanels.length;

    return `${position * (384 + (panelSpacing * 4))}px`;
  };

  const currentHour = new Date().getHours();
  const isNightMode = currentHour >= 18 || currentHour < 6;

  return (
    <div
      className="fixed top-4 z-40 transition-all duration-300 ease-in-out"
      style={{
        right: calculatePosition(),
      }}
    >
      <div className={`w-96 ${isNightMode ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-blue-600 to-blue-700'} rounded-xl shadow-2xl overflow-hidden`}>
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-white" />
            <h3 className="text-lg font-semibold text-white">World Timezones</h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onExpandedChange?.(!isExpanded)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="space-y-3">
              {timezones.map((timezone) => (
                <div
                  key={timezone.name}
                  className={`backdrop-blur-sm rounded-lg p-3 transition-colors ${
                    timezone.isLondon
                      ? 'bg-yellow-500/30 border-2 border-yellow-400/50 hover:bg-yellow-500/40'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className={`w-4 h-4 ${timezone.isLondon ? 'text-yellow-300' : 'text-white/80'}`} />
                      <div>
                        <div className={`font-semibold ${timezone.isLondon ? 'text-yellow-100' : 'text-white'}`}>
                          {timezone.city}
                        </div>
                        <div className={`text-xs ${timezone.isLondon ? 'text-yellow-200/80' : 'text-white/60'}`}>
                          {timezone.offset}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono text-lg font-semibold ${timezone.isLondon ? 'text-yellow-100' : 'text-white'}`}>
                        {timezone.time}
                      </div>
                      <div className={`text-xs ${timezone.isLondon ? 'text-yellow-200/80' : 'text-white/70'}`}>
                        {timezone.date}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isExpanded && (
          <div className="p-4">
            <div className="text-center text-white/80 text-sm">
              Click to expand
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
