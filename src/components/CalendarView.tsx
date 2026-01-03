import { useState } from 'react';
import { ChevronLeft, ChevronRight, Phone, Mail, Target, CheckSquare, Circle, CheckCircle2, Fuel } from 'lucide-react';
import { TaskWithRelated, FuelDeal } from '../lib/supabase';

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
  deals: FuelDeal[];
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

export default function CalendarView({ tasks, goals, communications, deals, onTaskClick, onDateClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

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

  const getEventCounts = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];

    const tasksDueCount = tasks.filter(task => task.due_date && task.due_date.startsWith(dateStr)).length;
    const tasksCompletedCount = tasks.filter(task => task.due_date && task.due_date.startsWith(dateStr) && task.completed).length;
    const goalsCount = goals.filter(goal => goal.target_date && goal.target_date.startsWith(dateStr)).length;
    const callsCount = communications.filter(comm => comm.type === 'call' && comm.date && comm.date.startsWith(dateStr)).length;
    const emailsCount = communications.filter(comm => comm.type === 'email' && comm.date && comm.date.startsWith(dateStr)).length;
    const dealsCount = deals.filter(deal => deal.deal_date && deal.deal_date.startsWith(dateStr)).length;

    return {
      tasksDue: tasksDueCount,
      tasksCompleted: tasksCompletedCount,
      goals: goalsCount,
      calls: callsCount,
      emails: emailsCount,
      deals: dealsCount,
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

      <div className="mb-4 flex gap-4 text-xs flex-wrap">
        <div className="flex items-center gap-1.5">
          <Circle className="w-3 h-3 text-blue-600" />
          <span className="text-gray-600">Tasks Due</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3 text-green-600" />
          <span className="text-gray-600">Tasks Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Target className="w-3 h-3 text-purple-600" />
          <span className="text-gray-600">Goals</span>
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
          <Fuel className="w-3 h-3 text-amber-600" />
          <span className="text-gray-600">Deals Logged</span>
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
          const counts = getEventCounts(date);
          const today = isToday(date);

          return (
            <div
              key={day}
              onClick={() => onDateClick?.(date)}
              className={`border rounded-lg min-h-[100px] p-1.5 transition-colors ${
                today ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              } ${onDateClick ? 'cursor-pointer' : ''}`}
            >
              <div className={`text-sm font-semibold mb-2 ${today ? 'text-blue-700' : 'text-gray-700'}`}>
                {day}
              </div>
              <div className="space-y-1">
                {counts.tasksDue > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <Circle className="w-3 h-3 text-blue-600 flex-shrink-0" />
                    <span className="text-blue-700 font-semibold">{counts.tasksDue}</span>
                  </div>
                )}
                {counts.tasksCompleted > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                    <span className="text-green-700 font-semibold">{counts.tasksCompleted}</span>
                  </div>
                )}
                {counts.goals > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <Target className="w-3 h-3 text-purple-600 flex-shrink-0" />
                    <span className="text-purple-700 font-semibold">{counts.goals}</span>
                  </div>
                )}
                {counts.calls > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <Phone className="w-3 h-3 text-teal-600 flex-shrink-0" />
                    <span className="text-teal-700 font-semibold">{counts.calls}</span>
                  </div>
                )}
                {counts.emails > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <Mail className="w-3 h-3 text-orange-600 flex-shrink-0" />
                    <span className="text-orange-700 font-semibold">{counts.emails}</span>
                  </div>
                )}
                {counts.deals > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <Fuel className="w-3 h-3 text-amber-600 flex-shrink-0" />
                    <span className="text-amber-700 font-semibold">{counts.deals}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
