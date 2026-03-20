import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads/shops directory exists
const shopsDir = 'uploads/shops';
if (!fs.existsSync(shopsDir)) {
  fs.mkdirSync(shopsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, shopsDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const extension = path.extname(originalName);
    const basename = path.basename(originalName, extension);
    cb(null, `${timestamp}-${basename}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export default upload;