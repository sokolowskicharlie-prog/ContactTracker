import { X, TrendingUp, TrendingDown, BarChart3, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';

interface MGOPricesModalProps {
  onClose: () => void;
  showGoals?: boolean;
  showNotepad?: boolean;
  showPriority?: boolean;
  panelOrder?: string[];
  notepadExpanded?: boolean;
  goalsExpanded?: boolean;
  priorityExpanded?: boolean;
  panelSpacing?: number;
  isOpen: boolean;
}

interface OilPrice {
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  unit: string;
}

interface OilPricesData {
  prices: OilPrice[];
  lastUpdated: string;
}

export default function MGOPricesModal({
  onClose,
  showGoals = false,
  showNotepad = false,
  showPriority = false,
  panelOrder = ['notes', 'goals', 'priority', 'mgo'],
  notepadExpanded = true,
  goalsExpanded = true,
  priorityExpanded = true,
  panelSpacing = 2,
  isOpen
}: MGOPricesModalProps) {
  const [data, setData] = useState<OilPricesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isOpen) return null;

  const fetchPrices = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-oil-prices`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch oil prices');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching oil prices:', err);
      setError('Failed to load oil prices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const maxPrice = data ? Math.max(...data.prices.map(p => p.price)) : 100;

  const calculateTopPosition = () => {
    let top = 16;
    const PANEL_HEADER_HEIGHT = 52;
    const spacing = panelSpacing * 16;

    const mgoIndex = panelOrder.indexOf('mgo');

    panelOrder.forEach((panel, index) => {
      if (index < mgoIndex) {
        if (panel === 'notes' && showNotepad) {
          top += PANEL_HEADER_HEIGHT + spacing;
          if (notepadExpanded) {
            top += 400;
          }
        } else if (panel === 'goals' && showGoals) {
          top += PANEL_HEADER_HEIGHT + spacing;
          if (goalsExpanded) {
            top += 400;
          }
        } else if (panel === 'priority' && showPriority) {
          top += PANEL_HEADER_HEIGHT + spacing;
          if (priorityExpanded) {
            top += 400;
          }
        }
      }
    });

    return top;
  };

  return (
    <div
      className="fixed right-4 z-40 w-96"
      style={{ top: `${calculateTopPosition()}px` }}
    >
      <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            <h3 className="font-semibold">Oil & Fuel Prices</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchPrices}
              disabled={loading}
              className="p-1 hover:bg-white/20 rounded transition-colors disabled:opacity-50"
              title="Refresh prices"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
          <div className="p-3 max-h-[600px] overflow-y-auto">
            {data && (
              <div className="mb-2 text-xs text-gray-600">
                Updated: {formatDate(data.lastUpdated)}
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {data && !loading && (
              <div className="space-y-3">
                <div className="space-y-2">
                {data.prices.map((price, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-xs font-medium text-gray-600 mb-0.5">
                          {price.name}
                        </h3>
                        <p className="text-xl font-bold text-gray-900">
                          ${price.price.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {price.currency} {price.unit}
                        </p>
                      </div>
                      <div
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${
                          price.change >= 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {price.change >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span className="text-xs font-medium">
                          {Math.abs(price.changePercent).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs pt-2 border-t border-gray-200">
                      <span className="text-gray-600">Change:</span>
                      <span
                        className={`font-medium ${
                          price.change >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {price.change >= 0 ? '+' : ''}
                        ${price.change.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Price Comparison</h3>
                <div className="space-y-3">
                  {data.prices.map((price, index) => {
                    const percentage = (price.price / maxPrice) * 100;
                    const isPositive = price.change >= 0;

                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-700">
                            {price.name}
                          </span>
                          <span className="text-xs font-semibold text-gray-900">
                            ${price.price.toFixed(2)}
                          </span>
                        </div>
                        <div className="relative h-6 bg-gray-100 rounded overflow-hidden">
                          <div
                            className={`absolute inset-y-0 left-0 rounded transition-all duration-500 ${
                              index === 0
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                                : index === 1
                                ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                                : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                            }`}
                            style={{ width: `${percentage}%` }}
                          >
                            <div className="absolute inset-0 flex items-center justify-end pr-2">
                              <span className="text-xs font-medium text-white">
                                {isPositive ? '+' : ''}
                                {price.changePercent.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-blue-900 mb-2">About These Prices</h4>
                <ul className="text-xs text-blue-800 space-y-0.5">
                  <li>• WTI: West Texas Intermediate crude oil</li>
                  <li>• Brent: International crude oil benchmark</li>
                  <li>• MGO: Marine Gas Oil for shipping</li>
                  <li>• Prices vary by location and supplier</li>
                </ul>
              </div>
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  );
}
