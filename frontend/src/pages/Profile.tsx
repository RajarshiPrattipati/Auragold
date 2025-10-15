/**
 * Profile Page - User profile and account management
 */
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchPortfolio } from '@/features/portfolio/portfolioSlice';
import {
  User,
  Mail,
  Shield,
  Wallet,
  TrendingUp,
  Calendar,
  Settings,
  Bell,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  Edit2,
  Save,
  X,
} from 'lucide-react';

export default function Profile() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user);
  const { summary } = useAppSelector((state) => state.portfolio);

  const [editMode, setEditMode] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [formData, setFormData] = useState({
    name: user.name || 'User',
    email: 'trader@auragold.com', // Mock email since it's not in user state
  });
  const [notifications, setNotifications] = useState({
    priceAlerts: true,
    portfolioUpdates: true,
    tradingActivity: true,
    systemUpdates: false,
  });
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (user.id) {
      dispatch(fetchPortfolio(user.id));
    }
  }, [dispatch, user.id]);

  const handleSave = () => {
    // In a real app, this would dispatch an action to update the user profile
    setEditMode(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || 'User',
      email: 'trader@auragold.com',
    });
    setEditMode(false);
  };

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  // Calculate account statistics
  const accountAge = Math.floor(Math.random() * 365) + 1; // Mock
  const totalTrades = summary?.holdings.length || 0;
  const totalReturn = Number(summary?.gain_loss_percentage || 0);
  const totalValue = Number(summary?.total_invested || 0) + Number(summary?.cash_balance || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Profile</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-xl p-4 animate-pulse">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm font-semibold text-green-900">
                Changes saved successfully!
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Profile Information
                </h2>
                {!editMode ? (
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCancel}
                      className="flex items-center space-x-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center space-x-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {formData.name}
                    </h3>
                    <p className="text-gray-600">User ID: {user.id}</p>
                    {editMode && (
                      <button className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                        Change Avatar
                      </button>
                    )}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>Full Name</span>
                      </div>
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium px-4 py-2.5 bg-gray-50 rounded-lg">
                        {formData.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>Email Address</span>
                      </div>
                    </label>
                    {editMode ? (
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium px-4 py-2.5 bg-gray-50 rounded-lg">
                        {formData.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4" />
                        <span>Account Type</span>
                      </div>
                    </label>
                    <p className="text-gray-900 font-medium px-4 py-2.5 bg-gray-50 rounded-lg">
                      Standard Trader
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Member Since</span>
                      </div>
                    </label>
                    <p className="text-gray-900 font-medium px-4 py-2.5 bg-gray-50 rounded-lg">
                      {accountAge} days ago
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Security Settings
              </h2>
              <div className="space-y-4">
                <button className="w-full flex items-center justify-between px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Lock className="w-5 h-5 text-gray-600" />
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">
                        Change Password
                      </p>
                      <p className="text-sm text-gray-600">
                        Update your password regularly for security
                      </p>
                    </div>
                  </div>
                  <Edit2 className="w-5 h-5 text-gray-400" />
                </button>

                <button className="w-full flex items-center justify-between px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-gray-600" />
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">
                        Two-Factor Authentication
                      </p>
                      <p className="text-sm text-gray-600">
                        Add an extra layer of security
                      </p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    Enabled
                  </div>
                </button>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Notification Preferences
              </h2>
              <div className="space-y-4">
                {Object.entries(notifications).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Bell className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {key
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, (str) => str.toUpperCase())}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleNotificationToggle(
                          key as keyof typeof notifications
                        )
                      }
                      className={`relative w-14 h-8 rounded-full transition-colors ${
                        value ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                          value ? 'transform translate-x-6' : ''
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Account Balance Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Wallet className="w-6 h-6" />
                  <h3 className="text-lg font-bold">Account Balance</h3>
                </div>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-2 rounded-lg hover:bg-blue-400 transition-colors"
                >
                  {showBalance ? (
                    <Eye className="w-5 h-5" />
                  ) : (
                    <EyeOff className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-blue-100 text-sm">Cash Balance</p>
                  <p className="text-3xl font-bold">
                    {showBalance
                      ? `$${Number(summary?.cash_balance || 0).toLocaleString()}`
                      : '••••••'}
                  </p>
                </div>
                <div className="pt-3 border-t border-blue-400">
                  <p className="text-blue-100 text-sm">Total Value</p>
                  <p className="text-xl font-semibold">
                    {showBalance
                      ? `$${totalValue.toLocaleString()}`
                      : '••••••'}
                  </p>
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Performance Stats
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Return</p>
                      <p
                        className={`text-lg font-bold ${
                          totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {totalReturn >= 0 ? '+' : ''}
                        {totalReturn.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Settings className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Active Positions</p>
                      <p className="text-lg font-bold text-gray-900">
                        {totalTrades}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Account Age</p>
                      <p className="text-lg font-bold text-gray-900">
                        {accountAge} days
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                  Add Funds
                </button>
                <button className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold">
                  Withdraw
                </button>
                <button className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold">
                  Transaction History
                </button>
              </div>
            </div>

            {/* Account Status */}
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-900 mb-1">
                    Account Verified
                  </p>
                  <p className="text-xs text-green-800">
                    Your account is fully verified and ready to trade.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
