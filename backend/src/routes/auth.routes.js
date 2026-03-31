import express from 'express';
import * as authController from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/request-otp', authController.requestOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/reset-password', authController.resetPassword);

router.post('/register-customer', authController.registerCustomer);
router.post('/register-shopowner', authController.registerShopOwner);
router.post('/login-customer', authController.loginCustomer);
router.post('/login-shopowner', authController.loginShopOwner);

router.get('/me', authController.getMe);

export default router;