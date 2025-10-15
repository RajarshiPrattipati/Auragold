/**
 * Portfolio Page - Comprehensive portfolio view with holdings, analytics, and insights
 */
import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchPortfolio } from '@/features/portfolio/portfolioSlice';
import { TrendingUp, TrendingDown, DollarSign, PieChart, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { DynamicLayout } from '@/features/lms/DynamicLayout';
import { updateLayout } from '@/features/uiConfig/uiConfigSlice';

export default function Portfolio() {
  const dispatch = useAppDispatch();
  const { summary, loading, error } = useAppSelector((state) => state.portfolio);
  const user = useAppSelector((state) => state.user);
  const [sortBy, setSortBy] = useState<'value' | 'gain' | 'symbol'>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (user.id) {
      dispatch(fetchPortfolio(user.id));
    }

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      if (user.id) {
        dispatch(fetchPortfolio(user.id));
      }
    }, 300000);

    return () => clearInterval(interval);
  }, [dispatch, user.id]);

  const handleRefresh = () => {
    if (user.id) {
      dispatch(fetchPortfolio(user.id));
    }
  };

  const sortedHoldings = summary?.holdings ? [...summary.holdings].sort((a, b) => {
    let compareValue = 0;
    switch (sortBy) {
      case 'value':
        compareValue = a.current_value - b.current_value;
        break;
      case 'gain':
        compareValue = a.gain_loss - b.gain_loss;
        break;
      case 'symbol':
        compareValue = a.stock_symbol.localeCompare(b.stock_symbol);
        break;
    }
    return sortOrder === 'asc' ? compareValue : -compareValue;
  }) : [];

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 max-w-md">
          <h3 className="text-red-800 font-bold text-xl mb-3">Error Loading Portfolio</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 text-lg">No portfolio data available</p>
      </div>
    );
  }

  const totalValue = Number(summary.total_invested) + Number(summary.cash_balance);
  const portfolioAllocation = summary.holdings.map(h => ({
    symbol: h.stock_symbol,
    value: Number(h.current_value),
    percentage: (Number(h.current_value) / Number(summary.current_value)) * 100
  }));

  const layoutItems = useMemo(
    () => [
      {
        id: 'summary-cards',
        title: 'Summary',
        render: () => (
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8 opacity-80" />
                  <span className="text-blue-100 text-sm font-medium">Total Value</span>
                </div>
                <p className="text-3xl font-bold mb-1">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-blue-100 text-sm">Cash: ${Number(summary.cash_balance).toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8 opacity-80" />
                  <span className="text-purple-100 text-sm font-medium">Invested</span>
                </div>
                <p className="text-3xl font-bold mb-1">${Number(summary.total_invested).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <p className="text-purple-100 text-sm">{summary.holdings.length} positions</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <PieChart className="w-8 h-8 opacity-80" />
                  <span className="text-green-100 text-sm font-medium">Market Value</span>
                </div>
                <p className="text-3xl font-bold mb-1">${Number(summary.current_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <p className="text-green-100 text-sm">Current holdings</p>
              </div>
              <div className={`bg-gradient-to-br ${Number(summary.gain_loss_amount) >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600'} rounded-xl shadow-lg p-6 text-white`}>
                <div className="flex items-center justify-between mb-2">
                  {Number(summary.gain_loss_amount) >= 0 ? <ArrowUpRight className="w-8 h-8 opacity-80" /> : <ArrowDownRight className="w-8 h-8 opacity-80" />}
                  <span className="text-white/90 text-sm font-medium">Total Gain/Loss</span>
                </div>
                <p className="text-3xl font-bold mb-1">{Number(summary.gain_loss_amount) >= 0 ? '+' : ''}${Number(summary.gain_loss_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <p className="text-white/90 text-sm">{Number(summary.gain_loss_percentage) >= 0 ? '+' : ''}{Number(summary.gain_loss_percentage).toFixed(2)}%</p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'allocation',
        title: 'Allocation',
        render: () => (
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Portfolio Allocation</h2>
              <div className="space-y-3">
                {portfolioAllocation.map((item) => (
                  <div key={item.symbol} className="flex items-center">
                    <div className="w-24 font-semibold text-gray-700">{item.symbol}</div>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500" style={{ width: `${item.percentage}%` }} />
                      </div>
                    </div>
                    <div className="w-32 text-right">
                      <span className="font-semibold text-gray-900">{item.percentage.toFixed(1)}%</span>
                      <span className="text-sm text-gray-500 ml-2">${item.value.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'holdings',
        title: 'Holdings',
        render: () => (
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Holdings</h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Sort by:</span>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="value">Current Value</option>
                      <option value="gain">Gain/Loss</option>
                      <option value="symbol">Symbol</option>
                    </select>
                    <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Avg Price</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Current Price</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Invested</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Current Value</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Gain/Loss</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Return</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedHoldings.map((holding) => {
                      const gainLossAmount = Number(holding.gain_loss)
                      const gainLossPercentage = Number(holding.gain_loss_percentage)
                      const isProfit = gainLossAmount >= 0
                      return (
                        <tr key={holding.stock_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-bold text-gray-900">{holding.stock_symbol}</div>
                              <div className="text-sm text-gray-500">{holding.stock_name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-gray-900">{Number(holding.quantity).toFixed(2)}</td>
                          <td className="px-6 py-4 text-right text-gray-700">${Number(holding.average_buy_price).toFixed(2)}</td>
                          <td className="px-6 py-4 text-right font-semibold text-blue-600">${Number(holding.current_price).toFixed(2)}</td>
                          <td className="px-6 py-4 text-right text-gray-700">${Number(holding.invested).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="px-6 py-4 text-right font-semibold text-gray-900">${Number(holding.current_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="px-6 py-4 text-right">
                            <div className={`inline-flex items-center space-x-1 font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                              {isProfit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                              <span>{isProfit ? '+' : ''}${Math.abs(gainLossAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${isProfit ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {isProfit ? '+' : ''}{gainLossPercentage.toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {sortedHoldings.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No holdings in your portfolio</p>
                  <p className="text-gray-400 text-sm mt-2">Start trading to build your portfolio!</p>
                </div>
              )}
            </div>
          </div>
        ),
      },
    ],
    [sortedHoldings, summary, totalValue, portfolioAllocation, sortBy, sortOrder]
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Portfolio</h1>
            <p className="text-gray-600">
              Account: <span className="font-semibold">{user.name}</span> (ID: {user.id})
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Dynamic layout for portfolio sections */}
      <DynamicLayout
        items={layoutItems}
        storageKey="portfolio_layout_v1"
        onChange={(s) =>
          dispatch(updateLayout({ key: 'portfolio_layout_v1', layout: { order: s.order, visibility: s.visibility } }))
        }
      />

      {/* Loading Overlay */}
      {loading && summary && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-5 py-3 rounded-lg shadow-2xl animate-pulse">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="font-medium">Updating portfolio...</span>
          </div>
        </div>
      )}
    </div>
  );
}
