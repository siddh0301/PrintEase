import React, { useState, useEffect } from 'react';
import { CreditCard, Download, TrendingUp } from 'lucide-react';
import { paymentService } from '../services/payment.service';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getPaymentHistory();
      setPayments(data.data || []);
      setTotalAmount(data.totalAmount || 0);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load payment history');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderStatusBadgeColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'accepted':
        return 'bg-indigo-100 text-indigo-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <CreditCard className="w-8 h-8" />
          Payment History
        </h1>
        <p className="text-gray-600">Track all your payments and transactions</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 mb-8 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm font-medium">Total Amount Paid</p>
            <p className="text-4xl font-bold mt-2">₹{totalAmount.toFixed(2)}</p>
            <p className="text-blue-100 text-sm mt-2">{payments.length} transactions</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-full p-4">
            <TrendingUp className="w-12 h-12" />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      {payments.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Shop</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Payment Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Order Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.orderId} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm font-medium text-gray-900">
                      {payment.orderNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {payment.shopName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                    ₹{payment.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(payment.paymentStatus)}`}>
                      {payment.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getOrderStatusBadgeColor(payment.orderStatus)}`}>
                      {payment.orderStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(payment.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
          <p className="text-gray-600 text-lg">No payment history yet</p>
          <p className="text-gray-400">Orders you pay for will appear here</p>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
