import upload from '../config/shop.image.multer.js';

const withShopImageUpload = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

export default withShopImageUpload;