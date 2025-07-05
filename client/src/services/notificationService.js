// quickfix-website/client/src/services/notificationService.js
import api from '../utils/api';

export const getUserNotifications = async () => {
    return api.get('/notifications');
};

export const markNotificationAsRead = async (notificationId) => {
    return api.put(`/notifications/${notificationId}/read`);
};

export const markAllNotificationsAsRead = async () => {
    return api.put('/notifications/mark-all-read');
};

export const deleteNotification = async (notificationId) => {
    return api.delete(`/notifications/${notificationId}`);
};

// Public announcements (fetched by non-logged in or general users)
export const getPublicAnnouncements = async () => {
    return api.get('/announcements');
};