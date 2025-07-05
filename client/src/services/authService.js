// quickfix-website/client/src/services/authService.js
import api from '../utils/api';

// Authentication API calls
export const login = async (email, password) => {
    try {
        const response = await api.post('/auth/login', { email, password });
        return { success: true, data: response.data, message: response.data.message };
    } catch (error) {
        const message = error.response?.data?.message || 'Login failed. An unexpected error occurred.';
        console.error('Login error (authService):', error.response?.data || error.message);
        return { success: false, message, needsVerification: error.response?.status === 403 && message.includes('email address is not verified') }; // Added needsVerification flag
    }
};

export const register = async (username, email, password, confirmPassword, newsletterSubscriber) => {
    try {
        const response = await api.post('/auth/register', { username, email, password, confirmPassword, newsletterSubscriber });
        return { success: true, data: response.data, message: response.data.message, userId: response.data.userId };
    } catch (error) {
        const message = error.response?.data?.message || 'Registration failed. Please try again.';
        console.error('Registration error (authService):', error.response?.data || error.message);
        return { success: false, message };
    }
};

export const verifyEmail = async (token) => {
    try {
        const response = await api.get(`/auth/verify-email/${token}`);
        return { success: true, data: response.data, message: response.data.message };
    } catch (error) {
        const message = error.response?.data?.message || 'Email verification failed. The link might be invalid or expired.';
        console.error('Email verification error (authService):', error.response?.data || error.message);
        return { success: false, message };
    }
};

export const resendEmailVerificationLink = async (email) => {
    try {
        const response = await api.post('/auth/resend-verification-link', { email });
        return { success: true, data: response.data, message: response.data.message };
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to resend verification link. Please try again.';
        console.error('Resend verification link error (authService):', error.response?.data || error.message);
        return { success: false, message };
    }
};

export const logout = async () => {
    try {
        const response = await api.get('/auth/logout');
        return { success: true, message: response.data.message };
    } catch (error) {
        const message = error.response?.data?.message || 'Logout failed.';
        console.error('Logout error (authService):', error.response?.data || error.message);
        return { success: false, message };
    }
};

export const getUserProfile = async () => {
    try {
        const response = await api.get('/auth/profile');
        return { success: true, data: response.data };
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to fetch user profile.';
        console.error('Get user profile error (authService):', error.response?.data || error.message);
        return { success: false, message };
    }
};

export const updateProfile = async (userData) => {
    try {
        const response = await api.put('/auth/profile', userData);
        return { success: true, data: response.data, message: response.data.message };
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to update profile.';
        console.error('Update profile error (authService):', error.response?.data || error.message);
        return { success: false, message };
    }
};

export const forgotPassword = async (email) => {
    try {
        const response = await api.post('/auth/forgotpassword', { email });
        return { success: true, message: response.data.message };
    } catch (error) {
        const message = error.response?.data?.message || 'Password reset request failed.';
        console.error('Forgot password error (authService):', error.response?.data || error.message);
        return { success: false, message };
    }
};

export const resetPassword = async (token, password, confirmPassword) => {
    try {
        const response = await api.put(`/auth/resetpassword/${token}`, { password, confirmPassword });
        return { success: true, message: response.data.message };
    } catch (error) {
        const message = error.response?.data?.message || 'Password reset failed.';
        console.error('Reset password error (authService):', error.response?.data || error.message);
        return { success: false, message };
    }
};

export const toggleNewsletterSubscription = async () => {
    try {
        const response = await api.put('/auth/toggle-newsletter');
        return { success: true, message: response.data.message };
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to toggle newsletter subscription.';
        console.error('Toggle newsletter error (authService):', error.response?.data || error.message);
        return { success: false, message };
    }
};

export const adminLogin = async (email, password) => {
    try {
        const response = await api.post('/auth/login', { email, password });
        return { success: true, data: response.data, message: response.data.message };
    } catch (error) {
        const message = error.response?.data?.message || 'Admin login failed. Please check your credentials.';
        console.error('Admin login error (authService):', error.response?.data || error.message);
        return { success: false, message };
    }
};

export const adminRegister = async (username, email, password, role = 'admin') => {
    try {
        const response = await api.post('/auth/register', { username, email, password, role });
        return { success: true, data: response.data, message: response.data.message };
    } catch (error) {
        const message = error.response?.data?.message || 'Admin registration failed.';
        console.error('Admin registration error (authService):', error.response?.data || error.message);
        return { success: false, message };
    }
};