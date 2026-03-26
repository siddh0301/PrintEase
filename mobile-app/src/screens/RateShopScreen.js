import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { colors, spacing, shadows } from '../styles/theme';

const RateShopScreen = ({ navigation, route }) => {
  const { shopId, shopName, existingRating, orderId } = route.params;
  const [rating, setRating] = useState(existingRating?.rating || 0);
  const [review, setReview] = useState(existingRating?.review || '');
  const [loading, setLoading] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Please select a rating');
      return;
    }

    if (!orderId) {
      Alert.alert('Error', 'Order ID is required');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/ratings', {
        shopId,
        orderId,
        rating,
        review
      });

      Alert.alert(
        'Success',
        existingRating 
          ? 'Your rating has been updated!'
          : 'Thank you for rating!',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to submit rating'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStarPicker = () => {
    return (
      <View style={styles.starPickerContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            onPressIn={() => setHoveredRating(star)}
            onPressOut={() => setHoveredRating(0)}
            style={styles.starButton}
          >
            <Ionicons
              name={
                star <= (hoveredRating || rating) ? 'star' : 'star-outline'
              }
              size={48}
              color={star <= (hoveredRating || rating) ? '#fbbf24' : '#d1d5db'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const getRatingLabel = () => {
    switch (rating) {
      case 1:
        return 'Poor';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Very Good';
      case 5:
        return 'Excellent';
      default:
        return 'Select a rating';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Shop</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Shop Info Card */}
        <View style={[styles.card, styles.shopInfoCard]}>
          <View style={styles.shopIconContainer}>
            <Ionicons name="storefront" size={40} color={colors.primary} />
          </View>
          <Text style={styles.shopNameText}>{shopName}</Text>
          <Text style={styles.ratingPromptText}>How would you rate this shop?</Text>
        </View>

        {/* Star Picker Card */}
        <View style={[styles.card, styles.starPickerCard]}>
          {renderStarPicker()}
          <Text style={styles.ratingLabelText}>{getRatingLabel()}</Text>
        </View>

        {/* Review Input Card */}
        <View style={[styles.card, styles.reviewCard]}>
          <Text style={styles.sectionTitle}>Share Your Experience (Optional)</Text>
          <TextInput
            style={styles.reviewInput}
            placeholder="Tell other customers about your experience..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={review}
            onChangeText={setReview}
          />
          <Text style={styles.charCount}>
            {review.length}/500
          </Text>
        </View>

        {/* Tips Card */}
        <View style={[styles.card, styles.tipsCard]}>
          <Text style={styles.tipsTitle}>💡 Tips for helpful reviews</Text>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.tipText}>Be specific about your experience</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.tipText}>Mention service speed and quality</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.tipText}>Be respectful and constructive</Text>
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.submitButtonText}>
                {existingRating ? 'Update Rating' : 'Submit Rating'}
              </Text>
            </>
          )}
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
  placeholder: {
    width: 40,
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
  shopInfoCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  shopIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  shopNameText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  ratingPromptText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  starPickerCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  starPickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  starButton: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingLabelText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  reviewCard: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: spacing.md,
  },
  reviewInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 14,
    color: '#1f2937',
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  tipsCard: {
    padding: spacing.lg,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  tipText: {
    fontSize: 13,
    color: '#4b5563',
    flex: 1,
  },
  buttonContainer: {
    padding: spacing.lg,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  spacer: {
    height: spacing.lg,
  },
});

export default RateShopScreen;
