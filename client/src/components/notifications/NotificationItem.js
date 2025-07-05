// quickfix-website/client/src/components/notifications/NotificationItem.js
// This component can be used to render a single notification item within NotificationList.js
// For current implementation simplicity, its logic is directly in NotificationList.js's map.
// If you want more complex interaction or a standalone item, extract its JSX here.

import React from 'react';
import {
    CheckCircleIcon, TrashIcon, EyeIcon as OutlineEyeIcon, BellIcon as OutlineBellIcon,
    InformationCircleIcon, ExclamationTriangleIcon, ExclamationCircleIcon, LightBulbIcon,
    MegaphoneIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';
import { NOTIFICATION_TYPES } from '../../utils/constants';

function NotificationItem({ notification, onMarkAsRead, onDelete }) {
    const getIconForType = (type) => {
        switch (type) {
            case NOTIFICATION_TYPES.SUCCESS: return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
            case NOTIFICATION_TYPES.ERROR: return <ExclamationCircleIcon className="h-6 w-6 text-red-500" />;
            case NOTIFICATION_TYPES.WARNING: return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
            case NOTIFICATION_TYPES.SYSTEM: return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
            case NOTIFICATION_TYPES.GUIDE_UPDATE: return <LightBulbIcon className="h-6 w-6 text-purple-500" />;
            case NOTIFICATION_TYPES.ANNOUNCEMENT: return <MegaphoneIcon className="h-6 w-6 text-orange-500" />;
            case NOTIFICATION_TYPES.SUBSCRIPTION: return <InformationCircleIcon className="h-6 w-6 text-primary" />;
            default: return <OutlineBellIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />;
        }
    };

    return (
        <div
            className={`flex items-start p-4 rounded-lg shadow-md border ${
                notification.read ? 'bg-gray-100 dark:bg-gray-700 border-border dark:border-gray-600' :
                'bg-cardBackground dark:bg-gray-800 border-primary-light dark:border-primary' // Highlight unread
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
                        onClick={() => !notification.read && onMarkAsRead(notification._id)}
                    >
                        View Details
                    </Link>
                )}
                <div className="mt-2 flex space-x-2">
                    {!notification.read && !notification.isAnnouncement && (
                        <button
                            onClick={() => onMarkAsRead(notification._id)}
                            className="px-3 py-1 bg-primary text-white rounded-md text-xs font-medium hover:bg-primary-dark transition-colors"
                        >
                            <OutlineEyeIcon className="h-4 w-4 inline-block mr-1" /> Mark as Read
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(notification._id)}
                        className="px-3 py-1 bg-red-500 text-white rounded-md text-xs font-medium hover:bg-red-600 transition-colors"
                    >
                        <TrashIcon className="h-4 w-4 inline-block mr-1" /> Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

export default NotificationItem;