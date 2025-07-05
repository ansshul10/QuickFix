// quickfix-website/client/src/pages/NotificationsPage.js
import React from 'react';
import NotificationList from '../components/notifications/NotificationList'; // Reuses the NotificationList component
import Breadcrumbs from '../components/common/Breadcrumbs';

function NotificationsPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Breadcrumbs customSegments={[{name: 'Notifications', path: '/notifications'}]} />
            </div>
            <NotificationList /> {/* The core notification listing component */}
        </div>
    );
}

export default NotificationsPage;