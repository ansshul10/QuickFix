// quickfix-website/client/src/pages/NotFound.js
import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../utils/constants'; // Adjust path based on location

function NotFound() {
    return (
        <div className="p-8 bg-cardBackground dark:bg-card-background rounded-lg shadow-lg border border-border dark:border-border text-center">
            <h3 className="text-2xl font-bold text-error">Page Not Found</h3>
            <p className="text-textSecondary dark:text-text-secondary mt-2">The page you are looking for does not exist.</p>
            <Link to={ROUTES.HOME} className="text-primary hover:underline mt-4 inline-block">Go to Home Page</Link>
        </div>
    );
}

export default NotFound;