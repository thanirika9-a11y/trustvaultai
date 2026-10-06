const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getSharedWithMe, getSharedByMe, shareDocument, getFamilyMembers, addFamilyMember, deleteFamilyMember } = require('../controllers/sharedController');

router.get('/with-me', protect, getSharedWithMe);
router.get('/by-me', protect, getSharedByMe);
router.post('/share/:docId', protect, shareDocument);

router.get('/family', protect, getFamilyMembers);
router.post('/family', protect, addFamilyMember);
router.delete('/family/:id', protect, deleteFamilyMember);

module.exports = router;
