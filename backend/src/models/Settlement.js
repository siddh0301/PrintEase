import mongoose from 'mongoose';

const settlementSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  earnings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Earning'
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  settlementDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  transactionId: String,
  notes: String
}, {
  timestamps: true
});

export default mongoose.model('Settlement', settlementSchema);
