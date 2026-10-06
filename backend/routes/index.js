const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Health Check API
router.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.json({
    success: true,
    message: 'Backend is running correctly.',
    data: {
      status: 'UP',
      timestamp: new Date(),
      database: dbStatus
    }
  });
});

const authRoutes = require('./authRoutes');
const documentRoutes = require('./documentRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const sharedRoutes = require('./sharedRoutes');
const aiRoutes = require('./aiRoutes');
const familyRoutes = require('./familyRoutes');
const notificationRoutes = require('./notificationRoutes');
const activityRoutes = require('./activityRoutes');
const reminderRoutes = require('./reminderRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/shared', sharedRoutes);
router.use('/ai', aiRoutes);
router.use('/family', familyRoutes);
router.use('/notifications', notificationRoutes);
router.use('/activity', activityRoutes);
router.use('/reminders', reminderRoutes);

module.exports = router;
