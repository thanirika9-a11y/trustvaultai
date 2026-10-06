const Notification = require('../models/Notification');

// @desc    Get all notifications for current user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    let notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    // If new user with no notifications, auto-seed helpful welcome notifications
    if (notifications.length === 0) {
      const seeded = [
        {
          user: userId,
          title: 'AES-256 Encryption Active',
          message: 'Your personal vault is protected with military-grade 256-bit AES encryption.',
          type: 'security',
          read: false
        },
        {
          user: userId,
          title: 'AI Assistant Ready',
          message: 'Gemini AI assistant is ready to summarize and answer questions about your documents in Tamil & English.',
          type: 'document',
          read: false
        },
        {
          user: userId,
          title: 'Smart Reminders Active',
          message: 'Automated tracking for passport expiry, insurance policies, and loan EMIs is active.',
          type: 'reminder',
          read: true
        }
      ];
      await Notification.insertMany(seeded);
      notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(50);
    }

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    let count = await Notification.countDocuments({ user: userId, read: false });
    
    // If no notifications exist at all for user, count initial unread (2)
    const total = await Notification.countDocuments({ user: userId });
    if (total === 0) {
      count = 2;
    }

    res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};

// Helper: create a notification (used by other controllers)
const createNotification = async (userId, title, message, type = 'document') => {
  try {
    await Notification.create({ user: userId, title, message, type });
  } catch (e) {
    console.error('Create notification error:', e.message);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead,
  deleteNotification,
  createNotification
};
