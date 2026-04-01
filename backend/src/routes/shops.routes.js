import express from 'express';
import { auth, shopOwnerAuth } from '../middlewares/auth.middleware.js';
import { validateShopInput, validateUserInput } from '../middlewares/validation.middleware.js';
import withShopUpload from '../middlewares/upload.shop.middleware.js';
import withShopImageUpload from '../middlewares/upload.shop.image.middleware.js';
import * as controller from '../controllers/shop.controller.js';

const router = express.Router();

// Public
router.get('/', controller.getAllShops);
router.get('/nearby', controller.getNearbyShops);
router.get('/:id', controller.getShopById);

// Shop owner
router.post('/', auth, shopOwnerAuth, validateShopInput, controller.createShop);
router.put('/:id', auth, shopOwnerAuth, validateShopInput, controller.updateShop);
router.put('/:id/upi', auth, shopOwnerAuth, controller.updateUpi);
router.get('/:id/upi-qr', auth, shopOwnerAuth, controller.generateUpiQr);
router.put('/:id/toggle-open', auth, shopOwnerAuth, controller.toggleShopOpen);
router.post('/:id/upload-image', auth, shopOwnerAuth, withShopImageUpload, controller.uploadShopImage);
router.get('/owner/my-shops', auth, shopOwnerAuth, controller.getOwnerShops);

// Services
router.get('/:id/services', controller.getServicesByShop);
router.post('/:id/services', auth, shopOwnerAuth, withShopUpload, controller.addService);
router.put('/:id/services/:serviceId', auth, shopOwnerAuth, withShopUpload, controller.updateService);
router.delete('/:id/services/:serviceId', auth, shopOwnerAuth, controller.deleteService);

// Printing & location
router.put('/:id/printing-services', auth, shopOwnerAuth, controller.updatePrintingServices);
router.put('/:id/location', auth, shopOwnerAuth, controller.updateLocation);

export default router;
