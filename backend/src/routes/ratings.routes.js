import express from 'express';
import { auth } from '../middlewares/auth.middleware.js';
import * as controller from '../controllers/ratings.controller.js';

const router = express.Router();

// Rate a shop
router.post('/', auth, controller.rateShop);

// Get rating distribution
router.get('/shop/:shopId/distribution', controller.getRatingDistribution);

// Check if user has rated a shop
router.get('/shop/:shopId/check', auth, controller.hasUserRatedShop);

// Get user's rating for a shop
router.get('/shop/:shopId/user', auth, controller.getUserShopRating);

// Get ratings for a shop
router.get('/shop/:shopId', controller.getShopRatings);

export default router;
