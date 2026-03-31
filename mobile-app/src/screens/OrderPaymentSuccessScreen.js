import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';

const OrderPaymentSuccessScreen = ({ navigation, route }) => {
  const { order } = route.params || {};

  useEffect(() => {
    if (!order) {
      Alert.alert('Error', 'Order data not found');
      navigation.goBack();
    }
  }, [order, navigation]);

  const handleViewOrders = () => {
    navigation.navigate('MainTabs', { screen: 'MyOrders' });
  };

  const handleGoHome = () => {
    navigation.navigate('MainTabs', { screen: 'Home' });
  };

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const getOrderStatus = () => {
    if (order.status === 'confirmed' || order.paymentStatus === 'paid') {
      return 'confirmed';
    }
    return order.status || 'pending';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return '#10b981';
      case 'processing':
        return '#f59e0b';
      case 'completed':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return '✓ Order Confirmed';
      case 'processing':
        return '⏳ Processing';
      case 'completed':
        return '✓ Completed';
      default:
        return 'Pending';
    }
  };

  const status = getOrderStatus();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Success Header */}
      <View style={styles.successHeader}>
        <View style={styles.successIcon}>
          <MaterialCommunityIcons name="check-circle" size={80} color="#10b981" />
        </View>
        <Text style={styles.successTitle}>Payment Successful!</Text>
        <Text style={styles.successSubtitle}>Your order has been placed</Text>
      </View>

      {/* Order Details Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Order Details</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
            <Text style={styles.statusText}>{getStatusText(status)}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Order Number</Text>
          <Text style={styles.detailValue}># {order.orderNumber || order._id?.substring(0, 8)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Shop Name</Text>
          <Text style={styles.detailValue}>{order.shop?.shopName || 'N/A'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Order Date</Text>
          <Text style={styles.detailValue}>
            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'N/A'}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Estimated Delivery</Text>
          <Text style={styles.detailValue}>
            {order.deliveryDate
              ? new Date(order.deliveryDate).toLocaleDateString('en-IN')
              : '1-2 days'}
          </Text>
        </View>
      </View>

      {/* Items Ordered */}
      {order.items && order.items.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items Ordered</Text>

          {order.items.map((item, index) => (
            <View key={index}>
              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name || item.service || 'Service'}</Text>
                  <Text style={styles.itemDetail}>
                    {item.quantity || item.copies || 1} × ₹{item.price?.toFixed(2) || '0.00'}
                  </Text>
                  {item.pages && (
                    <Text style={styles.itemDetail}>Pages: {item.pages}</Text>
                  )}
                </View>
                <Text style={styles.itemTotal}>
                  ₹{item.totalPrice?.toFixed(2) || (item.price * (item.quantity || 1)).toFixed(2)}
                </Text>
              </View>
              {index < order.items.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      )}

      {/* Payment Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment Summary</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>₹{(order.totalAmount * 0.95)?.toFixed(2) || '0.00'}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tax (5%)</Text>
          <Text style={styles.summaryValue}>₹{(order.totalAmount * 0.05)?.toFixed(2) || '0.00'}</Text>
        </View>

        {order.freePages > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.rewardSummarySection}>
              <Text style={styles.rewardLabel}>🎉 Free Pages Discount</Text>
              <Text style={styles.rewardText}>
                {order.freePages} free {order.freePages === 1 ? 'page' : 'pages'} for {order.totalPages} pages ordered
              </Text>
              <View style={styles.discountAmount}>
                <Text style={styles.discountText}>-₹{(order.discountedAmount || 0).toFixed(2)}</Text>
              </View>
            </View>
          </>
        )}

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total Paid</Text>
          <Text style={styles.totalValue}>₹{((order.totalAmount || 0) - (order.discountedAmount || 0)).toFixed(2)}</Text>
        </View>

        <View style={styles.paymentMethodRow}>
          <MaterialCommunityIcons name="check-circle" size={20} color="#10b981" />
          <Text style={styles.paymentMethodText}>Paid via Razorpay</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleViewOrders}>
          <MaterialCommunityIcons name="receipt" size={20} color="white" style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>View My Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
          <MaterialCommunityIcons name="home" size={20} color="#3b82f6" style={{ marginRight: 8 }} />
          <Text style={styles.secondaryButtonText}>Go Home</Text>
        </TouchableOpacity>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <MaterialCommunityIcons name="information-outline" size={20} color="#3b82f6" />
        <Text style={styles.infoText}>
          You will receive a notification once your order is ready for pickup
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingVertical: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  itemDetail: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'right',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 18,
    color: '#10b981',
    fontWeight: '700',
  },
  rewardSummarySection: {
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 3,
    borderLeftColor: '#22c55e',
    paddingLeft: 12,
    paddingVertical: 8,
    marginVertical: 12,
  },
  rewardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803d',
    marginBottom: 4,
  },
  rewardText: {
    fontSize: 12,
    color: '#4ade80',
    marginBottom: 8,
  },
  discountAmount: {
    marginTop: 8,
  },
  discountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22c55e',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  paymentMethodText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  actionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'white',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  secondaryButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    marginHorizontal: 16,
    marginBottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    fontWeight: '500',
    lineHeight: 18,
  },
});

export default OrderPaymentSuccessScreen;
