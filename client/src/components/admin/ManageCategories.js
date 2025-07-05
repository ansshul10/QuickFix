// quickfix-website/client/src/components/admin/ManageCategories.js
import React from 'react';
import { Link } from 'react-router-dom'; // Import Link here
import { ROUTES } from '../../utils/constants'; // Import ROUTES here

function ManageCategories() {
    return (
        <div className="p-8 bg-cardBackground dark:bg-card-background rounded-lg shadow-lg border border-border dark:border-border">
            <h3 className="text-2xl font-bold text-textDefault dark:text-text-default">Manage Categories (Coming Soon)</h3>
            <p className="text-textSecondary dark:text-text-secondary mt-2">
                This section will allow you to manage your guide categories.
                <br />
                Go to <Link to={ROUTES.ADMIN_GUIDES} className="text-primary hover:underline">Manage Guides</Link> or <Link to={ROUTES.ADMIN_USERS} className="text-primary hover:underline">Manage Users</Link>.
            </p>
        </div>
    );
}

export default ManageCategories;