import { useState } from 'react';
import { ChevronLeft, ChevronRight, Phone, Mail, Target, CheckSquare, Circle, CheckCircle2, X } from 'lucide-react';
import { TaskWithRelated } from '../lib/supabase';

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

interface CalendarViewProps {
  tasks: TaskWithRelated[];
  goals: DailyGoal[];
  communications: Communication[];
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

export default function CalendarView({ tasks, goals, communications, onTaskClick, onDateClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);

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

  const getCommCounts = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const calls = communications.filter(c => c.type === 'call' && c.date.startsWith(dateStr)).length;
    const emails = communications.filter(c => c.type === 'email' && c.date.startsWith(dateStr)).length;
    return { calls, emails };
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setShowDayModal(true);
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

      <div className="mb-4 flex gap-4 text-xs flex-wrap">
        <div className="flex items-center gap-1.5">
          <Circle className="w-3 h-3 text-blue-600" />
          <span className="text-gray-600">Task</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Target className="w-3 h-3 text-purple-600" />
          <span className="text-gray-600">Goal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Phone className="w-3 h-3 text-teal-600" />
          <span className="text-gray-600">Call</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Mail className="w-3 h-3 text-orange-600" />
          <span className="text-gray-600">Email</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-semibold text-gray-700 text-sm py-2">
            {day}
          </div>
        ))}

        {Array.from({ length: firstDay }).map((_, index) => (
          <div key={`empty-${index}`} className="bg-gray-50 rounded-lg min-h-[100px] p-1" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const events = getEventsForDate(date);
          const today = isToday(date);
          const { calls, emails } = getCommCounts(date);

          return (
            <div
              key={day}
              onClick={() => handleDayClick(date)}
              className={`border rounded-lg min-h-[100px] p-1 transition-colors cursor-pointer ${
                today ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className={`text-sm font-semibold ${today ? 'text-blue-700' : 'text-gray-700'}`}>
                  {day}
                </div>
                <div className="flex gap-1">
                  {calls > 0 && (
                    <div className="flex items-center gap-0.5 bg-teal-100 text-teal-700 text-xs px-1 rounded" title={`${calls} call${calls > 1 ? 's' : ''}`}>
                      <Phone className="w-2.5 h-2.5" />
                      <span className="font-medium">{calls}</span>
                    </div>
                  )}
                  {emails > 0 && (
                    <div className="flex items-center gap-0.5 bg-orange-100 text-orange-700 text-xs px-1 rounded" title={`${emails} email${emails > 1 ? 's' : ''}`}>
                      <Mail className="w-2.5 h-2.5" />
                      <span className="font-medium">{emails}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-0.5 overflow-y-auto max-h-[60px]">
                {events.slice(0, 2).map(renderEvent)}
                {events.length > 2 && (
                  <div className="text-xs text-gray-500 font-medium px-1">
                    +{events.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showDayModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h2>
                {isToday(selectedDate) && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    Today
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowDayModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {(() => {
                const events = getEventsForDate(selectedDate);
                const dayTasks = events.filter(e => e.type === 'task');
                const dayGoals = events.filter(e => e.type === 'goal');
                const dayCalls = events.filter(e => e.type === 'call');
                const dayEmails = events.filter(e => e.type === 'email');
                const hasAnyEvents = events.length > 0;

                return (
                  <>
                    {!hasAnyEvents && (
                      <div className="text-center py-12 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
                        <p className="text-lg">No events scheduled for this day</p>
                      </div>
                    )}

                    {dayGoals.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Target className="w-5 h-5 text-purple-600" />
                          Goals ({dayGoals.length})
                        </h3>
                        <div className="space-y-2">
                          {dayGoals.map(event => (
                            <div
                              key={event.id}
                              className={`p-3 rounded-lg border ${
                                event.completed
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-purple-50 border-purple-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`font-medium ${
                                  event.completed ? 'text-green-900' : 'text-purple-900'
                                }`}>
                                  {event.title}
                                </span>
                                {event.completed && (
                                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                                )}
                              </div>
                              {event.time && (
                                <p className="text-sm text-gray-600 mt-1">Time: {event.time}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {dayTasks.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                          Tasks ({dayTasks.length})
                        </h3>
                        <div className="space-y-2">
                          {dayTasks.map(event => (
                            <div
                              key={event.id}
                              onClick={() => {
                                if (onTaskClick) {
                                  onTaskClick(event.data);
                                  setShowDayModal(false);
                                }
                              }}
                              className={`p-3 rounded-lg border ${
                                event.completed
                                  ? 'bg-gray-50 border-gray-200'
                                  : 'bg-blue-50 border-blue-200'
                              } ${onTaskClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                            >
                              <div className="flex items-start gap-2">
                                {event.completed ? (
                                  <CheckCircle2 className="w-5 h-5 text-gray-600 mt-0.5" />
                                ) : (
                                  <Circle className="w-5 h-5 text-blue-600 mt-0.5" />
                                )}
                                <div className="flex-1">
                                  <p className={`font-medium ${
                                    event.completed ? 'text-gray-600 line-through' : 'text-blue-900'
                                  }`}>
                                    {event.title}
                                  </p>
                                  {event.data.description && (
                                    <p className="text-sm text-gray-600 mt-1">{event.data.description}</p>
                                  )}
                                  {event.data.related_contact_name && (
                                    <p className="text-sm text-gray-500 mt-1">
                                      Contact: {event.data.related_contact_name}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {dayCalls.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Phone className="w-5 h-5 text-teal-600" />
                          Calls ({dayCalls.length})
                        </h3>
                        <div className="space-y-2">
                          {dayCalls.map(event => (
                            <div
                              key={event.id}
                              className="p-3 rounded-lg border bg-teal-50 border-teal-200"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Phone className="w-4 h-4 text-teal-600" />
                                <span className="font-medium text-teal-900">{event.title}</span>
                              </div>
                              {event.data.notes && (
                                <p className="text-sm text-gray-600 mt-2">{event.data.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {dayEmails.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Mail className="w-5 h-5 text-orange-600" />
                          Emails ({dayEmails.length})
                        </h3>
                        <div className="space-y-2">
                          {dayEmails.map(event => (
                            <div
                              key={event.id}
                              className="p-3 rounded-lg border bg-orange-50 border-orange-200"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Mail className="w-4 h-4 text-orange-600" />
                                <span className="font-medium text-orange-900">{event.title}</span>
                              </div>
                              {event.data.notes && (
                                <p className="text-sm text-gray-600 mt-2">{event.data.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
              {onDateClick && (
                <button
                  onClick={() => {
                    onDateClick(selectedDate);
                    setShowDayModal(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Task for This Day
                </button>
              )}
              <button
                onClick={() => setShowDayModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
