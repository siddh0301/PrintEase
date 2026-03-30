import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
  Alert,
  TextInput,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import SkeletonLoader from '../component/SkeletonLoader';
import openLocationInMaps from '../component/openLoactionInMaps';
import ShopItemCard from '../component/ShopItemCard';
import { colors, spacing, shadows } from '../styles/theme';

const HomeScreen = ({ navigation }) => {
  const [shops, setShops] = useState([]);
  const [filteredShops, setFilteredShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const isShopOpen = (workingHours, isTemporaryClosed) => {
    if (isTemporaryClosed) return false;
    const now = new Date();
    const day = now.getDay(); // 0-6, Sunday=0
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[day];
    const dayHours = workingHours?.[dayName];
    if (!dayHours || !dayHours.isOpen) return false;
    const openTime = dayHours.open;
    const closeTime = dayHours.close;
    if (!openTime || !closeTime) return false;
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = openTime.split(':').map(Number);
    const [closeH, closeM] = closeTime.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    return currentTime >= openMinutes && currentTime <= closeMinutes;
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  useEffect(() => {
    fetchAllShops();
  }, []);
  useEffect(() => {
    filterShops();
  }, [searchQuery, shops]);
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchAllShops();
    } catch (e) {

    } finally {
      setRefreshing(false);
    }
  };

  const fetchAllShops = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/shops');
      const shopsWithOpenStatus = response.data.map(shop => ({
        ...shop,
        isOpen: isShopOpen(shop.workingHours, shop.isTemporaryClosed)
      }));
      setShops(shopsWithOpenStatus);
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
      const shopsWithOpenStatus = response.data.map(shop => ({
        ...shop,
        isOpen: isShopOpen(shop.workingHours, shop.isTemporaryClosed)
      }));
      setShops(shopsWithOpenStatus);
      Alert.alert('Success', 'Showing shops within 5km of your location');
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch nearby shops');
    } finally {
      setLoading(false);
    }
  };

  const filterShops = () => {
    if (!searchQuery.trim()) {
      setFilteredShops(shops);
      return;
    }

    const filtered = shops.filter(shop =>
      shop.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.address?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.address?.street?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredShops(filtered);
  };

  const renderShopItem = ({ item }) => (
    <ShopItemCard item={item} navigation={navigation} />
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
          {/* <Text style={styles.subtitle}>Find nearby Xerox shops</Text> */}
        </View>
        {/*<TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person-circle" size={32} color="#3b82f6" />
        </TouchableOpacity>*/}
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6b7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search shops by name or location"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Shops</Text>
      </View>

      <FlatList
        data={loading ? Array(3).fill({}) : filteredShops}
        renderItem={loading ? renderSkeletonItem : renderShopItem}
        keyExtractor={(item, index) => loading ? `skeleton-${index}` : item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="storefront-outline" size={64} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No shops found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Try adjusting your search' : 'No shops available'}
              </Text>
            </View>
          ) : null
        }
      />

      {/* Floating Location Button */}
      {!isKeyboardVisible && (
        <View>
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={fetchNearbyShops}
          >
            <Ionicons name="location" size={24} color="white" />
            <Text style={styles.floatingButtonText}>Nearby shops</Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingLeft: spacing.lg + 10,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.default,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
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
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default HomeScreen;