import express from 'express';
import * as usersController from '../controllers/users.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Update profile
router.put('/update-profile', auth, usersController.updateProfile);

export default router;