import { X, Trash2, Users, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { ContactWithActivity, supabase } from '../lib/supabase';

interface DuplicateGroup {
  name: string;
  contacts: ContactWithActivity[];
}

interface DuplicatesModalProps {
  contacts: ContactWithActivity[];
  onClose: () => void;
  onDelete: (contactId: string) => void;
  onRefresh?: () => void;
}

export default function DuplicatesModal({ contacts, onClose, onDelete, onRefresh }: DuplicatesModalProps) {
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const findDuplicates = (): DuplicateGroup[] => {
    const nameMap = new Map<string, ContactWithActivity[]>();

    contacts.forEach(contact => {
      const normalizedName = contact.name.trim().toLowerCase();
      if (!nameMap.has(normalizedName)) {
        nameMap.set(normalizedName, []);
      }
      nameMap.get(normalizedName)!.push(contact);
    });

    const duplicates: DuplicateGroup[] = [];
    nameMap.forEach((contactList, name) => {
      if (contactList.length > 1) {
        contactList.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA;
        });
        duplicates.push({ name, contacts: contactList });
      }
    });

    duplicates.sort((a, b) => b.contacts.length - a.contacts.length);

    return duplicates;
  };

  const duplicateGroups = findDuplicates();

  const handleDelete = async (contactId: string) => {
    setDeletingIds(prev => new Set(prev).add(contactId));
    try {
      await onDelete(contactId);
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(contactId);
        return newSet;
      });
    }
  };

  const handleDeleteAllNewest = async () => {
    const totalToDelete = duplicateGroups.length;
    const idsToDelete = duplicateGroups.map(group => group.contacts[0].id);

    if (!confirm(`Are you sure you want to delete ${totalToDelete} NEWEST duplicates? This will keep the oldest contact for each duplicate name.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .in('id', idsToDelete);

      if (error) {
        console.error('Error deleting contacts:', error);
        alert(`Error deleting duplicates: ${error.message}`);
        return;
      }

      alert(`Successfully deleted ${totalToDelete} newest duplicate(s)`);

      if (onRefresh) {
        await onRefresh();
      }

      onClose();
    } catch (error) {
      console.error('Error deleting newest duplicates:', error);
      alert('An error occurred while deleting duplicates. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAllOldest = async () => {
    const totalToDelete = duplicateGroups.length;
    const idsToDelete = duplicateGroups.map(group => group.contacts[group.contacts.length - 1].id);

    if (!confirm(`Are you sure you want to delete ${totalToDelete} OLDEST duplicates? This will keep the newest contact for each duplicate name.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .in('id', idsToDelete);

      if (error) {
        console.error('Error deleting contacts:', error);
        alert(`Error deleting duplicates: ${error.message}`);
        return;
      }

      alert(`Successfully deleted ${totalToDelete} oldest duplicate(s)`);

      if (onRefresh) {
        await onRefresh();
      }

      onClose();
    } catch (error) {
      console.error('Error deleting oldest duplicates:', error);
      alert('An error occurred while deleting duplicates. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-5 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6" />
            <div>
              <h2 className="text-2xl font-bold">Duplicate Contacts</h2>
              <p className="text-red-100 text-sm">
                {duplicateGroups.length} duplicate name{duplicateGroups.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {duplicateGroups.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-green-400 mb-4" />
              <p className="text-xl font-medium text-gray-900 mb-2">No Duplicates Found</p>
              <p className="text-gray-500">All contact names are unique!</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Review duplicates carefully</p>
                  <p>Contacts are sorted with the newest first. You can delete duplicates individually, or use the bulk actions below to delete all oldest or all newest duplicates at once.</p>
                </div>
              </div>

              {duplicateGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 text-lg capitalize">
                        {group.name}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {group.contacts.length} duplicate{group.contacts.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {group.contacts.map((contact, index) => (
                      <div
                        key={contact.id}
                        className={`p-4 hover:bg-gray-50 transition-colors ${
                          deletingIds.has(contact.id) ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {index === 0 && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                                  Newest
                                </span>
                              )}
                              {index === group.contacts.length - 1 && group.contacts.length > 1 && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                  Oldest
                                </span>
                              )}
                              <span className="text-sm text-gray-500">
                                Created: {formatDate(contact.created_at)}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                              {contact.company && (
                                <div>
                                  <span className="text-gray-600">Company:</span>{' '}
                                  <span className="font-medium text-gray-900">{contact.company}</span>
                                </div>
                              )}
                              {contact.email && (
                                <div>
                                  <span className="text-gray-600">Email:</span>{' '}
                                  <span className="font-medium text-gray-900">{contact.email}</span>
                                </div>
                              )}
                              {contact.phone && (
                                <div>
                                  <span className="text-gray-600">Phone:</span>{' '}
                                  <span className="font-medium text-gray-900">{contact.phone}</span>
                                </div>
                              )}
                              {contact.country && (
                                <div>
                                  <span className="text-gray-600">Country:</span>{' '}
                                  <span className="font-medium text-gray-900">{contact.country}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-gray-600">Calls:</span>{' '}
                                <span className="font-medium text-gray-900">{contact.total_calls || 0}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Emails:</span>{' '}
                                <span className="font-medium text-gray-900">{contact.total_emails || 0}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Deals:</span>{' '}
                                <span className="font-medium text-gray-900">{contact.total_deals || 0}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDelete(contact.id)}
                            disabled={deletingIds.has(contact.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete this contact"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex gap-3">
            {duplicateGroups.length > 0 && (
              <>
                <button
                  onClick={handleDeleteAllOldest}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? 'Deleting...' : 'Delete All Oldest'}
                </button>
                <button
                  onClick={handleDeleteAllNewest}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? 'Deleting...' : 'Delete All Newest'}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
