import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import SkeletonLoader from '../component/SkeletonLoader';
import OrderItemCard from '../component/OrderItemCard';
import { colors, spacing, shadows } from '../styles/theme';

const MyOrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/orders/customer/my-orders');
      setOrders(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const renderSkeletonItem = () => (
    <SkeletonLoader type="orderListCard" style={styles.skeletonContainer} />
  );

  const renderOrderItem = ({ item }) => (
    <OrderItemCard
      item={item}
      onPress={() => {
        navigation.navigate('OrderDetails', { orderId: item._id });
      }}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={loading ? Array(5).fill({}) : orders}
        renderItem={loading ? renderSkeletonItem : renderOrderItem}
        keyExtractor={(item, index) => loading ? `skeleton-${index}` : item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySubtitle}>
                Start by placing your first order from a nearby shop
              </Text>
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={styles.browseButtonText}>Browse Shops</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  refreshButton: {
    padding: 6,
  },
  listContainer: {
    padding: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },
  browseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  skeletonContainer: {
    marginBottom: spacing.sm,
  },
});

export default MyOrdersScreen;

