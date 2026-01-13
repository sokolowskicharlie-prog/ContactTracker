import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Task, Contact, Supplier } from '../lib/supabase';

interface TaskModalProps {
  task?: Task;
  contacts: Contact[];
  suppliers: Supplier[];
  preselectedContactId?: string;
  preselectedSupplierId?: string;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => void;
}

function TaskModal({ task, contacts, suppliers, preselectedContactId, preselectedSupplierId, onClose, onSave }: TaskModalProps) {
  const [formData, setFormData] = useState({
    task_type: task?.task_type || 'call_back',
    title: task?.title || '',
    notes: task?.notes || '',
    due_date: task?.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
    contact_id: task?.contact_id || preselectedContactId || '',
    supplier_id: task?.supplier_id || preselectedSupplierId || '',
  });

  const [entityType, setEntityType] = useState<'contact' | 'supplier'>(
    task?.contact_id || preselectedContactId ? 'contact' : 'supplier'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const taskData: Partial<Task> = {
      task_type: formData.task_type as Task['task_type'],
      title: formData.title,
      notes: formData.notes,
      due_date: formData.due_date ? new Date(formData.due_date).toISOString() : undefined,
    };

    if (entityType === 'contact') {
      taskData.contact_id = formData.contact_id || undefined;
      taskData.supplier_id = undefined;
    } else {
      taskData.supplier_id = formData.supplier_id || undefined;
      taskData.contact_id = undefined;
    }

    if (task?.id) {
      taskData.id = task.id;
    }

    onSave(taskData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {task ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Type
            </label>
            <select
              value={formData.task_type}
              onChange={(e) => setFormData({ ...formData, task_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="call_back">Call Back</option>
              <option value="email_back">Email Back</option>
              <option value="text_back">Text Back</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Related To
            </label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="contact"
                  checked={entityType === 'contact'}
                  onChange={(e) => setEntityType(e.target.value as 'contact')}
                  className="mr-2"
                />
                Contact
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="supplier"
                  checked={entityType === 'supplier'}
                  onChange={(e) => setEntityType(e.target.value as 'supplier')}
                  className="mr-2"
                />
                Supplier
              </label>
            </div>

            {entityType === 'contact' ? (
              <select
                value={formData.contact_id}
                onChange={(e) => setFormData({ ...formData, contact_id: e.target.value, supplier_id: '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a contact</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name} {contact.company ? `- ${contact.company}` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value, contact_id: '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.company_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {task ? 'Update Task' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskModal;
