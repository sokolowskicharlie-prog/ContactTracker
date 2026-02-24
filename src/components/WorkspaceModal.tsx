import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Save, Users } from 'lucide-react';
import { Workspace, getWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace } from '../lib/workspaces';
import { useAuth } from '../lib/auth';
import WorkspaceMembersModal from './WorkspaceMembersModal';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkspaceChange: () => void;
}

const PRESET_COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F97316'
];

export default function WorkspaceModal({ isOpen, onClose, onWorkspaceChange }: WorkspaceModalProps) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceColor, setNewWorkspaceColor] = useState('#3B82F6');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [loading, setLoading] = useState(false);
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadWorkspaces();
    }
  }, [isOpen, user]);

  const loadWorkspaces = async () => {
    if (!user) return;
    try {
      const data = await getWorkspaces(user.id);
      setWorkspaces(data);
    } catch (error) {
      console.error('Error loading workspaces:', error);
    }
  };

  const handleCreate = async () => {
    if (!user || !newWorkspaceName.trim()) return;

    setLoading(true);
    try {
      await createWorkspace(user.id, newWorkspaceName.trim(), newWorkspaceColor);
      setNewWorkspaceName('');
      setNewWorkspaceColor('#3B82F6');
      setIsAdding(false);
      await loadWorkspaces();
      onWorkspaceChange();
    } catch (error) {
      console.error('Error creating workspace:', error);
      alert('Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (workspaceId: string) => {
    if (!editName.trim()) return;

    setLoading(true);
    try {
      await updateWorkspace(workspaceId, { name: editName.trim(), color: editColor });
      setEditingId(null);
      await loadWorkspaces();
      onWorkspaceChange();
    } catch (error) {
      console.error('Error updating workspace:', error);
      alert('Failed to update workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (workspaceId: string, isDefault: boolean) => {
    if (isDefault) {
      alert('Cannot delete the default workspace');
      return;
    }

    if (!confirm('Delete this workspace? All contacts will remain but will no longer be associated with this workspace.')) {
      return;
    }

    setLoading(true);
    try {
      await deleteWorkspace(workspaceId);
      await loadWorkspaces();
      onWorkspaceChange();
    } catch (error) {
      console.error('Error deleting workspace:', error);
      alert('Failed to delete workspace');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (workspace: Workspace) => {
    setEditingId(workspace.id);
    setEditName(workspace.name);
    setEditColor(workspace.color);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Manage Workspaces</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {workspaces.map((workspace) => (
            <div
              key={workspace.id}
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg group"
            >
              {editingId === workspace.id ? (
                <>
                  <div className="flex gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setEditColor(color)}
                        className={`w-6 h-6 rounded-full border-2 ${
                          editColor === color ? 'border-gray-900' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={() => handleUpdate(workspace.id)}
                    disabled={loading}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <Save className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: workspace.color }}
                  />
                  <span className="flex-1 text-gray-900 font-medium">
                    {workspace.name}
                    {workspace.is_default && (
                      <span className="ml-2 text-xs text-gray-500">(Default)</span>
                    )}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedWorkspace(workspace);
                      setMembersModalOpen(true);
                    }}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Manage members"
                  >
                    <Users className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => startEdit(workspace)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {!workspace.is_default && (
                    <button
                      onClick={() => handleDelete(workspace.id, workspace.is_default)}
                      disabled={loading}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          ))}

          {isAdding ? (
            <div className="flex flex-col gap-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <div className="flex gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewWorkspaceColor(color)}
                    className={`w-6 h-6 rounded-full border-2 ${
                      newWorkspaceColor === color ? 'border-gray-900' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="Workspace name (e.g., Work, Clients)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate();
                    if (e.key === 'Escape') {
                      setIsAdding(false);
                      setNewWorkspaceName('');
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={handleCreate}
                  disabled={loading || !newWorkspaceName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewWorkspaceName('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add New Workspace
            </button>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {selectedWorkspace && (
        <WorkspaceMembersModal
          isOpen={membersModalOpen}
          onClose={() => {
            setMembersModalOpen(false);
            setSelectedWorkspace(null);
          }}
          workspaceId={selectedWorkspace.id}
          workspaceName={selectedWorkspace.name}
        />
      )}
    </div>
  );
}
