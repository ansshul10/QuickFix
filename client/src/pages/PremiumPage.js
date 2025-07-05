import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SettingsContext } from '../context/SettingsContext';
import PremiumPlansDisplay from '../components/premium/PremiumPlansDisplay';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import * as premiumService from '../services/premiumService';
import { SUBSCRIPTION_STATUSES, ROUTES } from '../utils/constants';
import { formatDate } from '../utils/formatters';
import {
    CheckCircleIcon, InformationCircleIcon, ExclamationTriangleIcon,
    CurrencyRupeeIcon, PhotoIcon
} from '@heroicons/react/24/solid';
import { ClipboardDocumentListIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { QRCodeSVG } from 'qrcode.react';

function PremiumPage() {
    const { user, loading: authLoading, checkUserStatus } = useContext(AuthContext);
    const { settings, loadingSettings } = useContext(SettingsContext);
    const navigate = useNavigate();

    const [subscriptionStatus, setSubscriptionStatus] = useState(null);
    const [loadingSubscriptionStatus, setLoadingSubscriptionStatus] = useState(true);
    const [errorSubscriptionStatus, setErrorSubscriptionStatus] = useState(null); // Keep error state for local display

    const [selectedPlan, setSelectedPlan] = useState(null);

    const [upiTransactionId, setUpiTransactionId] = useState('');
    const [referenceCode, setReferenceCode] = useState('');
    const [paymentConfirmationLoading, setPaymentConfirmationLoading] = useState(false);
    const [upiTransactionIdError, setUpiTransactionIdError] = useState(''); // For local input validation error

    const [screenshotFile, setScreenshotFile] = useState(null);
    const [screenshotUploadLoading, setScreenshotUploadLoading] = useState(false);
    const [screenshotUploadError, setScreenshotUploadError] = useState(null); // For local screenshot upload error display

    const generateUpiLink = (upiId, amount, reference) => {
        if (!upiId || !amount || !reference) return '';
        const encodedUpiId = encodeURIComponent(upiId);
        const encodedAmount = encodeURIComponent(amount);
        const encodedReference = encodeURIComponent(reference);
        return `upi://pay?pa=${encodedUpiId}&pn=QuickFix&tr=${encodedReference}&am=${encodedAmount}&cu=INR&tn=QuickFix%20Premium%20Ref%20${encodedReference}`;
    };

    const getSettingValue = (settingName, defaultValue = null) => {
        if (!settings) return defaultValue;
        return settings[settingName] !== undefined ? settings[settingName] : defaultValue;
    };

    const upiId = getSettingValue('upiIdForPremium');
    const upiLink = (upiId && selectedPlan?.price && referenceCode) ? generateUpiLink(upiId, selectedPlan.price, referenceCode) : '';

    useEffect(() => {
        const fetchStatusAndSettings = async () => {
            if (!user) {
                setSubscriptionStatus(null);
                setLoadingSubscriptionStatus(false);
                return;
            }
            setLoadingSubscriptionStatus(true);
            setErrorSubscriptionStatus(null);
            try {
                const statusRes = await premiumService.getSubscriptionStatus();
                setSubscriptionStatus(statusRes.data); // Assuming statusRes.data is the actual subscription object

                // If the user has a pending verification, pre-fill the form fields
                if (statusRes.data?.status === SUBSCRIPTION_STATUSES.PENDING_MANUAL_VERIFICATION) {
                    setReferenceCode(statusRes.data.referenceCode || '');
                    setUpiTransactionId(statusRes.data.transactionId || '');
                    // Also pre-select the plan if a pending verification exists
                    // You might need to fetch plans to find the matching selectedPlan object
                    const plansResponse = await premiumService.getPremiumFeatures(); // Fetch plans to find the object
                    const matchingPlan = plansResponse.plans.find(p => p.name === statusRes.data.plan);
                    if (matchingPlan) {
                        setSelectedPlan(matchingPlan);
                    }
                } else {
                    setUpiTransactionId('');
                    // Only clear referenceCode if no plan is selected or if the status is definitively not pending.
                    if (!selectedPlan || (selectedPlan && statusRes.data?.plan !== selectedPlan.name)) {
                       setReferenceCode('');
                    }
                }
            } catch (err) {
                // Error toast is handled by premiumService.getSubscriptionStatus (via api.js interceptor).
                // Just set local error state for display within the component if needed.
                const errorMessage = err.response?.data?.message || 'Failed to fetch subscription status.';
                setErrorSubscriptionStatus(errorMessage);
            } finally {
                setLoadingSubscriptionStatus(false);
            }
        };

        if (!authLoading && !loadingSettings) {
            fetchStatusAndSettings();
        }
    }, [user, authLoading, loadingSettings, settings]); // Removed selectedPlan from dependencies

    // This useEffect is to trigger generateUpiLink and referenceCode/transactionId management
    useEffect(() => {
        // Condition to generate a NEW reference code:
        // 1. A plan is selected
        // 2. AND there's no existing subscription status OR
        // 3. The current subscription is NOT pending for the *selected* plan OR
        // 4. The current subscription is pending, but for a *different* plan
        if (selectedPlan && (
            !subscriptionStatus ||
            subscriptionStatus.status !== SUBSCRIPTION_STATUSES.PENDING_MANUAL_VERIFICATION ||
            subscriptionStatus.plan !== selectedPlan.name
        )) {
            const newReferenceCode = Math.floor(100000 + Math.random() * 900000).toString();
            setReferenceCode(newReferenceCode);
            setUpiTransactionId(''); // Clear transaction ID if starting a new payment flow
            setUpiTransactionIdError(''); // Clear any old validation errors
        }
        // Condition to RETAIN pending details:
        // 1. A plan is selected
        // 2. AND there's a pending subscription
        // 3. AND that pending subscription matches the currently selected plan
        else if (selectedPlan && subscriptionStatus &&
                 subscriptionStatus.status === SUBSCRIPTION_STATUSES.PENDING_MANUAL_VERIFICATION &&
                 subscriptionStatus.plan === selectedPlan.name) {
            setReferenceCode(subscriptionStatus.referenceCode || '');
            setUpiTransactionId(subscriptionStatus.transactionId || '');
        }
    }, [selectedPlan, subscriptionStatus]); // Only depends on selectedPlan and subscriptionStatus

    const handleSelectPlan = (plan) => {
        setSelectedPlan(plan);
        // The logic for generating new referenceCode / keeping old one is moved to the useEffect above.
    };

    const handleCopyUpiId = () => {
        if (upiId) {
            navigator.clipboard.writeText(upiId);
            toast.info("UPI ID copied to clipboard!");
        }
    };

    const handleCopyReferenceCode = () => {
        if (referenceCode) {
            navigator.clipboard.writeText(referenceCode);
            toast.info("Reference code copied to clipboard!");
        }
    };

    const handleSubmitPaymentConfirmation = async (e) => {
        e.preventDefault();
        setPaymentConfirmationLoading(true);
        setUpiTransactionIdError(''); // Clear local validation error before submission

        if (!upiTransactionId.trim()) {
            setUpiTransactionIdError('Transaction ID is required.');
            toast.error('Please enter your UPI Transaction ID.'); // This is an explicit UI validation error, not an API error
            setPaymentConfirmationLoading(false);
            return;
        }

        if (!selectedPlan) {
            toast.error('Please select a premium plan first.'); // This is an explicit UI validation error
            setPaymentConfirmationLoading(false);
            return;
        }

        try {
            // Call premiumService; its errors will be toasted by api.js interceptor.
            const res = await premiumService.submitPaymentConfirmation(
                upiTransactionId.trim(),
                referenceCode,
                selectedPlan.name
            );
            toast.success(res.message || "Payment confirmation submitted! We'll verify it shortly.");
            setSubscriptionStatus(res.subscription);
            setUpiTransactionId('');
            checkUserStatus(); // Important: updates user's isPremium status in AuthContext
        } catch (err) {
            // Error handling is delegated to premiumService and api.js. No component-level toast.error.
            // You might log the error if your logger is client-side: console.error("Error submitting payment:", err);
        } finally {
            setPaymentConfirmationLoading(false);
        }
    };

    const handleScreenshotChange = (e) => {
        setScreenshotFile(e.target.files[0]);
        setScreenshotUploadError(null); // Clear previous error when new file is selected
    };

    const handleUploadScreenshot = async () => {
        if (!screenshotFile) {
            setScreenshotUploadError('Please select a screenshot file to upload.');
            return;
        }
        if (!subscriptionStatus?._id) {
            setScreenshotUploadError('No active or pending subscription found to attach screenshot to.');
            return;
        }

        setScreenshotUploadLoading(true);
        setScreenshotUploadError(null); // Clear previous error before upload

        const formData = new FormData();
        formData.append('screenshot', screenshotFile);
        formData.append('subscriptionId', subscriptionStatus._id);

        try {
            // Call premiumService; its errors will be toasted by api.js interceptor.
            const res = await premiumService.uploadPaymentScreenshot(formData);
            toast.success(res.message || 'Screenshot uploaded successfully!');
            setSubscriptionStatus(prev => ({ ...prev, screenshotUrl: res.screenshotUrl }));
            setScreenshotFile(null);
            document.getElementById('screenshot-upload-input').value = ''; // Clear file input
        } catch (err) {
            // Error handling is delegated to premiumService and api.js. No component-level toast.error.
            // Set local error state for display near the upload button.
            const errorMessage = err.response?.data?.message || 'Failed to upload screenshot.';
            setScreenshotUploadError(errorMessage);
        } finally {
            setScreenshotUploadLoading(false);
        }
    };

    const handleCancelSubscription = async () => {
        if (window.confirm("Are you sure you want to cancel your premium subscription? Your premium access will end at the current period's end.")) {
            setLoadingSubscriptionStatus(true);
            try {
                // Call premiumService; its errors will be toasted by api.js interceptor.
                await premiumService.cancelSubscription();
                toast.success("Subscription cancellation initiated. Your access will expire at the end of the current period.");
                const updatedStatusRes = await premiumService.getSubscriptionStatus();
                setSubscriptionStatus(updatedStatusRes.data);
                checkUserStatus(); // Important: updates user's isPremium status in AuthContext
            } catch (err) {
                // Error handling is delegated to premiumService and api.js. No component-level toast.error.
            } finally {
                setLoadingSubscriptionStatus(false);
            }
        }
    };

    if (authLoading || loadingSettings || loadingSubscriptionStatus) {
        return <LoadingSpinner fullScreen={true} message="Loading premium details..." />;
    }

    const getStatusClassName = (status) => {
        switch (status) {
            case SUBSCRIPTION_STATUSES.ACTIVE:
                return 'text-success-dark dark:text-success-light';
            case SUBSCRIPTION_STATUSES.PENDING_MANUAL_VERIFICATION:
                return 'text-info-dark dark:text-info-light';
            case SUBSCRIPTION_STATUSES.FAILED:
            case SUBSCRIPTION_STATUSES.CANCELLED:
            case SUBSCRIPTION_STATUSES.EXPIRED:
                return 'text-error-dark dark:text-error-light';
            case SUBSCRIPTION_STATUSES.NONE:
                return 'text-textSecondary dark:text-text-secondary';
            default:
                return 'text-textSecondary dark:text-text-secondary';
        }
    };

    // Determine if the payment submission section should be shown
    // It should show if a plan is selected AND:
    // 1. There is no current subscription.
    // 2. The current subscription is explicitly NONE.
    // 3. The current subscription is failed, expired, or cancelled.
    // 4. The current subscription is active but for a *different* plan (upgrade/downgrade).
    // 5. The current subscription is pending but for a *different* plan.
    // IMPORTANT: If status is PENDING_MANUAL_VERIFICATION AND plan matches, it should NOT show this section,
    // as it has its own "resubmit" form.
    const showPaymentSubmissionSection = selectedPlan && (
        !subscriptionStatus || // No subscription record at all
        subscriptionStatus.status === SUBSCRIPTION_STATUSES.NONE || // Explicitly no subscription record
        subscriptionStatus.status === SUBSCRIPTION_STATUSES.FAILED || // Previous attempt failed
        subscriptionStatus.status === SUBSCRIPTION_STATUSES.EXPIRED || // Previous plan expired
        subscriptionStatus.status === SUBSCRIPTION_STATUSES.CANCELLED || // Previous plan cancelled
        (subscriptionStatus.status === SUBSCRIPTION_STATUSES.ACTIVE && subscriptionStatus.plan !== selectedPlan.name) || // Active but wanting different plan
        (subscriptionStatus.status === SUBSCRIPTION_STATUSES.PENDING_MANUAL_VERIFICATION && subscriptionStatus.plan !== selectedPlan.name) // Pending but for a different plan
    );


    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Breadcrumbs customSegments={[{ name: 'Premium', path: ROUTES.PREMIUM }]} />
            </div>

            {user ? (
                <div className="max-w-4xl mx-auto bg-cardBackground dark:bg-card-background rounded-lg shadow-xl p-8 border border-border dark:border-border mb-8 text-center">
                    <h2 className="text-3xl font-bold text-textDefault dark:text-text-default mb-4">Your Premium Status</h2>
                    {errorSubscriptionStatus ? (
                        <p className="text-error-dark dark:text-error-light">{errorSubscriptionStatus}</p>
                    ) : (
                        <div>
                            {user.isPremium ? (
                                <div className="text-success-dark dark:text-success-light text-2xl font-bold flex items-center justify-center space-x-2">
                                    <CheckCircleIcon className="h-8 w-8 text-success-dark dark:text-success-light" />
                                    <span>You have Active Premium!</span>
                                </div>
                            ) : (
                                <div className="text-error-dark dark:text-error-light text-2xl font-bold">
                                    You are a Free Member.
                                </div>
                            )}

                            {subscriptionStatus && subscriptionStatus.status && (
                                <div className="mt-4 text-textSecondary dark:text-text-secondary text-sm space-y-1">
                                    <p>Plan: <span className="font-medium text-textDefault dark:text-text-default capitalize">{subscriptionStatus.plan?.replace(/_/g, ' ') || 'N/A'}</span></p>
                                    <p>Status: <span className={`font-medium ${getStatusClassName(subscriptionStatus.status)}`}>
                                        {subscriptionStatus.status.toUpperCase().replace(/_/g, ' ')}
                                    </span></p>
                                    {subscriptionStatus.startDate && <p>Starts: {formatDate(subscriptionStatus.startDate, { dateStyle: 'medium' })}</p>}
                                    {subscriptionStatus.endDate && <p>Ends: {formatDate(subscriptionStatus.endDate, { dateStyle: 'medium' })}</p>}
                                    {subscriptionStatus.amount > 0 && <p>Amount Paid: <span className="font-medium">{subscriptionStatus.amount} {subscriptionStatus.currency}</span></p>}
                                    {subscriptionStatus.transactionId && <p className="break-all">Transaction ID: <span className="font-medium">{subscriptionStatus.transactionId}</span></p>}
                                    {subscriptionStatus.referenceCode && <p className="break-all">Reference Code: <span className="font-medium text-primary dark:text-primary-light">{subscriptionStatus.referenceCode}</span></p>}
                                    {subscriptionStatus.screenshotUrl && (
                                        <p className="break-all">Screenshot:
                                            <a href={subscriptionStatus.screenshotUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">View Screenshot</a>
                                        </p>
                                    )}

                                    {/* This block handles display for PENDING_MANUAL_VERIFICATION status */}
                                    {subscriptionStatus.status === SUBSCRIPTION_STATUSES.PENDING_MANUAL_VERIFICATION && (
                                        <div className="mt-4 p-4 rounded-md bg-info-light dark:bg-info-dark/20 text-info-dark dark:text-info-light border border-info-dark/50 flex flex-col items-center">
                                            <InformationCircleIcon className="h-6 w-6 mb-2" />
                                            <p className="font-semibold text-center">Your payment for the {subscriptionStatus.plan?.replace(/_/g, ' ')} plan is awaiting manual verification.</p>
                                            <p className="text-sm text-center">Our team is reviewing your submission. This may take up to 24-48 hours. Thank you for your patience!</p>

                                            {!subscriptionStatus.screenshotUrl && (
                                                <div className="mt-4 w-full max-w-sm">
                                                    <h5 className="text-md font-semibold mb-2">Upload Payment Screenshot (Optional but Recommended)</h5>
                                                    <p className="text-xs mb-2">Help us verify faster by uploading a screenshot of your successful UPI transaction.</p>
                                                    <input
                                                        type="file"
                                                        id="screenshot-upload-input"
                                                        accept="image/*"
                                                        onChange={handleScreenshotChange}
                                                        className="block w-full text-sm text-textDefault dark:text-text-default
                                                                    file:mr-4 file:py-2 file:px-4
                                                                    file:rounded-full file:border-0
                                                                    file:text-sm file:font-semibold
                                                                    file:bg-primary-light file:text-primary
                                                                    hover:file:bg-primary-light/80"
                                                    />
                                                    {screenshotUploadError && <p className="mt-2 text-sm text-error">{screenshotUploadError}</p>}
                                                    <button
                                                        onClick={handleUploadScreenshot}
                                                        disabled={!screenshotFile || screenshotUploadLoading}
                                                        className="mt-3 w-full bg-accent hover:bg-accent-dark text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                                    >
                                                        {screenshotUploadLoading ? 'Uploading...' : <> <PhotoIcon className="h-5 w-5 mr-2" /> Upload Screenshot </>}
                                                    </button>
                                                </div>
                                            )}
                                            {subscriptionStatus.screenshotUrl && (
                                                <p className="mt-2 text-sm text-success-dark dark:text-success-light flex items-center">
                                                    <CheckCircleIcon className="h-4 w-4 mr-1" /> Screenshot uploaded.
                                                </p>
                                            )}
                                            {/* Allow re-submission of transaction ID if needed for pending, but only if the plan matches */}
                                            {selectedPlan && subscriptionStatus.plan === selectedPlan.name && (
                                                <form onSubmit={handleSubmitPaymentConfirmation} className="space-y-4 pt-4 border-t border-border dark:border-border w-full">
                                                    <h4 className="text-xl font-semibold text-textDefault dark:text-text-default mb-2">Resubmit Payment Details</h4>
                                                    <p className="text-textSecondary dark:text-text-secondary mb-4">If you need to update your Transaction ID or Reference Code for your pending payment, enter it here.</p>
                                                    <div>
                                                        <label htmlFor="upiTransactionId" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">
                                                            Your UPI Transaction ID (UTR / RRN)
                                                        </label>
                                                        <input
                                                            type="text"
                                                            id="upiTransactionId"
                                                            value={upiTransactionId}
                                                            onChange={(e) => {
                                                                setUpiTransactionId(e.target.value);
                                                                setUpiTransactionIdError('');
                                                            }}
                                                            className={`w-full p-2 border ${upiTransactionIdError ? 'border-error' : 'border-border'} rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary`}
                                                            disabled={paymentConfirmationLoading}
                                                            placeholder="e.g., 123456789012"
                                                            required
                                                        />
                                                        {upiTransactionIdError && <p className="mt-1 text-sm text-error">{upiTransactionIdError}</p>}
                                                    </div>
                                                    <button
                                                        type="submit"
                                                        disabled={paymentConfirmationLoading}
                                                        className="w-full bg-accent hover:bg-accent-dark text-white font-semibold py-2.5 px-4 rounded-md shadow-lg transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {paymentConfirmationLoading ? 'Updating...' : 'Update Pending Payment'}
                                                    </button>
                                                </form>
                                            )}
                                        </div>
                                    )}

                                    {subscriptionStatus.status === SUBSCRIPTION_STATUSES.ACTIVE && (
                                        <button
                                            onClick={handleCancelSubscription}
                                            disabled={loadingSubscriptionStatus}
                                            className="mt-4 px-5 py-2 bg-error hover:bg-error-dark text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {loadingSubscriptionStatus ? 'Cancelling...' : 'Cancel Subscription'}
                                        </button>
                                    )}
                                     {(subscriptionStatus.status === SUBSCRIPTION_STATUSES.FAILED || subscriptionStatus.status === SUBSCRIPTION_STATUSES.EXPIRED || subscriptionStatus.status === SUBSCRIPTION_STATUSES.CANCELLED) && (
                                        <p className="mt-4 text-warning-dark dark:text-warning-light flex items-center justify-center">
                                            <ExclamationTriangleIcon className="h-5 w-5 mr-1" /> Your subscription is not active. Please select a plan below to resubscribe.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="max-w-2xl mx-auto bg-cardBackground dark:bg-card-background rounded-lg shadow-xl p-8 border border-border dark:border-border text-center">
                    <h2 className="text-3xl font-bold text-textDefault dark:text-text-default mb-4">Join Premium Membership</h2>
                    <p className="text-textSecondary dark:text-text-secondary mb-6">Login to access premium features and manage your subscription.</p>
                    <Link to={ROUTES.LOGIN} className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-md font-semibold text-lg transition-colors">
                        Login to Get Premium
                    </Link>
                </div>
            )}

            <PremiumPlansDisplay
                onSelectPlan={handleSelectPlan}
                isUserPremium={user?.isPremium}
                currentSubscription={subscriptionStatus}
            />

            {/* Show payment form if a plan is selected AND it's not the user's currently active/pending plan (or is for resubscribe) */}
            {user && selectedPlan && showPaymentSubmissionSection && (
                <div className="mt-8 pt-6 border-t border-border dark:border-border text-left max-w-4xl mx-auto">
                    <h3 className="text-2xl font-bold text-textDefault dark:text-text-default mb-4 text-center">Subscribe to {selectedPlan.displayName} Plan</h3>

                    {!upiId || !selectedPlan.price ? (
                        <p className="text-error-dark dark:text-error-light text-center">
                            <ExclamationTriangleIcon className="h-5 w-5 inline-block mr-1" />
                            UPI payment details for this plan are not fully configured. Please contact support.
                            {getSettingValue('contactEmail') && <a href={`mailto:${getSettingValue('contactEmail')}`} className="text-primary hover:underline ml-1">{getSettingValue('contactEmail')}</a>}.
                        </p>
                    ) : (
                        <div className="bg-background dark:bg-card-background p-6 rounded-lg shadow-inner border border-border dark:border-border">
                            <h4 className="text-xl font-semibold text-textDefault dark:text-text-default mb-4 flex items-center">
                                <InformationCircleIcon className="h-6 w-6 mr-2 text-info-dark dark:text-info-light" />
                                Pay via UPI (Manual Verification Required)
                            </h4>
                            <p className="text-textSecondary dark:text-text-secondary mb-4">
                                To activate your {selectedPlan.displayName} membership, please make a payment of <strong className="text-textDefault dark:text-text-default">{selectedPlan.price} {selectedPlan.currency}</strong> to the UPI ID below.
                            </p>
                            <p className="text-textSecondary dark:text-text-secondary mb-4 font-bold">
                                <ExclamationTriangleIcon className="h-5 w-5 text-warning-dark dark:text-warning-light inline-block mr-1" />
                                IMPORTANT: In the UPI app's message/remarks, include the following <span className="text-primary-dark dark:text-primary-light">Reference Code</span>!
                            </p>

                            <div className="bg-black-500 dark:bg-gray-700 p-4 rounded-md flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
                                <div className="text-textDefault dark:text-text-default font-mono text-lg break-all">
                                    UPI ID: <span className="font-bold">{upiId}</span>
                                    <button type="button" onClick={handleCopyUpiId} className="ml-2 text-primary dark:text-primary-light hover:underline focus:outline-none">
                                        <ClipboardDocumentListIcon className="h-5 w-5 inline-block" /> Copy
                                    </button>
                                </div>
                                <div className="text-textDefault dark:text-text-default font-mono text-lg break-all">
                                    Reference Code: <span className="font-bold text-primary dark:text-primary-light">{referenceCode}</span>
                                    <button type="button" onClick={handleCopyReferenceCode} className="ml-2 text-primary dark:text-primary-light hover:underline focus:outline-none">
                                        <ClipboardDocumentListIcon className="h-5 w-5 inline-block" /> Copy
                                    </button>
                                </div>
                            </div>

                            {upiLink ? (
                                <div className="flex flex-col items-center justify-center mb-6">
                                    <p className="text-textSecondary dark:text-text-secondary mb-2">Scan to Pay:</p>
                                    <div className="p-2 border border-border dark:border-border rounded-md bg-white">
                                        <QRCodeSVG value={upiLink} size={180} level="H" renderAs="svg" />
                                    </div>
                                    <a
                                        href={upiLink}
                                        className="mt-4 flex items-center justify-center text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary-dark font-semibold text-lg"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <QrCodeIcon className="h-6 w-6 mr-2" /> Open in UPI App
                                    </a>
                                </div>
                            ) : (
                                <p className="text-error-dark dark:text-error-light text-center mb-6">
                                    <ExclamationTriangleIcon className="h-5 w-5 inline-block mr-1" />
                                    Cannot generate QR Code. Missing UPI details or amount for the selected plan.
                                </p>
                            )}

                            <form onSubmit={handleSubmitPaymentConfirmation} className="space-y-4 pt-4 border-t border-border dark:border-border">
                                <h4 className="text-xl font-semibold text-textDefault dark:text-text-default mb-2">Confirm Your Payment</h4>
                                <p className="text-textSecondary dark:text-text-secondary mb-4">
                                    After paying, enter the Transaction ID (UTR / RRN) from your UPI app below.
                                    We will then manually verify your payment and activate your premium membership.
                                </p>
                                <div>
                                    <label htmlFor="upiTransactionId" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">
                                        Your UPI Transaction ID (UTR / RRN)
                                    </label>
                                    <input
                                        type="text"
                                        id="upiTransactionId"
                                        value={upiTransactionId}
                                        onChange={(e) => {
                                            setUpiTransactionId(e.target.value);
                                            setUpiTransactionIdError('');
                                        }}
                                        className={`w-full p-2 border ${upiTransactionIdError ? 'border-error' : 'border-border'} rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary`}
                                        disabled={paymentConfirmationLoading}
                                        placeholder="e.g., 123456789012"
                                        required
                                    />
                                    {upiTransactionIdError && <p className="mt-1 text-sm text-error">{upiTransactionIdError}</p>}
                                </div>
                                <button
                                    type="submit"
                                    disabled={paymentConfirmationLoading}
                                    className="w-full bg-success hover:bg-success-dark text-white font-semibold py-2.5 px-4 rounded-md shadow-lg transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {paymentConfirmationLoading ? (
                                        'Submitting...'
                                    ) : (
                                        <>
                                            <CheckCircleIcon className="h-5 w-5 mr-2" /> Submit for Verification
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default PremiumPage;