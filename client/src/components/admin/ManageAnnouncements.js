// quickfix-website/client/src/components/admin/ManageAnnouncements.js
import React from 'react';
// Assuming you might want Link to go back to dashboard, etc.
import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';

function ManageAnnouncements() {
    return (
        <div className="p-8 bg-cardBackground dark:bg-card-background rounded-lg shadow-lg border border-border dark:border-border">
            <h3 className="text-2xl font-bold text-textDefault dark:text-text-default">Manage Announcements (Coming Soon)</h3>
            <p className="text-textSecondary dark:text-text-secondary mt-2">
                Create and manage announcements for your website.
                <br />
                <Link to={ROUTES.ADMIN_DASHBOARD} className="text-primary hover:underline">Back to Dashboard</Link>
            </p>
        </div>
    );
}

export default ManageAnnouncements;