// quickfix-website/server/services/notificationService.js
const Notification = require('../models/Notification');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

// @desc    Send a new notification to a specific user.
//          If userId is null, it creates a global Announcement.
const sendNotificationToUser = async (userId, title, message, type = 'info', link = null) => {
    try {
        if (userId === null) {
            // If userId is null, it means it's a global system-wide announcement.
            // We create an entry in the Announcement model which will be fetched by frontend for display.
            const Announcement = require('../models/Announcement'); // Import here to avoid circular dependency issues
            await Announcement.create({
                title: title,
                content: message,
                type: type,
                isActive: true,
                // createdBy: // If you have a system admin ID, assign it here (e.g. from an env variable)
                startDate: new Date()
            });
            logger.info(`Global announcement created from system notification: "${title}"`);
            return; // No specific user notification created in this case
        }

        const notification = await Notification.create({
            user: userId,
            title,
            message,
            type,
            link
        });
        logger.info(`Notification sent to user ${userId}: "${title}"`);
        // Optional: Implement real-time notifications via WebSockets (Socket.IO) here if needed
        // io.to(userId).emit('new_notification', notification);
        return notification;
    } catch (error) {
        logger.error(`Error sending notification to user ${userId || 'GLOBAL'}: ${error.message}`);
        throw new AppError('Failed to send notification', 500);
    }
};

// @desc    Get notifications for a user
const getNotificationsForUser = async (userId, readStatus = null) => {
    const query = { user: userId };
    if (readStatus !== null) {
        query.read = readStatus;
    }
    const notifications = await Notification.find(query).sort({ createdAt: -1 });
    return notifications;
};

// @desc    Mark notification(s) as read
const markNotificationsAsRead = async (notificationIds, userId) => {
    const result = await Notification.updateMany(
        { _id: { $in: notificationIds }, user: userId, read: false },
        { $set: { read: true } }
    );
    logger.info(`User ${userId} marked ${result.modifiedCount} notifications as read.`);
    return result;
};

// @desc    Delete notification(s)
const deleteNotifications = async (notificationIds, userId) => {
    const result = await Notification.deleteMany({ _id: { $in: notificationIds }, user: userId });
    logger.info(`User ${userId} deleted ${result.deletedCount} notifications.`);
    return result;
};

module.exports = {
    sendNotificationToUser,
    getNotificationsForUser,
    markNotificationsAsRead,
    deleteNotifications,
};