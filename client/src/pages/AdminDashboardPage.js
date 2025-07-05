// quickfix-website/client/src/pages/admin/AdminDashboardPage.js
import React from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import AdminDashboard from '../components/admin/AdminDashboard';
import ManageUsers from '../components/admin/ManageUsers';
import ManageGuides from '../components/admin/ManageGuides';
import Analytics from '../components/admin/Analytics';
import AdminSettings from '../components/admin/AdminSettings';
import UserHelp from '../components/admin/UserHelp';


// Import the separate components (assuming they are now in their own files)
import ManageCategories from '../components/admin/ManageCategories';
import ManageAnnouncements from '../components/admin/ManageAnnouncements';
import ManageNewsletter from '../components/admin/ManageNewsletter';
import ManageSubscriptions from '../components/admin/ManageSubscriptions';
import NotFound from '../pages/NotFound';


import {
    UserGroupIcon,
    DocumentDuplicateIcon,
    ChartPieIcon,
    Cog6ToothIcon,
    MegaphoneIcon,
    EnvelopeIcon,
    CreditCardIcon,
    RectangleGroupIcon
} from '@heroicons/react/24/outline';
import { ROUTES } from '../utils/constants';
import Breadcrumbs from '../components/common/Breadcrumbs';

// Admin Sidebar Navigation
const AdminSidebar = () => {
    const location = useLocation();

    const adminNavItems = [
        { name: 'Dashboard', path: ROUTES.ADMIN_DASHBOARD, icon: ChartPieIcon },
        { name: 'Users', path: ROUTES.ADMIN_USERS, icon: UserGroupIcon },
        { name: 'Guides', path: ROUTES.ADMIN_GUIDES, icon: DocumentDuplicateIcon },
        { name: 'Categories', path: ROUTES.ADMIN_CATEGORIES, icon: RectangleGroupIcon },
        { name: 'Announcements', path: ROUTES.ADMIN_ANNOUNCEMENTS, icon: MegaphoneIcon },
        { name: 'Settings', path: ROUTES.ADMIN_SETTINGS, icon: Cog6ToothIcon },
        { name: 'Newsletter', path: ROUTES.ADMIN_NEWSLETTER, icon: EnvelopeIcon },
        { name: 'Subscriptions', path: ROUTES.ADMIN_SUBSCRIPTIONS, icon: CreditCardIcon },
        { name: 'Users Help', path: ROUTES.ADMIN_USER_HELP, icon: CreditCardIcon },
    ];

    const getNavLinkClass = ({ isActive }) =>
        `flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
            isActive
                ? 'bg-primary text-white shadow-md' // Active state remains consistent
                : 'text-textDefault dark:text-text-secondary hover:bg-primary-light dark:hover:bg-secondary' // Adjusted colors
        }`;

    return (
        <nav className="flex flex-col space-y-2 p-4">
            {adminNavItems.map((item) => (
                <NavLink
                    key={item.name}
                    to={item.path}
                    className={getNavLinkClass}
                    end={item.path === ROUTES.ADMIN_DASHBOARD}
                >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                </NavLink>
            ))}
        </nav>
    );
};

function AdminDashboardPage() {
    const location = useLocation();

    const getAdminBreadcrumbs = () => {
        const pathnames = location.pathname.split('/').filter((x) => x);
        const breadcrumbs = [{ name: 'Admin Dashboard', path: ROUTES.ADMIN_DASHBOARD }];

        if (pathnames.length > 1) {
            const adminBase = pathnames[0];
            for (let i = 1; i < pathnames.length; i++) {
                const segment = pathnames[i];
                const fullPath = `/${pathnames.slice(0, i + 1).join('/')}`;
                breadcrumbs.push({ name: capitalizeFirstLetter(segment.replace(/-/g, ' ')), path: fullPath });
            }
        }
        return breadcrumbs;
    };

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Breadcrumbs customSegments={getAdminBreadcrumbs()} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8">
                <aside className="md:col-span-1 bg-cardBackground dark:bg-card-background rounded-lg shadow-lg border border-border dark:border-border"> {/* Adjusted background and border */}
                    <AdminSidebar />
                </aside>

                <main className="md:col-span-3 lg:col-span-4">
                    <Routes>
                        <Route index element={<AdminDashboard />} />
                        <Route path="users" element={<ManageUsers />} />
                        <Route path="guides" element={<ManageGuides />} />
                        <Route path="categories" element={<ManageCategories />} />
                        <Route path="announcements" element={<ManageAnnouncements />} />
                        <Route path="settings" element={<AdminSettings />} />
                        <Route path="newsletter" element={<ManageNewsletter />} />
                        <Route path="subscriptions" element={<ManageSubscriptions />} />
                        <Route path="user-help" element={<UserHelp />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}

export default AdminDashboardPage;