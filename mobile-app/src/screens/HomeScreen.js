import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import SkeletonLoader from '../component/SkeletonLoader';
import { colors, spacing, shadows } from '../styles/theme';

const HomeScreen = ({ navigation }) => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAllShops();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try{
      await fetchAllShops();
    }catch(e){

    }finally {
      setRefreshing(false);
    }
  };

  const fetchAllShops = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/shops');
      setShops(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch shops');
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyShops = async () => {
    try {
      setLoading(true);
      // Ask for permission and get current position
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Location permission is needed to show nearby shops');
        return;
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;
      const response = await axios.get(`/api/shops/nearby`, {
        params: { lat: latitude, lng: longitude, radius: 5000 }
      });
      setShops(response.data);
      Alert.alert('Success', 'Showing shops within 5km of your location');
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch nearby shops');
    } finally {
      setLoading(false);
    }
  };

  const renderShopItem = ({ item }) => (
    <TouchableOpacity
      style={styles.shopCard}
      onPress={() => navigation.navigate('ShopDetail', { shop: item })}
    >
      <View style={styles.shopInfo}>
        <Text style={styles.shopName}>{item.shopName}</Text>
        <Text style={styles.shopAddress}>
          {item.address?.street}, {item.address?.city}
        </Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#fbbf24" />
          <Text style={styles.rating}>
            {item.rating?.average?.toFixed(1) || '0.0'}
          </Text>
          <Text style={styles.ratingCount}>
            ({item.rating?.count || 0} reviews)
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </TouchableOpacity>
  );

  const renderSkeletonItem = () => (
    <SkeletonLoader type="shopListCard" style={styles.skeletonContainer} />
  );

  // if (loading) {
  //   return (
  //     <View style={styles.loadingContainer}>
  //     <Text>Loading shops...</Text>
  //   </View>
  //   );
  // }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name}!</Text>
          <Text style={styles.subtitle}>Find nearby Xerox shops</Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person-circle" size={32} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => navigation.navigate('ShopList')}
        >
          <Ionicons name="search" size={20} color="#6b7280" />
          <Text style={styles.searchText}>Search shops by location</Text>
          <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Shops</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ShopList')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={loading ? Array(3).fill({}) : shops.slice(0, 5)}
        renderItem={loading ? renderSkeletonItem : renderShopItem}
        keyExtractor={(item, index) => loading ? `skeleton-${index}` : item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {/* Floating Location Button */}
      <View>
        <TouchableOpacity
          
          style={styles.floatingButton}
          onPress={fetchNearbyShops}
          >
          <Ionicons name="location" size={24} color="white" />
          <Text style={styles.floatingButtonText}>Nearby shops</Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...shadows.default,
  },
  greeting: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: '#e0f2fe',
    marginTop: spacing.xs,
  },
  profileButton: {
    padding: 6,
    backgroundColor: '#bae6fd',
    borderRadius: 50,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: -spacing.md,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.default,
  },
  searchText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 16,
    color: colors.textMuted,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  seeAllText: {
    fontSize: 15,
    color: colors.secondary,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  shopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.default,
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  shopAddress: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 4,
  },
  ratingCount: {
    fontSize: 14,
    color: colors.textMuted,
    marginLeft: 6,
  },
  skeletonContainer: {
    marginBottom: spacing.sm,
  },
  floatingButton: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 25,
    backgroundColor: colors.primary,
    ...shadows.default,
  },
  floatingButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});

export default HomeScreen;

