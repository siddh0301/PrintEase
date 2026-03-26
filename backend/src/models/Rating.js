import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    default: ''
  },
  helpful: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Ensure one rating per customer per shop
ratingSchema.index({ customer: 1, shop: 1 }, { unique: true });

export default mongoose.model('Rating', ratingSchema);
