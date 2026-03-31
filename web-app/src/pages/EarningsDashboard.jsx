import React, { useState, useEffect } from 'react';
import { DollarSign, AlertCircle } from 'lucide-react';
import axios from '../api/axiosInstance';

const EarningsDashboard = () => {
  const [earnings, setEarnings] = useState([]);
  const [shopName, setShopName] = useState('');
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalUnsettled: 0,
    unsettledCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedEarning, setExpandedEarning] = useState(null);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const shopId = localStorage.getItem('selectedShopId');
      
      const params = {};
      if (shopId) params.shopId = shopId;
      
      const response = await axios.get('/settlements/earnings', { params });
      
      if (response.data.success) {
        // Show ALL earnings (both settled and unsettled)
        const allEarnings = response.data.earnings || [];
        setEarnings(allEarnings);
        
        // Get shop name from first earning
        if (allEarnings.length > 0 && allEarnings[0].shop) {
          setShopName(allEarnings[0].shop.shopName || '');
        }
        
        // Calculate stats for unsettled only
        const unsettledOnly = allEarnings.filter(e => e.status === 'unsettled');
        
        // Calculate actual paid amounts (after discounts)
        const totalEarningsActual = allEarnings.reduce((sum, e) => {
          const paidAmount = (Number(e.order?.totalAmount || 0) - Number(e.order?.discountedAmount || 0)) || e.amount;
          return sum + paidAmount;
        }, 0);
        
        const totalUnsettledActual = unsettledOnly.reduce((sum, e) => {
          const paidAmount = (Number(e.order?.totalAmount || 0) - Number(e.order?.discountedAmount || 0)) || e.amount;
          return sum + paidAmount;
        }, 0);
        
        setStats({
          totalEarnings: totalEarningsActual,
          totalUnsettled: totalUnsettledActual,
          unsettledCount: response.data.unsettledCount || 0
        });
        setError('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load earnings');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async (earningIds) => {
    if (!earningIds || earningIds.length === 0) {
      alert('❌ No earnings selected');
      return;
    }
    
    try {
      const shopId = localStorage.getItem('selectedShopId');
      console.log('📤 Settlement request:', { earningIds, shopId, earningsCo: earnings.length });
      
      // Debug: Check if shopId exists
      if (!shopId) {
        alert('❌ Shop ID not found!\nPlease make sure shop is loaded properly.');
        return;
      }
      
      // Debug: Check if earnings have shop data
      const hasShopInEarnings = earnings.some(e => e.shop);
      console.log('📍 Earnings have shop data:', hasShopInEarnings);
      
      const response = await axios.post('/settlements', {
        earningIds,
        shopId
      });
      
      console.log('✅ Settlement response:', response.data);
      
      if (response.data.success) {
        const amount = response.data.totalAmount;
        alert(`✅ Settlement created!\nAmount: ₹${amount.toFixed(2)}`);
        fetchEarnings(); // Refresh earnings list
      }
    } catch (err) {
      console.error('❌ Settlement error:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      
      const message = err.response?.data?.message || err.message || 'Settlement failed';
      alert(`❌ ERROR:\n${message}\n\nCheck browser console for details`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96 bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-green-600" />
          Earnings {shopName && <span className="text-2xl text-gray-500">- {shopName}</span>}
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
            <p className="text-gray-600 text-sm">Total Earnings</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">₹{stats.totalEarnings.toFixed(2)}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-600">
            <p className="text-gray-600 text-sm">Pending</p>
            <p className="text-3xl font-bold text-orange-600 mt-1">₹{stats.totalUnsettled.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">{stats.unsettledCount} transactions</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
            <p className="text-gray-600 text-sm">Avg per Transaction</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">
              ₹{earnings.length > 0 ? (stats.totalUnsettled / earnings.length).toFixed(0) : '0'}
            </p>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">All Transactions</h2>
            {earnings.some(e => e.status === 'unsettled') && (
              <button
                onClick={() => handleSettle(earnings.filter(e => e.status === 'unsettled').map(e => e._id))}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition"
              >
                Settle Pending ({stats.unsettledCount})
              </button>
            )}
          </div>

          {earnings.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="divide-y divide-gray-200">
                {earnings.map((earning) => (
                  <div key={earning._id}>
                    <div
                      onClick={() => setExpandedEarning(expandedEarning === earning._id ? null : earning._id)}
                      className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition flex items-center justify-between"
                    >
                      <div className="flex-1 grid grid-cols-5 gap-4">
                        <div>
                          <p className="text-sm font-mono text-blue-600">
                            {earning.razorpayPaymentId?.substring(0, 12) || earning._id.substring(0, 12)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            #{earning.order?.orderNumber || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            {earning.customer?.name || 'Unknown'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-semibold text-green-600">
                            ₹{((Number(earning.order?.totalAmount || 0) - Number(earning.order?.discountedAmount || 0)) || earning.amount).toFixed(2)}
                          </p>
                          <span className={`inline-block text-xs font-semibold px-2 py-1 rounded ${
                            earning.status === 'settled'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {earning.status === 'settled' ? '✓ Settled' : '⏳ Pending'}
                          </span>
                        </div>
                        <div>
                          {earning.status === 'unsettled' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSettle([earning._id]);
                              }}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                            >
                              Settle
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedEarning === earning._id && (
                      <div className="bg-blue-50 px-6 py-4 border-t border-blue-200">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                          <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase">Customer Name</p>
                            <p className="text-sm text-gray-900 mt-1">{earning.customer?.name || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase">Email</p>
                            <p className="text-sm text-gray-900 mt-1">{earning.customer?.email || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase">Phone</p>
                            <p className="text-sm text-gray-900 mt-1">{earning.customer?.phone || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase">Order Number</p>
                            <p className="text-sm text-gray-900 mt-1">#{earning.order?.orderNumber || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase">Original Amount</p>
                            <p className="text-sm text-gray-900 mt-1">₹{earning.order?.totalAmount?.toFixed(2) || earning.amount.toFixed(2)}</p>
                          </div>
                          {earning.order?.freePages > 0 && (
                            <>
                              <div>
                                <p className="text-xs text-red-600 font-semibold uppercase">Discount Given</p>
                                <p className="text-sm text-red-600 font-bold mt-1">-₹{(earning.order?.discountedAmount || 0).toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-green-600 font-semibold uppercase">Amount Received</p>
                                <p className="text-sm text-green-700 font-bold mt-1">₹{((earning.order?.totalAmount || 0) - (earning.order?.discountedAmount || 0)).toFixed(2)}</p>
                              </div>
                            </>
                          )}
                          <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase">Payment Date</p>
                            <p className="text-sm text-gray-900 mt-1">
                              {new Date(earning.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase">Transaction ID</p>
                            <p className="text-sm text-gray-900 mt-1 font-mono">{earning.razorpayPaymentId || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase">Order Status</p>
                            <p className="text-sm text-gray-900 mt-1 capitalize">{earning.order?.status?.replace('_', ' ') || 'pending'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase">Settlement Status</p>
                            <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mt-1 ${
                              earning.status === 'settled'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {earning.status === 'settled' ? '✓ Settled' : '⏳ Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium">No earnings yet</p>
              <p className="text-gray-500 text-sm mt-1">Complete orders to start earning</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EarningsDashboard;
