import { useState, useRef, useEffect } from 'react';
import { Edit2, Trash2, Phone, Mail, MapPin, AlertCircle, CheckCircle, TrendingUp, Settings, GripVertical, Eye, EyeOff, Skull, Package, Briefcase } from 'lucide-react';
import { ContactWithActivity } from '../lib/supabase';

interface ContactTableViewProps {
  contacts: ContactWithActivity[];
  onContactClick: (contact: ContactWithActivity) => void;
  onDeleteContact: (id: string) => void;
  onEditContact: (contact: ContactWithActivity) => void;
}

type ColumnConfig = {
  id: string;
  label: string;
  visible: boolean;
  width: number;
};

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'name', label: 'Name', visible: true, width: 150 },
  { id: 'company', label: 'Company', visible: true, width: 150 },
  { id: 'companySize', label: 'Company Size', visible: true, width: 120 },
  { id: 'priority', label: 'Priority', visible: true, width: 80 },
  { id: 'contactInfo', label: 'Contact Info', visible: true, width: 200 },
  { id: 'location', label: 'Location', visible: true, width: 150 },
  { id: 'averageMt', label: 'Avg MT', visible: true, width: 100 },
  { id: 'averageMargin', label: 'Avg Margin', visible: true, width: 110 },
  { id: 'numberOfDeals', label: '# Deals', visible: true, width: 90 },
  { id: 'status', label: 'Status', visible: true, width: 120 },
  { id: 'activity', label: 'Activity', visible: true, width: 120 },
  { id: 'lastActivity', label: 'Last Activity', visible: true, width: 150 },
  { id: 'nextTask', label: 'Next Task', visible: true, width: 180 },
  { id: 'nextCall', label: 'Next Call', visible: true, width: 150 },
  { id: 'followUp', label: 'Follow Up', visible: true, width: 150 },
];

