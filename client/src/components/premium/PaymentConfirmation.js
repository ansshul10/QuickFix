// quickfix-website/client/src/components/premium/PaymentConfirmation.js
import React, { useState } from 'react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { Link, useLocation } from 'react-router-dom';
import { ROUTES, SUBSCRIPTION_STATUSES } from '../../utils/constants';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';
import * as premiumService from '../../services/premiumService';

function PaymentConfirmation() {
    const location = useLocation();
    const { status, message, transactionId, plan, referenceCode, subscriptionId } = location.state || {};

    const isSuccess = status === SUBSCRIPTION_STATUSES.ACTIVE;
    const isPending = status === SUBSCRIPTION_STATUSES.PENDING_MANUAL_VERIFICATION;
    const isFailed = status === SUBSCRIPTION_STATUSES.FAILED;

    const [screenshotFile, setScreenshotFile] = useState(null);
    const [screenshotUploadLoading, setScreenshotUploadLoading] = useState(false);
    const [screenshotUploadError, setScreenshotUploadError] = useState('');

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setScreenshotUploadError("Only image files are allowed.");
                setScreenshotFile(null);
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setScreenshotUploadError("File size must be less than 5MB.");
                setScreenshotFile(null);
                return;
            }
            setScreenshotFile(file);
            setScreenshotUploadError('');
        }
    };

    const handleScreenshotUpload = async () => {
        if (!screenshotFile) {
            setScreenshotUploadError("Please select a screenshot to upload.");
            return;
        }
        if (!subscriptionId) {
            setScreenshotUploadError("Cannot upload screenshot: Subscription ID is missing. Please contact support.");
            toast.error("Cannot upload screenshot: Subscription ID is missing. Please contact support.");
            return;
        }

        setScreenshotUploadLoading(true);
        setScreenshotUploadError('');

        const formData = new FormData();
        formData.append('screenshot', screenshotFile);
        formData.append('subscriptionId', subscriptionId);

        try {
            const res = await premiumService.uploadPaymentScreenshot(formData);
            toast.success(res.message || "Screenshot uploaded successfully! It will aid in faster verification.");
            setScreenshotFile(null); // Clear file input
            // Optionally, update the local state to show screenshot is uploaded if needed
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Failed to upload screenshot.";
            setScreenshotUploadError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setScreenshotUploadLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
            <div className="max-w-md w-full space-y-8 p-8 bg-cardBackground dark:bg-gray-800 rounded-lg shadow-xl border border-border dark:border-gray-700 text-center">
                {isSuccess ? (
                    <>
                        <CheckCircleIcon className="mx-auto h-20 w-20 text-green-500" />
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-green-600 dark:text-green-400">
                            Payment Successful!
                        </h2>
                        <p className="mt-2 text-lg text-textDefault dark:text-white">
                            Your QuickFix Premium subscription is now active!
                        </p>
                    </>
                ) : isPending ? (
                    <>
                        <InformationCircleIcon className="mx-auto h-20 w-20 text-blue-500" />
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                            Payment Submitted for Verification!
                        </h2>
                        <p className="mt-2 text-lg text-textDefault dark:text-white">
                            Your payment confirmation has been received and is awaiting manual verification by our team.
                        </p>
                        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-md border border-border dark:border-gray-600">
                            <p className="text-sm text-textSecondary dark:text-gray-400 font-semibold mb-2">
                                To speed up verification, you can upload a screenshot of your payment.
                            </p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-textDefault dark:text-text-default file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark file:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={screenshotUploadLoading}
                            />
                            {screenshotUploadError && <p className="mt-2 text-xs text-error-dark">{screenshotUploadError}</p>}
                            <button
                                onClick={handleScreenshotUpload}
                                disabled={!screenshotFile || screenshotUploadLoading}
                                className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-dark disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {screenshotUploadLoading ? (
                                    <LoadingSpinner small={true} />
                                ) : (
                                    <>
                                        <PhotoIcon className="h-5 w-5 mr-2" /> Upload Screenshot
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <XCircleIcon className="mx-auto h-20 w-20 text-red-500" />
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-red-600 dark:text-red-400">
                            Payment Failed!
                        </h2>
                        <p className="mt-2 text-lg text-textDefault dark:text-white">
                            There was an issue processing your payment.
                        </p>
                    </>
                )}
                <p className="text-sm text-textSecondary dark:text-gray-400">
                    {message || (isSuccess ? "Thank you for your purchase." : isPending ? "We will notify you once your premium access is activated." : "Please try again or contact support.")}
                </p>
                {transactionId && (
                    <p className="text-sm text-textSecondary dark:text-gray-400">Transaction ID: <span className="font-medium text-textDefault dark:text-white break-all">{transactionId}</span></p>
                )}
                {referenceCode && (
                    <p className="text-sm text-textSecondary dark:text-gray-400">Reference Code: <span className="font-medium text-textDefault dark:text-white break-all">{referenceCode}</span></p>
                )}
                {plan && (
                    <p className="text-sm text-textSecondary dark:text-gray-400">Plan: <span className="font-medium text-textDefault dark:text-white">{plan}</span></p>
                )}
                {isFailed && ( // If payment failed, show contact info
                    <div className="mt-4 text-sm text-textSecondary dark:text-gray-400">
                        <p>If you believe this is an error, please contact support.</p>
                    </div>
                )}

                <div className="mt-8">
                    <Link
                        to={ROUTES.PROFILE}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark transition-colors"
                    >
                        Go to My Profile
                    </Link>
                </div>
                {!isSuccess && !isPending && (
                    <div className="mt-4">
                        <Link
                            to={ROUTES.PREMIUM}
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-primary bg-primary-light hover:bg-primary-light-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light transition-colors"
                        >
                            Try Again
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PaymentConfirmation;