import mongoose from 'mongoose';
import { randomUUID } from 'crypto';
import { type } from 'os';

const otpSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => randomUUID(),
    unique: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  otp_code: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    enum: ['mobile_login', 'password_reset', 'mobile_register', 'email_verification'],
    required: true
  },
  expires_at: {
    type: Date,
    required: true
  },
  is_used: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0
  },
  ip_address: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
otpSchema.index({ user_id: 1, purpose: 1 });
otpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 }); // TTL index to auto-delete expired OTPs

const Otp = mongoose.model('Otp', otpSchema);

export default Otp;