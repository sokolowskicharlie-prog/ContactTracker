import { X, Building2, User, Mail, Phone, Globe, MapPin, Package, DollarSign, FileText, Star, Plus, Edit, Trash2, Calendar, Truck, Hash, Anchor, Smartphone, Briefcase, MessageCircle, CheckSquare, Circle, CheckCircle2, AlertCircle, Ship, Fuel, Copy, Users } from 'lucide-react';
import { SupplierWithOrders, SupplierOrder, SupplierContact, SupplierPort, TaskWithRelated } from '../lib/supabase';

interface SupplierDetailProps {
  supplier: SupplierWithOrders;
  tasks: TaskWithRelated[];
  onClose: () => void;
  onEdit: () => void;
  onAddOrder: () => void;
  onEditOrder: (order: SupplierOrder) => void;
  onDeleteOrder: (orderId: string) => void;
  onAddContact: () => void;
  onEditContact: (contact: SupplierContact) => void;
  onDeleteContact: (contactId: string) => void;
  onAddPort: () => void;
  onEditPort: (port: SupplierPort) => void;
  onDeletePort: (portId: string) => void;
  onCheckPortDuplicates: () => void;
  onAddTask: () => void;
  onToggleTaskComplete: (taskId: string, completed: boolean) => void;
  onEditTask: (task: TaskWithRelated) => void;
  onDeleteTask: (taskId: string) => void;
  onConvertToContact: () => void;
}

