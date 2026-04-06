import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Allow letters, numbers, spaces, hyphens, apostrophes
        return /^[a-zA-Z0-9\s\-']{2,100}$/.test(v);
      },
      message: 'Name must contain only letters, numbers, spaces, hyphens, or apostrophes (2-100 characters).'
    }
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        // Basic email validation
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format.'
    }
  },
  password: {
    type: String,
    required: false
  },
  phone: {
    type: String,
    required: false,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        // Must be 10 digits
        return /^[0-9]{10}$/.test(v.replace(/\D/g, ''));
      },
      message: 'Phone must be 10 digits.'
    }
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['shop_owner', 'customer'],
    default: 'customer'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
