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
}

const majorTimezones = [
  { name: 'Pacific/Honolulu', city: 'Honolulu', utcOffset: -10 },
  { name: 'America/Anchorage', city: 'Anchorage', utcOffset: -9 },
  { name: 'America/Los_Angeles', city: 'Los Angeles', utcOffset: -8 },
  { name: 'America/Denver', city: 'Denver', utcOffset: -7 },
  { name: 'America/Chicago', city: 'Chicago', utcOffset: -6 },
  { name: 'America/New_York', city: 'New York', utcOffset: -5 },
  { name: 'America/Caracas', city: 'Caracas', utcOffset: -4 },
  { name: 'America/St_Johns', city: 'St. Johns', utcOffset: -3.5 },
  { name: 'America/Sao_Paulo', city: 'São Paulo', utcOffset: -3 },
  { name: 'Atlantic/Azores', city: 'Azores', utcOffset: -1 },
  { name: 'Europe/London', city: 'London', utcOffset: 0 },
  { name: 'Europe/Paris', city: 'Paris', utcOffset: 1 },
  { name: 'Europe/Athens', city: 'Athens', utcOffset: 2 },
  { name: 'Europe/Moscow', city: 'Moscow', utcOffset: 3 },
  { name: 'Asia/Dubai', city: 'Dubai', utcOffset: 4 },
  { name: 'Asia/Karachi', city: 'Karachi', utcOffset: 5 },
  { name: 'Asia/Dhaka', city: 'Dhaka', utcOffset: 6 },
  { name: 'Asia/Bangkok', city: 'Bangkok', utcOffset: 7 },
  { name: 'Asia/Shanghai', city: 'Shanghai', utcOffset: 8 },
  { name: 'Asia/Tokyo', city: 'Tokyo', utcOffset: 9 },
  { name: 'Australia/Sydney', city: 'Sydney', utcOffset: 10 },
  { name: 'Pacific/Auckland', city: 'Auckland', utcOffset: 12 },
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

          const time = formatter.format(now);
          const date = dateFormatter.format(now);

          const offset = tz.utcOffset;
          const offsetStr = offset >= 0
            ? `UTC+${offset}`
            : `UTC${offset}`;

          return {
            name: tz.name,
            city: tz.city,
            offset: offsetStr,
            time,
            date,
            isDST: false,
          };
        } catch (error) {
          console.error(`Error formatting timezone ${tz.name}:`, error);
          return {
            name: tz.name,
            city: tz.city,
            offset: `UTC${tz.utcOffset >= 0 ? '+' : ''}${tz.utcOffset}`,
            time: '--:--:--',
            date: '--',
            isDST: false,
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
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-3 hover:bg-white/20 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-white/80" />
                      <div>
                        <div className="text-white font-semibold">{timezone.city}</div>
                        <div className="text-white/60 text-xs">{timezone.offset}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-mono text-lg font-semibold">
                        {timezone.time}
                      </div>
                      <div className="text-white/70 text-xs">
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
