import React, { useState } from 'react';
import axios from '../api/axiosInstance';
import { ShoppingCart, AlertCircle } from 'lucide-react';
import { paymentService } from '../services/payment.service';

const PaymentCheckout = ({ orderId, amount, shopName, orderNumber, onPaymentSuccess, reward = {} }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const finalAmount = amount - (reward?.discountedAmount || 0);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError('');

      // Step 1: Create Razorpay Order
      const orderData = await paymentService.createRazorpayOrder(orderId);

      if (!window.Razorpay) {
        setError('Razorpay SDK not loaded');
        return;
      }

      // Step 2: Open Razorpay Checkout
      const options = {
        key: orderData.keyId,
        amount: Math.round(finalAmount * 100), // Convert to paise - use final amount after discount
        currency: orderData.currency,
        name: shopName || 'PrintEase',
        description: `Order ${orderNumber}`,
        order_id: orderData.razorpayOrderId,
        prefill: {
          email: orderData.customerEmail,
          contact: orderData.customerPhone,
          name: orderData.customerName
        },
        theme: {
          color: '#3b82f6'
        },
        handler: async (response) => {
          try {
            // Step 3: Verify payment
            const verifyResponse = await paymentService.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderId
            });

            if (verifyResponse.success) {
              // Payment successful
              if (onPaymentSuccess) {
                onPaymentSuccess(verifyResponse.order);
              }
            }
          } catch (err) {
            setError('Payment verification failed: ' + err.message);
          }
        },
        modal: {
          ondismiss: () => {
            setError('Payment cancelled');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setError(err.message || 'Failed to initiate payment');
      console.error('Payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Complete Payment</h2>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
        <div className="flex justify-between">
          <span className="text-gray-600">Order Number:</span>
          <span className="font-mono font-semibold text-gray-900">{orderNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Shop:</span>
          <span className="font-semibold text-gray-900">{shopName}</span>
        </div>
        {reward?.freePages > 0 && (
          <>
            <div className="flex justify-between pt-2 border-t border-gray-100">
              <span className="text-gray-600">Original Amount:</span>
              <span className="font-semibold text-gray-900">₹{amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span className="font-medium">Free Pages Discount:</span>
              <span className="font-bold">-₹{(reward.discountedAmount || 0).toFixed(2)}</span>
            </div>
          </>
        )}
      </div>

      <div className={`mb-6 p-4 rounded-lg ${reward?.freePages > 0 ? 'bg-green-50' : 'bg-blue-50'}`}>
        <p className="text-sm text-gray-600 mb-1">
          {reward?.freePages > 0 ? '💚 Amount to Pay (After Discount)' : 'Amount to Pay'}
        </p>
        <p className={`text-3xl font-bold ${reward?.freePages > 0 ? 'text-green-600' : 'text-blue-600'}`}>
          ₹{finalAmount.toFixed(2)}
        </p>
        {reward?.freePages > 0 && (
          <p className="text-xs text-green-600 mt-2">
            🎉 You got {reward.freePages} free {reward.freePages === 1 ? 'page' : 'pages'} for ordering {reward.totalPages} pages!
          </p>
        )}
      </div>

      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition"
      >
        {loading ? 'Processing...' : `Pay ₹${finalAmount.toFixed(2)}`}
      </button>

      <p className="text-xs text-gray-500 text-center mt-4">
        🔒 Secure payment powered by Razorpay
      </p>
    </div>
  );
};

export default PaymentCheckout;
