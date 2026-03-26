import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
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
  orderNumber: {
    type: String,
    unique: true,
    required: false
  },
  items: [{
    code: {
      type: String,
      required: false
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      required: false
    },
    serviceName: String,
    name: String,
    unit: {
      type: String,
      required: false
    },
    pages: {
      type: Number,
      default: 0
    },
    quantity: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    totalPrice: {
      type: Number,
      required: true
    }
  }],
  files: [{
    originalName: String,
    fileName: String,
    filePath: String,
    fileUrl: String,
    fileSize: Number,
    mimeType: String,
    pageCount: Number
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: String,
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    phone: String
  },
  notes: String,
  estimatedTime: Date,
  completedAt: Date
}, {
  timestamps: true
});

// Generate order number before validation (sync generator to avoid validation errors)
orderSchema.pre('validate', async function(next) {
  if (!this.orderNumber) {
    try {
      const user = await mongoose.model('User').findById(this.customer);
      const candidateName = user?.name || user?.email?.split('@')[0] || 'USER';
      const cleanName = candidateName.toString().replace(/[^a-zA-Z0-9]/g, '').substring(0, 20).toUpperCase() || 'USER';
      const randomDigits = Math.floor(100000 + Math.random() * 900000);
      this.orderNumber = `${cleanName}-${randomDigits}`;
    } catch (err) {
      const randomDigits = Math.floor(100000 + Math.random() * 900000);
      this.orderNumber = `USER-${randomDigits}`;
    }
  }
  next();
});

orderSchema.index({ shop: 1, paymentStatus: 1 });


export default mongoose.model('Order', orderSchema);
