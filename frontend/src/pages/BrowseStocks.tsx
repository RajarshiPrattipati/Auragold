/**
 * Browse Stocks Page - Feature-rich stock browsing with search, filters, and real-time data
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchStocks } from '@/features/stocks/stocksSlice'
import { StockMiniChart } from '@/features/stocks'
import {
  Search,
  Grid3x3,
  List,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Filter,
  ArrowUpDown,
  ShoppingCart,
  Star,
  BarChart3,
} from 'lucide-react'
import { DynamicLayout } from '@/features/lms/DynamicLayout'
import { updateLayout } from '@/features/uiConfig/uiConfigSlice'

type ViewMode = 'grid' | 'list'
type SortOption = 'symbol' | 'price' | 'change'
type FilterOption = 'all' | 'gainers' | 'losers'

export default function BrowseStocks() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { items: stocks, loading, error } = useAppSelector((state) => state.stocks)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('symbol')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000])
  const [watchlist, setWatchlist] = useState<number[]>(() => {
    const saved = localStorage.getItem('watchlist')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    dispatch(fetchStocks())

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      dispatch(fetchStocks())
    }, 300000)

    return () => clearInterval(interval)
  }, [dispatch])

  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify(watchlist))
  }, [watchlist])

  const handleRefresh = () => {
    dispatch(fetchStocks())
  }

  const toggleWatchlist = (stockId: number) => {
    setWatchlist((prev) =>
      prev.includes(stockId) ? prev.filter((id) => id !== stockId) : [...prev, stockId]
    )
  }

  const handleBuyClick = (stockId: number, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click navigation
    navigate(`/trade?stock=${stockId}&type=buy`)
  }

  const handleStockClick = (stockId: number) => {
    navigate(`/stock/${stockId}`)
  }

  // Filter and sort stocks
  const filteredAndSortedStocks = stocks
    .filter((stock) => {
      // Search filter
      const matchesSearch =
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchQuery.toLowerCase())

      // Price range filter
      const matchesPriceRange =
        Number(stock.current_price) >= priceRange[0] && Number(stock.current_price) <= priceRange[1]

      // Gainers/Losers filter (mock - in real app would use price history)
      const priceChange = Math.random() * 20 - 10 // Mock change
      const matchesFilter =
        filterBy === 'all' ||
        (filterBy === 'gainers' && priceChange > 0) ||
        (filterBy === 'losers' && priceChange < 0)

      return matchesSearch && matchesPriceRange && matchesFilter
    })
    .sort((a, b) => {
      let compareValue = 0
      switch (sortBy) {
        case 'symbol':
          compareValue = a.symbol.localeCompare(b.symbol)
          break
        case 'price':
          compareValue = Number(a.current_price) - Number(b.current_price)
          break
        case 'change':
          // Mock - in real app would use actual price change
          compareValue = Math.random() - 0.5
          break
      }
      return sortOrder === 'asc' ? compareValue : -compareValue
    })

  // Calculate market statistics
  const marketStats = {
    totalStocks: stocks.length,
    avgPrice: stocks.reduce((sum, s) => sum + Number(s.current_price), 0) / (stocks.length || 1),
    highestPrice: Math.max(...stocks.map((s) => Number(s.current_price))),
    lowestPrice: Math.min(...stocks.map((s) => Number(s.current_price))),
  }

  const layoutItems = useMemo(
    () => [
      {
        id: 'market-stats',
        title: 'Market Statistics',
        render: () => (
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Stocks</p>
                    <p className="text-2xl font-bold text-gray-900">{marketStats.totalStocks}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Average Price</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${marketStats.avgPrice.toFixed(2)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Highest Price</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${marketStats.highestPrice.toFixed(2)}
                    </p>
                  </div>
                  <ArrowUpDown className="w-8 h-8 text-purple-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Lowest Price</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ${marketStats.lowestPrice.toFixed(2)}
                    </p>
                  </div>
                  <ArrowUpDown className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'search-filters',
        title: 'Search & Filters',
        render: () => (
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by symbol or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      value={filterBy}
                      onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    >
                      <option value="all">All Stocks</option>
                      <option value="gainers">Top Gainers</option>
                      <option value="losers">Top Losers</option>
                    </select>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="symbol">Sort by Symbol</option>
                    <option value="price">Sort by Price</option>
                    <option value="change">Sort by Change</option>
                  </select>
                </div>
                <div className="md:col-span-1">
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
                <div className="md:col-span-3 flex space-x-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    <Grid3x3 className="w-5 h-5" />
                    <span>Grid</span>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    <List className="w-5 h-5" />
                    <span>List</span>
                  </button>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range: ${priceRange[0]} - ${priceRange[1]}
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="10"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="10"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'stocks-display',
        title: 'Stocks',
        render: () => (
          <div className="max-w-7xl mx-auto">
            {filteredAndSortedStocks.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No stocks found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedStocks.map((stock) => {
                  const priceChange = Math.random() * 20 - 10
                  const isGainer = priceChange > 0
                  const isWatched = watchlist.includes(stock.id)
                  return (
                    <div
                      key={stock.id}
                      onClick={() => handleStockClick(stock.id)}
                      className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer relative"
                    >
                      {/* Removed expand icon on hover */}
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-gray-900 mb-1">
                              {stock.symbol}
                            </h3>
                            <p className="text-sm text-gray-600">{stock.name}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleWatchlist(stock.id)
                            }}
                            className={`p-2 rounded-lg transition-colors z-10 relative ${isWatched ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400 hover:bg-yellow-50 hover:text-yellow-500'}`}
                          >
                            <Star className="w-5 h-5" fill={isWatched ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                        <div className="mb-4">
                          <div className="flex items-baseline space-x-2">
                            <span className="text-3xl font-bold text-gray-900">
                              ${Number(stock.current_price).toFixed(2)}
                            </span>
                            <div
                              className={`flex items-center space-x-1 text-sm font-semibold ${isGainer ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {isGainer ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <TrendingDown className="w-4 h-4" />
                              )}
                              <span>
                                {isGainer ? '+' : ''}
                                {priceChange.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Last updated: {new Date(stock.updated_at).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="mb-4 h-20 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg overflow-hidden">
                          <StockMiniChart stockId={stock.id.toString()} height={80} />
                        </div>
                        <button
                          onClick={(e) => handleBuyClick(stock.id, e)}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-md hover:shadow-lg group-hover:scale-105 z-10 relative"
                        >
                          <ShoppingCart className="w-5 h-5" />
                          <span>Trade Now</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Change
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Watchlist
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredAndSortedStocks.map((stock) => {
                      const priceChange = Math.random() * 20 - 10
                      const isGainer = priceChange > 0
                      const isWatched = watchlist.includes(stock.id)
                      return (
                        <tr
                          key={stock.id}
                          onClick={() => handleStockClick(stock.id)}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <div>
                                <div className="font-bold text-gray-900">{stock.symbol}</div>
                                <div className="text-sm text-gray-500">{stock.name}</div>
                              </div>
                              {/* Removed expand icon on hover */}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="font-bold text-xl text-gray-900">
                              ${Number(stock.current_price).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(stock.updated_at).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div
                              className={`inline-flex items-center space-x-1 font-bold ${isGainer ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {isGainer ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <TrendingDown className="w-4 h-4" />
                              )}
                              <span>
                                {isGainer ? '+' : ''}
                                {priceChange.toFixed(2)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleWatchlist(stock.id)
                              }}
                              className={`p-2 rounded-lg transition-colors ${isWatched ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400 hover:bg-yellow-50 hover:text-yellow-500'}`}
                            >
                              <Star
                                className="w-5 h-5"
                                fill={isWatched ? 'currentColor' : 'none'}
                              />
                            </button>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={(e) => handleBuyClick(stock.id, e)}
                              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                              <ShoppingCart className="w-4 h-4" />
                              <span>Trade</span>
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ),
      },
    ],
    [
      marketStats,
      searchQuery,
      filterBy,
      sortBy,
      sortOrder,
      viewMode,
      priceRange,
      filteredAndSortedStocks,
      watchlist,
    ]
  )

  if (loading && stocks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading stocks...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 max-w-md">
          <h3 className="text-red-800 font-bold text-xl mb-3">Error Loading Stocks</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Browse Stocks</h1>
            <p className="text-gray-600">Explore and trade from {stocks.length} available stocks</p>
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

        {/* Dynamic, draggable layout */}
        <DynamicLayout
          items={layoutItems}
          storageKey="browse_layout_v1"
          onChange={(s) =>
            dispatch(
              updateLayout({
                key: 'browse_layout_v1',
                layout: { order: s.order, visibility: s.visibility },
              })
            )
          }
        />
      </div>

      {/* Loading Overlay */}
      {loading && stocks.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-5 py-3 rounded-lg shadow-2xl animate-pulse">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="font-medium">Updating stocks...</span>
          </div>
        </div>
      )}
    </div>
  )
}
