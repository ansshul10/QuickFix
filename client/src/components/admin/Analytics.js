// quickfix-website/client/src/components/admin/Analytics.js
import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService'; // <--- FIX IS HERE: Import as default
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';
import {
    UsersIcon, DocumentTextIcon, TagIcon, ChatBubbleOvalLeftEllipsisIcon,
    StarIcon as SolidStarIcon, // <--- FIX IS HERE: Import SolidStarIcon
    ArrowUpIcon, ArrowDownIcon, AcademicCapIcon, NewspaperIcon, WalletIcon
} from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';
import { ROUTES } from '../../utils/constants';

function Analytics() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await adminService.getAdminDashboardStats(); // <--- CORRECTED: Call via default import
                setStats(res.data.data);
                toast.success("Analytics data loaded!", { autoClose: 1000 });
            } catch (err) {
                const errorMessage = err.response?.data?.message || "Failed to load analytics data.";
                setError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return <LoadingSpinner fullScreen={false} message="Loading analytics..." />;
    }

    if (error) {
        return <div className="text-center text-error-dark dark:text-error-light text-lg mt-8">{error}</div>;
    }

    // Prepare data for potential charting library
    const subscriptionChartData = {
        labels: stats.subscriptionStats.map(s => `${s._id.month}/${s._id.year}`),
        datasets: [
            {
                label: 'Active Subscriptions',
                data: stats.subscriptionStats.map(s => s.count),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                fill: true,
                tension: 0.3,
            },
            {
                label: 'Total Revenue',
                data: stats.subscriptionStats.map(s => s.totalAmount),
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                fill: true,
                tension: 0.3,
            }
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: 'var(--color-text-secondary)'
                }
            },
            title: {
                display: true,
                text: 'Monthly Subscription Trends',
                color: 'var(--color-text-default)'
            }
        },
        scales: {
            x: {
                ticks: { color: 'var(--color-text-secondary)' },
                grid: { color: 'var(--color-border)' }
            },
            y: {
                ticks: { color: 'var(--color-text-secondary)' },
                grid: { color: 'var(--color-border)' }
            }
        }
    };

    return (
        <div className="p-4 bg-cardBackground dark:bg-gray-800 rounded-lg shadow-lg border border-border dark:border-gray-700">
            <h2 className="text-3xl font-bold text-textDefault dark:text-white mb-6 text-center">Website Analytics</h2>

            {/* Overview Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
                <div className="relative bg-blue-600 pt-5 px-4 pb-12 rounded-lg shadow-md overflow-hidden text-white">
                    <dt className="flex items-center space-x-3">
                        <UsersIcon className="h-6 w-6" aria-hidden="true" />
                        <p className="truncate text-sm font-medium">Total Users</p>
                    </dt>
                    <dd className="ml-9 flex items-baseline pb-6 sm:pb-7">
                        <p className="text-2xl font-semibold">{stats.totalUsers}</p>
                    </dd>
                </div>
                <div className="relative bg-green-600 pt-5 px-4 pb-12 rounded-lg shadow-md overflow-hidden text-white">
                    <dt className="flex items-center space-x-3">
                        <DocumentTextIcon className="h-6 w-6" aria-hidden="true" />
                        <p className="truncate text-sm font-medium">Total Guides</p>
                    </dt>
                    <dd className="ml-9 flex items-baseline pb-6 sm:pb-7">
                        <p className="text-2xl font-semibold">{stats.totalGuides}</p>
                    </dd>
                </div>
                <div className="relative bg-purple-600 pt-5 px-4 pb-12 rounded-lg shadow-md overflow-hidden text-white">
                    <dt className="flex items-center space-x-3">
                        <WalletIcon className="h-6 w-6" aria-hidden="true" />
                        <p className="truncate text-sm font-medium">Active Subscriptions</p>
                    </dt>
                    <dd className="ml-9 flex items-baseline pb-6 sm:pb-7">
                        <p className="text-2xl font-semibold">{stats.activeSubscriptions}</p>
                    </dd>
                </div>
                <div className="relative bg-indigo-600 pt-5 px-4 pb-12 rounded-lg shadow-md overflow-hidden text-white">
                    <dt className="flex items-center space-x-3">
                        <UsersIcon className="h-6 w-6" aria-hidden="true" />
                        <p className="truncate text-sm font-medium">New Users (30 Days)</p>
                    </dt>
                    <dd className="ml-9 flex items-baseline pb-6 sm:pb-7">
                        <p className="text-2xl font-semibold">{stats.newUsersLast30Days}</p>
                    </dd>
                </div>
            </div>

            {/* Detailed Analytics Sections */}

            {/* Monthly Subscription Trends Chart */}
            <div className="bg-cardBackground dark:bg-gray-700 rounded-lg shadow-md p-6 mb-8">
                <h3 className="text-xl font-semibold text-textDefault dark:text-white mb-4">Monthly Subscription Trends</h3>
                {stats.subscriptionStats.length > 0 ? (
                    <div className="h-80">
                        <p className="text-center text-textSecondary dark:text-gray-400 py-10">
                            (Chart placeholder: Install `chart.js` and `react-chartjs-2` to display this graph)
                            <br/>
                            Data Points: {stats.subscriptionStats.map(s => `(${s._id.month}/${s._id.year}: Subs: ${s.count}, Rev: ${s.totalAmount})`).join(', ')}
                        </p>
                    </div>
                ) : (
                    <p className="text-textSecondary dark:text-gray-400">No subscription data to display a chart.</p>
                )}
            </div>

            {/* Top 5 Rated Guides */}
            <div className="bg-cardBackground dark:bg-gray-700 rounded-lg shadow-md p-6 mb-8">
                <h3 className="text-xl font-semibold text-textDefault dark:text-white mb-4">Top 5 Rated Guides</h3>
                {stats.topRatedGuides.length > 0 ? (
                    <ul className="divide-y divide-border dark:divide-gray-600">
                        {stats.topRatedGuides.map((guide) => (
                            <li key={guide.slug} className="py-3 flex justify-between items-center">
                                <Link to={`${ROUTES.GUIDES}/${guide.slug}`} className="text-primary hover:underline text-md font-medium">
                                    {guide.title}
                                </Link>
                                <div className="flex items-center space-x-2 text-textSecondary dark:text-gray-400 text-sm">
                                    <SolidStarIcon className="h-4 w-4 text-yellow-400" />
                                    <span>{guide.averageRating?.toFixed(1) || 'N/A'} ({guide.numOfReviews} reviews)</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-textSecondary dark:text-gray-400">No top rated guides yet.</p>
                )}
            </div>

            {/* Most Commented Guides */}
            <div className="bg-cardBackground dark:bg-gray-700 rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-textDefault dark:text-white mb-4">Most Commented Guides</h3>
                {stats.mostCommentedGuides.length > 0 ? (
                    <ul className="divide-y divide-border dark:divide-gray-600">
                        {stats.mostCommentedGuides.map((guide) => (
                            <li key={guide.slug} className="py-3 flex justify-between items-center">
                                <Link to={`${ROUTES.GUIDES}/${guide.slug}`} className="text-primary hover:underline text-md font-medium">
                                    {guide.title}
                                </Link>
                                <span className="text-textSecondary dark:text-gray-400 text-sm">{guide.commentCount} comments</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-textSecondary dark:text-gray-400">No commented guides yet.</p>
                )}
            </div>
        </div>
    );
}

export default Analytics;