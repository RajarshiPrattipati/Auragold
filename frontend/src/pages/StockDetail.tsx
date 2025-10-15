/**
 * Stock Detail Page - Displays detailed stock information with interactive price chart
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchStocks } from '@/features/stocks/stocksSlice';
import { StockPriceChart } from '@/features/stocks';
import {
  ArrowLeft,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Info,
  Star,
} from 'lucide-react';

export default function StockDetail() {
  const { stockId } = useParams<{ stockId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items: stocks, loading } = useAppSelector((state) => state.stocks);
  const [isWatched, setIsWatched] = useState(false);

  useEffect(() => {
    if (stocks.length === 0) {
      dispatch(fetchStocks());
    }
  }, [dispatch, stocks.length]);

  useEffect(() => {
    const watchlist = localStorage.getItem('watchlist');
    if (watchlist && stockId) {
      const list = JSON.parse(watchlist);
      setIsWatched(list.includes(Number(stockId)));
    }
  }, [stockId]);

  const stock = stocks.find((s) => s.id === Number(stockId));

  const toggleWatchlist = () => {
    const watchlist = localStorage.getItem('watchlist');
    const list = watchlist ? JSON.parse(watchlist) : [];
    const newList = isWatched
      ? list.filter((id: number) => id !== Number(stockId))
      : [...list, Number(stockId)];
    localStorage.setItem('watchlist', JSON.stringify(newList));
    setIsWatched(!isWatched);
  };

  const handleBuyClick = () => {
    navigate(`/trade?stock=${stockId}&type=buy`);
  };

  const handleRefresh = () => {
    dispatch(fetchStocks());
  };

  if (loading && !stock) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading stock details...</p>
        </div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 max-w-md text-center">
          <h3 className="text-red-800 font-bold text-xl mb-3">Stock Not Found</h3>
          <p className="text-red-600 mb-4">
            The stock with ID {stockId} could not be found.
          </p>
          <Link
            to="/browse-stocks"
            className="inline-block px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Browse All Stocks
          </Link>
        </div>
      </div>
    );
  }

  // Mock price change - in real app would come from API
  const priceChange = Math.random() * 20 - 10;
  const isGainer = priceChange > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/browse-stocks')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Browse</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Stock Overview Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-start space-x-4">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    {stock.symbol}
                  </h1>
                  <p className="text-xl text-gray-600 mb-4">{stock.name}</p>

                  {/* Price Display */}
                  <div className="flex items-baseline space-x-3">
                    <span className="text-5xl font-bold text-gray-900">
                      ${Number(stock.current_price).toFixed(2)}
                    </span>
                    <div
                      className={`flex items-center space-x-1 text-lg font-semibold ${
                        isGainer ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {isGainer ? (
                        <TrendingUp className="w-6 h-6" />
                      ) : (
                        <TrendingDown className="w-6 h-6" />
                      )}
                      <span>
                        {isGainer ? '+' : ''}
                        {priceChange.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Last updated: {new Date(stock.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col space-y-3 mt-4 md:mt-0">
              <button
                onClick={handleBuyClick}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Trade Now</span>
              </button>
              <button
                onClick={toggleWatchlist}
                className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg transition-colors font-medium ${
                  isWatched
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Star
                  className="w-5 h-5"
                  fill={isWatched ? 'currentColor' : 'none'}
                />
                <span>{isWatched ? 'Remove from Watchlist' : 'Add to Watchlist'}</span>
              </button>
            </div>
          </div>

          {/* Stock Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-blue-600 mb-1">
                <Info className="w-4 h-4" />
                <span className="text-sm font-medium">Stock ID</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stock.id}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-green-600 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Current Price</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                ${Number(stock.current_price).toFixed(2)}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-purple-600 mb-1">
                <Info className="w-4 h-4" />
                <span className="text-sm font-medium">Created</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(stock.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Price Chart */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Price History</h2>
          <StockPriceChart
            stockId={stock.id}
            stockSymbol={stock.symbol}
            stockName={stock.name}
            height={500}
          />
        </div>
      </div>
    </div>
  );
}
