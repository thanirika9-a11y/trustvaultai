const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getDashboard, seedDashboardData } = require('../controllers/dashboardController');

// Protect all dashboard routes
router.use(protect);

router.get('/', getDashboard);
router.post('/seed', seedDashboardData);

module.exports = router;
