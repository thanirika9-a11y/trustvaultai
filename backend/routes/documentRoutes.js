const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  uploadDocument,
  getMyDocuments,
  getDocumentById,
  deleteDocument,
  viewDocument
} = require('../controllers/documentController');

// Public route for browser window.open tabs
router.get('/view/:id', viewDocument);

// Protect all other document routes
router.use(protect);

router.post('/', upload.single('document'), uploadDocument);
router.get('/', getMyDocuments);
router.get('/:id', getDocumentById);
router.delete('/:id', deleteDocument);

module.exports = router;
