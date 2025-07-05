// quickfix-website/client/src/components/admin/UserManagement.js
import React from 'react';
import { Link } from 'react-router-dom';
import { UsersIcon, CheckCircleIcon, XCircleIcon, StarIcon } from '@heroicons/react/24/outline';
import { ROUTES } from '../../utils/constants';

function UserManagement() {
    return (
        <div className="p-4 bg-cardBackground dark:bg-gray-800 rounded-lg shadow-lg border border-border dark:border-gray-700">
            <h2 className="text-3xl font-bold text-textDefault dark:text-white mb-6 text-center">User Management Hub</h2>

            <p className="text-center text-textSecondary dark:text-gray-400 mb-8">
                Access detailed user lists, manage their accounts, roles, and premium status.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Link to the main ManageUsers component */}
                <Link to={ROUTES.ADMIN_USERS} className="group flex flex-col items-center p-6 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 text-center border border-border dark:border-gray-600">
                    <UsersIcon className="h-16 w-16 text-primary mb-4 group-hover:text-primary-dark transition-colors" />
                    <h3 className="text-xl font-semibold text-textDefault dark:text-white mb-2">View & Edit All Users</h3>
                    <p className="text-textSecondary dark:text-gray-400 text-sm">Access the full list of users, filter, search, and modify their details.</p>
                    <button className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors">Go to User List</button>
                </Link>

                {/* Example of other user-related admin actions (conceptual) */}
                <div className="group flex flex-col items-center p-6 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 text-center border border-border dark:border-gray-600">
                    <StarIcon className="h-16 w-16 text-yellow-500 mb-4 group-hover:text-yellow-600 transition-colors" />
                    <h3 className="text-xl font-semibold text-textDefault dark:text-white mb-2">Manage Subscriptions</h3>
                    <p className="text-textSecondary dark:text-gray-400 text-sm">View and manage all user subscriptions and premium statuses.</p>
                    <Link to={ROUTES.ADMIN_SUBSCRIPTIONS} className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors">Go to Subscriptions</Link>
                </div>

                 <div className="group flex flex-col items-center p-6 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 text-center border border-border dark:border-gray-600">
                    <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4 group-hover:text-green-600 transition-colors" />
                    <h3 className="text-xl font-semibold text-textDefault dark:text-white mb-2">Active Users</h3>
                    <p className="text-textSecondary dark:text-gray-400 text-sm">Quick overview or link to filter for active user accounts.</p>
                    <button className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors">View Active</button>
                </div>

                <div className="group flex flex-col items-center p-6 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 text-center border border-border dark:border-gray-600">
                    <XCircleIcon className="h-16 w-16 text-red-500 mb-4 group-hover:text-red-600 transition-colors" />
                    <h3 className="text-xl font-semibold text-textDefault dark:text-white mb-2">Inactive/Banned Users</h3>
                    <p className="text-textSecondary dark:text-gray-400 text-sm">Review or reactivate inactive user accounts.</p>
                    <button className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">View Inactive</button>
                </div>
            </div>
        </div>
    );
}

export default UserManagement;