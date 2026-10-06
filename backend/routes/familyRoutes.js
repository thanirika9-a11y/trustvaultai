const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getFamilyMembers, addFamilyMember, deleteFamilyMember } = require('../controllers/familyController');

router.use(protect);

router.get('/', getFamilyMembers);
router.post('/', addFamilyMember);
router.delete('/:id', deleteFamilyMember);

module.exports = router;
