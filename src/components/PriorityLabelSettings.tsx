import { useState, useEffect } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PriorityLabelSettingsProps {
  onClose: () => void;
  userId: string;
}

const defaultLabels = {
  0: 'Client',
  1: 'Highest',
  2: 'High',
  3: 'Medium',
  4: 'Low',
  5: 'Lowest'
};

export default function PriorityLabelSettings({ onClose, userId }: PriorityLabelSettingsProps) {
  const [labels, setLabels] = useState<Record<string, string>>(defaultLabels);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadCustomLabels();
  }, [userId]);

  const loadCustomLabels = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('custom_priority_labels')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data?.custom_priority_labels) {
        setLabels({ ...defaultLabels, ...data.custom_priority_labels });
      }
    } catch (error) {
      console.error('Error loading custom labels:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setSaveSuccess(false);

    try {
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_preferences')
          .update({ custom_priority_labels: labels })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_preferences')
          .insert({
            user_id: userId,
            custom_priority_labels: labels
          });

        if (error) throw error;
      }

      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error saving labels:', error);
      alert('Failed to save priority labels');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setLabels(defaultLabels);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Customize Priority Labels</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-6">
            Customize the labels for each priority rank. The priority numbers (0-5) will remain the same.
          </p>

          <div className="space-y-4">
            {Object.entries(labels).map(([rank, label]) => (
              <div key={rank} className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-32">
                  <span className="text-sm font-medium text-gray-700">Priority {rank}:</span>
                </div>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabels({ ...labels, [rank]: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Enter label for priority ${rank}`}
                />
              </div>
            ))}
          </div>

          {saveSuccess && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
              Priority labels saved successfully! Refreshing...
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Labels'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
