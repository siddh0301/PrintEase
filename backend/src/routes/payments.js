import express from 'express';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';
import Order from '../models/Order.js';
import config from '../config/config.js';

const router = express.Router();

const rawKey = process.env.STRIPE_SECRET_KEY || config.STRIPE_SECRET_KEY || '';
const isStripeConfigured = typeof rawKey === 'string' && rawKey.startsWith('sk_') && rawKey.length > 10;
const stripe = isStripeConfigured ? Stripe(rawKey) : null;

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// ✅ Route 1: Create payment intent (authenticated)
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.customer.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Order already paid' });
    }

    // Simulation fallback when Stripe is not configured
    if (!isStripeConfigured) {
      return res.json({ clientSecret: 'simulated_client_secret', paymentIntentId: 'test_simulated' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalAmount * 100),
      currency: 'inr',
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber
      },
      automatic_payment_methods: { enabled: true }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ✅ Route 1b: Setup UPI payment target for shop owner
router.post('/create-upi-payment', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId).populate('shop');

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.customer.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!order.shop || !order.shop.upi?.id) {
      return res.status(400).json({ message: 'Shop UPI ID is not configured' });
    }

    order.paymentMethod = 'upi';
    order.paymentStatus = 'pending';
    await order.save();

    return res.json({
      message: 'Send UPI payment to shop',
      upiId: order.shop.upi.id,
      amount: order.totalAmount,
      currency: 'INR',
      orderNumber: order.orderNumber
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ✅ Route 1c: Confirm UPI payment by customer after GPay/PhonePe/Paytm succeeds
router.post('/confirm-upi-payment', authenticateToken, async (req, res) => {
  try {
    const { orderId, upiTxnId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    if (order.customer.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Order already marked as paid' });
    }

    // Mark payment as successful
    order.paymentStatus = 'paid';
    order.paymentId = upiTxnId || `upi_${Date.now()}`;
    order.paymentMethod = 'upi';
    await order.save();

    res.json({
      message: 'UPI Payment confirmed successfully',
      orderNumber: order.orderNumber,
      paymentStatus: 'paid'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ✅ Route 2: Confirm payment
router.post('/confirm-payment', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    // Simulation fallback
    if (!isStripeConfigured) {
      const order = await Order.findById(orderId);
      if (order) {
        order.paymentStatus = 'paid';
        order.paymentId = paymentIntentId || 'test_simulated';
        await order.save();
      }
      return res.json({ message: 'Payment successful (simulated)', paymentStatus: 'paid' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      const order = await Order.findById(orderId);
      if (order) {
        order.paymentStatus = 'paid';
        order.paymentId = paymentIntentId;
        await order.save();
      }

      res.json({ message: 'Payment successful', paymentStatus: 'paid' });
    } else {
      res.status(400).json({ message: 'Payment failed', paymentStatus: paymentIntent.status });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ✅ Route 3: Get payment status
router.get('/status/:orderId', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.customer.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ paymentStatus: order.paymentStatus, paymentId: order.paymentId });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
