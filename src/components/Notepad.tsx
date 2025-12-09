import { Save } from 'lucide-react';
import { useState, useEffect } from 'react';

interface NotepadProps {
  content: string;
  onSave: (content: string) => void;
}

export default function Notepad({ content, onSave }: NotepadProps) {
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

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-3 py-1.5 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <textarea
        value={noteContent}
        onChange={(e) => setNoteContent(e.target.value)}
        placeholder="Start typing your notes..."
        className="w-full h-32 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-sm"
      />

      <p className="text-xs text-gray-500 mt-2">
        Your notes are automatically saved and synced across sessions.
      </p>
    </div>
  );
}