export default function SupplierDetail({ supplier, tasks, onClose, onEdit, onAddOrder, onEditOrder, onDeleteOrder, onAddContact, onEditContact, onDeleteContact, onAddPort, onEditPort, onDeletePort, onCheckPortDuplicates, onAddTask, onToggleTaskComplete, onEditTask, onDeleteTask, onConvertToContact }: SupplierDetailProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTaskDate = (dateString?: string) => {
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

  const getTaskTypeIcon = (taskType: string) => {
    switch (taskType) {
      case 'call_back':
        return <Phone className="w-3 h-3" />;
      case 'email_back':
        return <Mail className="w-3 h-3" />;
      case 'text_back':
        return <MessageCircle className="w-3 h-3" />;
      default:
        return <CheckSquare className="w-3 h-3" />;
    }
  };

  const renderRating = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-5 h-5 ${
              i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{supplier.company_name}</h2>
              <div className="flex gap-2 mt-1">
                {supplier.supplier_type && (
                  <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                    {supplier.supplier_type}
                  </span>
                )}
                {supplier.business_classification && (
                  <span className="inline-block px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    {supplier.business_classification}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit supplier details"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={onConvertToContact}
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Convert to contact"
            >
              <Users className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>

              {supplier.contact_person && (
                <div className="flex items-center text-gray-700">
                  <User className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Contact Person</p>
                    <p className="font-medium">{supplier.contact_person}</p>
                  </div>
                </div>
              )}

              {supplier.email && (
                <div className="flex items-center text-gray-700">
                  <Mail className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{supplier.email}</p>
                  </div>
                </div>
              )}

              {supplier.phone && (
                <div className="flex items-center text-gray-700">
                  <Phone className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{supplier.phone}</p>
                  </div>
                </div>
              )}

              {supplier.website && (
                <div className="flex items-center text-gray-700">
                  <Globe className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Website</p>
                    <a
                      href={supplier.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {supplier.website}
                    </a>
                  </div>
                </div>
              )}

              {supplier.country && (
                <div className="flex items-center text-gray-700">
                  <MapPin className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Country</p>
                    <p className="font-medium">{supplier.country}</p>
                  </div>
                </div>
              )}

              {supplier.address && (
                <div className="flex items-start text-gray-700">
                  <MapPin className="w-5 h-5 mr-3 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{supplier.address}</p>
                  </div>
                </div>
              )}

              {supplier.general_email && (
                <div className="flex items-center text-gray-700">
                  <Mail className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">General Email</p>
                    <p className="font-medium">{supplier.general_email}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Business Details</h3>

              {supplier.rating && (
                <div className="flex items-start text-gray-700">
                  <Star className="w-5 h-5 mr-3 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Rating</p>
                    {renderRating(supplier.rating)}
                  </div>
                </div>
              )}

              {supplier.products_services && (
                <div className="flex items-start text-gray-700">
                  <Package className="w-5 h-5 mr-3 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Products / Services</p>
                    <p className="font-medium">{supplier.products_services}</p>
                  </div>
                </div>
              )}

              {supplier.payment_terms && (
                <div className="flex items-start text-gray-700">
                  <DollarSign className="w-5 h-5 mr-3 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Payment Terms</p>
                    <p className="font-medium">{supplier.payment_terms}</p>
                  </div>
                </div>
              )}

              {supplier.currency && (
                <div className="flex items-center text-gray-700">
                  <DollarSign className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Currency</p>
                    <p className="font-medium">{supplier.currency}</p>
                  </div>
                </div>
              )}

              {supplier.ports && (
                <div className="flex items-start text-gray-700">
                  <Anchor className="w-5 h-5 mr-3 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Ports They Supply</p>
                    <p className="font-medium">{supplier.ports}</p>
                  </div>
                </div>
              )}

              {supplier.notes && (
                <div className="flex items-start text-gray-700">
                  <FileText className="w-5 h-5 mr-3 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="font-medium">{supplier.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Ports & Delivery Methods ({supplier.ports_detailed?.length || 0})
              </h3>
              <div className="flex gap-2">
                {supplier.ports_detailed && supplier.ports_detailed.length > 1 && (
                  <button
                    onClick={onCheckPortDuplicates}
                    className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Check Duplicates
                  </button>
                )}
                <button
                  onClick={onAddPort}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Port
                </button>
              </div>
            </div>

            {supplier.ports_detailed && supplier.ports_detailed.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {supplier.ports_detailed.map((port) => (
                  <div
                    key={port.id}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Anchor className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">{port.port_name}</h4>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditPort(port)}
                          className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete port ${port.port_name}?`)) {
                              onDeletePort(port.id);
                            }
                          }}
                          className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <p className="text-xs text-gray-500 font-medium mb-1">Delivery Methods:</p>
                      <div className="flex flex-wrap gap-2">
                        {(port.has_barge || supplier.default_has_barge) && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm">
                            <Ship className="w-4 h-4" />
                            <span>Barge</span>
                            {!port.has_barge && supplier.default_has_barge && (
                              <span className="text-xs opacity-60">(default)</span>
                            )}
                          </div>
                        )}
                        {(port.has_truck || supplier.default_has_truck) && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm">
                            <Truck className="w-4 h-4" />
                            <span>Truck</span>
                            {!port.has_truck && supplier.default_has_truck && (
                              <span className="text-xs opacity-60">(default)</span>
                            )}
                          </div>
                        )}
                        {(port.has_expipe || supplier.default_has_expipe) && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-sm">
                            <Anchor className="w-4 h-4" />
                            <span>Ex-Pipe</span>
                            {!port.has_expipe && supplier.default_has_expipe && (
                              <span className="text-xs opacity-60">(default)</span>
                            )}
                          </div>
                        )}
                        {port.custom_delivery_methods && port.custom_delivery_methods.map((method) => (
                          <div key={method.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm">
                            <Truck className="w-4 h-4" />
                            <span>{method.name}</span>
                          </div>
                        ))}
                        {!port.has_barge && !port.has_truck && !port.has_expipe && !supplier.default_has_barge && !supplier.default_has_truck && !supplier.default_has_expipe && (!port.custom_delivery_methods || port.custom_delivery_methods.length === 0) && (
                          <span className="text-sm text-gray-400 italic">No delivery methods specified</span>
                        )}
                      </div>
                    </div>

                    {(port.has_vlsfo || port.has_lsmgo || (port.custom_fuel_types && port.custom_fuel_types.length > 0)) && (
                      <div className="space-y-2 mb-3">
                        <p className="text-xs text-gray-500 font-medium mb-1">Fuel Types:</p>
                        <div className="flex flex-wrap gap-2">
                          {port.has_vlsfo && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm">
                              <Fuel className="w-4 h-4" />
                              <span>VLSFO</span>
                            </div>
                          )}
                          {port.has_lsmgo && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg text-sm">
                              <Fuel className="w-4 h-4" />
                              <span>LSMGO</span>
                            </div>
                          )}
                          {port.custom_fuel_types && port.custom_fuel_types.map((fuelType) => (
                            <div key={fuelType.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-800 rounded-lg text-sm">
                              <Fuel className="w-4 h-4" />
                              <span>{fuelType.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {port.notes && (
                      <p className="text-xs text-gray-500 italic border-t border-gray-100 pt-2">{port.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                <Anchor className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p>No ports added yet</p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Contacts ({supplier.contacts.length})
              </h3>
              <button
                onClick={onAddContact}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Contact
              </button>
            </div>

            {supplier.contacts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {supplier.contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{contact.name}</h4>
                          {contact.is_primary && (
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          )}
                        </div>
                        {contact.title && (
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <Briefcase className="w-3 h-3 mr-1" />
                            {contact.title}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditContact(contact)}
                          className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete contact ${contact.name}?`)) {
                              onDeleteContact(contact.id);
                            }
                          }}
                          className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {contact.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-3 h-3 mr-2 text-gray-400" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          {contact.phone_type === 'whatsapp' ? (
                            <MessageCircle className="w-3 h-3 mr-2 text-green-500" />
                          ) : (
                            <Phone className="w-3 h-3 mr-2 text-gray-400" />
                          )}
                          <span>{contact.phone}</span>
                          <span className="ml-1 text-xs text-gray-400">({contact.phone_type || 'general'})</span>
                        </div>
                      )}
                      {contact.mobile && (
                        <div className="flex items-center text-sm text-gray-600">
                          {contact.mobile_type === 'whatsapp' ? (
                            <MessageCircle className="w-3 h-3 mr-2 text-green-500" />
                          ) : (
                            <Smartphone className="w-3 h-3 mr-2 text-gray-400" />
                          )}
                          <span>{contact.mobile}</span>
                          <span className="ml-1 text-xs text-gray-400">({contact.mobile_type || 'general'})</span>
                        </div>
                      )}
                    </div>

                    {contact.notes && (
                      <p className="text-xs text-gray-500 mt-2 italic">{contact.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                <User className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p>No contacts added yet</p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Tasks ({tasks.length})
              </h3>
              <button
                onClick={onAddTask}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
              >
                <CheckSquare className="w-4 h-4" />
                Add Task
              </button>
            </div>

            {tasks.length > 0 ? (
              <div className="space-y-3 mb-6">
                {tasks
                  .sort((a, b) => {
                    if (a.completed !== b.completed) {
                      return a.completed ? 1 : -1;
                    }
                    if (a.due_date && b.due_date) {
                      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                    }
                    if (a.due_date) return -1;
                    if (b.due_date) return 1;
                    return 0;
                  })
                  .map((task) => (
                    <div
                      key={task.id}
                      className={`bg-white border rounded-lg p-4 transition-all ${
                        task.completed
                          ? 'border-gray-200 opacity-60'
                          : task.is_overdue
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => onToggleTaskComplete(task.id, !task.completed)}
                          className="mt-0.5 flex-shrink-0"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-400 hover:text-orange-600" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-xs font-medium">
                                  {getTaskTypeIcon(task.task_type)}
                                  {getTaskTypeLabel(task.task_type)}
                                </div>
                                {task.is_overdue && !task.completed && (
                                  <div className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                                    <AlertCircle className="w-3 h-3" />
                                    Overdue
                                  </div>
                                )}
                              </div>

                              <h4 className={`font-medium text-gray-900 mb-1 ${task.completed ? 'line-through' : ''}`}>
                                {task.title}
                              </h4>

                              {task.notes && (
                                <p className="text-sm text-gray-600 mb-2">{task.notes}</p>
                              )}

                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Calendar className="w-3 h-3" />
                                <span>{formatTaskDate(task.due_date)}</span>
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
                                className="p-1.5 text-gray-400 hover:text-orange-600 transition-colors rounded hover:bg-orange-50"
                                title="Edit task"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this task?')) {
                                    onDeleteTask(task.id);
                                  }
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded hover:bg-red-50"
                                title="Delete task"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg mb-6">
                <CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p>No tasks created yet</p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Order History ({supplier.orders.length})
              </h3>
              <button
                onClick={onAddOrder}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Order
              </button>
            </div>

            {supplier.orders.length > 0 ? (
              <div className="space-y-3">
                {supplier.orders
                  .sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())
                  .map((order) => (
                    <div
                      key={order.id}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {order.order_number && (
                              <div className="flex items-center text-gray-900 font-medium">
                                <Hash className="w-4 h-4 mr-1 text-gray-400" />
                                {order.order_number}
                              </div>
                            )}
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(order.order_date)}
                            </div>
                            {order.delivery_date && (
                              <div className="flex items-center">
                                <Truck className="w-4 h-4 mr-1" />
                                {formatDate(order.delivery_date)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {order.total_amount && (
                            <div className="text-right mr-2">
                              <p className="text-lg font-semibold text-gray-900">
                                {order.total_amount.toLocaleString()} {order.currency || supplier.currency}
                              </p>
                            </div>
                          )}
                          <button
                            onClick={() => onEditOrder(order)}
                            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete order ${order.order_number || 'this order'}?`)) {
                                onDeleteOrder(order.id);
                              }
                            }}
                            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {order.items && (
                        <div className="mb-2">
                          <p className="text-sm text-gray-500 mb-1">Items:</p>
                          <p className="text-sm text-gray-700">{order.items}</p>
                        </div>
                      )}

                      {order.notes && (
                        <p className="text-sm text-gray-600 italic border-t border-gray-100 pt-2">
                          {order.notes}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p>No orders recorded yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
