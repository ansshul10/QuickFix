import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES, SUBSCRIPTION_STATUSES, PAGINATION_DEFAULTS } from '../../utils/constants';
import adminService from '../../services/adminService';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import Pagination from '../common/Pagination';
import { toast } from 'react-toastify'; // Keep toast import for success and info messages

import {
    CheckCircleIcon, XMarkIcon, ExclamationTriangleIcon,
    InformationCircleIcon, ChatBubbleBottomCenterTextIcon, PhotoIcon
} from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/formatters';

// Component for image viewing modal (no console.logs)
const ImageViewerModal = ({ isOpen, onClose, imageUrl, title }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
            {imageUrl ? (
                <div className="flex justify-center items-center">
                    <img src={imageUrl} alt="Payment Screenshot" className="max-w-full h-auto max-h-[80vh] object-contain" />
                </div>
            ) : (
                <p className="text-center text-textSecondary dark:text-text-secondary">No screenshot available.</p>
            )}
            <div className="flex justify-end mt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md font-medium transition-colors dark:bg-gray-600 dark:text-text-default dark:hover:bg-gray-500"
                >
                    Close
                </button>
            </div>
        </Modal>
    );
};


function ManageSubscriptions() {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // Keep error state for display within the component

    const [currentPage, setCurrentPage] = useState(PAGINATION_DEFAULTS.PAGE_NUMBER);
    const [totalSubscriptions, setTotalSubscriptions] = useState(0);
    const [filterStatus, setFilterStatus] = useState('');

    const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
    const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState(false);
    const [currentScreenshotUrl, setCurrentScreenshotUrl] = useState('');

    const [currentSubscriptionToUpdate, setCurrentSubscriptionToUpdate] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [newStatusForUpdate, setNewStatusForUpdate] = useState('');
    const [modalLoading, setModalLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    // Predefined rejection reasons
    const REJECTION_REASONS = [
        "Transaction ID (UTR/RRN) incorrect or missing.",
        "Reference Code does not match.",
        "Payment amount is incorrect.",
        "Screenshot missing or invalid.",
        "Duplicate payment / already active subscription.",
        "Fraudulent activity suspected.",
        "Other (please specify in notes)"
    ];

    const fetchSubscriptions = useCallback(async () => {
        setLoading(true);
        setError(null); // Clear previous errors
        try {
            const responseData = await adminService.getAllSubscriptionsForAdmin({
                pageNumber: currentPage,
                pageSize: PAGINATION_DEFAULTS.PAGE_SIZE,
                status: filterStatus,
            });

            const receivedSubscriptions = Array.isArray(responseData.data) ? responseData.data : [];
            const receivedCount = responseData.count || 0;

            setSubscriptions(receivedSubscriptions);
            setTotalSubscriptions(receivedCount);

        } catch (err) {
            // Error toast is handled by adminService.getAllSubscriptionsForAdmin (via api.js interceptor).
            // Just update the component's local error state for display within the table.
            const errorMessage = err.response?.data?.message || 'Failed to fetch subscriptions.';
            setError(errorMessage);
            setSubscriptions([]);
            setTotalSubscriptions(0);
        } finally {
            setLoading(false);
        }
    }, [currentPage, filterStatus]);

    useEffect(() => {
        fetchSubscriptions();
    }, [fetchSubscriptions]);

    const handleOpenNotesModal = (subscription, status) => {
        setCurrentSubscriptionToUpdate(subscription);
        setNewStatusForUpdate(status);
        setAdminNotes('');
        setRejectionReason('');
        setIsNotesModalOpen(true);
    };

    const handleCloseNotesModal = () => {
        setIsNotesModalOpen(false);
        setCurrentSubscriptionToUpdate(null);
        setAdminNotes('');
        setNewStatusForUpdate('');
        setRejectionReason('');
    };

    const handleOpenScreenshotModal = (screenshotUrl) => {
        setCurrentScreenshotUrl(screenshotUrl);
        setIsScreenshotModalOpen(true);
    };

    const handleCloseScreenshotModal = () => {
        setCurrentScreenshotUrl('');
        setIsScreenshotModalOpen(false);
    };

    const handleSubmitStatusChange = async (e) => {
        e.preventDefault();
        setModalLoading(true);

        let finalAdminNotes = adminNotes;
        if (newStatusForUpdate === SUBSCRIPTION_STATUSES.FAILED && rejectionReason) {
            finalAdminNotes = `Reason: ${rejectionReason}. ${adminNotes ? `Notes: ${adminNotes}` : ''}`;
        }

        try {
            // Call the admin service; its error will be toasted by api.js interceptor.
            await adminService.updateSubscriptionStatusByAdmin(
                currentSubscriptionToUpdate._id,
                newStatusForUpdate,
                finalAdminNotes
            );
            // On success, display a success toast here.
            toast.success(`Subscription for ${currentSubscriptionToUpdate.user?.email || 'N/A'} marked as ${newStatusForUpdate.toUpperCase().replace(/_/g, ' ')}.`);
            handleCloseNotesModal();
            fetchSubscriptions(); // Re-fetch to update the list and status
        } catch (err) {
            // Error handling done by adminService and api.js. No component-level toast.error.
        } finally {
            setModalLoading(false);
        }
    };

    const getStatusDisplayClass = (status) => {
        switch (status) {
            case SUBSCRIPTION_STATUSES.ACTIVE:
                return 'bg-success-light text-success-dark dark:bg-success dark:text-white';
            case SUBSCRIPTION_STATUSES.PENDING_MANUAL_VERIFICATION:
                return 'bg-warning-light text-warning-dark dark:bg-warning dark:text-black';
            case SUBSCRIPTION_STATUSES.FAILED:
            case SUBSCRIPTION_STATUSES.CANCELLED:
            case SUBSCRIPTION_STATUSES.EXPIRED:
                return 'bg-error-light text-error-dark dark:bg-error dark:text-white';
            case SUBSCRIPTION_STATUSES.INITIATED:
                return 'bg-info-light text-info-dark dark:bg-info dark:text-white';
            default:
                return 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-white';
        }
    };

    if (loading && subscriptions.length === 0) {
        return <LoadingSpinner fullScreen={false} message="Loading subscriptions..." />;
    }

    const totalPages = Math.ceil(totalSubscriptions / PAGINATION_DEFAULTS.PAGE_SIZE);

    return (
        <div className="p-4 bg-cardBackground dark:bg-card-background rounded-lg shadow-lg border border-border dark:border-border">
            <h2 className="text-3xl font-bold text-textDefault dark:text-text-default mb-6 text-center">Manage Subscriptions</h2>

            <div className="mb-6 flex justify-end gap-4">
                <select
                    className="p-2 border border-border rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary"
                    value={filterStatus}
                    onChange={(e) => {
                        setCurrentPage(1);
                        setFilterStatus(e.target.value);
                    }}
                >
                    <option value="">All Statuses</option>
                    {Object.values(SUBSCRIPTION_STATUSES).map(status => (
                        <option key={status} value={status}>
                            {status.toUpperCase().replace(/_/g, ' ')}
                        </option>
                    ))}
                </select>
            </div>

            {error && <p className="text-error-dark dark:text-error-light text-center mb-4">{error}</p>}

            {(!loading && subscriptions.length === 0) ? (
                <p className="text-center text-textSecondary dark:text-text-secondary">No subscriptions found matching your criteria.</p>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-border dark:border-border shadow-sm">
                    <table className="min-w-full divide-y divide-border dark:divide-border">
                        <thead className="bg-background dark:bg-card-background">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary dark:text-text-secondary uppercase tracking-wider">User Info</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary dark:text-text-secondary uppercase tracking-wider hidden sm:table-cell">Plan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary dark:text-text-secondary uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary dark:text-text-secondary">Payment Info</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary dark:text-text-secondary hidden lg:table-cell">Dates</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-textSecondary dark:text-text-secondary uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-card-background dark:bg-card-background divide-y divide-border dark:divide-border">
                            {(subscriptions || []).map((sub) => {
                                return (
                                <tr key={sub._id} className="hover:bg-gray-50 dark:hover:bg-[rgba(255,255,255,0.05)] transition-colors duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-textDefault dark:text-text-default">
                                        <div className="font-bold">{sub.user?.username || 'N/A User'}</div>
                                        <div className="text-xs text-textSecondary dark:text-text-secondary">{sub.user?.email || 'N/A Email'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary dark:text-text-secondary hidden sm:table-cell capitalize">
                                        {sub.plan.replace(/_/g, ' ') || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusDisplayClass(sub.status)}`}>
                                            {sub.status?.toUpperCase().replace(/_/g, ' ') || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-textSecondary dark:text-text-secondary">
                                        {sub.paymentMethod && <p>Method: {sub.paymentMethod}</p>}
                                        {sub.amount > 0 && <p>Amount: {sub.amount} {sub.currency}</p>}
                                        {sub.referenceCode && <p className="break-all text-xs">Ref Code: <span className="font-bold">{sub.referenceCode}</span></p>}
                                        {sub.transactionId && <p className="break-all text-xs">Txn ID: <span className="font-bold">{sub.transactionId}</span></p>}
                                        {sub.screenshotUrl && (
                                            <button
                                                // Removed ImageViewerModal here, using toast.info for quick display as per previous code
                                                onClick={() => toast.info(sub.screenshotUrl, { autoClose: false, closeOnClick: false, draggable: false })}
                                                className="mt-1 flex items-center text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary-dark text-xs"
                                                title="View Payment Screenshot"
                                            >
                                                <PhotoIcon className="h-4 w-4 mr-1" /> View Screenshot
                                            </button>
                                        )}
                                        {sub.adminNotes && (
                                            <button
                                                onClick={() => toast.info(sub.adminNotes, { autoClose: false, closeOnClick: false, draggable: false })}
                                                className="mt-1 flex items-center text-info-dark hover:text-info dark:text-info-light dark:hover:text-info-lighter text-xs"
                                                title="View Admin Notes"
                                            >
                                                <ChatBubbleBottomCenterTextIcon className="h-4 w-4 mr-1" /> View Notes
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary dark:text-text-secondary hidden lg:table-cell">
                                        {sub.createdAt && <p>Submitted: {formatDate(sub.createdAt)}</p>}
                                        {sub.startDate && <p>Starts: {formatDate(sub.startDate)}</p>}
                                        {sub.endDate && <p>Ends: {formatDate(sub.endDate)}</p>}
                                        {sub.verifiedAt && <p>Verified: {formatDate(sub.verifiedAt)}</p>}
                                        {sub.verifiedBy?.username && <p>By: {sub.verifiedBy.username}</p>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {sub.status === SUBSCRIPTION_STATUSES.PENDING_MANUAL_VERIFICATION ? (
                                            <>
                                                <button
                                                    onClick={() => handleOpenNotesModal(sub, SUBSCRIPTION_STATUSES.ACTIVE)}
                                                    className="text-success hover:text-success-dark dark:text-success-light dark:hover:bg-[rgba(255,255,255,0.05)] p-1 rounded-full hover:bg-green-50 transition-colors mr-2"
                                                    title="Verify Payment & Activate"
                                                >
                                                    <CheckCircleIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenNotesModal(sub, SUBSCRIPTION_STATUSES.FAILED)}
                                                    className="text-error hover:text-error-dark dark:text-error-light dark:hover:bg-[rgba(255,255,255,0.05)] p-1 rounded-full hover:bg-red-50 transition-colors"
                                                    title="Mark as Failed"
                                                >
                                                    <XMarkIcon className="h-5 w-5" />
                                                </button>
                                            </>
                                        ) : sub.status === SUBSCRIPTION_STATUSES.ACTIVE ? (
                                            <button
                                                onClick={() => handleOpenNotesModal(sub, SUBSCRIPTION_STATUSES.CANCELLED)}
                                                className="text-orange-600 hover:text-orange-900 dark:text-warning-light dark:hover:bg-[rgba(255,255,255,0.05)] p-1 rounded-full hover:bg-orange-50 transition-colors"
                                                title="Cancel Subscription"
                                            >
                                                <XMarkIcon className="h-5 w-5" />
                                            </button>
                                        ) : (
                                            <span className="text-textSecondary dark:text-text-secondary text-xs italic">No actions</span>
                                        )}
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {totalSubscriptions > PAGINATION_DEFAULTS.PAGE_SIZE && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            )}

            {/* Notes/Status Update Modal */}
            <Modal
                isOpen={isNotesModalOpen}
                onClose={handleCloseNotesModal}
                title={`Update Subscription Status: ${currentSubscriptionToUpdate?.user?.email || 'N/A'}`}
                size="md"
            >
                <form onSubmit={handleSubmitStatusChange} className="space-y-4">
                    <p className="text-textDefault dark:text-text-default">
                        Confirm action for <span className="font-bold">{currentSubscriptionToUpdate?.user?.email || 'N/A'}</span>:
                        Mark as <span className="font-bold text-primary dark:text-primary-light">{newStatusForUpdate.toUpperCase().replace(/_/g, ' ')}</span>
                    </p>
                    {newStatusForUpdate === SUBSCRIPTION_STATUSES.ACTIVE && (
                        <p className="text-success-dark dark:text-success-light text-sm flex items-center">
                            <InformationCircleIcon className="h-5 w-5 mr-1" /> This will activate premium for the user for 1 year.
                        </p>
                    )}
                    {(newStatusForUpdate === SUBSCRIPTION_STATUSES.FAILED || newStatusForUpdate === SUBSCRIPTION_STATUSES.CANCELLED) && (
                        <div>
                            <label htmlFor="rejectionReason" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">
                                {newStatusForUpdate === SUBSCRIPTION_STATUSES.FAILED ? 'Rejection Reason (Required)' : 'Reason for Cancellation (Optional)'}
                            </label>
                            <select
                                id="rejectionReason"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="w-full p-2 border border-border rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary"
                                required={newStatusForUpdate === SUBSCRIPTION_STATUSES.FAILED}
                                disabled={modalLoading}
                            >
                                <option value="">Select a reason</option>
                                {REJECTION_REASONS.map((reason, index) => (
                                    <option key={index} value={reason}>{reason}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div>
                        <label htmlFor="adminNotes" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">
                            Additional Admin Notes (Optional)
                        </label>
                        <textarea
                            id="adminNotes"
                            rows="3"
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            className="w-full p-2 border border-border rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary"
                            disabled={modalLoading}
                            placeholder="e.g., 'Verified UPI payment against screenshot', 'User requested cancellation due to change of plans.'"
                        ></textarea>
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={handleCloseNotesModal}
                            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md font-medium transition-colors dark:bg-gray-600 dark:text-text-default dark:hover:bg-gray-500"
                            disabled={modalLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={modalLoading || (newStatusForUpdate === SUBSCRIPTION_STATUSES.FAILED && !rejectionReason)}
                            className={`px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                newStatusForUpdate === SUBSCRIPTION_STATUSES.ACTIVE ? 'bg-success hover:bg-success-dark text-white' : 'bg-error hover:bg-error-dark text-white'
                            }`}
                        >
                            {modalLoading ? (
                                'Updating...'
                            ) : (
                                `Confirm ${newStatusForUpdate.toUpperCase().replace(/_/g, ' ')}`
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Screenshot Viewer Modal is no longer directly used in the table, toast.info is used instead.
                Keeping it commented out here in case you want to re-integrate a proper modal later.
            */}
            {/* <ImageViewerModal
                isOpen={isScreenshotModalOpen}
                onClose={handleCloseScreenshotModal}
                imageUrl={currentScreenshotUrl}
                title="Payment Screenshot"
            /> */}
        </div>
    );
}

export default ManageSubscriptions;