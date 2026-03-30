import React, { useState, useEffect } from 'react';
import openLocationInMaps from '../component/openLoactionInMaps';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { colors } from '../styles/theme';

const ShopDetailScreen = ({ navigation, route }) => {
  const { shop } = route.params;
  const [shopDetails, setShopDetails] = useState(shop);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchShopDetails();
  }, []);

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

  const fetchShopDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/shops/${shop._id}`);
      setShopDetails(response.data);
      const calculatedIsOpen = isShopOpen(response.data.workingHours, response.data.isTemporaryClosed);
      setIsOpen(calculatedIsOpen);

    } catch (error) {
      Alert.alert('Error', 'Failed to fetch shop details');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderNow = () => {
    navigation.navigate('Order', {
      shop: shopDetails
    });
  };

  console.log("IMAGE PATH:", shopDetails.image);
  const BASE_URL = "http://192.168.1.3:5000";
  const imagePath = shopDetails.image?.trim();
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {shopDetails.shopName}
        </Text>
        <View style={styles.placeholder} />
      </View>
      {/* Shop Image */}

      {shopDetails.image && (
        <View style={styles.shopImageContainer}>
          <Image
            source={{ uri: `${BASE_URL}${imagePath}` }}

            style={styles.shopImage}
            resizeMode="cover"
          />
        </View>
      )}
      <View style={styles.shopInfo}>
        <Text style={styles.shopName}>{shopDetails.shopName}</Text>
        {shopDetails.ownerName && (
          <Text style={styles.ownerName}>Owner: {shopDetails.ownerName}</Text>
        )}
        {shopDetails.description && (
          <Text style={styles.shopDescription}>{shopDetails.description}</Text>
        )}
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, { color: isOpen ? '#16a34a' : '#dc2626' }]}>
            {isOpen ? '🟢 Open Today' : '🔴 Closed Today'}
          </Text>
        </View>
        {shopDetails.businessHours && (
          <Text style={styles.businessHours}>🕒 {shopDetails.businessHours}</Text>
        )}

        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={20} color="#fbbf24" />
          <Text style={styles.rating}>
            {shopDetails.rating?.average?.toFixed(1) || '0.0'}
          </Text>
          <Text style={styles.ratingCount}>
            ({shopDetails.rating?.count || 0} reviews)
          </Text>
          {shopDetails.rating?.count > 0 && (
            <TouchableOpacity
              style={styles.viewRatingsButton}
              onPress={() => navigation.navigate('Rating', {
                shopId: shopDetails._id,
                shopName: shopDetails.shopName
              })}
            >
              <Text style={styles.viewRatingsText}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.addressContainer}
          onPress={() => openLocationInMaps(shopDetails)}
        >
          <Ionicons name="location-outline" size={20} color="#3b82f6" />
          <Text style={styles.address}>
            {shopDetails.address?.shopNumber}, {shopDetails.address?.street}, {shopDetails.address?.city}, {shopDetails.address?.state} - {shopDetails.address?.pincode}
          </Text>
          <Ionicons name="open-outline" size={16} color="#3b82f6" />
        </TouchableOpacity>

        {shopDetails.distance && (
          <View style={styles.distanceContainer}>
            <Ionicons name="navigate-outline" size={16} color="#6b7280" />
            <Text style={styles.distanceText}>
              {(shopDetails.distance / 1000).toFixed(1)} km away
            </Text>
          </View>
        )}

        {shopDetails.contactInfo?.phone && (
          <TouchableOpacity
            style={styles.contactContainer}
            onPress={async () => {
              const phoneNumber = shopDetails.contactInfo.phone.replace(/\s+/g, '');
              const url = `tel:${phoneNumber}`;
              try {
                await Linking.openURL(url);
              } catch (e) {
                Alert.alert('Error', 'Unable to make phone call');
              }
            }}
          >
            <Ionicons name="call-outline" size={20} color="#10b981" />
            <Text style={styles.contact}>
              {shopDetails.contactInfo.phone}
            </Text>
            <Ionicons name="call" size={16} color="#10b981" />
          </TouchableOpacity>
        )}

        {shopDetails.contactInfo?.email && (
          <View style={styles.contactContainer}>
            <Ionicons name="mail-outline" size={20} color="#6b7280" />
            <Text style={styles.contact}>{shopDetails.contactInfo.email}</Text>
          </View>
        )}
      </View>

      {isOpen && <View style={styles.footer}>
        <TouchableOpacity
          style={styles.orderButton}
          onPress={handleOrderNow}
        >
          <Text style={styles.orderButtonText}>Order Now</Text>
        </TouchableOpacity>
      </View>}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  placeholder: {
    width: 32,
  },
  shopInfo: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
  },
  shopName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  ownerName: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  shopDescription: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 22,
  },
  businessHours: {
    fontSize: 14,
    color: '#059669',
    marginBottom: 12,
    fontWeight: '500',
  },
  statusContainer: {
    marginBottom: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 4,
  },
  ratingCount: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  viewRatingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f9ff',
    borderRadius: 6,
    gap: 4,
  },
  viewRatingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  address: {
    fontSize: 14,
    color: '#3b82f6',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
    textDecorationLine: 'underline',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  distanceText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  contactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  contact: {
    fontSize: 14,
    color: '#10b981',
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  orderButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  orderButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  shopImageContainer: {
    padding: 16,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  shopImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
});

export default ShopDetailScreen;
