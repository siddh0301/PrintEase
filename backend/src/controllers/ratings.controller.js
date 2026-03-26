import Rating from '../models/Rating.js';
import Shop from '../models/Shop.js';
import Order from '../models/Order.js';
import mongoose from 'mongoose';

// Create or update rating
export const rateShop = async (req, res) => {
  try {
    const { shopId, orderId, rating, review } = req.body;
    const customerId = req.user._id;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Verify order exists and belongs to customer
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.customer.toString() !== customerId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (order.shop.toString() !== shopId) {
      return res.status(400).json({ message: 'Order does not belong to this shop' });
    }

    // Find existing rating
    let existingRating = await Rating.findOne({
      customer: customerId,
      shop: shopId
    });

    let isNewRating = false;

    if (existingRating) {
      // Update existing rating
      const oldRating = existingRating.rating;
      existingRating.rating = rating;
      existingRating.review = review || '';
      await existingRating.save();

      // Update shop rating average
      const shop = await Shop.findById(shopId);
      if (shop && shop.rating) {
        const totalPoints = (shop.rating.average * shop.rating.count) - oldRating + rating;
        shop.rating.average = totalPoints / shop.rating.count;
        await shop.save();
      }
    } else {
      // Create new rating
      isNewRating = true;

      existingRating = new Rating({
        customer: customerId,
        shop: shopId,
        order: orderId,
        rating,
        review: review || ''
      });
      await existingRating.save();

      // Update shop rating count and average
      const shop = await Shop.findById(shopId);
      if (shop) {
        const newCount = (shop.rating?.count || 0) + 1;
        const newTotal = ((shop.rating?.average || 0) * (shop.rating?.count || 0)) + rating;
        shop.rating = {
          average: newTotal / newCount,
          count: newCount
        };
        await shop.save();
      }
    }

    res.json({
      message: isNewRating ? 'Rating added successfully' : 'Rating updated successfully',
      rating: existingRating
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to rate shop', error: error.message });
  }
};

// Get ratings for a shop
export const getShopRatings = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { limit = 10, skip = 0 } = req.query;

    const ratings = await Rating.find({ shop: shopId })
      .populate('customer', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const totalCount = await Rating.countDocuments({ shop: shopId });

    // Get shop rating summary
    const shop = await Shop.findById(shopId);

    res.json({
      ratings,
      summary: {
        average: shop?.rating?.average || 0,
        count: shop?.rating?.count || 0,
        totalCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch ratings', error: error.message });
  }
};

// Check if user has already rated a shop
export const hasUserRatedShop = async (req, res) => {
  try {
    const { shopId } = req.params;
    const customerId = req.user._id;

    const rating = await Rating.findOne({
      customer: customerId,
      shop: shopId
    });

    res.json({
      hasRated: !!rating,
      rating: rating || null
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to check rating', error: error.message });
  }
};

// Get user's rating for a shop
export const getUserShopRating = async (req, res) => {
  try {
    const { shopId } = req.params;
    const customerId = req.user._id;

    const rating = await Rating.findOne({
      customer: customerId,
      shop: shopId
    }).populate('customer', 'name');

    if (!rating) {
      return res.status(404).json({ message: 'No rating found' });
    }

    res.json(rating);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch rating', error: error.message });
  }
};

// Get rating distribution for a shop (1-5 stars)
export const getRatingDistribution = async (req, res) => {
  try {
    const { shopId } = req.params;

    const distribution = await Rating.aggregate([
      { $match: { shop: new mongoose.Types.ObjectId(shopId) } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    const result = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };

    distribution.forEach(item => {
      result[item._id] = item.count;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch rating distribution', error: error.message });
  }
};
