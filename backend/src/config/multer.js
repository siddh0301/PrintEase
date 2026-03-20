import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'orders');
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    } catch (e) {
      cb(e);
    }
  },
  filename: (req, file, cb) => {
    // Sanitize filename: remove spaces and special characters, keep only alphanumeric, dash, underscore, dot
    const sanitized = file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, '-') // Replace special chars with dash
      .replace(/-+/g, '-')               // Replace multiple dashes with single
      .replace(/^-+|-+$/g, '');          // Remove leading/trailing dashes

    cb(null, Date.now() + '-' + sanitized);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const mime = (file.mimetype || '').toLowerCase();
    const isPdf = mime === 'application/pdf';
    const isImage = mime.startsWith('image/');
    const isDoc =
      mime === 'application/msword' ||
      mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (isPdf || isImage || isDoc) cb(null, true);
    else cb(new Error('Only PDF, Word, or image files are allowed'));
  }
});

export default upload;
