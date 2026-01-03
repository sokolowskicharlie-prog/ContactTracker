import { X, CheckCircle2, Circle, Clock, Plus, Phone, Mail, Fuel } from 'lucide-react';
import { TaskWithRelated, Call, Email, FuelDeal } from '../lib/supabase';

interface DayScheduleModalProps {
  date: Date;
  tasks: TaskWithRelated[];
  calls: (Call & { contact_name: string })[];
  emails: (Email & { contact_name: string })[];
  fuelDeals: FuelDeal[];
  onClose: () => void;
  onTaskClick: (task: TaskWithRelated) => void;
  onCreateTask: () => void;
  onToggleTask: (taskId: string, completed: boolean) => void;
}

export default function DayScheduleModal({ date, tasks, calls, emails, fuelDeals, onClose, onTaskClick, onCreateTask, onToggleTask }: DayScheduleModalProps) {
  const dateStr = date.toISOString().split('T')[0];
  const dayTasks = tasks.filter(task => task.due_date && task.due_date.startsWith(dateStr));
  const dueTasks = dayTasks.filter(task => !task.completed);
  const completedTasks = dayTasks.filter(task => task.completed);
  const dayCalls = calls.filter(call => call.call_date.startsWith(dateStr));
  const dayEmails = emails.filter(email => email.email_date.startsWith(dateStr));
  const dayDeals = fuelDeals.filter(deal => deal.deal_date.startsWith(dateStr));

  const sortedDueTasks = [...dueTasks].sort((a, b) => {
    const timeA = a.due_date ? new Date(a.due_date).getTime() : 0;
    const timeB = b.due_date ? new Date(b.due_date).getTime() : 0;
    return timeA - timeB;
  });

  const sortedCompletedTasks = [...completedTasks].sort((a, b) => {
    const timeA = a.due_date ? new Date(a.due_date).getTime() : 0;
    const timeB = b.due_date ? new Date(b.due_date).getTime() : 0;
    return timeA - timeB;
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const totalActivities = dueTasks.length + completedTasks.length + dayCalls.length + dayEmails.length + dayDeals.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{formatDate(date)}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {totalActivities} {totalActivities === 1 ? 'activity' : 'activities'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {totalActivities === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No activities for this day</p>
              <button
                onClick={() => {
                  onCreateTask();
                  onClose();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDueTasks.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Circle className="w-5 h-5 text-blue-600" />
                    Tasks Due ({sortedDueTasks.length})
                  </h3>
                  <div className="space-y-2">
                    {sortedDueTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3 rounded-lg border bg-white hover:border-blue-300 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleTask(task.id, true);
                            }}
                            className="flex-shrink-0 mt-0.5 hover:scale-110 transition-transform"
                          >
                            <Circle className="w-5 h-5 text-gray-400 hover:text-green-600" />
                          </button>
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => {
                              onTaskClick(task);
                              onClose();
                            }}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {task.due_date && (
                                <span className="text-xs text-gray-600">{formatTime(task.due_date)}</span>
                              )}
                              {task.priority && (
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </span>
                              )}
                            </div>
                            <h4 className="font-medium text-gray-900">{task.title}</h4>
                            {task.contact && (
                              <p className="text-sm text-gray-600 mt-1">Related: {task.contact.name}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sortedCompletedTasks.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    Tasks Completed ({sortedCompletedTasks.length})
                  </h3>
                  <div className="space-y-2">
                    {sortedCompletedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3 rounded-lg border bg-gray-50 hover:border-green-300 transition-all opacity-75"
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleTask(task.id, false);
                            }}
                            className="flex-shrink-0 mt-0.5 hover:scale-110 transition-transform"
                          >
                            <CheckCircle2 className="w-5 h-5 text-green-600 hover:text-gray-400" />
                          </button>
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => {
                              onTaskClick(task);
                              onClose();
                            }}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {task.due_date && (
                                <span className="text-xs text-gray-600">{formatTime(task.due_date)}</span>
                              )}
                            </div>
                            <h4 className="font-medium text-gray-600 line-through">{task.title}</h4>
                            {task.contact && (
                              <p className="text-sm text-gray-500 mt-1">Related: {task.contact.name}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dayCalls.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-blue-600" />
                    Calls Logged ({dayCalls.length})
                  </h3>
                  <div className="space-y-2">
                    {dayCalls.map((call) => (
                      <div key={call.id} className="p-3 rounded-lg border bg-blue-50">
                        <div className="flex items-start gap-3">
                          <Phone className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-600">{formatTime(call.call_date)}</span>
                              {call.communication_type && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                  {call.communication_type}
                                </span>
                              )}
                            </div>
                            <h4 className="font-medium text-gray-900">{call.contact_name}</h4>
                            {call.spoke_with && (
                              <p className="text-sm text-gray-600 mt-1">Spoke with: {call.spoke_with}</p>
                            )}
                            {call.notes && (
                              <p className="text-sm text-gray-700 mt-1">{call.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dayEmails.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-purple-600" />
                    Emails Logged ({dayEmails.length})
                  </h3>
                  <div className="space-y-2">
                    {dayEmails.map((email) => (
                      <div key={email.id} className="p-3 rounded-lg border bg-purple-50">
                        <div className="flex items-start gap-3">
                          <Mail className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-600">{formatTime(email.email_date)}</span>
                            </div>
                            <h4 className="font-medium text-gray-900">{email.contact_name}</h4>
                            {email.subject && (
                              <p className="text-sm text-gray-700 mt-1 font-medium">Subject: {email.subject}</p>
                            )}
                            {email.emailed_to && (
                              <p className="text-sm text-gray-600 mt-1">To: {email.emailed_to}</p>
                            )}
                            {email.notes && (
                              <p className="text-sm text-gray-700 mt-1">{email.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dayDeals.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Fuel className="w-5 h-5 text-orange-600" />
                    Deals Logged ({dayDeals.length})
                  </h3>
                  <div className="space-y-2">
                    {dayDeals.map((deal) => (
                      <div key={deal.id} className="p-3 rounded-lg border bg-orange-50">
                        <div className="flex items-start gap-3">
                          <Fuel className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-600">{formatTime(deal.deal_date)}</span>
                            </div>
                            <h4 className="font-medium text-gray-900">{deal.vessel_name}</h4>
                            <p className="text-sm text-gray-700 mt-1">
                              {deal.fuel_quantity} MT of {deal.fuel_type} at {deal.port}
                            </p>
                            {deal.notes && (
                              <p className="text-sm text-gray-600 mt-1">{deal.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={() => {
              onCreateTask();
              onClose();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Task for This Day
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
