import { X, TrendingUp, TrendingDown, BarChart3, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

interface MGOPricesModalProps {
  onClose: () => void;
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

export default function MGOPricesModal({ onClose }: MGOPricesModalProps) {
  const [data, setData] = useState<OilPricesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Oil & Fuel Prices</h2>
              {data && (
                <p className="text-sm text-gray-600">
                  Last updated: {formatDate(data.lastUpdated)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchPrices}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh prices"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {data && !loading && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.prices.map((price, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-600 mb-1">
                          {price.name}
                        </h3>
                        <p className="text-3xl font-bold text-gray-900">
                          ${price.price.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {price.currency} {price.unit}
                        </p>
                      </div>
                      <div
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                          price.change >= 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {price.change >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">
                          {Math.abs(price.changePercent).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
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
                  </div>
                ))}
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Comparison</h3>
                <div className="space-y-4">
                  {data.prices.map((price, index) => {
                    const percentage = (price.price / maxPrice) * 100;
                    const isPositive = price.change >= 0;

                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            {price.name}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            ${price.price.toFixed(2)}
                          </span>
                        </div>
                        <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                          <div
                            className={`absolute inset-y-0 left-0 rounded-lg transition-all duration-500 ${
                              index === 0
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                                : index === 1
                                ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                                : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                            }`}
                            style={{ width: `${percentage}%` }}
                          >
                            <div className="absolute inset-0 flex items-center justify-end pr-3">
                              <span className="text-xs font-medium text-white">
                                {isPositive ? '+' : ''}
                                {price.changePercent.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">About These Prices</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• WTI: West Texas Intermediate crude oil benchmark</li>
                  <li>• Brent: International crude oil benchmark</li>
                  <li>• MGO: Marine Gas Oil used for shipping fuel</li>
                  <li>• Prices are indicative and may vary by location and supplier</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
