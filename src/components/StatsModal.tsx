import { X, PieChart as PieChartIcon, Phone, Edit2, Check, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ContactWithActivity, supabase } from '../lib/supabase';
import PieChart from './PieChart';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: ContactWithActivity[];
}

export default function StatsModal({ isOpen, onClose, contacts }: StatsModalProps) {
  const [callsGoal, setCallsGoal] = useState(100);
  const [totalCalls, setTotalCalls] = useState(0);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateFilterEnabled, setDateFilterEnabled] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCallsData();
    }
  }, [isOpen, startDate, endDate, dateFilterEnabled]);

  const loadCallsData = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('calls_goal')
        .eq('user_id', user.user.id)
        .maybeSingle();

      if (prefs) {
        setCallsGoal(prefs.calls_goal || 100);
      }

      let query = supabase
        .from('calls')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.user.id);

      if (dateFilterEnabled && startDate) {
        query = query.gte('call_date', `${startDate}T00:00:00`);
      }

      if (dateFilterEnabled && endDate) {
        query = query.lte('call_date', `${endDate}T23:59:59`);
      }

      const { count } = await query;

      setTotalCalls(count || 0);
    } catch (error) {
      console.error('Error loading calls data:', error);
    }
  };

  const startEditingGoal = () => {
    setEditingGoal(true);
    setGoalInput(callsGoal.toString());
  };

  const saveGoal = async () => {
    const newGoal = parseInt(goalInput);
    if (isNaN(newGoal) || newGoal < 1) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from('user_preferences')
        .update({ calls_goal: newGoal })
        .eq('user_id', user.user.id);

      if (error) throw error;

      setCallsGoal(newGoal);
      setEditingGoal(false);
      setGoalInput('');
    } catch (error) {
      console.error('Error updating calls goal:', error);
    }
  };

  const cancelEditingGoal = () => {
    setEditingGoal(false);
    setGoalInput('');
  };

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

  const remaining = Math.max(0, callsGoal - totalCalls);
  const callsData = [
    { label: 'Calls Made', value: totalCalls, color: '#16a34a' },
    { label: 'Remaining', value: remaining, color: '#e5e7eb' },
  ].filter(item => item.value > 0);

  const callsPercentage = callsGoal > 0 ? Math.round((totalCalls / callsGoal) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Calls Progress */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Calls Progress
                </h3>
                {editingGoal ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          saveGoal();
                        } else if (e.key === 'Escape') {
                          cancelEditingGoal();
                        }
                      }}
                      autoFocus
                      min="1"
                    />
                    <button
                      onClick={saveGoal}
                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={startEditingGoal}
                    className="flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600"
                  >
                    <span>Goal: {callsGoal}</span>
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="mb-4 space-y-3">
                <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Date Filter</span>
                  <button
                    onClick={() => setDateFilterEnabled(!dateFilterEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      dateFilterEnabled ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        dateFilterEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={!dateFilterEnabled}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Start Date"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={!dateFilterEnabled}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="End Date"
                  />
                </div>
                {dateFilterEnabled && (startDate || endDate) && (
                  <button
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="w-full px-3 py-1.5 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    Clear Dates
                  </button>
                )}
              </div>

              <PieChart data={callsData} size={200} />
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4 text-green-600" />
                  <span className="text-2xl font-bold text-green-700">{totalCalls}</span>
                  <span className="text-sm text-gray-600">/ {callsGoal}</span>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{callsPercentage}%</div>
                  <div className="text-xs text-gray-600">Complete</div>
                </div>
              </div>
            </div>

            {/* Status Distribution */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                Status Distribution
              </h3>
              <PieChart data={statusData} size={200} />
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600 text-center">
                  Total Contacts: <span className="font-semibold text-gray-900">{contacts.length}</span>
                </div>
              </div>
            </div>

            {/* Priority Distribution */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                Priority Distribution
              </h3>
              <PieChart data={priorityData} size={200} />
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
