import { useState, useEffect } from 'react';
import { X, Save, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

interface NotificationSettings {
  enable_notifications: boolean;
  notification_frequency: number;
  behind_schedule_message: string;
  goal_achieved_message: string;
  goal_missed_message: string;
  motivational_messages: {
    excellent: string;
    good: string;
    almost: string;
    halfWay: string;
    needsWork: string;
  };
}

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationSettingsModal({ isOpen, onClose }: NotificationSettingsModalProps) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>({
    enable_notifications: true,
    notification_frequency: 30,
    behind_schedule_message: '⚠️ Behind Schedule',
    goal_achieved_message: '🎉 Goal Completed!',
    goal_missed_message: "⏰ Time's Up!",
    motivational_messages: {
      excellent: "Outstanding! You're crushing it!",
      good: "Great job! You hit your target!",
      almost: "Almost there! Push a bit harder next time.",
      halfWay: "Good effort, but you can do better!",
      needsWork: "Time to step it up! You've got this!"
    }
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadSettings();
    }
  }, [isOpen, user]);

  const loadSettings = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('goal_notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setSettings({
        enable_notifications: data.enable_notifications,
        notification_frequency: data.notification_frequency,
        behind_schedule_message: data.behind_schedule_message,
        goal_achieved_message: data.goal_achieved_message,
        goal_missed_message: data.goal_missed_message,
        motivational_messages: data.motivational_messages
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('goal_notification_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('goal_notification_settings')
          .update({
            enable_notifications: settings.enable_notifications,
            notification_frequency: settings.notification_frequency,
            behind_schedule_message: settings.behind_schedule_message,
            goal_achieved_message: settings.goal_achieved_message,
            goal_missed_message: settings.goal_missed_message,
            motivational_messages: settings.motivational_messages,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('goal_notification_settings')
          .insert([{
            user_id: user.id,
            enable_notifications: settings.enable_notifications,
            notification_frequency: settings.notification_frequency,
            behind_schedule_message: settings.behind_schedule_message,
            goal_achieved_message: settings.goal_achieved_message,
            goal_missed_message: settings.goal_missed_message,
            motivational_messages: settings.motivational_messages
          }]);

        if (error) throw error;
      }

      onClose();
    } catch (error) {
      console.error('Error saving notification settings:', error);
      alert('Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Notification Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enable_notifications}
                onChange={(e) => setSettings({ ...settings, enable_notifications: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <div className="font-semibold text-gray-900">Enable Notifications</div>
                <div className="text-sm text-gray-600">Show goal progress alerts and reminders</div>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check Frequency (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="120"
              value={settings.notification_frequency}
              onChange={(e) => setSettings({ ...settings, notification_frequency: parseInt(e.target.value) || 30 })}
              disabled={!settings.enable_notifications}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
            />
            <p className="mt-1 text-sm text-gray-500">How often to check your goal progress</p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Messages</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Behind Schedule Message
                </label>
                <input
                  type="text"
                  value={settings.behind_schedule_message}
                  onChange={(e) => setSettings({ ...settings, behind_schedule_message: e.target.value })}
                  disabled={!settings.enable_notifications}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="⚠️ Behind Schedule"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal Achieved Message
                </label>
                <input
                  type="text"
                  value={settings.goal_achieved_message}
                  onChange={(e) => setSettings({ ...settings, goal_achieved_message: e.target.value })}
                  disabled={!settings.enable_notifications}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="🎉 Goal Completed!"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal Missed Message
                </label>
                <input
                  type="text"
                  value={settings.goal_missed_message}
                  onChange={(e) => setSettings({ ...settings, goal_missed_message: e.target.value })}
                  disabled={!settings.enable_notifications}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="⏰ Time's Up!"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Motivational Messages</h3>
            <p className="text-sm text-gray-600 mb-4">Customize the motivational messages shown based on your performance</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excellent Performance (150%+)
                </label>
                <input
                  type="text"
                  value={settings.motivational_messages.excellent}
                  onChange={(e) => setSettings({
                    ...settings,
                    motivational_messages: { ...settings.motivational_messages, excellent: e.target.value }
                  })}
                  disabled={!settings.enable_notifications}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="Outstanding! You're crushing it!"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Good Performance (100-149%)
                </label>
                <input
                  type="text"
                  value={settings.motivational_messages.good}
                  onChange={(e) => setSettings({
                    ...settings,
                    motivational_messages: { ...settings.motivational_messages, good: e.target.value }
                  })}
                  disabled={!settings.enable_notifications}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="Great job! You hit your target!"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Almost There (80-99%)
                </label>
                <input
                  type="text"
                  value={settings.motivational_messages.almost}
                  onChange={(e) => setSettings({
                    ...settings,
                    motivational_messages: { ...settings.motivational_messages, almost: e.target.value }
                  })}
                  disabled={!settings.enable_notifications}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="Almost there! Push a bit harder next time."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Halfway Performance (50-79%)
                </label>
                <input
                  type="text"
                  value={settings.motivational_messages.halfWay}
                  onChange={(e) => setSettings({
                    ...settings,
                    motivational_messages: { ...settings.motivational_messages, halfWay: e.target.value }
                  })}
                  disabled={!settings.enable_notifications}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="Good effort, but you can do better!"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Needs Improvement (0-49%)
                </label>
                <input
                  type="text"
                  value={settings.motivational_messages.needsWork}
                  onChange={(e) => setSettings({
                    ...settings,
                    motivational_messages: { ...settings.motivational_messages, needsWork: e.target.value }
                  })}
                  disabled={!settings.enable_notifications}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="Time to step it up! You've got this!"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
