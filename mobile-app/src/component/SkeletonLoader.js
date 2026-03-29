import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors, spacing } from '../styles/theme';

const SkeletonLoader = ({ type, style }) => {
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };
    animate();
  }, [animation]);

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0.8],
  });

  const renderSkeletonContent = () => {
    switch (type) {
      case 'shopListCard':
        return (
          <View style={styles.skeletonCard}>
            <View style={styles.skeletonInfo}>
              <View style={styles.skeletonLine1} />
              <View style={styles.skeletonLine2} />
              <View style={styles.skeletonLine3} />
            </View>
            <View style={styles.skeletonIcon} />
          </View>
        );

      case 'orderListCard':
        return (
          <View style={styles.orderSkeletonCard}>
            <View style={styles.orderSkeletonHeader}>
              <View style={styles.orderSkeletonLine1} />
              <View style={styles.orderSkeletonStatus} />
            </View>
            <View style={styles.orderSkeletonLine2} />
            <View style={styles.orderSkeletonLine3} />
            <View style={styles.orderSkeletonFooter}>
              <View style={styles.orderSkeletonPrice} />
              <View style={styles.orderSkeletonDate} />
            </View>
          </View>
        );

      default:
        return (
          <View style={styles.skeletonCard}>
            <View style={styles.skeletonInfo}>
              <View style={styles.skeletonLine1} />
              <View style={styles.skeletonLine2} />
              <View style={styles.skeletonLine3} />
            </View>
            <View style={styles.skeletonIcon} />
          </View>
        );
    }
  };

  return (
    <Animated.View style={[style, { opacity }]}>
      {renderSkeletonContent()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skeletonInfo: {
    flex: 1,
  },
  skeletonLine1: {
    height: 18,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 8,
    width: '30%',
  },
  skeletonLine2: {
    height: 14,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 8,
    width: '60%',
  },
  skeletonLine3: {
    height: 14,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    width: '50%',
  },
  skeletonIcon: {
    width: 20,
    height: 20,
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
  },

  orderSkeletonCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderSkeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderSkeletonLine1: {
    height: 18,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    width: '40%',
  },
  orderSkeletonStatus: {
    height: 16,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    width: '25%',
  },
  orderSkeletonLine2: {
    height: 14,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 8,
    width: '70%',
  },
  orderSkeletonLine3: {
    height: 14,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 12,
    width: '50%',
  },
  orderSkeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderSkeletonPrice: {
    height: 16,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    width: '30%',
  },
  orderSkeletonDate: {
    height: 14,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    width: '35%',
  },
});

export default SkeletonLoader;