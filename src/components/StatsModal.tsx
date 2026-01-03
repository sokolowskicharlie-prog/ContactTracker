import { X, PieChart as PieChartIcon } from 'lucide-react';
import { ContactWithActivity } from '../lib/supabase';
import PieChart from './PieChart';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: ContactWithActivity[];
}

export default function StatsModal({ isOpen, onClose, contacts }: StatsModalProps) {
  if (!isOpen) return null;

  // Calculate status distribution
  const statusCounts = {
    client: contacts.filter(c => c.is_client).length,
    traction: contacts.filter(c => !c.is_client && c.has_traction).length,
    jammed: contacts.filter(c => !c.is_client && !c.has_traction && c.is_jammed).length,
    none: contacts.filter(c => !c.is_client && !c.has_traction && !c.is_jammed).length,
  };

  const statusData = [
    { label: 'Client', value: statusCounts.client, color: '#16a34a' },
    { label: 'Traction', value: statusCounts.traction, color: '#eab308' },
    { label: 'Jammed', value: statusCounts.jammed, color: '#dc2626' },
    { label: 'None', value: statusCounts.none, color: '#6b7280' },
  ].filter(item => item.value > 0);

  // Calculate priority distribution
  const priorityCounts: Record<number, number> = {
    0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
  };

  contacts.forEach(contact => {
    if (contact.priority_rank !== null && contact.priority_rank !== undefined) {
      priorityCounts[contact.priority_rank]++;
    }
  });

  const priorityData = [
    { label: 'Client (0)', value: priorityCounts[0], color: '#16a34a' },
    { label: 'Highest (1)', value: priorityCounts[1], color: '#dc2626' },
    { label: 'High (2)', value: priorityCounts[2], color: '#f97316' },
    { label: 'Medium (3)', value: priorityCounts[3], color: '#eab308' },
    { label: 'Low (4)', value: priorityCounts[4], color: '#3b82f6' },
    { label: 'Lowest (5)', value: priorityCounts[5], color: '#6b7280' },
  ].filter(item => item.value > 0);

  const noPriority = contacts.filter(c => c.priority_rank === null || c.priority_rank === undefined).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <PieChartIcon className="w-6 h-6" />
            <h2 className="text-xl font-semibold">Contact Statistics</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Status Distribution */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
                Status Distribution
              </h3>
              <PieChart data={statusData} size={240} />
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600 text-center">
                  Total Contacts: <span className="font-semibold text-gray-900">{contacts.length}</span>
                </div>
              </div>
            </div>

            {/* Priority Distribution */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
                Priority Distribution
              </h3>
              <PieChart data={priorityData} size={240} />
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-1">
                <div className="text-sm text-gray-600 text-center">
                  With Priority: <span className="font-semibold text-gray-900">{contacts.length - noPriority}</span>
                </div>
                {noPriority > 0 && (
                  <div className="text-sm text-gray-600 text-center">
                    No Priority: <span className="font-semibold text-gray-900">{noPriority}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-700">{statusCounts.client}</div>
              <div className="text-sm text-green-600 mt-1">Clients</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-700">{statusCounts.traction}</div>
              <div className="text-sm text-yellow-600 mt-1">Traction</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-700">{statusCounts.jammed}</div>
              <div className="text-sm text-red-600 mt-1">Jammed</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-700">{statusCounts.none}</div>
              <div className="text-sm text-gray-600 mt-1">None</div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
