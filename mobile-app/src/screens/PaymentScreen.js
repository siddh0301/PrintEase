import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import axios from 'axios';

const PaymentScreen = ({ route, navigation }) => {
  const { order, reward: initialReward } = route.params || {};
  const [processing, setProcessing] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [paymentHtml, setPaymentHtml] = useState(null);
  
  // State for reward display - initialize with reward data from route params
  const [paymentData, setPaymentData] = useState({
    amount: null,
    freePages: initialReward?.freePages || 0,
    discountedAmount: initialReward?.discountedAmount || 0,
    originalAmount: null
  });

  const handleRazorpayPayment = async () => {
    try {
      setProcessing(true);

      // Validate order
      if (!order?._id) {
        throw new Error('Order ID is missing');
      }

      console.log('📡 Creating Razorpay order for:', order._id);

      // Step 1: Create Razorpay order from backend
      const orderResponse = await axios.post('/api/razorpay/create-order', {
        orderId: order._id
      });

      console.log('✅ Razorpay order created:', orderResponse.data);

      const {
        razorpayOrderId,
        amount,
        customerEmail,
        customerPhone,
        customerName,
        keyId,
        shopName,
        originalAmount,
        discountedAmount,
        freePages
      } = orderResponse.data;

      // Store payment data in state for display
      setPaymentData({
        amount,
        freePages: freePages || initialReward?.freePages || 0,
        discountedAmount: discountedAmount || initialReward?.discountedAmount || 0,
        originalAmount
      });

      console.log('🔑 Using Key:', keyId?.substring(0, 20) + '...');
      console.log('💰 Original Amount:', originalAmount, 'INR');
      console.log('💚 Free Pages Discount:', discountedAmount, 'INR');
      console.log('💳 Final Amount:', amount, 'INR');
      console.log('📦 Order ID:', razorpayOrderId);

      if (!razorpayOrderId || !keyId) {
        throw new Error('Invalid Razorpay order response - missing order ID or key');
      }

      // Step 2: Generate payment URL with embedded checkout HTML
      const paymentHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://checkout.razorpay.com/v1/checkout.js"><\/script>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #f5f5f5;
              padding: 20px;
            }
            .container { max-width: 500px; margin: 0 auto; }
            .loading { 
              text-align: center; 
              padding: 60px 20px;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .loading h2 { font-size: 18px; color: #333; margin-bottom: 20px; }
            .spinner {
              border: 4px solid #f3f3f3;
              border-top: 4px solid #3b82f6;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 0 auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="loading">
              <h2>🔄 Loading Payment...</h2>
              <div class="spinner"><\/div>
              <p style="color: #666; margin-top: 20px; font-size: 14px;">Opening Razorpay Checkout<\/p>
            </div>
          </div>
          <script>
            try {
              console.log('📱 Razorpay Script Loaded:', typeof Razorpay);
              
              var options = {
                "key": "${keyId}",
                "amount": ${Math.round(amount * 100)},
                "currency": "INR",
                "name": "${shopName || 'PrintEase'}",
                "description": "Order from ${shopName || 'PrintEase'}",
                "order_id": "${razorpayOrderId}",
                "prefill": {
                  "name": "${customerName || ''}",
                  "email": "${customerEmail || ''}",
                  "contact": "${customerPhone || '9999999999'}"
                },
                "theme": {
                  "color": "#3b82f6"
                },
                "method": {
                  "upi": true,
                  "card": true,
                  "netbanking": true,
                  "wallet": true,
                  "paylater": true
                },
                "handler": function(response) {
                  console.log('✅ Payment Success Handler Called:', response);
                  
                  // Send message back to React Native using postMessage
                  const message = {
                    type: 'PAYMENT_SUCCESS',
                    data: {
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature
                    }
                  };
                  
                  console.log('📤 Sending payment success message:', message);
                  
                  // For React Native, use window.ReactNativeWebView.postMessage
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify(message));
                  } else {
                    // Fallback to location.href for web
                    window.location.href = 'payment_success:///' + JSON.stringify(message.data);
                  }
                },
                "modal": {
                  "ondismiss": function() {
                    console.log('❌ Payment Cancelled Handler Called');
                    const message = { type: 'PAYMENT_CANCELLED' };
                    
                    if (window.ReactNativeWebView) {
                      window.ReactNativeWebView.postMessage(JSON.stringify(message));
                    } else {
                      window.location.href = 'payment_cancelled:///';
                    }
                  }
                }
              };

              console.log('🚀 Opening Razorpay with options:', options);
              var rzp = new Razorpay(options);
              rzp.open();
            } catch (error) {
              console.error('❌ Error:', error);
            }
          </script>
        </body>
        </html>
      `;

      console.log('🎯 Opening Razorpay via WebView');
      setPaymentHtml(paymentHTML);
      setShowWebView(true);
      setProcessing(false);
    } catch (error) {
      setProcessing(false);
      console.error('❌ Payment initialization error:', error);
      console.error('📋 Full error:', {
        message: error.message,
        status: error?.response?.status,
        data: error?.response?.data,
        url: error?.config?.url,
        baseURL: error?.config?.baseURL
      });
      Alert.alert(
        'Payment Failed',
        error?.response?.data?.message || 
        error?.response?.data?.hint ||
        error.message || 
        'Failed to initialize payment. Check backend is running.'
      );
    }
  };

  const handleWebViewMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      console.log('📨 WebView message received:', message);
      
      if (message.type === 'PAYMENT_SUCCESS') {
        console.log('✅ PAYMENT_SUCCESS message:', message.data);
        setShowWebView(false);
        verifyPayment(message.data);
      } else if (message.type === 'PAYMENT_CANCELLED') {
        console.log('❌ PAYMENT_CANCELLED message');
        setShowWebView(false);
        Alert.alert('Payment Cancelled', 'You cancelled the payment');
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

  const handleWebViewStateChange = (navState) => {
    const url = navState.url;
    
    console.log('🌐 WebView navigation:', url);
    
    // Check for payment success (fallback)
    if (url.includes('payment_success:///')) {
      try {
        const jsonStr = decodeURIComponent(url.split('payment_success:///')[1]);
        const paymentData = JSON.parse(jsonStr);
        
        console.log('✅ Payment successful intercepted:', paymentData);
        setShowWebView(false);
        verifyPayment(paymentData);
      } catch (error) {
        console.error('Error parsing payment data:', error);
      }
    }
    
    // Check for payment cancelled (fallback)
    if (url.includes('payment_cancelled:///')) {
      console.log('❌ Payment cancelled by user');
      setShowWebView(false);
    }
  };

  const handleWebViewShouldStartLoadRequest = (request) => {
    const { url } = request;
    
    console.log('📍 WebView should load:', url);
    
    // Handle payment success custom protocol
    if (url.startsWith('payment_success:///')) {
      try {
        const jsonStr = decodeURIComponent(url.replace('payment_success:///', ''));
        const paymentData = JSON.parse(jsonStr);
        
        console.log('✅ Payment SUCCESS data extracted:', paymentData);
        setShowWebView(false);
        verifyPayment(paymentData);
      } catch (error) {
        console.error('❌ Error parsing payment success:', error);
        Alert.alert('Error', 'Failed to process payment');
      }
      return false; // Don't load this URL
    }
    
    // Handle payment cancelled custom protocol
    if (url.startsWith('payment_cancelled:///')) {
      console.log('❌ Payment CANCELLED');
      setShowWebView(false);
      Alert.alert('Payment Cancelled', 'You cancelled the payment');
      return false; // Don't load this URL
    }
    
    // Allow all other URLs to load normally
    return true;
  };

  const verifyPayment = async (paymentData) => {
    try {
      setProcessing(true);
      
      console.log('🔐 Verifying payment:', paymentData);
      
      const response = await axios.post('/api/razorpay/verify-payment', {
        razorpayOrderId: paymentData.razorpay_order_id,
        razorpayPaymentId: paymentData.razorpay_payment_id,
        razorpaySignature: paymentData.razorpay_signature,
        orderId: order._id
      });

      console.log('✅ Verification response:', response.data);
      setProcessing(false);

      if (response.data.success) {
        // Navigate to order success screen with updated order data
        const updatedOrder = response.data.order || order;
        
        console.log('📱 Navigating to OrderPaymentSuccess with order:', updatedOrder);
        
        setTimeout(() => {
          navigation.navigate('OrderPaymentSuccess', { order: updatedOrder });
        }, 500);
      } else {
        console.log('❌ Verification failed:', response.data);
        Alert.alert('Verification Failed', response.data.message || 'Payment verification failed');
      }
    } catch (error) {
      setProcessing(false);
      console.error('❌ Verification error:', {
        message: error.message,
        status: error?.response?.status,
        data: error?.response?.data,
        url: error?.config?.url
      });
      Alert.alert('Verification Error', error?.response?.data?.message || error.message || 'Failed to verify payment');
    }
  };

  return (
    <>
      {showWebView && paymentHtml ? (
        <WebView
          source={{ html: paymentHtml }}
          onMessage={handleWebViewMessage}
          onShouldStartLoadWithRequest={handleWebViewShouldStartLoadRequest}
          onNavigationStateChange={handleWebViewStateChange}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scalesPageToFit={true}
          startInLoadingState={true}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.container}>
          <Text style={styles.title}>💳 Payment</Text>

          {order ? (
            <>
              <View style={styles.orderInfo}>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Order Number:</Text>
                  <Text style={styles.value}>{order.orderNumber}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Shop:</Text>
                  <Text style={styles.value}>{order?.shop?.shopName || 'N/A'}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Total Amount:</Text>
                  <Text style={styles.totalAmount}>₹{Number(order.totalAmount || 0).toFixed(2)}</Text>
                </View>
                
                {/* Loyalty Reward Discount Display */}
                {paymentData.freePages > 0 && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.rewardSection}>
                      <View style={styles.rewardRow}>
                        <Text style={styles.rewardLabel}>🎉 Free Pages:</Text>
                        <Text style={styles.rewardValue}>{paymentData.freePages} {paymentData.freePages === 1 ? 'page' : 'pages'}</Text>
                      </View>
                      <View style={styles.rewardRow}>
                        <Text style={styles.rewardLabel}>💚 You Save:</Text>
                        <Text style={styles.savingsAmount}>-₹{Number(paymentData.discountedAmount || 0).toFixed(2)}</Text>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.finalRow}>
                        <Text style={styles.finalLabel}>Final Amount to Pay:</Text>
                        <Text style={styles.finalAmount}>₹{Number(paymentData.amount || (order.totalAmount - paymentData.discountedAmount) || 0).toFixed(2)}</Text>
                      </View>
                    </View>
                  </>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.description}>
                  ✓ Safe & Secure payment via Razorpay
                </Text>
                <TouchableOpacity
                  style={[styles.payButton, processing && styles.payButtonDisabled]}
                  onPress={handleRazorpayPayment}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <ActivityIndicator color="white" size="small" style={{ marginRight: 8 }} />
                      <Text style={styles.payButtonText}>Processing...</Text>
                    </>
                  ) : (
                    <Text style={styles.payButtonText}>Pay Now ₹{(paymentData.amount || (order.totalAmount - paymentData.discountedAmount) || 0).toFixed(2)}</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.securityInfo}>
                <Text style={styles.securityText}>🔒 Your payment information is encrypted and secure</Text>
              </View>
            </>
          ) : (
            <Text style={styles.text}>No order data available.</Text>
          )}
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    marginTop: 40
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9fafb',
    marginTop: 40
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    color: '#1f2937'
  },
  orderInfo: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500'
  },
  value: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600'
  },
  totalAmount: {
    fontSize: 18,
    color: '#059669',
    fontWeight: 'bold'
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12
  },
  rewardSection: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e'
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  rewardLabel: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '500'
  },
  rewardValue: {
    fontSize: 13,
    color: '#15803d',
    fontWeight: 'bold'
  },
  savingsAmount: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: 'bold'
  },
  finalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8
  },
  finalLabel: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600'
  },
  finalAmount: {
    fontSize: 18,
    color: '#22c55e',
    fontWeight: 'bold'
  },
  section: {
    marginVertical: 16
  },
  description: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 16,
    textAlign: 'center'
  },
  payButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8
  },
  payButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.7
  },
  payButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  securityInfo: {
    backgroundColor: '#ecfdf5',
    borderRadius: 8,
    padding: 12,
    marginTop: 20
  },
  securityText: {
    color: '#065f46',
    fontSize: 12,
    textAlign: 'center'
  },
  text: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center'
  }
});

export default PaymentScreen;
