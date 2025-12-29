import { X, GripVertical, StickyNote, Target, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PanelConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface PanelOrderSettingsProps {
  onClose: () => void;
  onSave: (panelOrder: string[]) => void;
  currentOrder: string[];
}

const DEFAULT_PANELS: PanelConfig[] = [
  { id: 'notes', label: 'Notes', icon: <StickyNote className="w-5 h-5" /> },
  { id: 'goals', label: 'Goals', icon: <Target className="w-5 h-5" /> },
  { id: 'priority', label: 'Priority Contacts', icon: <TrendingUp className="w-5 h-5" /> },
];

export default function PanelOrderSettings({ onClose, onSave, currentOrder }: PanelOrderSettingsProps) {
  const [panels, setPanels] = useState<PanelConfig[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    const orderedPanels = currentOrder
      .map(id => DEFAULT_PANELS.find(p => p.id === id))
      .filter((p): p is PanelConfig => p !== undefined);

    const missingPanels = DEFAULT_PANELS.filter(
      p => !currentOrder.includes(p.id)
    );

    setPanels([...orderedPanels, ...missingPanels]);
  }, [currentOrder]);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newPanels = [...panels];
    const draggedPanel = newPanels[draggedIndex];
    newPanels.splice(draggedIndex, 1);
    newPanels.splice(index, 0, draggedPanel);

    setPanels(newPanels);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = () => {
    const order = panels.map(p => p.id);
    onSave(order);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Panel Order</h2>
          <button
            onClick={() => {
              const order = panels.map(p => p.id);
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
            Drag and drop to reorder toggle boxes. Top item will appear first from the top.
          </p>

          <div className="space-y-2">
            {panels.map((panel, index) => (
              <div
                key={panel.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 bg-white border-gray-200 hover:border-blue-300 transition-all cursor-move ${
                  draggedIndex === index ? 'shadow-lg scale-105' : ''
                }`}
              >
                <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-gray-600">{panel.icon}</div>
                  <span className="font-medium text-gray-900">{panel.label}</span>
                </div>
                <span className="text-sm text-gray-500">#{index + 1}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              The order you set here determines how the panels stack vertically on the right side of the screen.
            </p>
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
