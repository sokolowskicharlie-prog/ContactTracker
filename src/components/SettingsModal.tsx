import { X, Mail, Bell, Save, Plus, Trash2, GripVertical, List } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface PhoneType {
  id: string;
  label: string;
  value: string;
  is_default: boolean;
  display_order: number;
}

interface EmailType {
  id: string;
  label: string;
  value: string;
  is_default: boolean;
  display_order: number;
}

interface SettingsModalProps {
  onClose: () => void;
  panelSpacing?: number;
  onSavePanelSpacing?: (spacing: number) => void;
  onOpenPriorityLabels?: () => void;
}

export default function SettingsModal({ onClose, panelSpacing = 8, onSavePanelSpacing, onOpenPriorityLabels }: SettingsModalProps) {
  const [spacing, setSpacing] = useState(panelSpacing);
  const [phoneTypes, setPhoneTypes] = useState<PhoneType[]>([]);
  const [newPhoneTypeLabel, setNewPhoneTypeLabel] = useState('');
  const [isAddingPhoneType, setIsAddingPhoneType] = useState(false);
  const [emailTypes, setEmailTypes] = useState<EmailType[]>([]);
  const [newEmailTypeLabel, setNewEmailTypeLabel] = useState('');
  const [isAddingEmailType, setIsAddingEmailType] = useState(false);

  useEffect(() => {
    setSpacing(panelSpacing);
  }, [panelSpacing]);

  useEffect(() => {
    fetchPhoneTypes();
    fetchEmailTypes();
  }, []);

  const fetchPhoneTypes = async () => {
    const { data, error } = await supabase
      .from('custom_phone_types')
      .select('*')
      .order('display_order');

    if (!error && data) {
      setPhoneTypes(data);
    }
  };

  const handleAddPhoneType = async () => {
    if (!newPhoneTypeLabel.trim()) return;

    const value = newPhoneTypeLabel.toLowerCase().replace(/\s+/g, '_');
    const maxOrder = Math.max(...phoneTypes.map(t => t.display_order), 0);

    const { data, error } = await supabase
      .from('custom_phone_types')
      .insert({
        label: newPhoneTypeLabel.trim(),
        value: value,
        is_default: false,
        display_order: maxOrder + 1,
      })
      .select()
      .single();

    if (!error && data) {
      setPhoneTypes([...phoneTypes, data]);
      setNewPhoneTypeLabel('');
      setIsAddingPhoneType(false);
    }
  };

  const handleDeletePhoneType = async (id: string) => {
    const { error } = await supabase
      .from('custom_phone_types')
      .delete()
      .eq('id', id);

    if (!error) {
      setPhoneTypes(phoneTypes.filter(t => t.id !== id));
    }
  };

  const fetchEmailTypes = async () => {
    const { data, error } = await supabase
      .from('custom_email_types')
      .select('*')
      .order('display_order');

    if (!error && data) {
      setEmailTypes(data);
    }
  };

  const handleAddEmailType = async () => {
    if (!newEmailTypeLabel.trim()) return;

    const value = newEmailTypeLabel.toLowerCase().replace(/\s+/g, '_');
    const maxOrder = Math.max(...emailTypes.map(t => t.display_order), 0);

    const { data, error } = await supabase
      .from('custom_email_types')
      .insert({
        label: newEmailTypeLabel.trim(),
        value: value,
        is_default: false,
        display_order: maxOrder + 1,
      })
      .select()
      .single();

    if (!error && data) {
      setEmailTypes([...emailTypes, data]);
      setNewEmailTypeLabel('');
      setIsAddingEmailType(false);
    }
  };

  const handleDeleteEmailType = async (id: string) => {
    const { error } = await supabase
      .from('custom_email_types')
      .delete()
      .eq('id', id);

    if (!error) {
      setEmailTypes(emailTypes.filter(t => t.id !== id));
    }
  };

  const handleSpacingChange = (newSpacing: number) => {
    setSpacing(newSpacing);
    if (onSavePanelSpacing) {
      onSavePanelSpacing(newSpacing);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Priority Labels
            </label>
            <button
              type="button"
              onClick={() => {
                if (onOpenPriorityLabels) {
                  onOpenPriorityLabels();
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <List className="w-4 h-4" />
              Customize Priority Labels
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Change the labels for priority ranks (0-5) to match your workflow
            </p>
          </div>

          <div className="border-t border-gray-200 pt-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Panel Spacing
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="40"
                value={spacing}
                onChange={(e) => handleSpacingChange(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-sm font-medium text-gray-900 w-12 text-right">
                {spacing}px
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Adjust the vertical spacing between Notes, Goals, and Priority panels
            </p>
          </div>

          <div className="border-t border-gray-200 pt-5">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Phone Type Options
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
              {phoneTypes.map((type) => (
                <div key={type.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg group">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 text-sm text-gray-700">{type.label}</span>
                  {!type.is_default && (
                    <button
                      type="button"
                      onClick={() => handleDeletePhoneType(type.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {isAddingPhoneType ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPhoneTypeLabel}
                  onChange={(e) => setNewPhoneTypeLabel(e.target.value)}
                  placeholder="e.g., Direct Line"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPhoneType();
                    } else if (e.key === 'Escape') {
                      setIsAddingPhoneType(false);
                      setNewPhoneTypeLabel('');
                    }
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddPhoneType}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingPhoneType(false);
                    setNewPhoneTypeLabel('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingPhoneType(true)}
                className="w-full px-3 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Custom Phone Type
              </button>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Add custom phone type options that will appear in dropdowns throughout the app. Default options cannot be removed.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-5">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Email Type Options
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
              {emailTypes.map((type) => (
                <div key={type.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg group">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 text-sm text-gray-700">{type.label}</span>
                  {!type.is_default && (
                    <button
                      type="button"
                      onClick={() => handleDeleteEmailType(type.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {isAddingEmailType ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newEmailTypeLabel}
                  onChange={(e) => setNewEmailTypeLabel(e.target.value)}
                  placeholder="e.g., Work, Business"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddEmailType();
                    } else if (e.key === 'Escape') {
                      setIsAddingEmailType(false);
                      setNewEmailTypeLabel('');
                    }
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddEmailType}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingEmailType(false);
                    setNewEmailTypeLabel('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingEmailType(true)}
                className="w-full px-3 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Custom Email Type
              </button>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Add custom email type options that will appear in dropdowns throughout the app. Default options cannot be removed.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
