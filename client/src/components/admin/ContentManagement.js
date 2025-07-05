// quickfix-website/client/src/components/admin/ContentManagement.js
import React from 'react';
import { Link } from 'react-router-dom';
import { DocumentTextIcon, TagIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { ROUTES } from '../../utils/constants';

function ContentManagement() {
    return (
        <div className="p-4 bg-cardBackground dark:bg-gray-800 rounded-lg shadow-lg border border-border dark:border-gray-700">
            <h2 className="text-3xl font-bold text-textDefault dark:text-white mb-6 text-center">Content Management</h2>

            <p className="text-center text-textSecondary dark:text-gray-400 mb-8">
                Here you can manage all the content on your QuickFix website, including guides, categories, and announcements.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Manage Guides Card */}
                <Link to={ROUTES.ADMIN_GUIDES} className="group flex flex-col items-center p-6 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 text-center border border-border dark:border-gray-600">
                    <DocumentTextIcon className="h-16 w-16 text-primary mb-4 group-hover:text-primary-dark transition-colors" />
                    <h3 className="text-xl font-semibold text-textDefault dark:text-white mb-2">Manage Guides</h3>
                    <p className="text-textSecondary dark:text-gray-400 text-sm">Create, edit, delete, and organize all your repair guides.</p>
                    <button className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors">Go to Guides</button>
                </Link>

                {/* Manage Categories Card */}
                <Link to={ROUTES.ADMIN_CATEGORIES} className="group flex flex-col items-center p-6 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 text-center border border-border dark:border-gray-600">
                    <TagIcon className="h-16 w-16 text-secondary mb-4 group-hover:text-secondary-dark transition-colors" />
                    <h3 className="text-xl font-semibold text-textDefault dark:text-white mb-2">Manage Categories</h3>
                    <p className="text-textSecondary dark:text-gray-400 text-sm">Add, update, and remove categories for your guides.</p>
                    <button className="mt-4 px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary-dark transition-colors">Go to Categories</button>
                </Link>

                {/* Manage Announcements Card */}
                <Link to={ROUTES.ADMIN_ANNOUNCEMENTS} className="group flex flex-col items-center p-6 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 text-center border border-border dark:border-gray-600">
                    <PencilSquareIcon className="h-16 w-16 text-accent mb-4 group-hover:text-accent-dark transition-colors" />
                    <h3 className="text-xl font-semibold text-textDefault dark:text-white mb-2">Manage Announcements</h3>
                    <p className="text-textSecondary dark:text-gray-400 text-sm">Create and manage global announcements for your website.</p>
                    <button className="mt-4 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-dark transition-colors">Go to Announcements</button>
                </Link>
                {/* Potentially add: Manage Static Pages, Media Library, etc. */}
            </div>
        </div>
    );
}

export default ContentManagement;