import { X, Save, StickyNote, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';

interface NotepadProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  onSave: (content: string) => void;
  showGoals: boolean;
}

export default function Notepad({ isOpen, onClose, content, onSave, showGoals }: NotepadProps) {
  const [noteContent, setNoteContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    setNoteContent(content);
  }, [content]);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(noteContent);
    setIsSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed ${showGoals ? 'top-[32rem]' : 'top-20'} right-4 z-40 w-80`}>
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
              onClick={() => setIsExpanded(!isExpanded)}
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
            <div className="mt-2 text-xs text-gray-500">
              Notes are automatically synced
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
