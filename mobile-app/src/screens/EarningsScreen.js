import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import axios from 'axios';

const EarningsScreen = ({ route, navigation }) => {
  const { shopId } = route.params || {};
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEarnings = useCallback(async () => {
    try {
      const response = await axios.get('/api/settlements/earnings', {
        params: { shopId },
        headers: {
          'Authorization': `Bearer ${global.authToken}`
        }
      });

      setEarnings(response.data);
    } catch (error) {
      console.error('Error fetching earnings:', error);
      Alert.alert('Error', 'Failed to load earnings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [shopId]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEarnings();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const unsettled = earnings?.unsettledEarnings || {};
  const settled = earnings?.settledEarnings || {};

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>💰 Your Earnings</Text>

      {/* Unsettled Earnings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pending Settlement</Text>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Pending Amount:</Text>
          <Text style={styles.summaryAmount}>₹{unsettled.totalAmount?.toFixed(2) || '0.00'}</Text>
          <Text style={styles.summarySubtext}>
            {unsettled.count || 0} order{unsettled.count !== 1 ? 's' : ''}
          </Text>
        </View>

        {unsettled.orders && unsettled.orders.length > 0 ? (
          <View>
            {unsettled.orders.map((order, index) => (
              <View key={index} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                  <Text style={styles.orderAmount}>₹{order.amount.toFixed(2)}</Text>
                </View>
                <View style={styles.orderDetail}>
                  <Text style={styles.orderLabel}>Customer:</Text>
                  <Text style={styles.orderValue}>{order.customerName}</Text>
                </View>
                <View style={styles.orderDetail}>
                  <Text style={styles.orderLabel}>Status:</Text>
                  <View style={[styles.badgeContainer, getStatusColor(order.orderStatus)]}>
                    <Text style={styles.badge}>{order.orderStatus}</Text>
                  </View>
                </View>
                <Text style={styles.orderDate}>
                  Order placed: {new Date(order.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>All orders have been settled! 🎉</Text>
          </View>
        )}
      </View>

      {/* Settled History */}
      {settled.count > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settlement History</Text>
          {settled.orders.map((settlement, index) => (
            <View key={index} style={styles.settlementCard}>
              <View style={styles.settlementHeader}>
                <Text style={styles.settlementAmount}>₹{settlement.amount.toFixed(2)}</Text>
                <Text style={styles.settlementMethod}>{settlement.settlementMethod}</Text>
              </View>
              <Text style={styles.settlementDate}>
                Settled: {new Date(settlement.settledAt).toLocaleDateString()}
              </Text>
              {settlement.referenceId && (
                <Text style={styles.referenceId}>Ref: {settlement.referenceId}</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
      return { backgroundColor: '#ecfdf5', borderLeftColor: '#10b981' };
    case 'in_progress':
      return { backgroundColor: '#eff6ff', borderLeftColor: '#3b82f6' };
    case 'accepted':
      return { backgroundColor: '#fef3c7', borderLeftColor: '#f59e0b' };
    default:
      return { backgroundColor: '#f3f4f6', borderLeftColor: '#9ca3af' };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 24,
    color: '#1f2937'
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#374151'
  },
  summaryCard: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16
  },
  summaryLabel: {
    color: '#e0e7ff',
    fontSize: 14,
    marginBottom: 8
  },
  summaryAmount: {
    color: 'white',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4
  },
  summarySubtext: {
    color: '#c7d2fe',
    fontSize: 12
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6'
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937'
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669'
  },
  orderDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  orderLabel: {
    fontSize: 12,
    color: '#6b7280'
  },
  orderValue: {
    fontSize: 12,
    color: '#1f2937',
    fontWeight: '500'
  },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start'
  },
  badge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1f2937',
    textTransform: 'capitalize'
  },
  orderDate: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4
  },
  settlementCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981'
  },
  settlementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  settlementAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669'
  },
  settlementMethod: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize'
  },
  settlementDate: {
    fontSize: 12,
    color: '#6b7280'
  },
  referenceId: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center'
  }
});

export default EarningsScreen;
