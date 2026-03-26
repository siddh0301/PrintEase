import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, Linking } from 'react-native';
import axios from 'axios';

const PaymentScreen = ({ route, navigation }) => {
  const { order } = route.params || {};
  const [paying, setPaying] = useState(false);
  const [upiQr, setUpiQr] = useState(null);
  const [upiIntent, setUpiIntent] = useState(null);
  const [upiInitiated, setUpiInitiated] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const loadUpi = async () => {
      try {
        if (!order?.shop?._id && !order?.shop) return;
        const shopId = order.shop?._id || order.shop;
        const resp = await axios.get(`/api/shops/${shopId}/upi-qr`, {
          params: { am: Number(order.totalAmount || 0).toFixed(2), tn: `Order ${order.orderNumber}` }
        });
        setUpiQr(resp.data?.qrDataUrl || null);
        setUpiIntent(resp.data?.intent || null);
      } catch (err) {
        console.error('UPI QR Error:', err?.response?.data?.message || err.message);
        if (err?.response?.status === 400) {
          Alert.alert('UPI Not Configured', 'This shop has not set up their UPI ID yet. Please contact the shop owner.');
        }
      }
    };
    loadUpi();
  }, [order]);

  // Step 1: Initiate UPI payment (setup backend)
  const initiateUpiPayment = async () => {
    try {
      setPaying(true);
      const resp = await axios.post('/api/payments/create-upi-payment', { 
        orderId: order._id 
      });
      
      if (resp.data?.upiId) {
        setUpiInitiated(true);
        Alert.alert('UPI Payment', `Pay ₹${order.totalAmount} to ${resp.data.upiId}\n\nAfter payment completes, tap "Confirm Payment" below.`);
      }
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to initialize UPI payment');
    } finally {
      setPaying(false);
    }
  };

  const handleOpenUpi = async () => {
    try {
      if (!upiIntent) return;
      const supported = await Linking.canOpenURL(upiIntent);
      if (supported) {
        await Linking.openURL(upiIntent);
      } else {
        Alert.alert('UPI', 'No UPI app found to handle payment.');
      }
    } catch (e) {
      Alert.alert('UPI', 'Failed to open UPI app');
    }
  };

  // Step 2: Confirm UPI payment after user completes transaction in GPay/PhonePe
  const confirmUpiPayment = async () => {
    try {
      setConfirming(true);
      
      const resp = await axios.post('/api/payments/confirm-upi-payment', {
        orderId: order._id,
        upiTxnId: `upi_${Date.now()}`
      });

      Alert.alert('Success', 'Payment confirmed! Order is now active.');
      
      // Navigate to Orders
      navigation.navigate('MainTabs', { screen: 'Orders' });
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to confirm payment');
    } finally {
      setConfirming(false);
    }
  };

  const handlePay = async () => {
    try {
      setPaying(true);

      // 1. Create payment intent (match backend route name)
      const resp = await axios.post('/api/payments/create-payment-intent', { orderId: order._id });
      const clientSecret = resp.data?.clientSecret;

      if (!clientSecret) {
        Alert.alert('Payment', 'Unable to initialize payment');
        return;
      }

      // 2. Simulate payment success (in test mode)
      await axios.post('/api/payments/confirm-payment', {
        paymentIntentId: 'test_simulated',
        orderId: order._id,
      });

      Alert.alert('Payment', 'Payment simulated as successful (test mode)');

      // 3. Navigate to Orders tab inside MainTabs
      navigation.navigate('MainTabs', { screen: 'Orders' });

    } catch (e) {
      Alert.alert('Payment', e?.response?.data?.message || e.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment</Text>
      {order ? (
        <>
          <Text style={styles.text}>Order Number: {order.orderNumber}</Text>
          <Text style={styles.text}>Total: ₹{Number(order.totalAmount || 0).toFixed(2)}</Text>
          
          <View style={styles.section}>
            <Text style={styles.subTitle}>💳 Pay via UPI (Google Pay / PhonePe / Paytm)</Text>
            <TouchableOpacity 
              style={styles.button} 
              onPress={initiateUpiPayment} 
              disabled={paying || upiInitiated}
            >
              <Text style={styles.buttonText}>
                {upiInitiated ? 'UPI Payment Initiated ✓' : (paying ? 'Setting up...' : 'Pay with UPI')}
              </Text>
            </TouchableOpacity>
            
            {upiInitiated && (
              <>
                <Text style={styles.instruction}>
                  Complete the payment in your UPI app, then tap the button below to confirm.
                </Text>
                <TouchableOpacity 
                  style={styles.confirmButton} 
                  onPress={confirmUpiPayment} 
                  disabled={confirming}
                >
                  <Text style={styles.confirmButtonText}>
                    {confirming ? 'Confirming...' : '✓ Payment Done - Confirm'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {upiQr && (
            <View style={styles.qrBox}>
              <Text style={styles.subTitle}>📱 Scan to Pay Directly</Text>
              <Image source={{ uri: upiQr }} style={styles.qr} />
              <TouchableOpacity style={styles.linkBtn} onPress={handleOpenUpi}>
                <Text style={styles.linkBtnText}>Open in UPI App</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.subTitle}>🧪 Test Mode (Stripe Simulation)</Text>
            <TouchableOpacity style={styles.button} onPress={handlePay} disabled={paying}>
              <Text style={styles.buttonText}>
                {paying ? 'Processing...' : 'Pay (Simulate)'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <Text style={styles.text}>No order data.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: 'white', marginTop: 40 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16, color: '#1f2937' },
  subTitle: { fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 12 },
  text: { fontSize: 16, color: '#374151', marginBottom: 8 },
  section: { marginVertical: 16, paddingBottom: 12 },
  instruction: { fontSize: 13, color: '#6b7280', marginTop: 12, fontStyle: 'italic' },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 16 },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  confirmButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: { color: 'white', fontSize: 15, fontWeight: '600' },
  confirmButtonText: { color: 'white', fontSize: 15, fontWeight: '600' },
  qrBox: { alignItems: 'center', marginVertical: 12, paddingVertical: 12, backgroundColor: '#f3f4f6', borderRadius: 12 },
  qr: { width: 180, height: 180, marginVertical: 8 },
  linkBtn: { marginTop: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#10b981', borderRadius: 8 },
  linkBtnText: { color: 'white', fontWeight: '600', textAlign: 'center' },
});

export default PaymentScreen;



