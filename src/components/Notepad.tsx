import { X, Save, StickyNote, ChevronDown, ChevronUp, FolderPlus } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Contact {
  id: string;
  name: string;
  company: string;
}

interface NotepadProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  onSave: (content: string) => void;
  showGoals: boolean;
  contacts?: Contact[];
  onSaveToNotesSection?: (title: string, content: string, contactId?: string) => Promise<void>;
  panelOrder?: string[];
  showNotepad?: boolean;
  showPriority?: boolean;
  notepadExpanded?: boolean;
  goalsExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

export default function Notepad({ isOpen, onClose, content, onSave, showGoals, contacts = [], onSaveToNotesSection, panelOrder = ['notes', 'goals', 'priority'], showNotepad = false, showPriority = false, notepadExpanded = true, goalsExpanded = true, onExpandedChange }: NotepadProps) {
  const [noteContent, setNoteContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(notepadExpanded);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveContactId, setSaveContactId] = useState('');
  const [isSavingToSection, setIsSavingToSection] = useState(false);

  useEffect(() => {
    setNoteContent(content);
  }, [content]);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(noteContent);
    setIsSaving(false);
  };

  const handleSaveToNotesSection = async () => {
    if (!saveTitle.trim() || !onSaveToNotesSection) return;

    setIsSavingToSection(true);
    try {
      await onSaveToNotesSection(saveTitle, noteContent, saveContactId || undefined);
      setShowSaveModal(false);
      setSaveTitle('');
      setSaveContactId('');
    } catch (error) {
      console.error('Error saving to notes section:', error);
    } finally {
      setIsSavingToSection(false);
    }
  };

  if (!isOpen) return null;

  const calculateTopPosition = () => {
    let top = 80;
    const myIndex = panelOrder.indexOf('notes');
    const PANEL_SPACING = 22;
    const PANEL_SIZES = {
      notesExpanded: 388,
      notesCollapsed: 52,
      goalsExpanded: 180,
      goalsCollapsed: 52,
      priority: 0
    };

    for (let i = 0; i < myIndex; i++) {
      const panelId = panelOrder[i];
      if (panelId === 'notes' && showNotepad) {
        const height = notepadExpanded ? PANEL_SIZES.notesExpanded : PANEL_SIZES.notesCollapsed;
        top += height + PANEL_SPACING;
      } else if (panelId === 'goals' && showGoals) {
        const height = goalsExpanded ? PANEL_SIZES.goalsExpanded : PANEL_SIZES.goalsCollapsed;
        top += height + PANEL_SPACING;
      } else if (panelId === 'priority' && showPriority) {
        top += PANEL_SIZES.priority + PANEL_SPACING;
      }
    }

    return top;
  };

  return (
    <div className="fixed right-4 z-40 w-80" style={{ top: `${calculateTopPosition()}px` }}>
      <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StickyNote className="w-5 h-5" />
            <h3 className="font-semibold">Notes</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                const newExpanded = !isExpanded;
                setIsExpanded(newExpanded);
                if (onExpandedChange) {
                  onExpandedChange(newExpanded);
                }
              }}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="p-4">
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Start typing your notes..."
              className="w-full h-64 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-sm"
            />
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Notes are automatically synced
              </div>
              {onSaveToNotesSection && (
                <button
                  onClick={() => setShowSaveModal(true)}
                  disabled={!noteContent.trim()}
                  className="px-3 py-1.5 bg-amber-600 text-white rounded text-xs hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  Save to Notes
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Save to Notes Section</h3>
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setSaveTitle('');
                  setSaveContactId('');
                }}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note Title *
                </label>
                <input
                  type="text"
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder="Enter a title for this note"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attach to Contact (Optional)
                </label>
                <select
                  value={saveContactId}
                  onChange={(e) => setSaveContactId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">No contact attached</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.company} - {contact.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 mb-1 font-medium">Note Preview:</p>
                <p className="text-sm text-gray-700 line-clamp-3">
                  {noteContent || 'No content'}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowSaveModal(false);
                    setSaveTitle('');
                    setSaveContactId('');
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveToNotesSection}
                  disabled={!saveTitle.trim() || isSavingToSection}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSavingToSection ? 'Saving...' : 'Save to Notes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
