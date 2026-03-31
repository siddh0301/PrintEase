import express from 'express';
import { auth, shopOwnerAuth } from '../middlewares/auth.middleware.js';
import {
  getShopEarnings,
  createSettlement,
  getSettlements
} from '../controllers/settlement.controller.js';

const router = express.Router();

// Get shop earnings (shop owner only)
router.get('/earnings', auth, shopOwnerAuth, getShopEarnings);

// Create settlement (shop owner only)
router.post('/', auth, shopOwnerAuth, createSettlement);

// Get settlements (shop owner only)
router.get('/', auth, shopOwnerAuth, getSettlements);

export default router;
