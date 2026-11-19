const multer = require('multer');
const path = require('path');

// Store uploaded files directly in memory buffer for S3 streaming
const storage = multer.memoryStorage();

// Validate file type and extension (JPEG, PNG, WebP)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp/;
  const allowedMimetypes = ['image/jpeg', 'image/png', 'image/webp'];

  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const isExtValid = allowedExtensions.test(ext);
  const isMimeValid = allowedMimetypes.includes(file.mimetype);

  if (isExtValid && isMimeValid) {
    return cb(null, true);
  }

  cb(
    new Error(
      'Invalid file format. Only JPEG, PNG, and WebP image formats are allowed.'
    )
  );
};

// Multer upload instance configured for max 5MB per file
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per file
  },
  fileFilter,
});

// Middleware for handling up to 5 product images
const uploadProductImages = upload.array('images', 5);

module.exports = {
  uploadProductImages,
  upload,
};
