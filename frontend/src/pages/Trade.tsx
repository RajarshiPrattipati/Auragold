/**
 * Trade Page - Comprehensive trading interface with buy/sell operations
 */
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchStocks } from '@/features/stocks/stocksSlice';
import { fetchPortfolio } from '@/features/portfolio/portfolioSlice';
import { buyStock, sellStock, clearLastTransaction } from '@/features/transactions/transactionsSlice';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ArrowLeftRight,
  AlertCircle,
  CheckCircle,
  Info,
  Calculator,
  Wallet,
  ShoppingCart,
  XCircle,
} from 'lucide-react';

type TransactionType = 'buy' | 'sell';

export default function Trade() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();

  const { items: stocks, loading: stocksLoading } = useAppSelector((state) => state.stocks);
  const { summary } = useAppSelector((state) => state.portfolio);
  const user = useAppSelector((state) => state.user);
  const { loading: transactionLoading, error: transactionError, lastTransaction } = useAppSelector(
    (state) => state.transactions
  );

  const [transactionType, setTransactionType] = useState<TransactionType>(
    (searchParams.get('type') as TransactionType) || 'buy'
  );
  const [selectedStockId, setSelectedStockId] = useState<number | null>(
    searchParams.get('stock') ? Number(searchParams.get('stock')) : null
  );
  const [amount, setAmount] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    dispatch(fetchStocks());
    if (user.id) {
      dispatch(fetchPortfolio(user.id));
    }
  }, [dispatch, user.id]);

  useEffect(() => {
    if (lastTransaction && !transactionError) {
      setShowSuccess(true);
      setAmount('');
      setQuantity('');
      setTimeout(() => {
        setShowSuccess(false);
        dispatch(clearLastTransaction());
        if (user.id) {
          dispatch(fetchPortfolio(user.id));
        }
      }, 3000);
    }
  }, [lastTransaction, transactionError, dispatch, user.id]);

  const selectedStock = stocks.find((s) => s.id === selectedStockId);
  const userHolding = summary?.holdings.find((h) => h.stock_id === selectedStockId);

  // Calculate values
  const calculateQuantityFromAmount = (amt: string): number => {
    if (!selectedStock || !amt) return 0;
    return Number(amt) / Number(selectedStock.current_price);
  };

  const calculateAmountFromQuantity = (qty: string): number => {
    if (!selectedStock || !qty) return 0;
    return Number(qty) * Number(selectedStock.current_price);
  };

  const calculatedQuantity = transactionType === 'buy' && amount
    ? calculateQuantityFromAmount(amount)
    : Number(quantity) || 0;

  const calculatedAmount = transactionType === 'sell' && quantity
    ? calculateAmountFromQuantity(quantity)
    : Number(amount) || 0;

  // Validation
  const getValidationError = (): string | null => {
    if (!selectedStockId) return 'Please select a stock';
    if (!selectedStock) return 'Invalid stock selected';

    if (transactionType === 'buy') {
      if (!amount || Number(amount) <= 0) return 'Enter a valid amount';
      if (Number(amount) > Number(summary?.cash_balance || 0)) {
        return 'Insufficient balance';
      }
      if (Number(amount) < 1) return 'Minimum purchase amount is $1';
    } else {
      if (!quantity || Number(quantity) <= 0) return 'Enter a valid quantity';
      if (!userHolding) return 'You do not own this stock';
      if (Number(quantity) > Number(userHolding.quantity)) {
        return `Insufficient quantity (you own ${Number(userHolding.quantity).toFixed(2)})`;
      }
    }

    return null;
  };

  const validationError = getValidationError();

  const handleTransactionTypeChange = (type: TransactionType) => {
    setTransactionType(type);
    setAmount('');
    setQuantity('');
    dispatch(clearLastTransaction());
  };

  const handleStockChange = (stockId: number) => {
    setSelectedStockId(stockId);
    setAmount('');
    setQuantity('');
    dispatch(clearLastTransaction());
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setQuantity('');
  };

  const handleQuantityChange = (value: string) => {
    setQuantity(value);
    setAmount('');
  };

  const handleSubmit = () => {
    if (validationError) return;
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    if (!selectedStockId || !user.id) return;

    if (transactionType === 'buy') {
      await dispatch(
        buyStock({
          user_id: user.id,
          stock_id: selectedStockId,
          amount: calculatedAmount,
        })
      );
    } else {
      await dispatch(
        sellStock({
          user_id: user.id,
          stock_id: selectedStockId,
          quantity: calculatedQuantity,
        })
      );
    }

    setShowConfirmation(false);
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    dispatch(clearLastTransaction());
  };

  if (stocksLoading && stocks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading trading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Trade Stocks</h1>
          <p className="text-gray-600">
            Buy and sell stocks with real-time pricing
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trading Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8">
              {/* Transaction Type Toggle */}
              <div className="flex space-x-4 mb-8">
                <button
                  onClick={() => handleTransactionTypeChange('buy')}
                  className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 rounded-xl font-bold text-lg transition-all ${
                    transactionType === 'buy'
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <ShoppingCart className="w-6 h-6" />
                  <span>Buy</span>
                </button>
                <button
                  onClick={() => handleTransactionTypeChange('sell')}
                  className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 rounded-xl font-bold text-lg transition-all ${
                    transactionType === 'sell'
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <DollarSign className="w-6 h-6" />
                  <span>Sell</span>
                </button>
              </div>

              {/* Stock Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Stock
                </label>
                <select
                  value={selectedStockId || ''}
                  onChange={(e) => handleStockChange(Number(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                >
                  <option value="">Choose a stock...</option>
                  {stocks.map((stock) => (
                    <option key={stock.id} value={stock.id}>
                      {stock.symbol} - {stock.name} (${Number(stock.current_price).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Input Fields */}
              {selectedStock && (
                <div className="space-y-6 mb-6">
                  {transactionType === 'buy' ? (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Amount to Invest ($)
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl font-semibold"
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        Available balance: ${Number(summary?.cash_balance || 0).toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Quantity to Sell
                      </label>
                      <div className="relative">
                        <Package className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => handleQuantityChange(e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          max={userHolding ? Number(userHolding.quantity) : 0}
                          className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl font-semibold"
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        You own: {userHolding ? Number(userHolding.quantity).toFixed(2) : '0.00'} shares
                      </p>
                    </div>
                  )}

                  {/* Calculation Display */}
                  {((transactionType === 'buy' && amount) || (transactionType === 'sell' && quantity)) && (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Calculator className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-blue-900 mb-2">
                            Transaction Summary
                          </p>
                          <div className="space-y-1 text-sm text-blue-800">
                            <div className="flex justify-between">
                              <span>Quantity:</span>
                              <span className="font-semibold">
                                {calculatedQuantity.toFixed(6)} shares
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Price per share:</span>
                              <span className="font-semibold">
                                ${Number(selectedStock.current_price).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-blue-300">
                              <span className="font-bold">Total {transactionType === 'buy' ? 'Cost' : 'Value'}:</span>
                              <span className="font-bold text-lg">
                                ${calculatedAmount.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Validation Error */}
              {validationError && (
                <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-900">
                        Cannot proceed
                      </p>
                      <p className="text-sm text-red-700">{validationError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Error */}
              {transactionError && (
                <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-900">
                        Transaction Failed
                      </p>
                      <p className="text-sm text-red-700">{transactionError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!!validationError || transactionLoading}
                className={`w-full flex items-center justify-center space-x-3 px-6 py-4 rounded-xl font-bold text-lg transition-all ${
                  transactionType === 'buy'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                    : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                } text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg`}
              >
                <ArrowLeftRight className="w-6 h-6" />
                <span>
                  {transactionLoading
                    ? 'Processing...'
                    : `${transactionType === 'buy' ? 'Buy' : 'Sell'} ${selectedStock?.symbol || 'Stock'}`}
                </span>
              </button>
            </div>
          </div>

          {/* Sidebar - Stock Info & Account Summary */}
          <div className="lg:col-span-1 space-y-6">
            {/* Selected Stock Info */}
            {selectedStock && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Stock Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Symbol</p>
                    <p className="text-xl font-bold text-gray-900">
                      {selectedStock.symbol}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Company</p>
                    <p className="font-semibold text-gray-900">
                      {selectedStock.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Current Price</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ${Number(selectedStock.current_price).toFixed(2)}
                    </p>
                  </div>
                  {userHolding && (
                    <>
                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600">Your Holdings</p>
                        <p className="text-lg font-bold text-gray-900">
                          {Number(userHolding.quantity).toFixed(2)} shares
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Average Buy Price</p>
                        <p className="font-semibold text-gray-900">
                          ${Number(userHolding.average_buy_price).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Current Value</p>
                        <p className="text-lg font-bold text-gray-900">
                          ${Number(userHolding.current_value).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Gain/Loss</p>
                        <div
                          className={`flex items-center space-x-1 font-bold ${
                            Number(userHolding.gain_loss) >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {Number(userHolding.gain_loss) >= 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          <span>
                            ${Math.abs(Number(userHolding.gain_loss)).toFixed(2)} (
                            {Number(userHolding.gain_loss_percentage).toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Account Summary */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center space-x-2 mb-4">
                <Wallet className="w-6 h-6" />
                <h3 className="text-lg font-bold">Account Summary</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-blue-100 text-sm">Cash Balance</p>
                  <p className="text-2xl font-bold">
                    ${Number(summary?.cash_balance || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Total Invested</p>
                  <p className="text-lg font-semibold">
                    ${Number(summary?.total_invested || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Portfolio Value</p>
                  <p className="text-lg font-semibold">
                    ${Number(summary?.current_value || 0).toLocaleString()}
                  </p>
                </div>
                <div className="pt-3 border-t border-blue-400">
                  <p className="text-blue-100 text-sm">Total Gain/Loss</p>
                  <p
                    className={`text-lg font-bold ${
                      Number(summary?.gain_loss_amount || 0) >= 0
                        ? 'text-green-200'
                        : 'text-red-200'
                    }`}
                  >
                    {Number(summary?.gain_loss_amount || 0) >= 0 ? '+' : ''}$
                    {Number(summary?.gain_loss_amount || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-900 mb-1">
                    Trading Tips
                  </p>
                  <ul className="text-xs text-yellow-800 space-y-1">
                    <li>• Prices update every 5 minutes</li>
                    <li>• Minimum transaction: $1</li>
                    <li>• Review calculations before confirming</li>
                    <li>• Check your portfolio after trading</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && selectedStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Confirm {transactionType === 'buy' ? 'Purchase' : 'Sale'}
            </h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Stock:</span>
                <span className="font-bold text-gray-900">
                  {selectedStock.symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-bold text-gray-900">
                  {calculatedQuantity.toFixed(6)} shares
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price per share:</span>
                <span className="font-bold text-gray-900">
                  ${Number(selectedStock.current_price).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <span className="font-bold text-gray-900">Total:</span>
                <span className="font-bold text-2xl text-blue-600">
                  ${calculatedAmount.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={transactionLoading}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-colors ${
                  transactionType === 'buy'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {transactionLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && lastTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Transaction Successful!
            </h3>
            <p className="text-gray-600 mb-6">
              Your {transactionType} order has been executed.
            </p>
            <button
              onClick={() => navigate('/portfolio')}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              View Portfolio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
