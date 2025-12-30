import { X, GripVertical } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ButtonConfig {
  id: string;
  label: string;
  enabled: boolean;
}

interface ButtonOrderSettingsProps {
  onClose: () => void;
  onSave: (buttonOrder: string[]) => void;
  currentOrder: string[];
}

const DEFAULT_BUTTONS = [
  { id: 'copy-emails', label: 'Copy Emails' },
  { id: 'export', label: 'Export Excel' },
  { id: 'history', label: 'History' },
  { id: 'delete-all', label: 'Delete All' },
  { id: 'duplicates', label: 'Duplicates' },
  { id: 'settings', label: 'Settings' },
  { id: 'import', label: 'Import Excel' },
  { id: 'bulk-search', label: 'Bulk Search' },
  { id: 'add-contact', label: 'Add Contact' },
  { id: 'alerts', label: 'Alerts' },
];

export default function ButtonOrderSettings({ onClose, onSave, currentOrder }: ButtonOrderSettingsProps) {
  const [buttons, setButtons] = useState<ButtonConfig[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    const orderedButtons = currentOrder.map(id => {
      const button = DEFAULT_BUTTONS.find(b => b.id === id);
      return {
        id,
        label: button?.label || id,
        enabled: true,
      };
    });

    const missingButtons = DEFAULT_BUTTONS.filter(
      b => !currentOrder.includes(b.id)
    ).map(b => ({
      id: b.id,
      label: b.label,
      enabled: false,
    }));

    setButtons([...orderedButtons, ...missingButtons]);
  }, [currentOrder]);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newButtons = [...buttons];
    const draggedButton = newButtons[draggedIndex];
    newButtons.splice(draggedIndex, 1);
    newButtons.splice(index, 0, draggedButton);

    setButtons(newButtons);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = () => {
    const order = buttons.filter(b => b.enabled).map(b => b.id);
    onSave(order);
    onClose();
  };

  const toggleButton = (id: string) => {
    setButtons(buttons.map(b =>
      b.id === id ? { ...b, enabled: !b.enabled } : b
    ));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Organize Buttons</h2>
          <button
            onClick={() => {
              const order = buttons.filter(b => b.enabled).map(b => b.id);
              onSave(order);
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Drag and drop to reorder buttons. Click to enable/disable.
          </p>

          <div className="space-y-2">
            {buttons.map((button, index) => (
              <div
                key={button.id}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  button.enabled
                    ? 'bg-white border-gray-200 hover:border-blue-300'
                    : 'bg-gray-50 border-gray-100 opacity-50'
                } ${draggedIndex === index ? 'shadow-lg scale-105' : ''}`}
              >
                <div
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className="cursor-move"
                >
                  <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
                <span className="flex-1 font-medium text-gray-900">{button.label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={button.enabled}
                    onChange={() => toggleButton(button.id)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Save Order
          </button>
        </div>
      </div>
    </div>
  );
}
