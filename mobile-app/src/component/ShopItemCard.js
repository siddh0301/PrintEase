import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import openLocationInMaps from './openLoactionInMaps';
import { colors, spacing, shadows } from '../styles/theme';

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

const ShopItemCard = ({ item, navigation }) => {
  return (
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
        </TouchableOpacity>

        <View style={styles.servicesContainer}>
          <Text style={[styles.servicesText, !hasPrintingServices(item) && styles.noServicesText]}>
            Seervices : {getServiceText(item)}
          </Text>
        </View>

        {/* <View style={styles.distanceContainer}>
          <Ionicons name="time-outline" size={14} color="#6b7280" />
          <Text style={styles.distanceText}>
            {item.distance ? `${(item.distance / 1000).toFixed(1)} km away` : 'Distance unknown'}
          </Text>
        </View> */}
      </View>

      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
  },
  shopAddress: {
    fontSize: 14,
    color: colors.textMuted,
  },
  ratingContainer: {
    // marginLeft: 70,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 4,
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
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingVertical: 4,
  },
  servicesContainer: {
    marginTop: 4,
    marginBottom: 4,
  },
  servicesText: {
    fontSize: 12,
    // color: colors.secondary,
    fontWeight: '500',
  },
  noServicesText: {
    color: colors.error,
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
});

export default ShopItemCard;
