import mongoose from 'mongoose';

const earningSchema = new mongoose.Schema({
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
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  amount: {
    type: Number,
    required: true
  },
  razorpayPaymentId: {
    type: String
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  status: {
    type: String,
    enum: ['unsettled', 'settled'],
    default: 'unsettled'
  }
}, {
  timestamps: true
});

export default mongoose.model('Earning', earningSchema);
