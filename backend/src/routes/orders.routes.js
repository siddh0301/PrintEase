import express from 'express';
import { auth, shopOwnerAuth } from '../middlewares/auth.middleware.js';
import withUpload from '../middlewares/upload.middleware.js';
import withMemoryUpload from '../middlewares/upload.memory.middleware.js';
import * as controller from '../controllers/orders.controller.js';

const router = express.Router();

// Debug: Test Cloudinary upload
router.post('/test/cloudinary', withMemoryUpload, controller.testCloudinaryUpload);

// Inspect uploaded files (customer) - uses MEMORY storage for speed
router.post('/inspect', auth, withMemoryUpload, controller.inspectFiles);

// Debug: Test page count extraction without upload
router.post('/debug/page-count', withMemoryUpload, controller.debugPageCount);

// Create order (customer)
router.post('/', auth, withUpload, controller.createOrder);

// Customer orders
router.get('/customer/my-orders', auth, controller.getCustomerOrders);

// Shop owner orders
router.get('/shop/my-orders', auth, shopOwnerAuth, controller.getShopOrders);

// Shop pending orders
router.get('/shop/pending', auth, shopOwnerAuth, controller.getShopPendingOrders);

// Update order status (shop owner)
router.put('/:id/status', auth, shopOwnerAuth, controller.updateOrderStatus);

// Print order (shop owner)
router.post('/:id/print', auth, shopOwnerAuth, controller.printOrder);

// Order details (customer or owner)
router.get('/:id', auth, controller.getOrderById);

// Cancel order (customer)
router.patch('/:id/cancel', auth, controller.cancelOrder);

export default router;
