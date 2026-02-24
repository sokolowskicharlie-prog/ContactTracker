import { X, Clock, ChevronDown, ChevronUp, Globe, Eye, EyeOff, Edit2, Check, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

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

interface TimezoneSettings {
  [key: string]: {
    visible: boolean;
    customName?: string;
  };
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
  const [timezoneSettings, setTimezoneSettings] = useState<TimezoneSettings>({});
  const [editMode, setEditMode] = useState(false);
  const [editingTimezone, setEditingTimezone] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const { user } = useAuth();
  const isExpanded = expanded;

  useEffect(() => {
    if (!user) return;

    const loadTimezoneSettings = async () => {
      const { data } = await supabase
        .from('user_preferences')
        .select('timezone_settings')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.timezone_settings) {
        setTimezoneSettings(data.timezone_settings);
      }
    };

    loadTimezoneSettings();
  }, [user]);

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

  const toggleTimezoneVisibility = async (timezoneName: string) => {
    if (!user) return;

    const currentVisible = timezoneSettings[timezoneName]?.visible ?? true;
    const newSettings = {
      ...timezoneSettings,
      [timezoneName]: {
        ...timezoneSettings[timezoneName],
        visible: !currentVisible,
      },
    };

    setTimezoneSettings(newSettings);

    await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        timezone_settings: newSettings,
      }, {
        onConflict: 'user_id',
      });
  };

  const startEditingTimezone = (timezoneName: string, currentName: string) => {
    setEditingTimezone(timezoneName);
    setEditValue(timezoneSettings[timezoneName]?.customName || currentName);
  };

  const saveTimezoneName = async (timezoneName: string) => {
    if (!user) return;

    const newSettings = {
      ...timezoneSettings,
      [timezoneName]: {
        ...timezoneSettings[timezoneName],
        visible: timezoneSettings[timezoneName]?.visible ?? true,
        customName: editValue.trim() || undefined,
      },
    };

    setTimezoneSettings(newSettings);
    setEditingTimezone(null);

    await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        timezone_settings: newSettings,
      }, {
        onConflict: 'user_id',
      });
  };

  const getDisplayName = (timezone: Timezone) => {
    return timezoneSettings[timezone.name]?.customName || timezone.city;
  };

  const isTimezoneVisible = (timezoneName: string) => {
    return timezoneSettings[timezoneName]?.visible ?? true;
  };

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
              onClick={() => setEditMode(!editMode)}
              className={`p-1 rounded transition-colors ${editMode ? 'bg-white/30' : 'hover:bg-white/20'}`}
              title="Customize timezones"
            >
              <Settings className="w-4 h-4 text-white" />
            </button>
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
            {editMode && (
              <div className="mb-3 text-xs text-white/70 bg-white/10 rounded-lg p-2">
                Click the eye icon to hide/show timezones. Click the pencil icon to rename them.
              </div>
            )}
            <div className="space-y-3">
              {timezones.map((timezone) => {
                const isVisible = isTimezoneVisible(timezone.name);
                const displayName = getDisplayName(timezone);
                const isEditing = editingTimezone === timezone.name;

                return (
                  <div
                    key={timezone.name}
                    className={`backdrop-blur-sm rounded-lg p-3 transition-all ${
                      !isVisible
                        ? 'opacity-40'
                        : timezone.isLondon
                        ? 'bg-yellow-500/30 border-2 border-yellow-400/50 hover:bg-yellow-500/40'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <Clock className={`w-4 h-4 flex-shrink-0 ${timezone.isLondon ? 'text-yellow-300' : 'text-white/80'}`} />
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveTimezoneName(timezone.name);
                                  if (e.key === 'Escape') setEditingTimezone(null);
                                }}
                                className="bg-white/20 text-white px-2 py-1 rounded text-sm w-full"
                                autoFocus
                              />
                              <button
                                onClick={() => saveTimezoneName(timezone.name)}
                                className="p-1 hover:bg-white/20 rounded transition-colors flex-shrink-0"
                              >
                                <Check className="w-3 h-3 text-white" />
                              </button>
                            </div>
                          ) : (
                            <div className={`font-semibold truncate ${timezone.isLondon ? 'text-yellow-100' : 'text-white'}`}>
                              {displayName}
                            </div>
                          )}
                          <div className={`text-xs ${timezone.isLondon ? 'text-yellow-200/80' : 'text-white/60'}`}>
                            {timezone.offset}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {editMode && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEditingTimezone(timezone.name, timezone.city)}
                              className="p-1 hover:bg-white/20 rounded transition-colors"
                              title="Rename"
                            >
                              <Edit2 className="w-3 h-3 text-white/80" />
                            </button>
                            <button
                              onClick={() => toggleTimezoneVisibility(timezone.name)}
                              className="p-1 hover:bg-white/20 rounded transition-colors"
                              title={isVisible ? 'Hide' : 'Show'}
                            >
                              {isVisible ? (
                                <Eye className="w-3 h-3 text-white/80" />
                              ) : (
                                <EyeOff className="w-3 h-3 text-white/80" />
                              )}
                            </button>
                          </div>
                        )}
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
                  </div>
                );
              })}
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
