/**
 * Dashboard - Now using DynamicLayout for drag-and-drop and visibility controls
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchStocks } from '@/features/stocks/stocksSlice'
import { fetchPortfolio } from '@/features/portfolio/portfolioSlice'
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  BarChart3,
  ShoppingCart,
  Eye,
  RefreshCw,
  Wallet,
  Star,
  AlertCircle,
} from 'lucide-react'
import { DynamicLayout } from '@/features/lms/DynamicLayout'
import { updateLayout } from '@/features/uiConfig/uiConfigSlice'

export default function Dashboard() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { items: stocks, loading: stocksLoading } = useAppSelector((state) => state.stocks)
  const { summary, loading: portfolioLoading } = useAppSelector((state) => state.portfolio)
  const user = useAppSelector((state) => state.user)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    dispatch(fetchStocks())
    if (user.id) {
      dispatch(fetchPortfolio(user.id))
    }

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      dispatch(fetchStocks())
      if (user.id) {
        dispatch(fetchPortfolio(user.id))
      }
    }, 300000)

    return () => clearInterval(interval)
  }, [dispatch, user.id])

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([dispatch(fetchStocks()), user.id && dispatch(fetchPortfolio(user.id))])
    setTimeout(() => setRefreshing(false), 500)
  }

  // Calculate market statistics
  const marketStats = {
    totalStocks: stocks.length,
    avgPrice: stocks.reduce((sum, s) => sum + Number(s.current_price), 0) / (stocks.length || 1),
    topGainer: stocks.reduce((max, s) => (Number(s.current_price) > Number(max.current_price) ? s : max), stocks[0]),
    topLoser: stocks.reduce((min, s) => (Number(s.current_price) < Number(min.current_price) ? s : min), stocks[0]),
  }

  // Portfolio calculations
  const totalValue = Number(summary?.total_invested || 0) + Number(summary?.cash_balance || 0)
  const isProfit = Number(summary?.gain_loss_amount || 0) >= 0

  // Featured stocks (top 3 by price)
  const featuredStocks = [...stocks].sort((a, b) => Number(b.current_price) - Number(a.current_price)).slice(0, 3)

  const loading = stocksLoading || portfolioLoading

  const layoutItems = useMemo(
    () => [
      {
        id: 'stats',
        title: 'Quick Stats',
        render: () => (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Wallet className="w-8 h-8 opacity-80" />
                <span className="text-blue-100 text-sm font-medium">Total Value</span>
              </div>
              <p className="text-3xl font-bold mb-1">
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-blue-100 text-sm">Cash: ${Number(summary?.cash_balance || 0).toLocaleString()}</p>
            </div>
            <div className={`bg-gradient-to-br ${isProfit ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'} rounded-xl shadow-lg p-6 text-white`}>
              <div className="flex items-center justify-between mb-2">
                {isProfit ? <TrendingUp className="w-8 h-8 opacity-80" /> : <TrendingDown className="w-8 h-8 opacity-80" />}
                <span className="text-white/80 text-sm font-medium">P/L</span>
              </div>
              <p className="text-3xl font-bold mb-1">
                {isProfit ? '+' : ''}{Number(summary?.gain_loss_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-white/80 text-sm">{isProfit ? 'Profit' : 'Loss'} today</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <PieChart className="w-8 h-8 opacity-80" />
                <span className="text-purple-100 text-sm font-medium">Positions</span>
              </div>
              <p className="text-3xl font-bold mb-1">{summary?.holdings.length || 0}</p>
              <p className="text-purple-100 text-sm">Active holdings</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-8 h-8 opacity-80" />
                <span className="text-orange-100 text-sm font-medium">Market</span>
              </div>
              <p className="text-3xl font-bold mb-1">{marketStats.totalStocks}</p>
              <p className="text-orange-100 text-sm">Stocks available</p>
            </div>
          </div>
        ),
      },
      {
        id: 'quick-actions',
        title: 'Quick Actions',
        render: () => (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button onClick={() => navigate('/browse')} className="w-full flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg">
                <Eye className="w-5 h-5" />
                <span className="font-semibold">Browse Stocks</span>
              </button>
              <button onClick={() => navigate('/trade')} className="w-full flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg">
                <ShoppingCart className="w-5 h-5" />
                <span className="font-semibold">Start Trading</span>
              </button>
              <button onClick={() => navigate('/portfolio')} className="w-full flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg">
                <BarChart3 className="w-5 h-5" />
                <span className="font-semibold">View Portfolio</span>
              </button>
            </div>
          </div>
        ),
      },
      {
        id: 'market-leaders',
        title: 'Market Leaders',
        render: () => (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Market Leaders</h2>
            <div className="space-y-3">
              {marketStats.topGainer && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-green-600 font-semibold">TOP GAINER</p>
                      <p className="font-bold text-gray-900">{marketStats.topGainer.symbol}</p>
                      <p className="text-sm text-gray-600">{marketStats.topGainer.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">${Number(marketStats.topGainer.current_price).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
              {marketStats.topLoser && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-600 font-semibold">MOST AFFORDABLE</p>
                      <p className="font-bold text-gray-900">{marketStats.topLoser.symbol}</p>
                      <p className="text-sm text-gray-600">{marketStats.topLoser.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">${Number(marketStats.topLoser.current_price).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        id: 'featured-stocks',
        title: 'Featured Stocks',
        render: () => (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Featured Stocks</h2>
              <button onClick={() => navigate('/browse')} className="text-blue-600 hover:text-blue-700 font-semibold text-sm">View All →</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredStocks.map((stock, index) => {
                const priceChange = Math.random() * 10 - 5
                const isGainer = priceChange > 0
                return (
                  <div key={stock.id} className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all cursor-pointer" onClick={() => navigate(`/trade?stock=${stock.id}&type=buy`)}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-bold text-gray-900">{stock.symbol}</h3>
                          {index === 0 && <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />}
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1">{stock.name}</p>
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="text-2xl font-bold text-gray-900">${Number(stock.current_price).toFixed(2)}</p>
                      <div className={`flex items-center space-x-1 text-sm font-semibold ${isGainer ? 'text-green-600' : 'text-red-600'}`}>
                        {isGainer ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        <span>{isGainer ? '+' : ''}{priceChange.toFixed(2)}%</span>
                      </div>
                    </div>
                    <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">Trade Now</button>
                  </div>
                )
              })}
            </div>
          </div>
        ),
      },
      {
        id: 'top-holdings',
        title: 'Top Holdings',
        defaultVisible: (summary?.holdings?.length || 0) > 0,
        render: () => (
          summary && summary.holdings.length > 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Your Top Holdings</h2>
                <button onClick={() => navigate('/portfolio')} className="text-blue-600 hover:text-blue-700 font-semibold text-sm">View All →</button>
              </div>
              <div className="space-y-3">
                {summary.holdings.slice(0, 3).map((holding) => {
                  const isProfit = Number(holding.gain_loss) >= 0
                  return (
                    <div key={holding.stock_id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="font-bold text-gray-900">{holding.stock_symbol}</p>
                            <p className="text-sm text-gray-500">{Number(holding.quantity).toFixed(2)} shares</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">${Number(holding.current_value).toLocaleString()}</p>
                        <div className={`flex items-center justify-end space-x-1 text-sm font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                          {isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          <span>{isProfit ? '+' : ''}{Number(holding.gain_loss_percentage).toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow p-6 text-sm text-gray-500">No holdings yet. Buy your first stock to see it here.</div>
          )
        ),
      },
      {
        id: 'market-info',
        title: 'Market Info',
        render: () => (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">Real-time Market Data</p>
                <p className="text-xs text-blue-800">Stock prices are updated every 5 minutes. All transactions are processed instantly with current market prices.</p>
              </div>
            </div>
          </div>
        ),
      },
    ],
    [featuredStocks, isProfit, marketStats.totalStocks, navigate, summary]
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome back, {user.name}!</h1>
              <p className="text-gray-600">Here's your market overview and portfolio summary</p>
            </div>
            <button onClick={handleRefresh} disabled={refreshing} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Dynamic layout with drag-and-drop + visibility settings */}
        <DynamicLayout
          items={layoutItems}
          storageKey="dashboard_layout_v1"
          onChange={(s) =>
            dispatch(
              updateLayout({ key: 'dashboard_layout_v1', layout: { order: s.order, visibility: s.visibility } })
            )
          }
        />
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-5 py-3 rounded-lg shadow-2xl animate-pulse">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="font-medium">Loading data...</span>
          </div>
        </div>
      )}
    </div>
  )
}
