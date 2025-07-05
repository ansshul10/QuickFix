// quickfix-website/client/src/context/NotificationContext.js
import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import * as notificationService from '../services/notificationService';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext'; // To know if user is logged in
import logger from '../utils/logger'; // Frontend logger

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user, loading: authLoading } = useContext(AuthContext); // Access user and auth loading state
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [announcements, setAnnouncements] = useState([]); // For global announcements

    // Fetch user-specific notifications
    const fetchNotifications = useCallback(async () => {
        if (!user) { // Only fetch if user is logged in
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await notificationService.getUserNotifications();
            setNotifications(res.data.data);
            const unread = res.data.data.filter(n => !n.read).length;
            setUnreadCount(unread);
            logger.info('User notifications fetched.');
        } catch (err) {
            logger.error('Failed to fetch notifications:', err.response?.data?.message || err.message, err);
            setNotifications([]);
            setUnreadCount(0);
            // Don't toast error for expected 401 when user is not logged in, api.js interceptor handles it
        } finally {
            setLoading(false);
        }
    }, [user]); // Re-fetch when user changes (login/logout)

    // Fetch global announcements (publicly accessible)
    const fetchAnnouncements = useCallback(async () => {
        try {
            const res = await notificationService.getPublicAnnouncements();
            setAnnouncements(res.data.data);
            logger.info('Public announcements fetched.');
        } catch (err) {
            logger.error('Failed to fetch public announcements:', err.response?.data?.message || err.message, err);
            setAnnouncements([]);
        }
    }, []);

    // Effect to fetch on initial load or when user status changes
    useEffect(() => {
        // Fetch public announcements once on mount
        fetchAnnouncements();

        if (!authLoading) { // Only fetch user notifications once auth status is known
            fetchNotifications();
            // You could set a polling interval here to check for new notifications periodically
            // const interval = setInterval(fetchNotifications, 60000); // Every 60 seconds
            // return () => clearInterval(interval);
        }
    }, [authLoading, fetchNotifications, fetchAnnouncements]); // Depend on authLoading to prevent early calls

    const markAsRead = async (notificationId) => {
        try {
            await notificationService.markNotificationAsRead(notificationId);
            setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1)); // Decrement unread count
            toast.success('Notification marked as read.');
            return true;
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to mark notification as read.');
            logger.error('Error marking notification as read:', err);
            return false;
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationService.markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
            toast.success('All notifications marked as read.');
            return true;
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to mark all notifications as read.');
            logger.error('Error marking all notifications as read:', err);
            return false;
        }
    };

    const deleteNotif = async (notificationId) => {
        try {
            await notificationService.deleteNotification(notificationId);
            setNotifications(prev => prev.filter(n => n._id !== notificationId));
            // If it was unread, decrement count. If already read, no change.
            setUnreadCount(prev => {
                const deletedNotif = notifications.find(n => n._id === notificationId);
                return (deletedNotif && !deletedNotif.read) ? Math.max(0, prev - 1) : prev;
            });
            toast.info('Notification deleted.');
            return true;
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete notification.');
            logger.error('Error deleting notification:', err);
            return false;
        }
    };


    return (
        <NotificationContext.Provider value={{
            notifications,
            loading,
            unreadCount,
            announcements, // Global announcements
            fetchNotifications,
            markAsRead,
            markAllAsRead,
            deleteNotif,
        }}>
            {children}
        </NotificationContext.Provider>
    );
};