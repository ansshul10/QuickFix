// quickfix-website/client/src/components/admin/ManageNewsletter.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as newsletterService from '../../services/newsletterService';
import adminService from '../../services/adminService';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import Pagination from '../common/Pagination';
import { toast } from 'react-toastify';
import { PaperAirplaneIcon, EnvelopeIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { PAGINATION_DEFAULTS } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';

function ManageNewsletter() {
    // State for Send Email functionality (Bulk only)
    const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailContent, setEmailContent] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [emailSubjectError, setEmailSubjectError] = useState('');
    const [emailContentError, setEmailContentError] = useState('');

    // State for Subscriber List Management
    const [subscribers, setSubscribers] = useState([]);
    const [loadingSubscribers, setLoadingSubscribers] = useState(true);
    const [errorSubscribers, setErrorSubscribers] = useState(null);
    const [currentPage, setCurrentPage] = useState(PAGINATION_DEFAULTS.PAGE_NUMBER);
    const [totalSubscribers, setTotalSubscribers] = useState(0);
    const [searchKeyword, setSearchKeyword] = useState('');

    const fetchSubscribers = useCallback(async () => {
        setLoadingSubscribers(true);
        setErrorSubscribers(null);
        try {
            const res = await newsletterService.getNewsletterSubscribers({
                pageNumber: currentPage,
                pageSize: PAGINATION_DEFAULTS.PAGE_SIZE,
                keyword: searchKeyword,
            });

            setSubscribers(Array.isArray(res.data) ? res.data : []);
            setTotalSubscribers(res.count || 0);

        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to fetch newsletter subscribers.';
            setErrorSubscribers(errorMessage);
            setSubscribers([]);
            setTotalSubscribers(0);
            toast.error(errorMessage);
        } finally {
            setLoadingSubscribers(false);
        }
    }, [currentPage, searchKeyword]);

    useEffect(() => {
        fetchSubscribers();
    }, [fetchSubscribers]);

    const handleToggleSubscription = async (subscriberId, userId, currentStatus) => {
        const newStatus = !currentStatus;
        const action = newStatus ? 'enabled' : 'disabled';

        setSubscribers(prevSubscribers =>
            prevSubscribers.map(sub =>
                sub._id === subscriberId
                    ? { ...sub, active: newStatus }
                    : sub
            )
        );

        try {
            await adminService.updateUserNewsletterStatusByAdmin(userId, newStatus);
            toast.success(`Newsletter subscription ${action} for user.`);
        } catch (err) {
            const errorMessage = err.response?.data?.message || `Failed to ${action} newsletter subscription.`;
            toast.error(errorMessage);
            console.error(`Toggle newsletter subscription error (${action}):`, err);

            setSubscribers(prevSubscribers =>
                prevSubscribers.map(sub =>
                    sub._id === subscriberId
                        ? { ...sub, active: currentStatus }
                        : sub
                )
            );
            toast.error(`Reverted change due to error: ${errorMessage}`);
        }
    };

    const handleOpenSendEmailModal = () => {
        setIsSendEmailModalOpen(true);
        setEmailSubject('');
        setEmailContent('');
        setEmailSubjectError('');
        setEmailContentError('');
    };

    const handleCloseSendEmailModal = () => {
        setIsSendEmailModalOpen(false);
        setEmailSubject('');
        setEmailContent('');
        setEmailSubjectError('');
        setEmailContentError('');
    };

    const handleSendEmailSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setEmailSubjectError('');
        setEmailContentError('');

        let hasError = false;
        if (!emailSubject.trim()) { setEmailSubjectError('Subject is required.'); hasError = true; }
        if (!emailContent.trim()) { setEmailContentError('Content is required.'); hasError = true; }

        if (hasError) {
            setFormLoading(false);
            toast.error("Please correct the form errors.");
            return;
        }

        try {
            await newsletterService.sendBulkNewsletterEmail(emailSubject, emailContent);
            toast.success("Bulk email sending initiated!");
            handleCloseSendEmailModal();
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to send bulk email.';
            toast.error(errorMessage);
            console.error('Bulk email send error:', err);
        } finally {
            setFormLoading(false);
        }
    };

    const totalPages = Math.ceil(totalSubscribers / PAGINATION_DEFAULTS.PAGE_SIZE);

    return (
        <div className="p-4 bg-cardBackground dark:bg-card-background rounded-lg shadow-lg border border-border dark:border-border">
            <h2 className="text-3xl font-bold text-textDefault dark:text-text-default mb-6 text-center">
                Manage Newsletter
            </h2>

            {/* Bulk Email Section */}
            <div className="mb-8 p-4 border border-border rounded-md bg-background dark:bg-card-background shadow-sm">
                <h3 className="text-xl font-semibold text-textDefault dark:text-text-default mb-4">Send Bulk Newsletter</h3>
                <p className="text-textSecondary dark:text-text-secondary mb-4">
                    Compose and send emails to all active newsletter subscribers.
                </p>
                <div className="flex justify-center">
                    <button
                        onClick={handleOpenSendEmailModal}
                        className="flex items-center bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-md font-medium text-lg transition-colors duration-200 shadow-md"
                    >
                        <PaperAirplaneIcon className="h-6 w-6 mr-3" /> Compose New Bulk Email
                    </button>
                </div>
            </div>

            {/* Subscriber List Section */}
            <div className="p-4 border border-border rounded-md bg-background dark:bg-card-background shadow-sm">
                <h3 className="text-xl font-semibold text-textDefault dark:text-text-default mb-4">Newsletter Subscribers</h3>

                <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="w-full sm:w-1/2">
                        <input
                            type="text"
                            placeholder="Search by email..."
                            value={searchKeyword}
                            onChange={(e) => { setCurrentPage(1); setSearchKeyword(e.target.value); }}
                            className="w-full p-2 border border-border rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary"
                        />
                    </div>
                </div>

                {loadingSubscribers ? (
                    <LoadingSpinner fullScreen={false} message="Loading subscribers..." />
                ) : errorSubscribers ? (
                    <p className="text-error-dark dark:text-error-light text-center mt-4">{errorSubscribers}</p>
                ) : subscribers.length === 0 ? (
                    <p className="text-center text-textSecondary dark:text-text-secondary mt-4">No newsletter subscribers found.</p>
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-border dark:border-border shadow-sm">
                        <table className="min-w-full divide-y divide-border dark:divide-border">
                            <thead className="bg-background dark:bg-card-background">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary dark:text-text-secondary uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary dark:text-text-secondary uppercase tracking-wider">User Account?</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary dark:text-text-secondary uppercase tracking-wider hidden sm:table-cell">Subscribed Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary dark:text-text-secondary uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-textSecondary dark:text-text-secondary uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-card-background dark:bg-card-background divide-y divide-border dark:divide-border">
                                {subscribers.map((subscriber) => (
                                    <tr key={subscriber._id} className="hover:bg-[#6c6f7c] transition-colors duration-150"> {/* ADDED HOVER CLASS HERE */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-textDefault dark:text-text-default">
                                            {subscriber.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary dark:text-text-secondary">
                                            {subscriber.userAccountExists ? (
                                                <span className="text-success flex items-center">
                                                    <CheckIcon className="h-4 w-4 mr-1" /> Yes
                                                </span>
                                            ) : (
                                                <span className="text-error flex items-center">
                                                    <XMarkIcon className="h-4 w-4 mr-1" /> No
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary dark:text-text-secondary hidden sm:table-cell">
                                            {formatDate(subscriber.subscribedAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                subscriber.active ? 'bg-success-light text-success-dark dark:bg-success dark:text-white' : 'bg-error-light text-error-dark dark:bg-error dark:text-white'
                                            }`}>
                                                {subscriber.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {/* Toggle Switch */}
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    value=""
                                                    className="sr-only peer"
                                                    checked={subscriber.active}
                                                    onChange={() => handleToggleSubscription(subscriber._id, subscriber.user?._id, subscriber.active)}
                                                    disabled={!subscriber.user?._id}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-light dark:peer-focus:ring-primary rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                                <span className="ml-3 text-sm font-medium text-textDefault dark:text-text-default">
                                                    {subscriber.active ? 'ON' : 'OFF'}
                                                </span>
                                            </label>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalSubscribers > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>

            {/* Send Email Modal */}
            <Modal
                isOpen={isSendEmailModalOpen}
                onClose={handleCloseSendEmailModal}
                title="Compose Bulk Newsletter"
                size="lg"
            >
                <form onSubmit={handleSendEmailSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="emailSubject" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">Subject</label>
                        <input
                            type="text"
                            id="emailSubject"
                            value={emailSubject}
                            onChange={(e) => { setEmailSubject(e.target.value); setEmailSubjectError(''); }}
                            className={`w-full p-2 border ${emailSubjectError ? 'border-error' : 'border-border'} rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary`}
                            disabled={formLoading}
                        />
                        {emailSubjectError && <p className="mt-1 text-sm text-error">{emailSubjectError}</p>}
                    </div>
                    <div>
                        <label htmlFor="emailContent" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">HTML Content</label>
                        <textarea
                            id="emailContent"
                            value={emailContent}
                            onChange={(e) => { setEmailContent(e.target.value); setEmailContentError(''); }}
                            rows="10"
                            className={`w-full p-2 border ${emailContentError ? 'border-error' : 'border-border'} rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary`}
                            disabled={formLoading}
                        ></textarea>
                        {emailContentError && <p className="mt-1 text-sm text-error">{emailContentError}</p>}
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={handleCloseSendEmailModal}
                            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md font-medium transition-colors dark:bg-gray-600 dark:text-text-default dark:hover:bg-gray-500"
                            disabled={formLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={formLoading}
                            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {formLoading ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                'Send Bulk Email'
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default ManageNewsletter;