export default function ContactTableView({
  contacts,
  onContactClick,
  onDeleteContact,
  onEditContact,
}: ContactTableViewProps) {
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    const saved = localStorage.getItem('contactTableColumns');
    return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
  });
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [resizing, setResizing] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [draggingColumn, setDraggingColumn] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const getDuplicateCompanies = () => {
    const companyCount = new Map<string, number>();
    contacts.forEach(contact => {
      if (contact.company && contact.company.trim() !== '') {
        const company = contact.company.toLowerCase().trim();
        companyCount.set(company, (companyCount.get(company) || 0) + 1);
      }
    });
    return new Set(
      Array.from(companyCount.entries())
        .filter(([_, count]) => count > 1)
        .map(([company]) => company)
    );
  };

  const getDuplicateNames = () => {
    const nameCount = new Map<string, number>();
    contacts.forEach(contact => {
      if (contact.name && contact.name.trim() !== '') {
        const name = contact.name.toLowerCase().trim();
        nameCount.set(name, (nameCount.get(name) || 0) + 1);
      }
    });
    return new Set(
      Array.from(nameCount.entries())
        .filter(([_, count]) => count > 1)
        .map(([name]) => name)
    );
  };

  const duplicateCompanies = getDuplicateCompanies();
  const duplicateNames = getDuplicateNames();

  const isDuplicateCompany = (company?: string) => {
    if (!company || company.trim() === '') return false;
    return duplicateCompanies.has(company.toLowerCase().trim());
  };

  const isDuplicateName = (name?: string) => {
    if (!name || name.trim() === '') return false;
    return duplicateNames.has(name.toLowerCase().trim());
  };

  useEffect(() => {
    localStorage.setItem('contactTableColumns', JSON.stringify(columns));
  }, [columns]);

  const getStatusBadge = (contact: ContactWithActivity) => {
    if (contact.is_client) {
      return (
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Client
          </span>
          {contact.client_note && (
            <div className="text-xs text-green-700 font-medium truncate" title={contact.client_note}>
              {contact.client_note}
            </div>
          )}
        </div>
      );
    }
    if (contact.has_traction) {
      return (
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <TrendingUp className="w-3 h-3" />
            Traction
          </span>
          {contact.traction_note && (
            <div className="text-xs text-yellow-700 font-medium truncate" title={contact.traction_note}>
              {contact.traction_note}
            </div>
          )}
        </div>
      );
    }
    if (contact.is_jammed) {
      return (
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3" />
            Jammed
          </span>
          {contact.jammed_note && (
            <div className="text-xs text-red-700 font-medium truncate" title={contact.jammed_note}>
              {contact.jammed_note}
            </div>
          )}
        </div>
      );
    }
    if (contact.is_dead) {
      return (
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Skull className="w-3 h-3" />
            Dead
          </span>
          {contact.dead_note && (
            <div className="text-xs text-gray-700 font-medium truncate" title={contact.dead_note}>
              {contact.dead_note}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent, columnId: string) => {
    e.preventDefault();
    setResizing(columnId);
    setStartX(e.clientX);
    const column = columns.find(c => c.id === columnId);
    setStartWidth(column?.width || 100);
  };

  const toggleColumnVisibility = (columnId: string) => {
    setColumns(prev => prev.map(col =>
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
  };

  const handleDragStart = (e: React.DragEvent, columnId: string) => {
    setDraggingColumn(columnId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    if (!draggingColumn || draggingColumn === targetColumnId) return;

    setColumns(prev => {
      const newColumns = [...prev];
      const dragIndex = newColumns.findIndex(c => c.id === draggingColumn);
      const dropIndex = newColumns.findIndex(c => c.id === targetColumnId);

      const [removed] = newColumns.splice(dragIndex, 1);
      newColumns.splice(dropIndex, 0, removed);

      return newColumns;
    });

    setDraggingColumn(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggingColumn(null);
    setDragOverColumn(null);
  };

  const resetColumns = () => {
    setColumns(DEFAULT_COLUMNS);
    localStorage.removeItem('contactTableColumns');
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing) return;
      const diff = e.clientX - startX;
      const newWidth = Math.max(50, startWidth + diff);
      setColumns(prev => prev.map(col =>
        col.id === resizing ? { ...col, width: newWidth } : col
      ));
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, startX, startWidth]);

  const visibleColumns = columns.filter(col => col.visible);

  const renderCell = (column: ColumnConfig, contact: ContactWithActivity) => {
    switch (column.id) {
      case 'name':
        return <div className="text-sm font-medium text-gray-900 truncate">{contact.name}</div>;
      case 'company':
        return <div className="text-sm text-gray-900 truncate">{contact.company || '-'}</div>;
      case 'companySize':
        return <div className="text-sm text-gray-600 truncate">{contact.company_size || '-'}</div>;
      case 'priority':
        return contact.priority_rank ? (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium w-fit">
            <TrendingUp className="w-3 h-3" />
            P{contact.priority_rank}
          </div>
        ) : (
          <div className="text-sm text-gray-400">-</div>
        );
      case 'contactInfo':
        return (
          <div className="flex flex-col gap-1">
            {contact.phone && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Phone className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{contact.phone}</span>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{contact.email}</span>
              </div>
            )}
          </div>
        );
      case 'location':
        return (
          <div className="flex flex-col gap-1">
            {contact.city && (
              <div className="text-sm text-gray-900 truncate">{contact.city}</div>
            )}
            {contact.country && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{contact.country}</span>
              </div>
            )}
          </div>
        );
      case 'averageMt':
        return (
          <div className="flex items-center gap-1 text-sm text-gray-900">
            <Package className="w-3 h-3 text-blue-500 flex-shrink-0" />
            <span className="font-medium">{contact.average_mt_enquiry ?? 0}</span>
          </div>
        );
      case 'averageMargin':
        return (
          <div className="flex items-center gap-1 text-sm text-gray-900">
            <TrendingUp className="w-3 h-3 text-green-500 flex-shrink-0" />
            <span className="font-medium">
              {(() => {
                const margin = contact.average_margin || '0';
                return margin.includes('%') ? margin : `$${margin}`;
              })()}
            </span>
          </div>
        );
      case 'numberOfDeals':
        return (
          <div className="flex items-center gap-1 text-sm text-gray-900">
            <Briefcase className="w-3 h-3 text-orange-500 flex-shrink-0" />
            <span className="font-medium">{contact.number_of_deals ?? 0}</span>
          </div>
        );
      case 'status':
        return getStatusBadge(contact);
      case 'activity':
        return (
          <div className="flex flex-col gap-1 text-sm">
            <div className="text-gray-600">
              {contact.total_calls || 0} calls
            </div>
            <div className="text-gray-600">
              {contact.total_emails || 0} emails
            </div>
            <div className="text-gray-600">
              {contact.total_deals || 0} deals
            </div>
            <div className="text-gray-600">
              {contact.vessels?.length || 0} {contact.vessels?.length === 1 ? 'vessel' : 'vessels'}
            </div>
            {contact.total_tasks > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-gray-600">
                  {contact.total_tasks} tasks
                </span>
                {contact.pending_tasks > 0 && (
                  <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                    {contact.pending_tasks}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      case 'lastActivity':
        return (
          <div className="flex flex-col gap-1 text-sm">
            {contact.last_call_date && (
              <div className="text-gray-900">
                <span className="font-medium">Called: </span>
                <div className="text-xs">
                  {new Date(contact.last_call_date).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </div>
              </div>
            )}
            {contact.last_email_date && (
              <div className="text-gray-900">
                <span className="font-medium">Emailed: </span>
                <div className="text-xs">
                  {new Date(contact.last_email_date).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </div>
              </div>
            )}
            {!contact.last_call_date && !contact.last_email_date && (
              <span className="text-gray-400">-</span>
            )}
          </div>
        );
      case 'nextTask':
        if (!contact.next_task_due || !contact.next_task_title) {
          return <span className="text-sm text-gray-400">-</span>;
        }
        const taskDueDate = new Date(contact.next_task_due);
        const now = new Date();
        const taskDiffTime = taskDueDate.getTime() - now.getTime();
        const taskDiffDays = Math.ceil(taskDiffTime / (1000 * 60 * 60 * 24));
        const taskIsOverdue = taskDiffDays < 0;
        return (
          <div className="flex flex-col gap-1">
            <div
              className={`text-sm font-medium truncate ${
                taskIsOverdue ? 'text-red-600' : 'text-gray-900'
              }`}
              title={contact.next_task_title}
            >
              {contact.next_task_title}
            </div>
            <div className="flex items-center gap-2">
              <div className={`text-xs ${taskIsOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                {taskDueDate.toLocaleDateString()}
              </div>
              <div className={`text-xs ${taskIsOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                {taskIsOverdue
                  ? `${Math.abs(taskDiffDays)} days overdue`
                  : `in ${taskDiffDays} days`}
              </div>
            </div>
          </div>
        );
      case 'nextCall':
        return contact.next_call_due ? (
          <div className="flex flex-col gap-1">
            <div
              className={`text-sm font-medium ${
                contact.is_overdue ? 'text-red-600' : 'text-gray-900'
              }`}
            >
              {new Date(contact.next_call_due).toLocaleDateString()}
            </div>
            {contact.days_until_due !== undefined && (
              <div className={`text-xs ${contact.is_overdue ? 'text-red-600' : 'text-gray-500'}`}>
                {contact.is_overdue
                  ? `${Math.abs(contact.days_until_due)} days overdue`
                  : `in ${contact.days_until_due} days`}
              </div>
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        );
      case 'followUp':
        if (!contact.follow_up_date) {
          return <span className="text-sm text-gray-400">-</span>;
        }
        const followUpDate = new Date(contact.follow_up_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const followUpDiffTime = followUpDate.getTime() - today.getTime();
        const followUpDiffDays = Math.ceil(followUpDiffTime / (1000 * 60 * 60 * 24));
        const followUpIsOverdue = followUpDiffDays < 0;
        return (
          <div className="flex flex-col gap-1">
            <div
              className={`text-sm font-medium ${
                followUpIsOverdue ? 'text-red-600' : 'text-purple-700'
              }`}
            >
              {followUpDate.toLocaleDateString()}
            </div>
            <div className={`text-xs ${followUpIsOverdue ? 'text-red-600' : 'text-gray-500'}`}>
              {followUpIsOverdue
                ? `${Math.abs(followUpDiffDays)} days overdue`
                : followUpDiffDays === 0
                ? 'Today'
                : `in ${followUpDiffDays} days`}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="text-sm font-medium text-gray-700">
          {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'}
        </div>
        <button
          onClick={() => setShowColumnSettings(!showColumnSettings)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
        >
          <Settings className="w-4 h-4" />
          Columns
        </button>
      </div>

      {showColumnSettings && (
        <div className="border-b border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Manage Columns</h3>
            <button
              onClick={resetColumns}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Reset to default
            </button>
          </div>
          <div className="space-y-2">
            {columns.map((column) => (
              <div
                key={column.id}
                draggable
                onDragStart={(e) => handleDragStart(e, column.id)}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-2 bg-white border rounded cursor-move hover:border-blue-300 transition-colors ${
                  dragOverColumn === column.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <button
                  onClick={() => toggleColumnVisibility(column.id)}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  {column.visible ? (
                    <Eye className="w-4 h-4 text-blue-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                  <span className={`text-sm ${column.visible ? 'text-gray-900' : 'text-gray-400'}`}>
                    {column.label}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {visibleColumns.map((column) => (
                <th
                  key={column.id}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                  style={{ width: column.width }}
                >
                  {column.label}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors"
                    onMouseDown={(e) => handleMouseDown(e, column.id)}
                  />
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: 100 }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="px-4 py-8 text-center text-gray-500">
                  No contacts found
                </td>
              </tr>
            ) : (
              contacts.map((contact) => (
                <tr
                  key={contact.id}
                  className={`cursor-pointer transition-colors ${
                    isDuplicateCompany(contact.company) || isDuplicateName(contact.name)
                      ? 'bg-orange-50 hover:bg-orange-100'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => onContactClick(contact)}
                >
                  {visibleColumns.map((column) => (
                    <td key={column.id} className="px-4 py-3" style={{ width: column.width }}>
                      {renderCell(column, contact)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right" style={{ width: 100 }}>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditContact(contact);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to delete this contact?')) {
                            onDeleteContact(contact.id);
                          }
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
