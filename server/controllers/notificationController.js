// quickfix-website/server/controllers/notificationController.js
const asyncHandler = require('express-async-handler');
const {
    getNotificationsForUser,
    markNotificationsAsRead,
    deleteNotifications
} = require('../services/notificationService'); // Import service functions for notifications
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const Notification = require('../models/Notification'); // Directly import model for count/find operations


// @desc    Get notifications for the authenticated user
// @route   GET /api/notifications
// @access  Private
const getUserNotifications = asyncHandler(async (req, res) => {
    // Fetch notifications for the current authenticated user
    const notifications = await getNotificationsForUser(req.user._id);
    res.status(200).json({ success: true, data: notifications });
});

// @desc    Mark a specific notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationAsRead = asyncHandler(async (req, res, next) => {
    const notificationId = req.params.id;
    const userId = req.user._id;

    // Use service to mark a specific notification as read for the user
    const result = await markNotificationsAsRead([notificationId], userId);

    // If no notification was matched or modified, it might not exist or was already read
    if (result.modifiedCount === 0 && result.matchedCount === 0) {
        return next(new AppError('Notification not found or already read', 404));
    }

    res.status(200).json({ success: true, message: 'Notification marked as read' });
});

// @desc    Mark all notifications as read for the authenticated user
// @route   PUT /api/notifications/mark-all-read
// @access  Private
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    // Find all unread notifications for the user
    const unreadNotifications = await Notification.find({ user: userId, read: false }).select('_id');
    const notificationIds = unreadNotifications.map(notif => notif._id);

    if (notificationIds.length === 0) {
        return res.status(200).json({ success: true, message: 'No unread notifications to mark.' });
    }

    // Use service to mark all found notifications as read
    const result = await markNotificationsAsRead(notificationIds, userId);
    res.status(200).json({ success: true, message: `${result.modifiedCount} notifications marked as read` });
});


// @desc    Delete a specific notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res, next) => {
    const notificationId = req.params.id;
    const userId = req.user._id;

    // Use service to delete the specific notification for the user
    const result = await deleteNotifications([notificationId], userId);

    // If no notification was deleted, it might not exist or user not authorized
    if (result.deletedCount === 0) {
        return next(new AppError('Notification not found or not authorized to delete', 404));
    }

    res.status(200).json({ success: true, message: 'Notification deleted' });
});

module.exports = {
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
};