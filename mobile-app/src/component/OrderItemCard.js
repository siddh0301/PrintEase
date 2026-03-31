import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, shadows } from '../styles/theme';

const OrderItemCard = ({ item, onPress }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Ionicons name="time-outline" size={20} color="#f59e0b" />;
      case 'accepted':
        return <Ionicons name="checkmark-circle-outline" size={20} color="#3b82f6" />;
      case 'in_progress':
        return <Ionicons name="construct-outline" size={20} color="#8b5cf6" />;
      case 'completed':
        return <Ionicons name="checkmark-done-outline" size={20} color="#10b981" />;
      case 'cancelled':
        return <Ionicons name="close-circle-outline" size={20} color="#ef4444" />;
      default:
        return <Ionicons name="help-circle-outline" size={20} color="#6b7280" />;
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

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'failed':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={onPress}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
          <Text style={styles.shopName}>{item.shop?.shopName}</Text>
        </View>
        <View style={styles.statusContainer}>
          {getStatusIcon(item.status)}
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Items:</Text>
          <Text style={styles.detailValue}>{item.items?.length || 0}</Text>
        </View>
        {/* <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount:</Text>
          <Text style={styles.detailValue}>₹{item.totalAmount}</Text>
        </View> */}
        <View>
          <Text style={styles.detailValue}>₹{(Number(item.totalAmount || 0) - Number(item.discountedAmount || 0)).toFixed(2)}</Text>
          {item.freePages > 0 && (
            <Text style={styles.rewardText}>({item.freePages} free {item.freePages === 1 ? 'page' : 'pages'})</Text>
          )}
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Payment:</Text>
          <Text style={[styles.detailValue, { color: getPaymentStatusColor(item.paymentStatus) }]}>
            {item.paymentStatus?.toUpperCase()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.statusBar}>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
          {item.status.replace('_', ' ').toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  orderCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.default,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  shopName: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusContainer: {
    padding: 4,
  },
  orderDetails: {
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  rewardText: {
    fontSize: 12,
    color: '#22c55e',
    marginTop: 2,
    fontWeight: '500',
  },
});

export default OrderItemCard;