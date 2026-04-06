import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ownerName: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Only allow letters, numbers, spaces, hyphens, apostrophes
        return /^[a-zA-Z0-9\s\-']{3,100}$/.test(v);
      },
      message: 'Owner name must contain only letters, numbers, spaces, hyphens, or apostrophes (3-100 characters). No HTML tags allowed.'
    }
  },
  shopName: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Only allow letters, numbers, spaces, hyphens, apostrophes, commas, periods
        return /^[a-zA-Z0-9\s\-',.&]{3,100}$/.test(v);
      },
      message: 'Shop name must contain only letters, numbers, spaces, hyphens, apostrophes, commas, periods, or ampersands (3-100 characters). No HTML tags allowed.'
    }
  },
  description: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        // Check for HTML tags or script content
        return !/<[^>]*>/.test(v) && !/javascript:|onerror|onload|onclick/i.test(v);
      },
      message: 'Description cannot contain HTML tags or JavaScript.'
    }
  },
  address: {
    shopNumber: {
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true; // Optional
          return /^[a-zA-Z0-9\s,.\-#/]{1,50}$/.test(v);
        },
        message: 'Invalid shop number format.'
      }
    },
    street: {
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true; // Optional
          return /^[a-zA-Z0-9\s,.\-#/]{3,100}$/.test(v);
        },
        message: 'Invalid street address format.'
      }
    },
    city: {
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true; // Optional
          return /^[a-zA-Z\s\-']{2,50}$/.test(v);
        },
        message: 'Invalid city name format.'
      }
    },
    state: String,
    pincode: {
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true; // Optional
          return /^[0-9]{5,6}$/.test(v);
        },
        message: 'Pincode must be 5-6 digits.'
      }
    }
  },
  // GeoJSON location for map + nearby queries
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number] // [lng, lat]
    }
  },
  contactInfo: {
    phone: String,
    email: String,
    whatsapp: String
  },
  // Direct UPI details for QR/intent payments (optional)
  upi: {
    id: { type: String, default: '' }, // e.g., name@bank
    displayName: { type: String, default: '' }, // shown in UPI apps
    qrImageUrl: { type: String, default: '' } // optional uploaded/static QR image
  },
  workingHours: {
    monday: { open: String, close: String, isOpen: Boolean },
    tuesday: { open: String, close: String, isOpen: Boolean },
    wednesday: { open: String, close: String, isOpen: Boolean },
    thursday: { open: String, close: String, isOpen: Boolean },
    friday: { open: String, close: String, isOpen: Boolean },
    saturday: { open: String, close: String, isOpen: Boolean },
    sunday: { open: String, close: String, isOpen: Boolean }
  },
  images: [String],
  image: {
    type: String, // Main shop image URL
    default: ''
  },
  // Dedicated printing services pricing
  printingServices: {
    blackWhite: {
      singleSidedPrice: { type: Number, default: 0 },
      doubleSidedPrice: { type: Number, default: 0 }
    },
    color: {
      singleSidedPrice: { type: Number, default: 0 },
      doubleSidedPrice: { type: Number, default: 0 }
    }
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isTemporaryClosed: {
    type: Boolean,
    default: false
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  totalOrders: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Geospatial index
shopSchema.index({ location: '2dsphere' });

export default mongoose.model('Shop', shopSchema);