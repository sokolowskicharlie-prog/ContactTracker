import { useState, useEffect } from 'react';
import { X, Users, Trash2, Mail, Shield, User as UserIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

interface WorkspaceMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName: string;
}

interface Member {
  id: string;
  user_id: string;
  email?: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
}

export default function WorkspaceMembersModal({ isOpen, onClose, workspaceId, workspaceName }: WorkspaceMembersModalProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; email: string }>>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'member'>('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadMembers();
      loadUsers();
    }
  }, [isOpen, workspaceId]);

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('id, user_id, role, created_at')
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      const membersWithEmails = await Promise.all(
        (data || []).map(async (member) => {
          const { data: userData } = await supabase
            .from('user_profiles')
            .select('email')
            .eq('id', member.user_id)
            .maybeSingle();

          if (member.user_id === user?.id) {
            setCurrentUserRole(member.role);
          }

          return {
            ...member,
            email: userData?.email || 'Unknown User',
          };
        })
      );

      setMembers(membersWithEmails);
    } catch (err) {
      console.error('Error loading members:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email')
        .neq('id', user?.id || '');

      if (error) throw error;

      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Unable to load users list.');
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId) {
      setError('Please select a user to add');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.from('workspace_members').insert([
        {
          workspace_id: workspaceId,
          user_id: selectedUserId,
          added_by: user?.id,
          role: selectedRole,
        },
      ]);

      if (error) throw error;

      setSelectedUserId('');
      setSelectedRole('member');
      loadMembers();
    } catch (err: any) {
      console.error('Error adding member:', err);
      if (err.code === '23505') {
        setError('This user is already a member of this workspace');
      } else {
        setError('Failed to add member. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberUserId: string) => {
    if (memberUserId === user?.id) {
      if (!confirm('Are you sure you want to leave this workspace?')) {
        return;
      }
    } else {
      if (!confirm('Are you sure you want to remove this member?')) {
        return;
      }
    }

    try {
      const { error } = await supabase.from('workspace_members').delete().eq('id', memberId);

      if (error) throw error;

      loadMembers();
    } catch (err) {
      console.error('Error removing member:', err);
      setError('Failed to remove member. Please try again.');
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: 'admin' | 'member') => {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      loadMembers();
    } catch (err) {
      console.error('Error updating role:', err);
      setError('Failed to update role. Please try again.');
    }
  };

  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin';

  if (!isOpen) return null;

  const availableUsers = users.filter(
    (u) => !members.some((m) => m.user_id === u.id)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Users className="text-blue-600" size={24} />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Workspace Members</h2>
              <p className="text-sm text-gray-600 mt-1">{workspaceName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {canManageMembers && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Add a member</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Email
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  >
                    <option value="">Select a user...</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'member')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleAddMember}
                disabled={loading || !selectedUserId}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          )}

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              Members ({members.length})
            </h3>
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Mail size={16} className="text-gray-400" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {member.email}
                          {member.user_id === user?.id && (
                            <span className="ml-2 text-xs text-gray-500">(You)</span>
                          )}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        Added {new Date(member.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.role === 'owner' && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                          <Shield size={12} />
                          Owner
                        </div>
                      )}
                      {member.role === 'admin' && canManageMembers && member.role !== 'owner' ? (
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleUpdateRole(member.id, e.target.value as 'admin' | 'member')
                          }
                          className="px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                          disabled={member.user_id === user?.id}
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                        </select>
                      ) : member.role === 'admin' ? (
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          <Shield size={12} />
                          Admin
                        </div>
                      ) : null}
                      {member.role === 'member' && canManageMembers ? (
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleUpdateRole(member.id, e.target.value as 'admin' | 'member')
                          }
                          className="px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : member.role === 'member' ? (
                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                          <UserIcon size={12} />
                          Member
                        </div>
                      ) : null}
                    </div>
                  </div>
                  {member.role !== 'owner' && (canManageMembers || member.user_id === user?.id) && (
                    <button
                      onClick={() => handleRemoveMember(member.id, member.user_id)}
                      className="text-red-600 hover:text-red-800 transition-colors p-2 ml-2"
                      title={member.user_id === user?.id ? 'Leave workspace' : 'Remove member'}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
