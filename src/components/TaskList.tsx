import { CheckCircle2, Circle, Trash2, Edit2, Phone, Mail, MessageSquare, MoreHorizontal, Calendar, AlertCircle } from 'lucide-react';
import { TaskWithRelated } from '../lib/supabase';

interface TaskListProps {
  tasks: TaskWithRelated[];
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: TaskWithRelated) => void;
}

function TaskList({ tasks, onToggleComplete, onDeleteTask, onEditTask }: TaskListProps) {
  const getTaskTypeIcon = (taskType: string) => {
    switch (taskType) {
      case 'call_back':
        return <Phone className="w-4 h-4" />;
      case 'email_back':
        return <Mail className="w-4 h-4" />;
      case 'text_back':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <MoreHorizontal className="w-4 h-4" />;
    }
  };

  const getTaskTypeLabel = (taskType: string) => {
    switch (taskType) {
      case 'call_back':
        return 'Call Back';
      case 'email_back':
        return 'Email Back';
      case 'text_back':
        return 'Text Back';
      default:
        return 'Other';
    }
  };

  const getContactStatus = (contact?: TaskWithRelated['contact']) => {
    if (!contact) return null;

    if (contact.is_client) {
      return { label: 'Client', color: 'bg-green-50 text-green-700 border-green-200' };
    }
    if (contact.has_traction) {
      return { label: 'Traction', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
    }
    if (contact.is_jammed) {
      return { label: 'Jammed', color: 'bg-red-50 text-red-700 border-red-200' };
    }
    return { label: 'None', color: 'bg-gray-50 text-gray-700 border-gray-200' };
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const hasTime = hours !== 0 || minutes !== 0;

    if (hasTime) {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <CheckCircle2 className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
        <p className="text-gray-600">Add your first task to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`bg-white rounded-lg shadow-sm border transition-all hover:shadow-md ${
            task.completed
              ? 'border-gray-200 opacity-60'
              : task.is_overdue
              ? 'border-red-300'
              : 'border-gray-200'
          }`}
        >
          <div className="p-4">
            <div className="flex items-start gap-3">
              <button
                onClick={() => onToggleComplete(task.id, !task.completed)}
                className="mt-1 flex-shrink-0"
              >
                {task.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400 hover:text-blue-600" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                        {getTaskTypeIcon(task.task_type)}
                        {getTaskTypeLabel(task.task_type)}
                      </div>
                      {task.contact && getContactStatus(task.contact) && (
                        <div className={`px-2 py-0.5 rounded text-xs font-medium border ${getContactStatus(task.contact)!.color}`}>
                          {getContactStatus(task.contact)!.label}
                        </div>
                      )}
                      {task.is_overdue && !task.completed && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-medium">
                          <AlertCircle className="w-3 h-3" />
                          Overdue
                        </div>
                      )}
                    </div>

                    <h3 className={`font-medium text-gray-900 mb-1 ${task.completed ? 'line-through' : ''}`}>
                      {task.title}
                    </h3>

                    <div className="text-sm text-gray-600 mb-2">
                      {task.contact && (
                        <span>
                          Contact: <span className="font-medium">{task.contact.name}</span>
                          {task.contact.company && <span className="text-gray-500"> - {task.contact.company}</span>}
                        </span>
                      )}
                      {task.supplier && (
                        <span>
                          Supplier: <span className="font-medium">{task.supplier.company_name}</span>
                        </span>
                      )}
                    </div>

                    {task.notes && (
                      <p className="text-sm text-gray-600 mb-2">{task.notes}</p>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(task.due_date)}</span>
                      {task.days_until_due !== undefined && !task.completed && (
                        <span className={task.is_overdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          {task.is_overdue
                            ? `${Math.abs(task.days_until_due)} days overdue`
                            : `${task.days_until_due} days left`}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => onEditTask(task)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                      title="Edit task"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this task?')) {
                          onDeleteTask(task.id);
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TaskList;
