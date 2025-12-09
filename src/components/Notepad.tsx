import { X, Save, StickyNote, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase, SavedNote } from '../lib/supabase';
import { useAuth } from '../lib/auth';

interface NotepadProps {
  isOpen: boolean;
  onClose: () => void;
  showGoals: boolean;
  editingNote?: SavedNote | null;
  onNoteSaved?: () => void;
}

export default function Notepad({ isOpen, onClose, showGoals, editingNote, onNoteSaved }: NotepadProps) {
  const { user } = useAuth();
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (editingNote) {
      setNoteTitle(editingNote.title);
      setNoteContent(editingNote.content);
    } else {
      setNoteTitle('');
      setNoteContent('');
    }
  }, [editingNote]);

  const handleSave = async () => {
    if (!user) return;
    if (!noteTitle.trim() && !noteContent.trim()) return;

    setIsSaving(true);

    try {
      if (editingNote) {
        const { error } = await supabase
          .from('saved_notes')
          .update({
            title: noteTitle.trim() || 'Untitled Note',
            content: noteContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingNote.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('saved_notes')
          .insert({
            user_id: user.id,
            title: noteTitle.trim() || 'Untitled Note',
            content: noteContent
          });

        if (error) throw error;
      }

      if (onNoteSaved) onNoteSaved();
      setNoteTitle('');
      setNoteContent('');
      onClose();
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewNote = () => {
    setNoteTitle('');
    setNoteContent('');
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed ${showGoals ? 'top-[32rem]' : 'top-20'} right-4 z-40 w-80`}>
      <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StickyNote className="w-5 h-5" />
            <h3 className="font-semibold">{editingNote ? 'Edit Note' : 'New Note'}</h3>
          </div>
          <div className="flex items-center gap-2">
            {editingNote && (
              <button
                onClick={handleNewNote}
                className="p-1 bg-white/20 hover:bg-white/30 rounded transition-colors"
                title="New note"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || (!noteTitle.trim() && !noteContent.trim())}
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
          <div className="p-4 space-y-3">
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Note title..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm font-medium"
            />
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Start typing your notes..."
              className="w-full h-64 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-sm"
            />
            <div className="text-xs text-gray-500">
              {editingNote ? 'Editing saved note' : 'Create a new note'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
