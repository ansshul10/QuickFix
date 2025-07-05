// quickfix-website/server/routes/notifications.js
const express = require('express');
const {
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All notification routes are protected, requiring a logged-in user
router.use(protect);

router.get('/', getUserNotifications);             // Get all notifications for the current user
router.put('/:id/read', markNotificationAsRead);   // Mark a specific notification as read by ID
router.put('/mark-all-read', markAllNotificationsAsRead); // Mark all user's notifications as read
router.delete('/:id', deleteNotification);         // Delete a specific notification by ID

module.exports = router;