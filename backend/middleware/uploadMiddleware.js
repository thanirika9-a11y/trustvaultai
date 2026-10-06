const multer = require('multer');

// Store in memory because we will stream it to Cloudinary
const storage = multer.memoryStorage();

// Accept 10MB limit as decided
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (req, file, cb) => {
    // Accept only images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Only images and PDFs are allowed.'), false);
    }
  }
});

module.exports = upload;
