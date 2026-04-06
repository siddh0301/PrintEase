import express from 'express';
import rateLimit from 'express-rate-limit';
import { validateUserInput } from '../middlewares/validation.middleware.js';
import * as authController from '../controllers/auth.controller.js';

const router = express.Router();

// 🔐 Rate limiters for auth endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 OTP requests
  message: 'Too many OTP requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registration attempts per hour
  message: 'Too many registration attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/request-otp', otpLimiter, validateUserInput, authController.requestOtp);
router.post('/verify-otp', otpLimiter, authController.verifyOtp);
router.post('/reset-password', otpLimiter, authController.resetPassword);

router.post('/register-customer', registerLimiter, validateUserInput, authController.registerCustomer);
router.post('/register-shopowner', registerLimiter, validateUserInput, authController.registerShopOwner);
router.post('/login-customer', loginLimiter, authController.loginCustomer);
router.post('/login-shopowner', loginLimiter, authController.loginShopOwner);

router.get('/me', authController.getMe);

export default router;