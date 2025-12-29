import { X, Mail, Bell, Save } from 'lucide-react';
import { useState, useEffect } from 'react';

interface NotificationSettings {
  id?: string;
  user_email: string;
  days_before_reminder: number;
  enabled: boolean;
}

interface SettingsModalProps {
  onClose: () => void;
  onSave: (settings: NotificationSettings) => void;
  currentSettings?: NotificationSettings;
  panelSpacing?: number;
  onSavePanelSpacing?: (spacing: number) => void;
}

export default function SettingsModal({ onClose, onSave, currentSettings, panelSpacing = 8, onSavePanelSpacing }: SettingsModalProps) {
  const [email, setEmail] = useState('');
  const [daysBefore, setDaysBefore] = useState('1');
  const [enabled, setEnabled] = useState(true);
  const [spacing, setSpacing] = useState(panelSpacing);

  useEffect(() => {
    if (currentSettings) {
      setEmail(currentSettings.user_email);
      setDaysBefore(currentSettings.days_before_reminder.toString());
      setEnabled(currentSettings.enabled);
    }
  }, [currentSettings]);

  useEffect(() => {
    setSpacing(panelSpacing);
  }, [panelSpacing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    onSave({
      ...(currentSettings?.id ? { id: currentSettings.id } : {}),
      user_email: email.trim(),
      days_before_reminder: parseInt(daysBefore),
      enabled,
    });

    onClose();
  };

  const handleSpacingChange = (newSpacing: number) => {
    setSpacing(newSpacing);
    if (onSavePanelSpacing) {
      onSavePanelSpacing(newSpacing);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 mb-1">Automatic Email Reminders</h3>
                <p className="text-sm text-blue-800">
                  Receive email notifications before your scheduled calls are due. The system checks daily and sends reminders based on your settings.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Enable email reminders
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!enabled}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="your.email@example.com"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Reminders will be sent to this email address
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Send Reminder
            </label>
            <select
              value={daysBefore}
              onChange={(e) => setDaysBefore(e.target.value)}
              disabled={!enabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="0">On the day the call is due</option>
              <option value="1">1 day before</option>
              <option value="2">2 days before</option>
              <option value="3">3 days before</option>
              <option value="5">5 days before</option>
              <option value="7">1 week before</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              When to send the reminder before a call is due
            </p>
          </div>

          <div>
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

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">How it works:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• The system checks daily for upcoming calls</li>
              <li>• You'll receive one email per day with all reminders</li>
              <li>• Only contacts with call reminders enabled will be included</li>
              <li>• Reminders are sent based on the last call date + reminder interval</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
