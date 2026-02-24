import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, StickyNote, User, Calendar, ArrowUpDown, Share2 } from 'lucide-react';
import { ContactWithActivity } from '../lib/supabase';
import { formatNoteContent } from '../lib/noteFormatter';
import ShareNoteModal from './ShareNoteModal';

interface SavedNote {
  id: string;
  title: string;
  content: string;
  contact_id?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

interface NotesSectionProps {
  notes: SavedNote[];
  contacts: ContactWithActivity[];
  onAddNote: () => void;
  onEditNote: (note: SavedNote) => void;
  onDeleteNote: (noteId: string) => void;
  currentUserId?: string;
}

export default function NotesSection({
  notes,
  contacts,
  onAddNote,
  onEditNote,
  onDeleteNote,
  currentUserId,
}: NotesSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNotes, setFilteredNotes] = useState<SavedNote[]>(notes);
  const [filterContact, setFilterContact] = useState<string>('');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<SavedNote[]>([]);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedNoteForShare, setSelectedNoteForShare] = useState<SavedNote | null>(null);

  useEffect(() => {
    let filtered = [...notes];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matches = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query)
      );
      setSearchResults(matches.slice(0, 10));
      filtered = matches;
    } else {
      setSearchResults([]);
    }

    if (filterContact) {
      if (filterContact === 'unattached') {
        filtered = filtered.filter((note) => !note.contact_id);
      } else {
        filtered = filtered.filter((note) => note.contact_id === filterContact);
      }
    }

    filtered.sort((a, b) => {
      let aVal, bVal;

      if (sortBy === 'title') {
        aVal = a.title.toLowerCase();
        bVal = b.title.toLowerCase();
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        const dateField = sortBy === 'created' ? 'created_at' : 'updated_at';
        aVal = new Date(a[dateField]).getTime();
        bVal = new Date(b[dateField]).getTime();
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
    });

    setFilteredNotes(filtered);
  }, [notes, searchQuery, filterContact, sortBy, sortOrder]);

  const getContactName = (contactId?: string) => {
    if (!contactId) return null;
    const contact = contacts.find((c) => c.id === contactId);
    return contact ? `${contact.company} - ${contact.name}` : 'Unknown Contact';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleSort = (field: 'updated' | 'created' | 'title') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(!!e.target.value);
              }}
              onFocus={() => {
                if (searchQuery) {
                  setShowSearchDropdown(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowSearchDropdown(false), 200);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
                <div className="py-1">
                  {searchResults.map((note) => (
                    <button
                      key={note.id}
                      onClick={() => {
                        onEditNote(note);
                        setShowSearchDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-amber-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{note.title}</div>
                      <div
                        className="text-sm text-gray-600 mt-1 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: formatNoteContent(note.content) }}
                      />
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        {note.contact_id && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <User className="w-3 h-3" />
                            {getContactName(note.contact_id)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(note.updated_at)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <select
            value={filterContact}
            onChange={(e) => setFilterContact(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">All Contacts</option>
            <option value="unattached">Unattached Notes</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.company} - {contact.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onAddNote}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Note
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600">Sort by:</span>
        <button
          onClick={() => toggleSort('updated')}
          className={`px-3 py-1 rounded-lg flex items-center gap-1 transition-colors ${
            sortBy === 'updated'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Last Updated
          {sortBy === 'updated' && (
            <ArrowUpDown className="w-3 h-3" />
          )}
        </button>
        <button
          onClick={() => toggleSort('created')}
          className={`px-3 py-1 rounded-lg flex items-center gap-1 transition-colors ${
            sortBy === 'created'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Date Created
          {sortBy === 'created' && (
            <ArrowUpDown className="w-3 h-3" />
          )}
        </button>
        <button
          onClick={() => toggleSort('title')}
          className={`px-3 py-1 rounded-lg flex items-center gap-1 transition-colors ${
            sortBy === 'title'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Title
          {sortBy === 'title' && (
            <ArrowUpDown className="w-3 h-3" />
          )}
        </button>
      </div>

      {filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <StickyNote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {notes.length === 0
              ? 'No notes yet. Create your first note!'
              : 'No notes match your search criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
                    {note.title}
                  </h3>
                  <div className="flex items-center gap-1">
                    {note.user_id === currentUserId && (
                      <button
                        onClick={() => {
                          setSelectedNoteForShare(note);
                          setShareModalOpen(true);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Share note"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onEditNote(note)}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="Edit note"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {note.user_id === currentUserId && (
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this note?')) {
                            onDeleteNote(note.id);
                          }
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete note"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div
                  className="text-sm text-gray-600 line-clamp-4"
                  dangerouslySetInnerHTML={{ __html: note.content ? formatNoteContent(note.content) : 'No content' }}
                />

                <div className="pt-3 border-t border-gray-100 space-y-2 text-xs text-gray-500">
                  {note.contact_id && (
                    <div className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      <span className="truncate">{getContactName(note.contact_id)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Updated: {formatDate(note.updated_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Created: {formatDate(note.created_at)}</span>
                  </div>
                  {note.user_id !== currentUserId && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Shared with you</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {shareModalOpen && selectedNoteForShare && (
        <ShareNoteModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedNoteForShare(null);
          }}
          noteId={selectedNoteForShare.id}
          noteTitle={selectedNoteForShare.title}
        />
      )}
    </div>
  );
}
