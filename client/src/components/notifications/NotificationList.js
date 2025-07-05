// quickfix-website/client/src/components/notifications/NotificationList.js
import React, { useContext, useEffect, useState } from 'react';
import { NotificationContext } from '../../context/NotificationContext';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner'; // Keep this import for main list loading
import {
    CheckCircleIcon, TrashIcon, EyeIcon as OutlineEyeIcon, BellIcon as OutlineBellIcon,
    InformationCircleIcon, ExclamationTriangleIcon, ExclamationCircleIcon, LightBulbIcon,
    MegaphoneIcon, ShieldExclamationIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';
import { NOTIFICATION_TYPES, ANNOUNCEMENT_TYPES, ROUTES } from '../../utils/constants';

function NotificationList() {
    const { notifications, loading, error, unreadCount, announcements,
            fetchNotifications, markAsRead, markAllAsRead, deleteNotif } = useContext(NotificationContext);
    const { user, loading: authLoading } = useContext(AuthContext);

    const [displayList, setDisplayList] = useState([]);
    const [actionLoading, setActionLoading] = useState(null); // State to track loading for specific actions/notifications

    useEffect(() => {
        if (!loading && !authLoading) {
            let combined = [];
            if (user) {
                combined = [...notifications];
            }
            const activeAnnouncements = announcements.filter(ann => {
                const now = new Date();
                return ann.isActive && new Date(ann.startDate) <= now && (ann.endDate === null || new Date(ann.endDate) >= now);
            }).map(ann => ({
                _id: `announcement-${ann._id}`,
                title: ann.title,
                message: ann.content,
                type: ann.type,
                read: false,
                link: ann.link,
                createdAt: ann.createdAt,
                isAnnouncement: true
            }));

            const uniqueAnnouncements = activeAnnouncements.filter(ann =>
                !notifications.some(n => n.title === ann.title && n.message === ann.message)
            );

            combined = [...combined, ...uniqueAnnouncements];

            combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setDisplayList(combined);
        }
    }, [notifications, announcements, loading, authLoading, user]);


    const getIconForType = (type) => {
        switch (type) {
            case NOTIFICATION_TYPES.SUCCESS: return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
            case NOTIFICATION_TYPES.ERROR: return <ExclamationCircleIcon className="h-6 w-6 text-red-500" />;
            case NOTIFICATION_TYPES.WARNING: return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
            case NOTIFICATION_TYPES.SYSTEM: return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
            case NOTIFICATION_TYPES.GUIDE_UPDATE: return <LightBulbIcon className="h-6 w-6 text-purple-500" />;
            case NOTIFICATION_TYPES.ANNOUNCEMENT: return <MegaphoneIcon className="h-6 w-6 text-orange-500" />;
            case NOTIFICATION_TYPES.SUBSCRIPTION: return <InformationCircleIcon className="h-6 w-6 text-primary" />;
            case NOTIFICATION_TYPES.ACCOUNT_VERIFICATION: return <ShieldExclamationIcon className="h-6 w-6 text-red-600 dark:text-red-400" />;
            default: return <OutlineBellIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />;
        }
    };

    const handleMarkAsRead = async (id) => {
        setActionLoading(`read-${id}`);
        await markAsRead(id);
        setActionLoading(null);
    };

    const handleDeleteNotif = async (id) => {
        setActionLoading(`delete-${id}`);
        await deleteNotif(id);
        setActionLoading(null);
    };

    const handleMarkAllAsRead = async () => {
        setActionLoading('mark-all');
        await markAllAsRead();
        setActionLoading(null);
    };


    // Show initial full-screen loading spinner if the component is in a global loading state
    if (loading || authLoading) {
        return <LoadingSpinner fullScreen={true} message="Loading notifications..." />;
    }

    if (!user) {
        return (
            <div className="text-center text-textSecondary dark:text-gray-400 text-lg mt-8 bg-cardBackground dark:bg-gray-800 p-6 rounded-lg shadow-md">
                Please log in to view your notifications.
                <br/>
                <Link to={ROUTES.LOGIN} className="text-primary hover:underline mt-4 inline-block">Login Now</Link>
            </div>
        );
    }

    if (error) {
        return <div className="text-center text-error dark:text-error-light text-lg mt-8">{error}</div>;
    }

    return (
        <div className="py-8">
            <h1 className="text-4xl font-extrabold text-center text-textDefault dark:text-white mb-8">Your Notifications & Alerts</h1>

            <div className="max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-6 bg-cardBackground dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-border dark:border-gray-700">
                    <span className="text-lg font-medium text-textDefault dark:text-white">Unread: {unreadCount}</span>
                    <button
                        onClick={handleMarkAllAsRead}
                        disabled={unreadCount === 0 || actionLoading === 'mark-all'}
                        className="px-4 py-2 bg-secondary hover:bg-secondary-dark text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[150px]"
                    >
                        {actionLoading === 'mark-all' ? (
                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-b-2 border-white"></span>
                        ) : (
                            'Mark All as Read'
                        )}
                    </button>
                </div>

                {displayList.length === 0 ? (
                    <div className="text-center text-textSecondary dark:text-gray-400 text-lg py-10 bg-cardBackground dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        You have no notifications or active announcements.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {displayList.map(notification => (
                            <div
                                key={notification._id}
                                className={`flex items-start p-4 rounded-lg shadow-md border ${
                                    notification.read ? 'bg-gray-100 dark:bg-gray-700 border-border dark:border-gray-600' :
                                    'bg-cardBackground dark:bg-gray-800 border-primary-light dark:border-primary'
                                } transition-colors duration-200`}
                            >
                                <div className="flex-shrink-0 mt-1 mr-3">
                                    {getIconForType(notification.type)}
                                </div>
                                <div className="flex-grow">
                                    <h3 className={`text-lg font-semibold ${notification.read ? 'text-textSecondary dark:text-gray-400' : 'text-textDefault dark:text-white'}`}>
                                        {notification.title}
                                    </h3>
                                    <p className={`text-sm ${notification.read ? 'text-textSecondary dark:text-gray-500' : 'text-textDefault dark:text-gray-200'} mb-2`}>
                                        {notification.message}
                                    </p>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(notification.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                    {notification.link && (
                                        <Link
                                            to={notification.link}
                                            className="ml-3 text-sm text-primary hover:underline transition-colors"
                                            onClick={() => {
                                                if (notification.type !== NOTIFICATION_TYPES.ACCOUNT_VERIFICATION && !notification.read) {
                                                    // No need for inline loading here as it's a navigation action.
                                                    markAsRead(notification._id);
                                                } else if (notification.type === NOTIFICATION_TYPES.ACCOUNT_VERIFICATION) {
                                                    if (!notification.read) markAsRead(notification._id); // Mark as read if they click on it
                                                }
                                            }}
                                        >
                                            {notification.type === NOTIFICATION_TYPES.ACCOUNT_VERIFICATION ? 'Verify Now' : 'View Details'}
                                        </Link>
                                    )}
                                    <div className="mt-2 flex space-x-2">
                                        {!notification.read && !notification.isAnnouncement && (
                                            <button
                                                onClick={() => handleMarkAsRead(notification._id)}
                                                disabled={actionLoading === `read-${notification._id}`}
                                                className="px-3 py-1 bg-primary text-white rounded-md text-xs font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
                                            >
                                                {actionLoading === `read-${notification._id}` ? (
                                                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-b-2 border-white"></span>
                                                ) : (
                                                    <><OutlineEyeIcon className="h-4 w-4 inline-block mr-1" /> Mark as Read</>
                                                )}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDeleteNotif(notification._id)}
                                            disabled={actionLoading === `delete-${notification._id}`}
                                            className="px-3 py-1 bg-red-500 text-white rounded-md text-xs font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
                                        >
                                            {actionLoading === `delete-${notification._id}` ? (
                                                <span className="inline-block h-4 w-4 animate-spin rounded-full border-b-2 border-white"></span>
                                            ) : (
                                                <><TrashIcon className="h-4 w-4 inline-block mr-1" /> Delete</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default NotificationList;