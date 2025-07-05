// quickfix-website/client/src/components/auth/Profile.js
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { validateUsername, validatePassword, validateConfirmPassword } from '../../utils/validation';
import LoadingSpinner from '../common/LoadingSpinner';
import { StarIcon, EnvelopeIcon } from '@heroicons/react/24/solid';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { ROUTES } from '../../utils/constants';
import { useNavigate } from 'react-router-dom';

// Import the default avatar image directly
import defaultAvatar from '../../assets/images/default-avatar.png'; // Correct path to your default avatar

function Profile() {
    const { user, loading, updateUser, toggleNewsletterSubscription, resendEmailVerificationLink, checkUserStatus } = useContext(AuthContext);
    const navigate = useNavigate();

    const [username, setUsername] = useState(user ? user.username : '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [profilePicture, setProfilePicture] = useState(user ? user.profilePicture : '');

    const [usernameError, setUsernameError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    // State for resend button cooldown
    const [resendCooldown, setResendCooldown] = useState(0);
    const RESEND_COOLDOWN_SECONDS = 60; // 1 minute cooldown

    // State to manage the displayed profile image source
    const [displayedProfilePicture, setDisplayedProfilePicture] = useState('');

    useEffect(() => {
        if (user) {
            setUsername(user.username);
            setProfilePicture(user.profilePicture);
            // Initialize the displayed profile picture when user data is available
            setDisplayedProfilePicture(user.profilePicture || defaultAvatar);
        }
    }, [user]);

    // Handle resend cooldown timer
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

    // Update displayed profile picture when profilePicture state changes
    useEffect(() => {
        setDisplayedProfilePicture(profilePicture || defaultAvatar);
    }, [profilePicture]);


    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    if (!user) {
        return <div className="text-center text-error">User data not found. Please log in.</div>;
    }

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();

        setUsernameError('');
        setPasswordError('');
        setConfirmPasswordError('');

        let hasError = false;
        const usernameValidation = validateUsername(username);
        if (usernameValidation) {
            setUsernameError(usernameValidation);
            hasError = true;
        }

        if (password) {
            const passwordValidation = validatePassword(password);
            const confirmPasswordValidation = validateConfirmPassword(password, confirmPassword);
            if (passwordValidation) {
                setPasswordError(passwordValidation);
                hasError = true;
            }
            if (confirmPasswordValidation) {
                setConfirmPasswordError(confirmPasswordValidation);
                hasError = true;
            }
        }

        if (hasError) {
            toast.error("Please correct the errors in the form.", { toastId: 'profile-validation-error' });
            return;
        }

        setFormLoading(true);
        const userData = {
            username,
            profilePicture,
        };
        if (password) {
            userData.password = password;
        }

        const success = await updateUser(userData);
        setFormLoading(false);

        if (success) {
            setPassword('');
            setConfirmPassword('');
            // If update successful, ensure displayed profile picture reflects the new URL or default
            setDisplayedProfilePicture(profilePicture || defaultAvatar);
        }
    };

    const handleToggleNewsletter = async () => {
        setFormLoading(true);
        const success = await toggleNewsletterSubscription();
        setFormLoading(false);
    };

    const handleResendVerificationLink = async () => {
        if (resendCooldown > 0) {
            toast.warn(`Please wait ${resendCooldown} seconds before requesting a new link.`, { toastId: 'resend-cooldown-profile-warning' });
            return;
        }
        setFormLoading(true);
        toast.info("Sending new verification link...", { autoClose: false, toastId: 'sending-resend-link' });
        const result = await resendEmailVerificationLink(user.email);
        setFormLoading(false);
        toast.dismiss('sending-resend-link');

        if (result.success) {
            setResendCooldown(RESEND_COOLDOWN_SECONDS);
        }
    };

    const handleVerifyButtonCheck = async () => {
        setFormLoading(true);
        await checkUserStatus();
        setFormLoading(false);
        if (user.emailVerified) {
            toast.success("Your account is already verified!", { toastId: 'profile-already-verified-toast' });
        } else {
            toast.info("Your account is still unverified. Please check your email for a verification link.", { toastId: 'profile-still-unverified-toast', autoClose: false, closeButton: true });
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 bg-background">
            <div className="max-w-3xl mx-auto bg-cardBackground dark:bg-gray-800 rounded-lg shadow-xl p-8 border border-border dark:border-gray-700">
                <h2 className="text-3xl font-extrabold text-textDefault dark:text-white mb-6 text-center">Your Profile</h2>

                <div className="flex flex-col items-center mb-8">
                    <img
                        src={displayedProfilePicture} // Use the state variable for the displayed image source
                        alt="Profile"
                        className="w-28 h-28 rounded-full object-cover border-4 border-primary dark:border-primary-light shadow-md"
                        onError={(e) => { // Add onError event handler
                            e.target.src = defaultAvatar; // Fallback to default avatar on error
                        }}
                    />
                    <h3 className="text-2xl font-semibold mt-4 text-textDefault dark:text-white">
                        {user.username}
                        {user.isPremium && (
                            <StarIcon className="h-5 w-5 inline-block ml-2 text-accent" title="Premium Member" />
                        )}
                    </h3>
                    <p className="text-md text-textSecondary dark:text-gray-400">{user.email}</p>
                    <span className={`px-3 py-1 mt-2 text-sm font-medium rounded-full ${user.role === 'admin' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                        {user.role.toUpperCase()}
                    </span>

                    {true && (
                        <div className={`mt-4 p-3 rounded-lg flex items-center space-x-2 w-full max-w-sm ${user.emailVerified ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-300'}`}>
                            {user.emailVerified ? (
                                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                            ) : (
                                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                            )}
                            <span className="font-medium">
                                Email Status: {user.emailVerified ? 'Verified' : 'Not Verified'}
                            </span>
                            {!user.emailVerified && (
                                <button
                                    onClick={handleVerifyButtonCheck}
                                    disabled={formLoading}
                                    className="ml-auto px-3 py-1 bg-primary text-white text-xs rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {formLoading ? 'Checking...' : 'Check Status'}
                                </button>
                            )}
                        </div>
                    )}

                    {!user.emailVerified && (
                        <div className="mt-4 w-full max-w-sm p-4 bg-red-100 dark:bg-red-800/20 border border-red-200 dark:border-red-700 rounded-lg text-red-800 dark:text-red-300 text-sm text-center">
                            <EnvelopeIcon className="h-5 w-5 inline-block mr-2" />
                            Your account is not verified. Please check your email for a verification link or
                            <button
                                onClick={handleResendVerificationLink}
                                disabled={formLoading || resendCooldown > 0}
                                className="ml-2 font-semibold text-red-800 dark:text-red-300 hover:underline disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'resend link'}
                            </button>
                            .
                            <br />
                            <p className="mt-2 text-xs text-red-700 dark:text-red-400">
                                (Verification is required to purchase Premium plans.)
                            </p>
                        </div>
                    )}
                </div>

                <form onSubmit={handleUpdateSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-textDefault dark:text-white mb-1">Username</label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => { setUsername(e.target.value); setUsernameError(''); }}
                                className={`w-full p-3 border ${usernameError ? 'border-error' : 'border-border'} rounded-md dark:bg-gray-700 dark:text-white focus:ring-primary focus:border-primary`}
                                disabled={formLoading}
                            />
                            {usernameError && <p className="mt-1 text-sm text-error">{usernameError}</p>}
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-textDefault dark:text-white mb-1">Email</label>
                            <input
                                type="email"
                                id="email"
                                value={user.email}
                                disabled
                                className="w-full p-3 border border-border rounded-md bg-gray-100 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed"
                            />
                            <p className="mt-1 text-xs text-textSecondary dark:text-gray-500">Email cannot be changed from here.</p>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="profilePicture" className="block text-sm font-medium text-textDefault dark:text-white mb-1">Profile Picture URL</label>
                        <input
                            type="text"
                            id="profilePicture"
                            value={profilePicture}
                            onChange={(e) => setProfilePicture(e.target.value)}
                            className="w-full p-3 border border-border rounded-md dark:bg-gray-700 dark:text-white focus:ring-primary focus:border-primary"
                            placeholder="e.g., https://example.com/your-image.jpg"
                            disabled={formLoading}
                        />
                        <p className="mt-1 text-xs text-textSecondary dark:text-gray-500">
                            Provide a direct URL to your profile image.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-textDefault dark:text-white mb-1">New Password (optional)</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                                className={`w-full p-3 border ${passwordError ? 'border-error' : 'border-border'} rounded-md dark:bg-gray-700 dark:text-white focus:ring-primary focus:border-primary`}
                                placeholder="Leave blank to keep current"
                                disabled={formLoading}
                            />
                            {passwordError && <p className="mt-1 text-sm text-error">{passwordError}</p>}
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-textDefault dark:text-white mb-1">Confirm New Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => { setConfirmPassword(e.target.value); setConfirmPasswordError(''); }}
                                className={`w-full p-3 border ${confirmPasswordError ? 'border-error' : 'border-border'} rounded-md dark:bg-gray-700 dark:text-white focus:ring-primary focus:border-primary`}
                                placeholder="Confirm new password"
                                disabled={formLoading}
                            />
                            {confirmPasswordError && <p className="mt-1 text-sm text-error">{confirmPasswordError}</p>}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={formLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {formLoading ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                'Update Profile'
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-8 border-t border-border dark:border-gray-700 pt-6">
                    <h3 className="text-2xl font-semibold text-textDefault dark:text-white mb-4">Newsletter Subscription</h3>
                    <div className="flex items-center justify-between">
                        <p className="text-textSecondary dark:text-gray-400">
                            {user.newsletterSubscriber ? 'You are currently subscribed to our newsletter.' : 'You are not subscribed to our newsletter.'}
                        </p>
                        <button
                            onClick={handleToggleNewsletter}
                            disabled={formLoading}
                            className={`px-4 py-2 rounded-md text-white font-medium shadow-sm transition-colors duration-200 ${user.newsletterSubscriber ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {formLoading ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                user.newsletterSubscriber ? 'Unsubscribe' : 'Subscribe'
                            )}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Profile;