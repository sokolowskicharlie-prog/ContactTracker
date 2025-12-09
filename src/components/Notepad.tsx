import { X, Save } from 'lucide-react';
import { useState, useEffect } from 'react';

interface NotepadProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  onSave: (content: string) => void;
}

export default function Notepad({ isOpen, onClose, content, onSave }: NotepadProps) {
  const [noteContent, setNoteContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);

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
    <div
      className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-amber-50">
          <h2 className="text-xl font-bold text-gray-900">Notes</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-4">
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Start typing your notes..."
            className="w-full h-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none font-mono text-sm"
          />
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
          Your notes are automatically saved and synced across sessions.
        </div>
      </div>
    </div>
  );
}
