// quickfix-website/client/src/pages/EmailVerificationPage.js
import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { validateEmail } from '../utils/validation';
import LoadingSpinner from '../components/common/LoadingSpinner'; // Keep this for full-screen loading
import { toast } from 'react-toastify';
import { ROUTES } from '../utils/constants';

function EmailVerificationPage() {
    const { token } = useParams();
    const { state } = useLocation();
    const { verifyEmail, resendEmailVerificationLink, user, loading: authLoading } = useContext(AuthContext); // Use authLoading from context
    const navigate = useNavigate();

    const [verificationStatus, setVerificationStatus] = useState('pending'); // 'pending', 'verifying', 'success', 'error'
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendEmail, setResendEmail] = useState(state?.email || '');
    const [resendEmailError, setResendEmailError] = useState('');
    const [resendLoading, setResendLoading] = useState(false); // Controls the specific resend button loading

    const RESEND_COOLDOWN_SECONDS = 60; // 1 minute cooldown

    // Effect for handling actual token verification
    useEffect(() => {
        const handleVerification = async () => {
            if (user && user.emailVerified) {
                toast.success("Your email is already verified!", { autoClose: 3000, toastId: 'already-verified-redirect' });
                navigate(ROUTES.PROFILE, { replace: true });
                return;
            }

            if (token) {
                setVerificationStatus('verifying');
                toast.dismiss();
                toast.info("Verifying your email...", { autoClose: false, toastId: 'verifying-email' });

                const result = await verifyEmail(token);
                toast.dismiss('verifying-email');

                if (result.success) {
                    setVerificationStatus('success');
                } else {
                    setVerificationStatus('error');
                }
            } else if (!authLoading && !user) {
                setVerificationStatus('error');
                toast.error("Please verify your account. If you just registered or logged in with an unverified email, a verification link has been sent to your inbox.", { toastId: 'no-token-initial-load', autoClose: false, closeButton: true });
            } else if (!authLoading && user && !user.emailVerified) {
                setVerificationStatus('error');
            }
        };

        // Only run verification logic if auth is not globally loading (meaning initial auth check is done)
        if (!authLoading) {
            handleVerification();
        }
    }, [token, user, authLoading, navigate, verifyEmail, state?.email]);

    // Effect for resend cooldown timer
    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setInterval(() => {
                setResendCooldown(prev => prev - 1);
            }, 1000);
        } else if (resendCooldown === 0 && timer) {
            clearInterval(timer);
        }
        return () => clearInterval(timer);
    }, [resendCooldown]);

    const handleResend = async () => {
        if (resendCooldown > 0) {
            toast.warn(`Please wait ${resendCooldown} seconds before requesting a new link.`, { toastId: 'resend-cooldown-warning' });
            return;
        }

        setResendEmailError('');
        const emailValidation = validateEmail(resendEmail);
        if (emailValidation) {
            setResendEmailError(emailValidation);
            toast.error("Please enter a valid email address.", { toastId: 'resend-email-validation-error' });
            return;
        }
        if (!resendEmail) {
            toast.info("Please provide your email to resend the verification link.", { toastId: 'resend-email-missing' });
            return;
        }

        setResendLoading(true); // Start loading animation on the resend button
        toast.dismiss();
        toast.info("Sending new verification link...", { autoClose: false, toastId: 'sending-resend-link' });

        const result = await resendEmailVerificationLink(resendEmail);
        setResendLoading(false); // Stop loading animation
        toast.dismiss('sending-resend-link');

        if (result.success) {
            setResendCooldown(RESEND_COOLDOWN_SECONDS);
        }
    };

    // Show full-screen loading spinner only if the global auth loading is true, or if actively verifying.
    if (authLoading || verificationStatus === 'verifying') {
        return <LoadingSpinner fullScreen />;
    }

    let displayTitle = '';
    let displayMessage = '';
    let showResendForm = false;

    if (verificationStatus === 'success') {
        displayTitle = 'Email Verified!';
        displayMessage = 'Your email has been successfully verified. You will be redirected shortly.';
    } else if (verificationStatus === 'error') {
        displayTitle = 'Verification Required / Failed';
        displayMessage = 'Your email address is not verified, or the link is invalid/expired. Please request a new verification link below.';
        showResendForm = true;
    } else {
        displayTitle = 'Checking Verification Status...';
        displayMessage = 'Please wait while we determine your email verification status.';
    }

    return (
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background min-h-screen">
            <div className="max-w-md w-full space-y-8 p-8 bg-cardBackground dark:bg-gray-800 rounded-lg shadow-xl border border-border dark:border-gray-700 text-center">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-textDefault dark:text-white">
                        {displayTitle}
                    </h2>
                    <p className="mt-2 text-center text-sm text-textSecondary dark:text-gray-400">
                        {displayMessage}
                    </p>
                </div>

                {showResendForm && (
                    <div className="mt-8 space-y-4">
                        <p className="text-textSecondary dark:text-gray-400">
                            If you haven't received a link or it expired, enter your email to get a new one:
                        </p>
                        <div>
                            <label htmlFor="resend-email" className="sr-only">
                                Your Email
                            </label>
                            <input
                                id="resend-email"
                                name="resend-email"
                                type="email"
                                required
                                className={`appearance-none relative block w-full px-3 py-2 border ${resendEmailError ? 'border-error' : 'border-border'} placeholder-gray-500 text-textDefault dark:text-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10`}
                                placeholder="Enter your email"
                                value={resendEmail}
                                onChange={(e) => { setResendEmail(e.target.value); setResendEmailError(''); }}
                                disabled={resendLoading}
                            />
                            {resendEmailError && <p className="mt-2 text-sm text-error text-center">{resendEmailError}</p>}
                        </div>
                        <div>
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resendLoading || resendCooldown > 0}
                                className="group relative w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[40px]" // Added min-h to maintain size
                            >
                                {resendLoading ? (
                                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-b-2 border-white"></span> // In-button spinner
                                ) : (
                                    resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Link'
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {(verificationStatus === 'success' || verificationStatus === 'error') && (
                    <div className="mt-6 text-center text-sm text-textSecondary dark:text-gray-400">
                        <p>Go to <Link to={ROUTES.LOGIN} className="text-primary hover:underline">Login Page</Link></p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default EmailVerificationPage;