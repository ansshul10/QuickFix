import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';
import {
    UsersIcon, DocumentTextIcon, ChatBubbleOvalLeftEllipsisIcon,
    StarIcon as SolidStarIcon, AcademicCapIcon, NewspaperIcon, WalletIcon, QuestionMarkCircleIcon
} from '@heroicons/react/24/solid';
import { ROUTES } from '../../utils/constants';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';

function AdminDashboard() {
    // Initialize stats with a default object containing all expected properties
    // This prevents "Cannot read properties of undefined" errors when accessing stats.propertyName
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalAdmins: 0,
        totalGuides: 0,
        totalCategories: 0,
        totalComments: 0,
        totalRatings: 0,
        activeSubscriptions: 0,
        pendingVerifications: 0, // Ensure this new stat is initialized
        premiumGuidesCount: 0,
        totalAnnouncements: 0,
        totalNewsletterSubscribers: 0,
        newUsersLast30Days: 0,
        topRatedGuides: [], // Initialize arrays as empty
        mostCommentedGuides: [], // Initialize arrays as empty
        subscriptionStats: [] // Initialize arrays as empty
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardStats = async () => {
            console.log("Fetching dashboard stats...");
            setLoading(true);
            setError(null); // Clear previous errors
            try {
                const res = await adminService.getAdminDashboardStats();
                // FIX: The res object already contains { success: true, data: { ...stats... } }
                // So, we need to check res.success and then access res.data directly.
                if (res.success && res.data) { // Changed condition
                    console.log("Dashboard data fetched successfully and structure is correct:", res.data);
                    setStats(res.data); // Changed this line to res.data
                    toast.success("Dashboard data loaded!", { autoClose: 1000 });
                } else {
                    console.warn("Received unexpected data structure from API:", res);
                    setError("Received unexpected empty data or structure from the server.");
                    toast.error("Error: Empty or malformed dashboard data received.");
                }
            } catch (err) {
                const errorMessage = err.response?.data?.message || "Failed to load dashboard statistics.";
                console.error("Error fetching dashboard stats:", errorMessage, err);
                setError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setLoading(false);
                console.log("Loading finished. Current loading state:", false);
            }
        };

        fetchDashboardStats();
    }, []); // Empty dependency array means this runs once on component mount

    // Add a useEffect to log state changes for debugging
    useEffect(() => {
        console.log("AdminDashboard component state updated:");
        console.log("Loading:", loading);
        console.log("Error:", error);
        console.log("Stats:", stats);
    }, [loading, error, stats]);


    // Render loading spinner while data is being fetched
    if (loading) {
        return <LoadingSpinner fullScreen={false} message="Loading dashboard..." />;
    }

    // Render error message if there was an error and not loading
    if (error) {
        return <div className="text-center text-error-dark dark:text-error-light text-lg mt-8">{error}</div>;
    }

    // Now, 'stats' is guaranteed to be an object with default or fetched data,
    // so we can safely access its properties without null checks for rendering.
    const statCards = [
        { name: 'Total Users', stat: stats.totalUsers, icon: UsersIcon, bgColor: 'bg-blue-500' },
        { name: 'Total Guides', stat: stats.totalGuides, icon: DocumentTextIcon, bgColor: 'bg-green-500' },
        { name: 'Total Categories', stat: stats.totalCategories, icon: AcademicCapIcon, bgColor: 'bg-purple-500' },
        { name: 'Total Comments', stat: stats.totalComments, icon: ChatBubbleOvalLeftEllipsisIcon, bgColor: 'bg-yellow-500' },
        { name: 'Total Ratings', stat: stats.totalRatings, icon: SolidStarIcon, bgColor: 'bg-orange-500' },
        { name: 'Active Subscriptions', stat: stats.activeSubscriptions, icon: WalletIcon, bgColor: 'bg-teal-500' },
        { name: 'Pending Verifications', stat: stats.pendingVerifications, icon: QuestionMarkCircleIcon, bgColor: 'bg-red-500' }, // Changed icon to QuestionMarkCircleIcon
        { name: 'Premium Guides', stat: stats.premiumGuidesCount, icon: AcademicCapIcon, bgColor: 'bg-rose-500' },
        { name: 'New Users (30 Days)', stat: stats.newUsersLast30Days, icon: UsersIcon, bgColor: 'bg-indigo-500' },
        { name: 'Announcements', stat: stats.totalAnnouncements, icon: NewspaperIcon, bgColor: 'bg-cyan-500' },
        { name: 'Newsletter Subscribers', stat: stats.totalNewsletterSubscribers, icon: ChatBubbleOvalLeftEllipsisIcon, bgColor: 'bg-lime-500' },
    ];

    return (
        <div className="py-8">
            <h1 className="text-4xl font-extrabold text-center text-textDefault dark:text-text-default mb-8">Admin Dashboard Overview</h1>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
                {statCards.map((card) => (
                    <div key={card.name} className="relative bg-cardBackground dark:bg-card-background pt-5 px-4 pb-12 rounded-lg shadow-md overflow-hidden transform transition-all hover:scale-105 duration-200">
                        <dt>
                            <div className={`absolute rounded-md p-3 ${card.bgColor} shadow-lg`}>
                                <card.icon className="h-6 w-6 text-white" aria-hidden="true" />
                            </div>
                            <p className="ml-16 truncate text-sm font-medium text-textSecondary dark:text-text-secondary">{card.name}</p>
                        </dt>
                        <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                            <p className="text-2xl font-semibold text-textDefault dark:text-text-default">{card.stat}</p>
                        </dd>
                    </div>
                ))}
            </div>

            {/* Charts & Graphs Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                {/* Example: Top Rated Guides */}
                <div className="bg-cardBackground dark:bg-card-background rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-textDefault dark:text-text-default mb-4">Top 5 Rated Guides</h2>
                    {/* Safely access array and its length */}
                    {stats.topRatedGuides.length > 0 ? (
                        <ul className="divide-y divide-border dark:divide-border">
                            {stats.topRatedGuides.map((guide) => (
                                <li key={guide.slug} className="py-3 flex justify-between items-center">
                                    <Link to={`${ROUTES.GUIDES}/${guide.slug}`} className="text-primary hover:underline text-md font-medium">
                                        {guide.title}
                                    </Link>
                                    <div className="flex items-center space-x-2 text-textSecondary dark:text-text-secondary text-sm">
                                        <SolidStarIcon className="h-4 w-4 text-yellow-400" />
                                        <span>{guide.averageRating?.toFixed(1) || 'N/A'} ({guide.numOfReviews} reviews)</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-textSecondary dark:text-text-secondary">No top rated guides yet.</p>
                    )}
                </div>

                {/* Example: Most Commented Guides */}
                <div className="bg-cardBackground dark:bg-card-background rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-textDefault dark:text-text-default mb-4">Most Commented Guides</h2>
                    {stats.mostCommentedGuides.length > 0 ? (
                        <ul className="divide-y divide-border dark:divide-border">
                            {stats.mostCommentedGuides.map((guide) => (
                                <li key={guide.slug} className="py-3 flex justify-between items-center">
                                    <Link to={`${ROUTES.GUIDES}/${guide.slug}`} className="text-primary hover:underline text-md font-medium">
                                        {guide.title}
                                    </Link>
                                    <span className="text-textSecondary dark:text-text-secondary text-sm">{guide.commentCount} comments</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-textSecondary dark:text-text-secondary">No commented guides yet.</p>
                    )}
                </div>
            </div>

            {/* Subscription Growth Chart (Placeholder) */}
            <div className="bg-cardBackground dark:bg-card-background rounded-lg shadow-md p-6 mb-10">
                <h2 className="text-xl font-semibold text-textDefault dark:text-text-default mb-4">Monthly Subscription Trends</h2>
                {stats.subscriptionStats.length > 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-textSecondary dark:text-text-secondary text-center">
                        <p className="mb-2">Chart would go here (e.g., using Chart.js or Recharts)</p>
                        <p className="text-sm">Data Points: {stats.subscriptionStats.map(s => `(${s._id.month}/${s._id.year}: Subs: ${s.count}, Rev: ${s.totalAmount})`).join(', ')}</p>
                    </div>
                ) : (
                    <p className="text-textSecondary dark:text-text-secondary">No subscription data to display a chart.</p>
                )}
            </div>

            {/* Quick Links / Navigation to detailed admin sections */}
            <div className="mt-10 text-center">
                <h2 className="text-2xl font-semibold text-textDefault dark:text-text-default mb-6">Manage Your Website</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link to={ROUTES.ADMIN_USERS} className="block p-6 bg-cardBackground dark:bg-card-background rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 text-lg font-medium text-primary dark:text-primary-light">
                        Manage Users
                    </Link>
                    <Link to={ROUTES.ADMIN_GUIDES} className="block p-6 bg-cardBackground dark:bg-card-background rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 text-lg font-medium text-primary dark:text-primary-light">
                        Manage Guides
                    </Link>
                    <Link to={ROUTES.ADMIN_CATEGORIES} className="block p-6 bg-cardBackground dark:bg-card-background rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 text-lg font-medium text-primary dark:text-primary-light">
                        Manage Categories
                    </Link>
                    <Link to={ROUTES.ADMIN_ANNOUNCEMENTS} className="block p-6 bg-cardBackground dark:bg-card-background rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 text-lg font-medium text-primary dark:text-primary-light">
                        Manage Announcements
                    </Link>
                    <Link to={ROUTES.ADMIN_SETTINGS} className="block p-6 bg-cardBackground dark:bg-card-background rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 text-lg font-medium text-primary dark:text-primary-light">
                        Website Settings
                    </Link>
                    <Link to={ROUTES.ADMIN_NEWSLETTER} className="block p-6 bg-cardBackground dark:bg-card-background rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 text-lg font-medium text-primary dark:text-primary-light">
                        Newsletter & Emails
                    </Link>
                    <Link to={ROUTES.ADMIN_SUBSCRIPTIONS} className="block p-6 bg-cardBackground dark:bg-card-background rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 text-lg font-medium text-primary dark:text-primary-light">
                        Manage Subscriptions
                    </Link>
                    {/* NEW LINK FOR USER HELP */}
                    <Link to={ROUTES.ADMIN_USER_HELP} className="flex items-center justify-center p-6 bg-cardBackground dark:bg-card-background rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 text-lg font-medium text-primary dark:text-primary-light">
                        <QuestionMarkCircleIcon className="h-5 w-5 mr-3" /> User Help Desk
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;