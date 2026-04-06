import multer from 'multer';

/**
 * Memory storage upload - keeps files in RAM for fast processing
 * Perfect for PDF inspection without disk I/O
 */
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
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

const withMemoryUpload = (req, res, next) => {
  memoryUpload.array('files', 10)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Upload error' });
    }
    next();
  });
};

export default withMemoryUpload;
