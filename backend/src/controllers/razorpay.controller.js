import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/Order.js';
import Earning from '../models/Earning.js';
import Shop from '../models/Shop.js';
import Notification from '../models/Notification.js';
import config from '../config/config.js';

let razorpay = null;

try {
  if (config.RAZORPAY_KEY_ID && config.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: config.RAZORPAY_KEY_ID,
      key_secret: config.RAZORPAY_KEY_SECRET
    });
    console.log('✅ Razorpay initialized successfully');
  } else {
    console.warn('⚠️ Razorpay keys missing in .env - RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET');
  }
} catch (error) {
  console.error('❌ Razorpay initialization error:', error.message);
}

// ✅ Create Razorpay Order
export const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!razorpay) {
      return res.status(500).json({ 
        message: 'Razorpay not configured. Check server logs.',
        hint: 'Ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are valid in .env'
      });
    }

    const order = await Order.findById(orderId)
      .populate('shop')
      .populate('customer');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify customer
    if (order.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    // Check if already paid
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Order already paid' });
    }

    // Calculate final amount after loyalty reward discount
    const discountedAmount = order.discountedAmount || 0;
    const finalAmount = order.totalAmount - discountedAmount;

    console.log('💰 Amount Breakdown:');
    console.log('   - Original Total:', order.totalAmount);
    console.log('   - Free Pages Discount:', discountedAmount);
    console.log('   - Final Amount:', finalAmount);

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(finalAmount * 100),
      currency: 'INR',
      receipt: order.orderNumber,
      notes: {
        orderId: order._id.toString(),
        shopId: order.shop._id.toString(),
        shopName: order.shop.shopName,
        customerEmail: order.customer.email,
        customerPhone: order.customer.phone,
        originalAmount: order.totalAmount,
        freePages: order.freePages || 0,
        discountedAmount: discountedAmount
      }
    });

    console.log('✅ Razorpay order created:', razorpayOrder.id);

    // Save Razorpay order ID to order
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: finalAmount,
      originalAmount: order.totalAmount,
      discountedAmount: discountedAmount,
      freePages: order.freePages || 0,
      currency: 'INR',
      customerEmail: order.customer.email,
      customerPhone: order.customer.phone,
      customerName: order.customer.name,
      keyId: config.RAZORPAY_KEY_ID,
      shopName: order.shop.shopName,
      orderNumber: order.orderNumber
    });
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    res.status(500).json({
      message: 'Failed to create payment order',
      error: error.message
    });
  }
};

// ✅ Verify & Save Payment
export const verifyPayment = async (req, res) => {
  try {
    console.log('🔄 Verify Payment - Request body:', {
      orderId: req.body.orderId,
      razorpayOrderId: req.body.razorpayOrderId?.substring(0, 10),
      razorpayPaymentId: req.body.razorpayPaymentId?.substring(0, 10)
    });

    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      orderId
    } = req.body;

    // Verify signature
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    console.log('🔐 Signature Check:');
    console.log('   - Expected:', expectedSignature.substring(0, 20) + '...');
    console.log('   - Received:', razorpaySignature?.substring(0, 20) + '...');
    console.log('   - Match:', expectedSignature === razorpaySignature);

    if (expectedSignature !== razorpaySignature) {
      console.log('❌ Signature verification FAILED');
      return res.status(400).json({ message: 'Payment verification failed - Invalid signature' });
    }

    console.log('✅ Signature verified successfully');

    // Update order with payment details
    console.log('📦 Finding order:', orderId);
    const order = await Order.findById(orderId)
      .populate('shop');

    if (!order) {
      console.log('❌ Order not found:', orderId);
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('✅ Order found:', order._id, 'Shop:', order.shop?.shopName);

    order.razorpayOrderId = razorpayOrderId;
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    order.paymentStatus = 'paid';
    order.paymentId = razorpayPaymentId;
    await order.save();
    
    console.log('💾 Order saved with payment details');

    // Update shop revenue & order count
    const shop = await Shop.findByIdAndUpdate(
      order.shop._id,
      {
        $inc: {
          totalRevenue: order.totalAmount,
          totalOrders: 1
        }
      },
      { new: true }
    );

    console.log(`💰 Shop Revenue Updated:`, {
      shopName: shop.shopName,
      totalRevenue: shop.totalRevenue,
      totalOrders: shop.totalOrders
    });

    // ✅ Create earning for shopkeeper
    const earning = await Earning.create({
      shop: order.shop._id,
      order: order._id,
      customer: order.customer,
      amount: order.totalAmount,
      razorpayPaymentId: razorpayPaymentId,
      orderStatus: order.status
    });

    // Link earning to order
    order.earning = earning._id;
    await order.save();

    // Notify shop owner
    await Notification.create({
      user: order.shop.owner,
      order: order._id,
      title: `Payment Received - Order #${order.orderNumber}`,
      message: `Payment of ₹${order.totalAmount} received for Order #${order.orderNumber}`,
      type: 'payment'
    });

    // Re-fetch order with all populated data for response
    const completeOrder = await Order.findById(orderId)
      .populate('shop', 'shopName owner')
      .populate('customer', 'firstName lastName email phone')
      .lean();

    console.log('✅ Complete order fetched for response');
    console.log('   - Order number:', completeOrder?.orderNumber);
    console.log('   - Shop name:', completeOrder?.shop?.shopName);
    console.log('   - Total amount:', completeOrder?.totalAmount);
    console.log('   - Items count:', completeOrder?.items?.length);

    res.json({
      success: true,
      message: 'Payment verified successfully',
      order: completeOrder
    });
    
    console.log('📤 Response sent to client successfully');
  } catch (error) {
    console.error('Payment verification failed:', error);
    res.status(500).json({
      message: 'Payment verification failed',
      error: error.message
    });
  }
};

// ✅ Get Payment History
export const getUserPaymentHistory = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('shop', 'shopName')
      .sort({ createdAt: -1 })
      .lean();

    const paymentHistory = orders.map(order => ({
      orderId: order._id,
      orderNumber: order.orderNumber,
      shopName: order.shop?.shopName,
      amount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
      razorpayPaymentId: order.razorpayPaymentId,
      createdAt: order.createdAt,
      completedAt: order.completedAt
    }));

    res.json({
      success: true,
      data: paymentHistory,
      totalAmount: orders.reduce((sum, o) => o.paymentStatus === 'paid' ? sum + o.totalAmount : sum, 0)
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch payment history',
      error: error.message
    });
  }
};
