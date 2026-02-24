import { X, Share2, UserPlus, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
}

interface NoteShare {
  id: string;
  shared_with: string;
  shared_with_email?: string;
  can_edit: boolean;
  created_at: string;
}

interface ShareNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
  noteTitle: string;
}

export default function ShareNoteModal({
  isOpen,
  onClose,
  noteId,
  noteTitle,
}: ShareNoteModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [shares, setShares] = useState<NoteShare[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      loadShares();
      getCurrentUser();
    }
  }, [isOpen, noteId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('get_user_emails');
      if (error) throw error;

      const otherUsers = (data || [])
        .filter((u: User) => u.id !== user.id)
        .map((u: User) => ({ id: u.id, email: u.email || 'No email' }));

      setUsers(otherUsers);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Unable to load users.');
    }
  };

  const loadShares = async () => {
    try {
      const { data, error } = await supabase
        .from('note_shares')
        .select('id, shared_with, can_edit, created_at')
        .eq('note_id', noteId);

      if (error) throw error;

      const { data: userEmails } = await supabase.rpc('get_user_emails');
      const emailMap = new Map((userEmails || []).map((u: User) => [u.id, u.email]));

      const sharesWithEmails = (data || []).map((share) => ({
        ...share,
        shared_with_email: emailMap.get(share.shared_with) || 'Unknown user',
      }));

      setShares(sharesWithEmails);
    } catch (err) {
      console.error('Error loading shares:', err);
    }
  };

  const handleShare = async () => {
    if (!selectedUserId) {
      setError('Please select a user to share with');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('note_shares')
        .insert({
          note_id: noteId,
          shared_by: user.id,
          shared_with: selectedUserId,
          can_edit: canEdit,
        });

      if (error) {
        if (error.code === '23505') {
          setError('Note already shared with this user');
        } else {
          throw error;
        }
        return;
      }

      setSelectedUserId('');
      setCanEdit(false);
      await loadShares();
    } catch (err) {
      console.error('Error sharing note:', err);
      setError('Failed to share note');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    try {
      const { error } = await supabase
        .from('note_shares')
        .delete()
        .eq('id', shareId);

      if (error) throw error;

      await loadShares();
    } catch (err) {
      console.error('Error removing share:', err);
      setError('Failed to remove share');
    }
  };

  const handleToggleEdit = async (shareId: string, currentCanEdit: boolean) => {
    try {
      const { error } = await supabase
        .from('note_shares')
        .update({ can_edit: !currentCanEdit })
        .eq('id', shareId);

      if (error) throw error;

      await loadShares();
    } catch (err) {
      console.error('Error updating share:', err);
      setError('Failed to update permissions');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Share Note</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-1">Sharing note:</p>
            <p className="font-medium text-gray-900">{noteTitle}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Share with user
            </h3>
            <div className="flex gap-2">
              <div className="flex-1">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                >
                  <option value="">Select a user...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.email}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={canEdit}
                  onChange={(e) => setCanEdit(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-700">Can edit</span>
              </label>
              <button
                onClick={handleShare}
                disabled={isLoading || !selectedUserId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Share
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Currently shared with ({shares.length})
            </h3>
            {shares.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                This note hasn't been shared with anyone yet
              </p>
            ) : (
              <div className="space-y-2">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {share.shared_with_email}
                      </p>
                      <p className="text-xs text-gray-500">
                        Shared on {new Date(share.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={share.can_edit}
                          onChange={() => handleToggleEdit(share.id, share.can_edit)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-xs text-gray-600">Can edit</span>
                      </label>
                      <button
                        onClick={() => handleRemoveShare(share.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove share"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
