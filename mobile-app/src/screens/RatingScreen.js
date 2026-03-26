import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { colors, spacing, shadows } from '../styles/theme';

const RatingScreen = ({ navigation, route }) => {
  const { shopId, shopName } = route.params;
  const [ratings, setRatings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [distribution, setDistribution] = useState({});
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(null);

  useEffect(() => {
    fetchRatings();
    checkUserRating();
  }, []);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const [ratingsRes, distributionRes] = await Promise.all([
        axios.get(`/api/ratings/shop/${shopId}`),
        axios.get(`/api/ratings/shop/${shopId}/distribution`)
      ]);
      
      setRatings(ratingsRes.data.ratings);
      setSummary(ratingsRes.data.summary);
      setDistribution(distributionRes.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch ratings');
    } finally {
      setLoading(false);
    }
  };

  const checkUserRating = async () => {
    try {
      const response = await axios.get(`/api/ratings/shop/${shopId}/check`);
      if (response.data.hasRated) {
        setUserRating(response.data.rating);
      }
    } catch (error) {
      // No user rating yet
    }
  };

  const renderStars = (rating) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={16}
            color={star <= rating ? '#fbbf24' : '#d1d5db'}
            style={styles.star}
          />
        ))}
      </View>
    );
  };

  const getRatingPercentage = (count) => {
    if (!summary || summary.count === 0) return 0;
    return (count / summary.count) * 100;
  };

  const renderRatingBar = (stars, count) => {
    const percentage = getRatingPercentage(count);
    return (
      <View key={stars} style={styles.ratingBarContainer}>
        <View style={styles.starsForBar}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= stars ? 'star' : 'star-outline'}
              size={14}
              color={star <= stars ? '#fbbf24' : '#d1d5db'}
            />
          ))}
        </View>
        <View style={styles.barBackground}>
          <View
            style={[
              styles.barFill,
              { width: `${percentage}%` }
            ]}
          />
        </View>
        <Text style={styles.barCount}>{count}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
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
        <Text style={styles.headerTitle}>Shop Ratings</Text>
        {!userRating && (
          <TouchableOpacity
            style={styles.rateButton}
            onPress={() => navigation.navigate('RateShop', { shopId, shopName })}
          >
            <Ionicons name="star" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        {summary && (
          <View style={[styles.card, styles.summaryCard]}>
            <View style={styles.summaryContent}>
              <View style={styles.averageSection}>
                <Text style={styles.averageNumber}>
                  {summary.average.toFixed(1)}
                </Text>
                <View style={styles.summaryStars}>
                  {renderStars(Math.round(summary.average))}
                </View>
                <Text style={styles.summaryCount}>
                  {summary.count} {summary.count === 1 ? 'rating' : 'ratings'}
                </Text>
              </View>

              <View style={styles.distributionSection}>
                {[5, 4, 3, 2, 1].map((stars) =>
                  renderRatingBar(stars, distribution[stars] || 0)
                )}
              </View>
            </View>
          </View>
        )}

        {/* User's Rating Card */}
        {userRating && (
          <View style={[styles.card, styles.userRatingCard]}>
            <Text style={styles.sectionTitle}>Your Rating</Text>
            <View style={styles.userRatingContent}>
              {renderStars(userRating.rating)}
              <Text style={styles.userReviewText}>
                {userRating.review || 'No comment added'}
              </Text>
              <Text style={styles.userRatingDate}>
                {new Date(userRating.createdAt).toLocaleDateString()}
              </Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate('RateShop', {
                  shopId,
                  shopName,
                  existingRating: userRating
                })}
              >
                <Ionicons name="pencil" size={16} color={colors.primary} />
                <Text style={styles.editButtonText}>Edit Rating</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Ratings List */}
        {ratings.length > 0 ? (
          <View style={[styles.card, styles.ratingsCard]}>
            <Text style={styles.sectionTitle}>Customer Reviews</Text>
            {ratings.map((rating, index) => (
              <View
                key={index}
                style={[
                  styles.ratingItem,
                  index !== ratings.length - 1 && styles.ratingItemBorder
                ]}
              >
                <View style={styles.ratingHeader}>
                  <Text style={styles.customerName}>
                    {rating.customer?.name || 'Anonymous'}
                  </Text>
                  {renderStars(rating.rating)}
                </View>
                {rating.review && (
                  <Text style={styles.reviewText}>{rating.review}</Text>
                )}
                <Text style={styles.ratingDate}>
                  {new Date(rating.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.card, styles.emptyCard]}>
            <Ionicons name="star-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No ratings yet</Text>
            <Text style={styles.emptySubtext}>
              Be the first to rate this shop
            </Text>
          </View>
        )}

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
  rateButton: {
    padding: spacing.sm,
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
  summaryCard: {
    padding: spacing.lg,
  },
  summaryContent: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  averageSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  averageNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  summaryStars: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    marginHorizontal: 2,
  },
  summaryCount: {
    fontSize: 13,
    color: '#6b7280',
  },
  distributionSection: {
    flex: 1,
    justifyContent: 'space-around',
  },
  ratingBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  starsForBar: {
    flexDirection: 'row',
    width: 60,
  },
  barBackground: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#fbbf24',
  },
  barCount: {
    width: 30,
    textAlign: 'right',
    fontSize: 12,
    color: '#6b7280',
  },
  userRatingCard: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: spacing.md,
  },
  userRatingContent: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: spacing.md,
  },
  userReviewText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  userRatingDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: spacing.md,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#f0f9ff',
    borderRadius: 6,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  ratingsCard: {
    padding: spacing.lg,
  },
  ratingItem: {
    paddingVertical: spacing.md,
  },
  ratingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  reviewText: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 18,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  ratingDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#d1d5db',
    marginTop: spacing.sm,
  },
  spacer: {
    height: spacing.lg,
  },
});

export default RatingScreen;
