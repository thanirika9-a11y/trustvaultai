const ActivityLog = require('../models/ActivityLog');

// @desc    Get activity log for current user
// @route   GET /api/activity
// @access  Private
const getActivities = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const activities = await ActivityLog.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.status(200).json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
};

// Helper: create an activity log entry (used by other controllers)
const createActivity = async (userId, action, details) => {
  try {
    await ActivityLog.create({ user: userId, action, details });
  } catch (e) {
    console.error('Activity log error:', e.message);
  }
};

module.exports = { getActivities, createActivity };
