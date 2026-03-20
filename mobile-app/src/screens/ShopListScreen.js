import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as Location from 'expo-location';

const ShopListScreen = ({ navigation }) => {
  const [shops, setShops] = useState([]);
  const [filteredShops, setFilteredShops] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNearbyShops();
  }, []);

  useEffect(() => {
    filterShops();
  }, [searchQuery, shops]);

  const fetchNearbyShops = async () => {
    try {
      setLoading(true);
      // Ask for permission and get current position
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Location permission is needed to show nearby shops');
        // Fallback: load all shops
        const all = await axios.get('/api/shops');
        setShops(all.data);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;
      const response = await axios.get(`/api/shops/nearby`, {
        params: { lat: latitude, lng: longitude, radius: 5000 }
      });
      setShops(response.data);
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

  const openLocationInMaps = async (shop) => {
    const { latitude, longitude } = shop.location?.coordinates || {};
    const address = `${shop.address?.street}, ${shop.address?.city}, ${shop.address?.state} ${shop.address?.pincode}`;

    if (latitude && longitude) {
      // Use coordinates if available
      const url = Platform.select({
        ios: `maps://app?daddr=${latitude},${longitude}`,
        android: `geo:${latitude},${longitude}?q=${encodeURIComponent(address)}`,
        default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
      });

      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          // Fallback to web URL
          await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`);
        }
      } catch (error) {
        Alert.alert('Error', 'Unable to open maps application');
      }
    } else {
      // Use address if coordinates not available
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
      try {
        await Linking.openURL(url);
      } catch (error) {
        Alert.alert('Error', 'Unable to open maps');
      }
    }
  };

  const hasPrintingServices = (shop) => {
    return shop.printingServices?.blackWhite || 
           shop.printingServices?.color ||
           shop.printingServices?.a4Size ||
           shop.printingServices?.a3Size ||
           shop.printingServices?.photoPaper ||
           shop.printingServices?.lamination ||
           shop.printingServices?.binding ||
           shop.printingServices?.scanning ||
           shop.printingServices?.pen ||
           shop.printingServices?.notebook ||
           shop.printingServices?.file ||
           shop.printingServices?.stapler;
  };

  const getServiceText = (shop) => {
    if (hasPrintingServices(shop)) {
      const services = [];
      
      // Basic printing
      if (shop.printingServices?.blackWhite) services.push('B/W');
      if (shop.printingServices?.color) services.push('Color');
      
      // Paper sizes
      if (shop.printingServices?.a4Size) services.push('A4');
      if (shop.printingServices?.a3Size) services.push('A3');
      if (shop.printingServices?.photoPaper) services.push('Photo');
      
      // Additional services
      if (shop.printingServices?.lamination) services.push('Lamination');
      if (shop.printingServices?.binding) services.push('Binding');
      if (shop.printingServices?.scanning) services.push('Scanning');
      
      // Stationery
      if (shop.printingServices?.pen || shop.printingServices?.notebook || 
          shop.printingServices?.file || shop.printingServices?.stapler) {
        services.push('Stationery');
      }
      
      return `${services.slice(0, 4).join(', ')}${services.length > 4 ? '...' : ''}`;
    }
    return 'No services';
  };

  const renderShopItem = ({ item }) => (
    <TouchableOpacity
      style={styles.shopCard}
      onPress={() => navigation.navigate('ShopDetail', { shop: item })}
    >
      <View style={styles.shopImageContainer}>
        {item.image ? (
          <Image
            source={{ uri: `http://192.168.1.5:5000${item.image}` }}
            style={styles.shopImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.shopImagePlaceholder}>
            <Ionicons name="storefront" size={32} color="#9ca3af" />
          </View>
        )}
        <View style={[styles.statusBadge, { backgroundColor: item.isOpen ? '#dcfce7' : '#fef2f2' }]}>
          <Text style={[styles.statusBadgeText, { color: item.isOpen ? '#166534' : '#dc2626' }]}>
            {item.isOpen ? 'Open' : 'Closed'}
          </Text>
        </View>
      </View>

      <View style={styles.shopInfo}>
        <View style={styles.shopHeader}>
          <Text style={styles.shopName} numberOfLines={1}>{item.shopName}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#fbbf24" />
            <Text style={styles.rating}>
              {item.rating?.average?.toFixed(1) || '0.0'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.locationContainer}
          onPress={() => openLocationInMaps(item)}
        >
          <Ionicons name="location-outline" size={16} color="#3b82f6" />
          <Text style={styles.shopAddress} numberOfLines={2}>
            {item.address?.street}, {item.address?.city}
          </Text>
          <Ionicons name="chevron-forward" size={14} color="#3b82f6" />
        </TouchableOpacity>

        <View style={styles.servicesContainer}>
          <Text style={[styles.servicesText, !hasPrintingServices(item) && styles.noServicesText]}>
            {getServiceText(item)}
          </Text>
        </View>

        <View style={styles.distanceContainer}>
          <Ionicons name="time-outline" size={14} color="#6b7280" />
          <Text style={styles.distanceText}>
            {item.distance ? `${(item.distance / 1000).toFixed(1)} km away` : 'Distance unknown'}
          </Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading shops...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nearby Shops (within 5 km)</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
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
      </View>

      <FlatList
        data={filteredShops}
        renderItem={renderShopItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No shops found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search' : 'No shops available in your area'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  placeholder: {
    width: 32,
  },
  searchContainer: {
    padding: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  shopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  shopImageContainer: {
    marginRight: 12,
    position: 'relative',
  },
  shopImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  shopImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'white',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  shopInfo: {
    flex: 1,
  },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingVertical: 4,
  },
  shopAddress: {
    fontSize: 13,
    color: '#3b82f6',
    marginLeft: 4,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 4,
  },
  servicesContainer: {
    marginTop: 4,
    marginBottom: 4,
  },
  servicesText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  noServicesText: {
    color: '#ef4444',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  distanceText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
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
    color: '#1f2937',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ShopListScreen;
