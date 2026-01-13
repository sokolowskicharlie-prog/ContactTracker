import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Phone, Mail, CheckSquare, Circle, CheckCircle2, DollarSign, Calendar as CalendarIcon, Plus, X, Clock } from 'lucide-react';
import { TaskWithRelated, Holiday, Meeting, supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

interface DailyGoal {
  id: string;
  goal_type: 'calls' | 'emails' | 'deals';
  target_amount: number;
  target_date?: string;
  target_time?: string;
  is_completed?: boolean;
}

interface Communication {
  id: string;
  contact_id: string;
  type: 'call' | 'email';
  date: string;
  contact_name?: string;
  notes?: string;
}

interface FuelDeal {
  id: string;
  contact_id: string;
  created_at: string;
}

interface CalendarViewProps {
  tasks: TaskWithRelated[];
  goals: DailyGoal[];
  communications: Communication[];
  fuelDeals?: FuelDeal[];
  onTaskClick?: (task: TaskWithRelated) => void;
  onDateClick?: (date: Date) => void;
}

interface CalendarEvent {
  id: string;
  type: 'task' | 'goal' | 'call' | 'email';
  title: string;
  time?: string;
  completed?: boolean;
  data: any;
}

export default function CalendarView({ tasks, goals, communications, fuelDeals = [], onTaskClick, onDateClick }: CalendarViewProps) {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showAddHolidayModal, setShowAddHolidayModal] = useState(false);
  const [showAddMeetingModal, setShowAddMeetingModal] = useState(false);
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayEndDate, setNewHolidayEndDate] = useState('');
  const [newHolidayDescription, setNewHolidayDescription] = useState('');
  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [newMeetingDate, setNewMeetingDate] = useState('');
  const [newMeetingStartTime, setNewMeetingStartTime] = useState('');
  const [newMeetingEndTime, setNewMeetingEndTime] = useState('');
  const [newMeetingLocation, setNewMeetingLocation] = useState('');
  const [newMeetingDescription, setNewMeetingDescription] = useState('');

  useEffect(() => {
    if (user) {
      loadHolidays();
      loadMeetings();
    }
  }, [user, currentDate]);

  const loadHolidays = async () => {
    if (!user) return;

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .or(`date.gte.${startOfMonth.toISOString().split('T')[0]},end_date.gte.${startOfMonth.toISOString().split('T')[0]}`)
      .or(`date.lte.${endOfMonth.toISOString().split('T')[0]},end_date.lte.${endOfMonth.toISOString().split('T')[0]}`)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error loading holidays:', error);
    } else {
      setHolidays(data || []);
    }
  };

  const loadMeetings = async () => {
    if (!user) return;

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .gte('date', startOfMonth.toISOString().split('T')[0])
      .lte('date', endOfMonth.toISOString().split('T')[0])
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error loading meetings:', error);
    } else {
      setMeetings(data || []);
    }
  };

  const handleAddHoliday = async () => {
    if (!user || !newHolidayName || !newHolidayDate) return;

    const { error } = await supabase
      .from('holidays')
      .insert({
        user_id: user.id,
        name: newHolidayName,
        date: newHolidayDate,
        end_date: newHolidayEndDate || null,
        is_public: false,
        description: newHolidayDescription || null
      });

    if (error) {
      console.error('Error adding holiday:', error);
      alert('Failed to add holiday. Please try again.');
    } else {
      setShowAddHolidayModal(false);
      setNewHolidayName('');
      setNewHolidayDate('');
      setNewHolidayEndDate('');
      setNewHolidayDescription('');
      loadHolidays();
    }
  };

  const handleAddMeeting = async () => {
    if (!user || !newMeetingTitle || !newMeetingDate || !newMeetingStartTime) return;

    const { error } = await supabase
      .from('meetings')
      .insert({
        user_id: user.id,
        title: newMeetingTitle,
        date: newMeetingDate,
        start_time: newMeetingStartTime,
        end_time: newMeetingEndTime || null,
        location: newMeetingLocation || null,
        description: newMeetingDescription || null
      });

    if (error) {
      console.error('Error adding meeting:', error);
      alert('Failed to add meeting. Please try again.');
    } else {
      setShowAddMeetingModal(false);
      setNewMeetingTitle('');
      setNewMeetingDate('');
      setNewMeetingStartTime('');
      setNewMeetingEndTime('');
      setNewMeetingLocation('');
      setNewMeetingDescription('');
      loadMeetings();
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!confirm('Are you sure you want to delete this meeting?')) return;

    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('id', meetingId);

    if (error) {
      console.error('Error deleting meeting:', error);
      alert('Failed to delete meeting. Please try again.');
    } else {
      loadMeetings();
    }
  };

  const handleDeleteHoliday = async (holidayId: string) => {
    if (!confirm('Are you sure you want to delete this holiday?')) return;

    const { error } = await supabase
      .from('holidays')
      .delete()
      .eq('id', holidayId);

    if (error) {
      console.error('Error deleting holiday:', error);
      alert('Failed to delete holiday. Please try again.');
    } else {
      loadHolidays();
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const dateStr = date.toISOString().split('T')[0];

    tasks.forEach(task => {
      if (task.due_date && task.due_date.startsWith(dateStr)) {
        events.push({
          id: task.id,
          type: 'task',
          title: task.title,
          completed: task.completed,
          data: task,
        });
      }
    });

    goals.forEach(goal => {
      if (goal.target_date && goal.target_date.startsWith(dateStr)) {
        const goalLabel = goal.goal_type === 'calls' ? 'Calls' : goal.goal_type === 'emails' ? 'Emails' : 'Deals';
        events.push({
          id: goal.id,
          type: 'goal',
          title: `${goalLabel}: ${goal.target_amount}`,
          time: goal.target_time,
          completed: goal.is_completed,
          data: goal,
        });
      }
    });

    communications.forEach(comm => {
      if (comm.date && comm.date.startsWith(dateStr)) {
        events.push({
          id: comm.id,
          type: comm.type,
          title: comm.contact_name || 'Unknown',
          data: comm,
        });
      }
    });

    return events;
  };

  const getTaskCountForDate = (date: Date): number => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(task => task.due_date && task.due_date.startsWith(dateStr)).length;
  };

  const isDateInRange = (dateStr: string, startDate: string, endDate?: string) => {
    if (!endDate) {
      return dateStr === startDate;
    }
    return dateStr >= startDate && dateStr <= endDate;
  };

  const getEventCounts = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];

    const tasksDueCount = tasks.filter(task => task.due_date && task.due_date.startsWith(dateStr) && !task.completed).length;
    const tasksCompletedCount = tasks.filter(task => task.due_date && task.due_date.startsWith(dateStr) && task.completed).length;
    const callsCount = communications.filter(comm => comm.type === 'call' && comm.date && comm.date.startsWith(dateStr)).length;
    const emailsCount = communications.filter(comm => comm.type === 'email' && comm.date && comm.date.startsWith(dateStr)).length;
    const dealsCount = fuelDeals.filter(deal => deal.created_at && deal.created_at.startsWith(dateStr)).length;
    const holidaysForDate = holidays.filter(holiday => isDateInRange(dateStr, holiday.date, holiday.end_date || undefined));
    const meetingsForDate = meetings.filter(meeting => meeting.date === dateStr);

    return {
      tasksDue: tasksDueCount,
      tasksCompleted: tasksCompletedCount,
      calls: callsCount,
      emails: emailsCount,
      deals: dealsCount,
      holidays: holidaysForDate,
      meetings: meetingsForDate,
    };
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const renderEvent = (event: CalendarEvent) => {
    const getEventStyle = () => {
      switch (event.type) {
        case 'task':
          return event.completed
            ? 'bg-gray-100 text-gray-600 border-gray-300'
            : 'bg-blue-50 text-blue-700 border-blue-200';
        case 'goal':
          return event.completed
            ? 'bg-green-100 text-green-700 border-green-300'
            : 'bg-purple-50 text-purple-700 border-purple-200';
        case 'call':
          return 'bg-teal-50 text-teal-700 border-teal-200';
        case 'email':
          return 'bg-orange-50 text-orange-700 border-orange-200';
        default:
          return 'bg-gray-50 text-gray-700 border-gray-200';
      }
    };

    const getEventIcon = () => {
      switch (event.type) {
        case 'task':
          return event.completed ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />;
        case 'goal':
          return <Target className="w-3 h-3" />;
        case 'call':
          return <Phone className="w-3 h-3" />;
        case 'email':
          return <Mail className="w-3 h-3" />;
        default:
          return <CheckSquare className="w-3 h-3" />;
      }
    };

    return (
      <div
        key={event.id}
        onClick={() => {
          if (event.type === 'task' && onTaskClick) {
            onTaskClick(event.data);
          }
        }}
        className={`text-xs px-1.5 py-0.5 rounded border mb-1 flex items-center gap-1 truncate ${getEventStyle()} ${
          event.type === 'task' && onTaskClick ? 'cursor-pointer hover:opacity-80' : ''
        } ${event.completed ? 'line-through opacity-60' : ''}`}
        title={event.title}
      >
        {getEventIcon()}
        <span className="truncate flex-1">{event.title}</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">{monthName}</h2>
        <div className="flex gap-2">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-4 text-xs flex-wrap items-center justify-between">
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Circle className="w-3 h-3 text-blue-600" />
            <span className="text-gray-600">Tasks Due</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-green-600" />
            <span className="text-gray-600">Tasks Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone className="w-3 h-3 text-teal-600" />
            <span className="text-gray-600">Calls Logged</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Mail className="w-3 h-3 text-orange-600" />
            <span className="text-gray-600">Emails Logged</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3 h-3 text-emerald-600" />
            <span className="text-gray-600">Deals Logged</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="w-3 h-3 text-rose-600" />
            <span className="text-gray-600">Holidays</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-violet-600" />
            <span className="text-gray-600">Meetings</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddHolidayModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Holiday
          </button>
          <button
            onClick={() => setShowAddMeetingModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Meeting
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-semibold text-gray-700 text-sm py-2">
            {day}
          </div>
        ))}

        {Array.from({ length: firstDay }).map((_, index) => (
          <div key={`empty-${index}`} className="bg-gray-50 rounded-lg min-h-[140px] p-1" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const counts = getEventCounts(date);
          const today = isToday(date);
          const dayOfWeek = date.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const hasHoliday = counts.holidays.length > 0;
          const isNonWorking = isWeekend || hasHoliday;

          return (
            <div
              key={day}
              onClick={() => onDateClick?.(date)}
              className={`border rounded-lg min-h-[140px] p-1.5 transition-colors ${
                today
                  ? 'border-blue-500 bg-blue-50'
                  : isNonWorking
                    ? 'border-gray-300 bg-gray-200 hover:border-gray-400 hover:bg-gray-300'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              } ${onDateClick ? 'cursor-pointer' : ''}`}
            >
              <div className={`text-sm font-semibold mb-2 ${today ? 'text-blue-700' : isNonWorking ? 'text-gray-600' : 'text-gray-700'}`}>
                {day}
              </div>
              <div className="space-y-1">
                {counts.tasksDue > 0 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <Circle className="w-3 h-3 text-blue-600 flex-shrink-0" />
                    <span className="text-blue-700 font-semibold">{counts.tasksDue}</span>
                  </div>
                )}
                {counts.tasksCompleted > 0 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                    <span className="text-green-700 font-semibold">{counts.tasksCompleted}</span>
                  </div>
                )}
                {counts.calls > 0 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <Phone className="w-3 h-3 text-teal-600 flex-shrink-0" />
                    <span className="text-teal-700 font-semibold">{counts.calls}</span>
                  </div>
                )}
                {counts.emails > 0 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <Mail className="w-3 h-3 text-orange-600 flex-shrink-0" />
                    <span className="text-orange-700 font-semibold">{counts.emails}</span>
                  </div>
                )}
                {counts.deals > 0 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <DollarSign className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                    <span className="text-emerald-700 font-semibold">{counts.deals}</span>
                  </div>
                )}
                {counts.holidays.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    {counts.holidays.map(holiday => (
                      <div key={holiday.id} className="flex items-start gap-1 mb-1 group">
                        <CalendarIcon className={`w-3 h-3 flex-shrink-0 mt-0.5 ${holiday.is_public ? 'text-rose-600' : 'text-pink-600'}`} />
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs truncate ${holiday.is_public ? 'text-rose-700 font-semibold' : 'text-pink-700'}`} title={holiday.name}>
                            {holiday.name}
                            {holiday.end_date && ` (${holiday.date} - ${holiday.end_date})`}
                          </div>
                          {!holiday.is_public && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteHoliday(holiday.id);
                              }}
                              className="text-[10px] text-red-600 hover:text-red-800 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {counts.meetings.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    {counts.meetings.map(meeting => (
                      <div key={meeting.id} className="flex items-start gap-1 mb-1 group">
                        <Clock className="w-3 h-3 flex-shrink-0 mt-0.5 text-violet-600" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs truncate text-violet-700 font-semibold" title={meeting.title}>
                            {meeting.start_time.substring(0, 5)} {meeting.title}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMeeting(meeting.id);
                            }}
                            className="text-[10px] text-red-600 hover:text-red-800 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showAddHolidayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Personal Holiday</h3>
              <button
                onClick={() => {
                  setShowAddHolidayModal(false);
                  setNewHolidayName('');
                  setNewHolidayDate('');
                  setNewHolidayEndDate('');
                  setNewHolidayDescription('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Holiday Name *
                </label>
                <input
                  type="text"
                  value={newHolidayName}
                  onChange={(e) => setNewHolidayName(e.target.value)}
                  placeholder="e.g., Birthday, Anniversary"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={newHolidayDate}
                    onChange={(e) => setNewHolidayDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={newHolidayEndDate}
                    onChange={(e) => setNewHolidayEndDate(e.target.value)}
                    min={newHolidayDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newHolidayDescription}
                  onChange={(e) => setNewHolidayDescription(e.target.value)}
                  placeholder="Additional details..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddHolidayModal(false);
                    setNewHolidayName('');
                    setNewHolidayDate('');
                    setNewHolidayEndDate('');
                    setNewHolidayDescription('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddHoliday}
                  disabled={!newHolidayName || !newHolidayDate}
                  className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Add Holiday
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddMeetingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Schedule Meeting</h3>
              <button
                onClick={() => {
                  setShowAddMeetingModal(false);
                  setNewMeetingTitle('');
                  setNewMeetingDate('');
                  setNewMeetingStartTime('');
                  setNewMeetingEndTime('');
                  setNewMeetingLocation('');
                  setNewMeetingDescription('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  value={newMeetingTitle}
                  onChange={(e) => setNewMeetingTitle(e.target.value)}
                  placeholder="e.g., Client Meeting, Team Standup"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={newMeetingDate}
                  onChange={(e) => setNewMeetingDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={newMeetingStartTime}
                    onChange={(e) => setNewMeetingStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={newMeetingEndTime}
                    onChange={(e) => setNewMeetingEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location/Link (Optional)
                </label>
                <input
                  type="text"
                  value={newMeetingLocation}
                  onChange={(e) => setNewMeetingLocation(e.target.value)}
                  placeholder="e.g., Conference Room A, Zoom Link"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newMeetingDescription}
                  onChange={(e) => setNewMeetingDescription(e.target.value)}
                  placeholder="Agenda, notes, or additional details..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddMeetingModal(false);
                    setNewMeetingTitle('');
                    setNewMeetingDate('');
                    setNewMeetingStartTime('');
                    setNewMeetingEndTime('');
                    setNewMeetingLocation('');
                    setNewMeetingDescription('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMeeting}
                  disabled={!newMeetingTitle || !newMeetingDate || !newMeetingStartTime}
                  className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Schedule Meeting
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
