const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const {
  getReminders,
  createReminder,
  updateReminder,
  toggleComplete,
  deleteReminder,
  getUpcoming
} = require('../controllers/reminderController');

router.use(protect);

router.get('/upcoming', getUpcoming);
router.route('/')
  .get(getReminders)
  .post(createReminder);

router.route('/:id')
  .put(updateReminder)
  .delete(deleteReminder);

router.put('/:id/toggle', toggleComplete);

module.exports = router;
