import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { colors, spacing, shadows } from '../styles/theme';

const OrderDetailsScreen = ({ navigation, route }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasRated, setHasRated] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  useEffect(() => {
    if (order && order.status === 'completed') {
      checkIfUserHasRated();
    }
  }, [order]);

  const checkIfUserHasRated = async () => {
    try {
      const response = await axios.get(`/api/ratings/shop/${order.shop._id}/check`);
      setHasRated(response.data.hasRated);
    } catch (error) {
      // If there's an error, assume user hasn't rated yet
      setHasRated(false);
    }
  };

  const fetchOrderDetails = async () => {
    try {
      const response = await axios.get(`/api/orders/${orderId}`);
      setOrder(response.data);
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch order details');
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Ionicons name="time-outline" size={24} color="#f59e0b" />;
      case 'accepted':
        return <Ionicons name="checkmark-circle-outline" size={24} color="#3b82f6" />;
      case 'in_progress':
        return <Ionicons name="construct-outline" size={24} color="#8b5cf6" />;
      case 'completed':
        return <Ionicons name="checkmark-done-outline" size={24} color="#10b981" />;
      case 'cancelled':
        return <Ionicons name="close-circle-outline" size={24} color="#ef4444" />;
      default:
        return <Ionicons name="help-circle-outline" size={24} color="#6b7280" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'accepted':
        return '#3b82f6';
      case 'in_progress':
        return '#8b5cf6';
      case 'completed':
        return '#10b981';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my order #${order.orderNumber} from ${order.shop?.shopName}. Status: ${order.status}`,
        title: `Order #${order.orderNumber}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share order');
    }
  };

  const handleCallShop = () => {
    const phoneNumber = order.shop?.contactInfo?.phone || order.shop?.phone;
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handleCancelOrder = async () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', onPress: () => {}, style: 'cancel' },
        {
          text: 'Yes, Cancel',
          onPress: async () => {
            try {
              await axios.patch(`/api/orders/${orderId}/cancel`);
              Alert.alert('Success', 'Order cancelled successfully');
              fetchOrderDetails();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel order');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleShare}
        >
          <Ionicons name="share-social" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Header Card */}
        <View style={[styles.card, styles.headerCard]}>
          <View style={styles.orderNumberContainer}>
            <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
              <Text style={styles.statusBadgeText}>
                {order.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.statusFlow}>
            {getStatusIcon(order.status)}
            <View style={styles.statusFlowBar} />
            <Ionicons
              name={order.status === 'completed' ? 'checkmark-done-circle' : 'ellipse-outline'}
              size={20}
              color={order.status === 'completed' ? '#10b981' : '#d1d5db'}
            />
          </View>
        </View>

        {/* Shop Information Card */}
        <View style={[styles.card, styles.shopCard]}>
          <View style={styles.shopHeader}>
            <View>
              <Text style={styles.shopName}>{order.shop?.shopName}</Text>
              {order.shop?.address?.street && (
                <Text style={styles.shopAddress}>{order.shop.address.street}</Text>
              )}
            </View>
            {(order.shop?.contactInfo?.phone || order.shop?.phone) && (
              <TouchableOpacity
                style={styles.callButton}
                onPress={handleCallShop}
              >
                <Ionicons name="call" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Order Items Card */}
        <View style={[styles.card, styles.itemsCard]}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items && order.items.length > 0 ? (
            order.items.map((item, index) => (
              <View key={index} style={styles.itemContainer}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDetails}>
                    {item.unit === 'per page'
                      ? `${item.pages} pages × ${item.quantity} copies`
                      : `Quantity: ${item.quantity}`}
                  </Text>
                </View>
                <View style={styles.itemPrice}>
                  <Text style={styles.priceAmount}>
                    ₹{item.totalPrice?.toFixed(2) || (item.price * item.quantity).toFixed(2)}
                  </Text>
                  <Text style={styles.unitPrice}>
                    @ ₹{item.price}/
                    {item.unit === 'per page' ? 'page' : 'unit'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No items in this order</Text>
          )}

          <View style={styles.divider} />

          {/* Total Amount */}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>₹{order.totalAmount?.toFixed(2)}</Text>
          </View>
        </View>

        {/* Files Card */}
        {order.files && order.files.length > 0 && (
          <View style={[styles.card, styles.filesCard]}>
            <Text style={styles.sectionTitle}>Files</Text>
            {order.files.map((file, index) => (
              <View key={index} style={styles.fileItem}>
                <Ionicons name="document" size={20} color={colors.primary} />
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.originalName}
                  </Text>
                  <Text style={styles.fileSize}>
                    {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Notes Card */}
        {order.notes && (
          <View style={[styles.card, styles.notesCard]}>
            <Text style={styles.sectionTitle}>Special Instructions</Text>
            <Text style={styles.notesText}>{order.notes}</Text>
          </View>
        )}

        {/* Payment Status Card */}
        <View style={[styles.card, styles.paymentCard]}>
          <View style={styles.paymentHeader}>
            <Text style={styles.sectionTitle}>Payment Status</Text>
            <View
              style={[
                styles.paymentStatusBadge,
                {
                  backgroundColor:
                    order.paymentStatus === 'paid'
                      ? '#d1f2e6'
                      : order.paymentStatus === 'pending'
                      ? '#fef3c7'
                      : '#fee2e2',
                },
              ]}
            >
              <Text
                style={[
                  styles.paymentStatusText,
                  {
                    color:
                      order.paymentStatus === 'paid'
                        ? '#10b981'
                        : order.paymentStatus === 'pending'
                        ? '#f59e0b'
                        : '#ef4444',
                  },
                ]}
              >
                {order.paymentStatus?.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.paymentDetails}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Order Date:</Text>
              <Text style={styles.paymentValue}>
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Total Payment:</Text>
              <Text style={styles.paymentValue}>₹{order.totalAmount?.toFixed(2)}</Text>
            </View>
            {order.paymentId && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Transaction ID:</Text>
                <Text style={styles.paymentValue} numberOfLines={1}>
                  {order.paymentId}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Order Timeline */}
        <View style={[styles.card, styles.timelineCard]}>
          <Text style={styles.sectionTitle}>Order Timeline</Text>
          <View style={styles.timeline}>
            {order.createdAt && (
              <View style={styles.timelineEvent}>
                <View style={[styles.timelineMarker, { backgroundColor: '#10b981' }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Order Placed</Text>
                  <Text style={styles.timelineDate}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            )}
            {order.updatedAt && order.updatedAt !== order.createdAt && (
              <View style={styles.timelineEvent}>
                <View
                  style={[
                    styles.timelineMarker,
                    {
                      backgroundColor:
                        order.status === 'completed'
                          ? '#10b981'
                          : order.status === 'cancelled'
                          ? '#ef4444'
                          : '#3b82f6',
                    },
                  ]}
                />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>
                    Status Updated to {order.status.replace('_', ' ').toUpperCase()}
                  </Text>
                  <Text style={styles.timelineDate}>
                    {new Date(order.updatedAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {order.status === 'completed' && !hasRated && (
            <TouchableOpacity
              style={[styles.actionButton, styles.rateButton]}
              onPress={() => navigation.navigate('RateShop', {
                shopId: order.shop._id,
                shopName: order.shop.shopName,
                orderId: order._id
              })}
            >
              <Ionicons name="star" size={20} color="white" />
              <Text style={styles.rateButtonText}>Rate Shop</Text>
            </TouchableOpacity>
          )}
          {order.status === 'completed' && hasRated && (
            <TouchableOpacity
              style={[styles.actionButton, styles.viewRatingButton]}
              onPress={() => navigation.navigate('Rating', {
                shopId: order.shop._id,
                shopName: order.shop.shopName
              })}
            >
              <Ionicons name="star" size={20} color="white" />
              <Text style={styles.viewRatingButtonText}>View Rating</Text>
            </TouchableOpacity>
          )}
          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancelOrder}
            >
              <Ionicons name="close-circle" size={20} color="white" />
              <Text style={styles.cancelButtonText}>Cancel Order</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.retryButton]}
            onPress={() => navigation.navigate('Home')}
          >
            <Ionicons name="add-circle" size={20} color="white" />
            <Text style={styles.retryButtonText}>Place Another Order</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: spacing.lg,
    ...shadows.default,
  },
  headerCard: {
    padding: spacing.lg,
  },
  orderNumberContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  orderNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  statusFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusFlowBar: {
    flex: 1,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginHorizontal: spacing.md,
  },
  shopCard: {
    padding: spacing.lg,
  },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: spacing.xs,
  },
  shopAddress: {
    fontSize: 13,
    color: '#6b7280',
    maxWidth: '80%',
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemsCard: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: spacing.md,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: spacing.xs,
  },
  itemDetails: {
    fontSize: 12,
    color: '#6b7280',
  },
  itemPrice: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  unitPrice: {
    fontSize: 11,
    color: '#6b7280',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: spacing.md,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  filesCard: {
    padding: spacing.lg,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  fileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: spacing.xs,
  },
  fileSize: {
    fontSize: 12,
    color: '#9ca3af',
  },
  notesCard: {
    padding: spacing.lg,
  },
  notesText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  paymentCard: {
    padding: spacing.lg,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  paymentStatusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentDetails: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: spacing.md,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  paymentLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  paymentValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1f2937',
  },
  timelineCard: {
    padding: spacing.lg,
  },
  timeline: {
    marginLeft: spacing.sm,
  },
  timelineEvent: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  timelineMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.md,
    marginTop: spacing.sm,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: spacing.xs,
  },
  timelineDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  actionsContainer: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  retryButton: {
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  rateButton: {
    backgroundColor: '#fbbf24',
  },
  rateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  viewRatingButton: {
    backgroundColor: '#8b5cf6',
  },
  viewRatingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  spacer: {
    height: spacing.lg,
  },
});

export default OrderDetailsScreen;
