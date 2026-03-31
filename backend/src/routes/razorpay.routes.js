import express from 'express';
import { auth } from '../middlewares/auth.middleware.js';
import {
  createRazorpayOrder,
  verifyPayment,
  getUserPaymentHistory
} from '../controllers/razorpay.controller.js';

const router = express.Router();

// ✅ Create Razorpay Order
router.post('/create-order', auth, createRazorpayOrder);

// ✅ Verify Payment
router.post('/verify-payment', auth, verifyPayment);

// ✅ Get Payment History
router.get('/payment-history', auth, getUserPaymentHistory);

export default router;
