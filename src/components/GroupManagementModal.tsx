import React, { useState, useEffect } from 'react';
import { X, Users, Edit2, Trash2, Plus, UserPlus } from 'lucide-react';
import { supabase, type ContactGroup, type ContactGroupWithMembers } from '../lib/supabase';
import GroupModal from './GroupModal';

interface GroupManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  selectedContactIds?: string[];
  onGroupsChanged?: () => void;
}

export default function GroupManagementModal({
  isOpen,
  onClose,
  workspaceId,
  selectedContactIds = [],
  onGroupsChanged,
}: GroupManagementModalProps) {
  const [groups, setGroups] = useState<ContactGroupWithMembers[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ContactGroup | undefined>();
  const [assigningToGroup, setAssigningToGroup] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadGroups();
    }
  }, [isOpen, workspaceId]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const { data: groupsData, error: groupsError } = await supabase
        .from('contact_groups')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name');

      if (groupsError) throw groupsError;

      const groupsWithMembers = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { data: members, error: membersError } = await supabase
            .from('contact_group_members')
            .select('contact_id')
            .eq('group_id', group.id);

          if (membersError) throw membersError;

          return {
            ...group,
            member_count: members?.length || 0,
            contact_ids: members?.map((m) => m.contact_id) || [],
          };
        })
      );

      setGroups(groupsWithMembers);
    } catch (err) {
      console.error('Error loading groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = () => {
    setEditingGroup(undefined);
    setShowGroupModal(true);
  };

  const handleEditGroup = (group: ContactGroup) => {
    setEditingGroup(group);
    setShowGroupModal(true);
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? Contacts will not be deleted.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('contact_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      await loadGroups();
      onGroupsChanged?.();
    } catch (err) {
      console.error('Error deleting group:', err);
      alert('Failed to delete group');
    }
  };

  const handleAssignContacts = async (groupId: string) => {
    if (selectedContactIds.length === 0) {
      alert('No contacts selected');
      return;
    }

    setAssigningToGroup(groupId);
    try {
      const group = groups.find((g) => g.id === groupId);
      if (!group) return;

      const newContactIds = selectedContactIds.filter(
        (id) => !group.contact_ids.includes(id)
      );

      if (newContactIds.length === 0) {
        alert('Selected contacts are already in this group');
        return;
      }

      const membersToInsert = newContactIds.map((contactId) => ({
        group_id: groupId,
        contact_id: contactId,
      }));

      const { error } = await supabase
        .from('contact_group_members')
        .insert(membersToInsert);

      if (error) throw error;

      await loadGroups();
      onGroupsChanged?.();
      alert(`${newContactIds.length} contact(s) added to group`);
    } catch (err) {
      console.error('Error assigning contacts:', err);
      alert('Failed to assign contacts to group');
    } finally {
      setAssigningToGroup(null);
    }
  };

  const handleGroupSaved = () => {
    loadGroups();
    onGroupsChanged?.();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Manage Groups</h2>
              {selectedContactIds.length > 0 && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                  {selectedContactIds.length} selected
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-4">
              <button
                onClick={handleCreateGroup}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create New Group
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading groups...</div>
            ) : groups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No groups yet. Create your first group to organize contacts.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: group.color }}
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{group.name}</h3>
                          <p className="text-sm text-gray-500">
                            {group.member_count} contact{group.member_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {selectedContactIds.length > 0 && (
                          <button
                            onClick={() => handleAssignContacts(group.id)}
                            disabled={assigningToGroup === group.id}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Add selected contacts to this group"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditGroup(group)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit group"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete group"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t p-4">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <GroupModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        group={editingGroup}
        workspaceId={workspaceId}
        onSave={handleGroupSaved}
      />
    </>
  );
}