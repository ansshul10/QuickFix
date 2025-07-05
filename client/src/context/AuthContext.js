// quickfix-website/client/src/context/AuthContext.js
import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import * as authService from '../services/authService';
import { toast } from 'react-toastify';
import logger from '../utils/logger';
import { SettingsContext } from './SettingsContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../utils/constants';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // `loading` state here represents the *global* authentication loading,
    // like initial app boot-up, or background checks.
    // Individual forms will manage their `formLoading` state.
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Initial loading state for app boot
    const { settings, loadingSettings } = useContext(SettingsContext);
    const navigate = useNavigate();

    const logout = useCallback(async (silent = false) => {
        // No need to set `setLoading(true)` here, as it's typically a user-initiated action
        // from a button that will have its own `formLoading` state.
        try {
            const result = await authService.logout();
            setUser(null);
            toast.dismiss('login-success');
            if (!silent) {
                toast.success(result.message || 'Logged out successfully!', { toastId: 'logout-success' });
                navigate(ROUTES.HOME, { replace: true });
            }
            return { success: true }; // Indicate success for UI handling
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            if (!silent) {
                toast.error(errorMessage || 'Logout failed.', { toastId: 'logout-error' });
            }
            logger.error('Logout error:', errorMessage);
            return { success: false, message: errorMessage }; // Indicate failure for UI handling
        }
        // No `finally` block for setLoading(false) as it's not a global app loading state controlled by this action
    }, [navigate]);

    const checkUserStatus = useCallback(async () => {
        // This is primarily for background re-validation of user session.
        // It should not set `loading` to true globally, as it runs periodically or on route changes.
        // The `App.js` component will control the initial `loading` state.
        try {
            const res = await authService.getUserProfile();
            setUser(res.data);
            logger.info('User session re-validated:', res.data.username);
        } catch (error) {
            setUser(null);
            if (error.response && error.response.status !== 401) {
                logger.error('Failed to validate user session (non-401 error):', error.response?.data?.message || error.message);
            } else {
                logger.debug('No active session found (401 on /auth/profile).');
            }
        } finally {
            // This is the correct place to set `setLoading(false)` for the *initial* app load.
            // Subsequent calls to `checkUserStatus` (e.g., from profile page) won't trigger full screen.
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // This runs once on mount to check initial user status
        checkUserStatus();
    }, [checkUserStatus]);

    useEffect(() => {
        // Maintenance mode check still relies on global loading and user state
        if (!loadingSettings && settings?.websiteMaintenanceMode && user && user.role !== 'admin') {
            toast.warn(settings?.globalAnnouncement || "Website is currently under maintenance. You have been logged out.", { autoClose: false, closeButton: true, toastId: 'maintenance-logout' });
            logout(true);
        }
    }, [settings, loadingSettings, user, logout]);

    const login = async (email, password) => {
        // `setLoading(true)` for the main AuthContext loading is not needed here
        // as the Login component manages its own `formLoading` state for the button.
        try {
            const result = await authService.login(email, password);
            if (result.success) {
                setUser(result.data);
                if (result.data.emailVerified || !settings?.enableEmailVerification) {
                    toast.success(`Welcome back, ${result.data.username}!`, { toastId: 'login-success' });
                    const from = window.location.pathname.includes(ROUTES.LOGIN) ? ROUTES.PROFILE : window.location.pathname;
                    navigate(from, { replace: true });
                } else {
                    toast.info(`Welcome back, ${result.data.username}! Your email is not verified. Check your profile for verification status and options.`, { toastId: 'login-unverified', autoClose: false, closeButton: true });
                    navigate(ROUTES.PROFILE, { replace: true });
                }
                return { success: true, user: result.data };
            } else {
                if (result.message && result.message.includes('email address is not verified')) {
                    toast.info(result.message, { toastId: 'login-email-unverified', autoClose: false, closeButton: true });
                    return { success: false, message: result.message, needsVerification: true };
                } else {
                    toast.error(result.message || 'Login failed. Please check your credentials.', { toastId: 'login-error' });
                    return { success: false, message: result.message };
                }
            }
        } catch (error) {
            logger.error('Login API call failed (AuthContext):', error.message, error.response?.data);
            const message = error.response?.data?.message || 'Login failed due to an unexpected error.';
            return { success: false, message, needsVerification: error.response?.status === 403 && message.includes('email address is not verified') };
        }
        // No finally block for setLoading(false) here, as form component will handle it.
    };

    const register = async (username, email, password, confirmPassword, newsletterSubscriber) => {
        // Same as login, register component manages its own formLoading.
        try {
            const result = await authService.register(username, email, password, confirmPassword, newsletterSubscriber);

            if (result.success) {
                setUser(result.data);
                if (settings?.enableEmailVerification) {
                    toast.success(`Welcome, ${result.data.username}! Your account has been created. Please check your email (${email}) for a verification link to unlock full features.`, { toastId: 'register-success-verify', autoClose: false, closeButton: true });
                    navigate(ROUTES.PROFILE, { replace: true });
                } else {
                    toast.success(`Registration successful! Welcome, ${username}!`, { toastId: 'register-success-direct' });
                    navigate(ROUTES.PROFILE, { replace: true });
                }
                return { success: true, user: result.data, message: result.message };
            } else {
                toast.error(result.message || 'Registration failed. Please try again.', { toastId: 'register-error' });
                return { success: false, message: result.message };
            }
        } catch (error) {
            logger.error('Registration API call failed (AuthContext):', error.message, error.response?.data);
            const message = error.response?.data?.message || 'Registration failed due to an unexpected error.';
            return { success: false, message };
        }
        // No finally block for setLoading(false) here.
    };


    const verifyEmail = async (token) => {
        setLoading(true); // Keep this global loading as it's a critical app flow redirect
        try {
            const result = await authService.verifyEmail(token);
            if (result.success) {
                setUser(result.data);
                toast.success(result.message || 'Email verified successfully! You are now logged in.', { toastId: 'email-verify-success' });
                navigate(ROUTES.PROFILE, { replace: true });
                return { success: true, user: result.data };
            } else {
                toast.error(result.message || 'Email verification failed. The link might be invalid or expired.', { toastId: 'email-verify-error' });
                return { success: false, message: result.message };
            }
        } catch (error) {
            logger.error('Email verification API call failed (AuthContext):', error.message, error.response?.data);
            const message = error.response?.data?.message || 'Email verification failed due to an unexpected error.';
            return { success: false, message };
        } finally {
            setLoading(false); // Resolve global loading
        }
    };

    const resendEmailVerificationLink = async (email) => {
        // This is called from a component with its own formLoading, so no global setLoading here.
        try {
            const result = await authService.resendEmailVerificationLink(email);
            if (result.success) {
                toast.info(result.message || 'New verification link sent to your email. Please check your inbox.', { toastId: 'resend-link-success' });
                return { success: true };
            } else {
                toast.error(result.message || 'Failed to resend verification link. Please try again.', { toastId: 'resend-link-error' });
                return { success: false, message: result.message };
            }
        } catch (error) {
            logger.error('Resend verification link API call failed (AuthContext):', error.message, error.response?.data);
            const message = error.response?.data?.message || 'Failed to resend verification link due to an unexpected error.';
            return { success: false, message };
        }
    };

    const updateUser = async (userData) => {
        // This is called from Profile component with its own formLoading.
        try {
            const result = await authService.updateProfile(userData);
            if (result.success) {
                setUser(result.data);
                toast.success(result.message || 'Profile updated successfully!', { toastId: 'profile-update-success' });
                return true;
            } else {
                toast.error(result.message || 'Failed to update profile.', { toastId: 'profile-update-error' });
                return false;
            }
        } catch (error) {
            logger.error('Profile update API call failed (AuthContext):', error.message, error.response?.data);
            const message = error.response?.data?.message || 'Profile update failed due to an unexpected error.';
            return false;
        }
    };

    const forgotPassword = async (email) => {
        // This is called from ForgotPassword component with its own formLoading.
        try {
            const result = await authService.forgotPassword(email);
            if (result.success) {
                toast.info(result.message || 'Password reset email sent. Check your inbox.', { toastId: 'forgot-password-success' });
                return { success: true, message: result.message };
            } else {
                toast.error(result.message || 'Password reset request failed.', { toastId: 'forgot-password-error' });
                return { success: false, message: result.message };
            }
        } catch (error) {
            logger.error('Forgot password API call failed (AuthContext):', error.message, error.response?.data);
            const message = error.response?.data?.message || 'Forgot password failed due to an unexpected error.';
            return { success: false, message };
        }
    };

    const resetPassword = async (token, password, confirmPassword) => {
        // This is called from ResetPassword component with its own formLoading.
        try {
            const result = await authService.resetPassword(token, password, confirmPassword);
            if (result.success) {
                await checkUserStatus(); // Re-fetch user status after reset to update context
                toast.success(result.message || 'Password has been reset and you are logged in!', { toastId: 'reset-password-success' });
                return { success: true, message: result.message };
            } else {
                toast.error(result.message || 'Password reset failed.', { toastId: 'reset-password-error' });
                return { success: false, message: result.message };
            }
        } catch (error) {
            logger.error('Reset password API call failed (AuthContext):', error.message, error.response?.data);
            const message = error.response?.data?.message || 'Password reset failed due to an unexpected error.';
            return { success: false, message };
        }
    };

    const toggleNewsletterSubscription = async () => {
        // This is called from Profile component with its own formLoading.
        try {
            const result = await authService.toggleNewsletterSubscription();
            if (result.success) {
                setUser(prevUser => ({ ...prevUser, newsletterSubscriber: !prevUser.newsletterSubscriber }));
                toast.success(result.message, { toastId: 'newsletter-toggle-success' });
                return true;
            } else {
                toast.error(result.message || 'Failed to toggle newsletter subscription.', { toastId: 'newsletter-toggle-error' });
                return false;
            }
        } catch (error) {
            logger.error('Newsletter toggle API call failed (AuthContext):', error.message, error.response?.data);
            const message = error.response?.data?.message || 'Newsletter toggle failed due to an unexpected error.';
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading, // This `loading` is for initial app/auth status, not per-action loading.
            login,
            register,
            verifyEmail,
            resendEmailVerificationLink,
            logout,
            updateUser,
            forgotPassword,
            resetPassword,
            toggleNewsletterSubscription,
            checkUserStatus
        }}>
            {children}
        </AuthContext.Provider>
    );
};