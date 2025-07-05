import api from '../utils/api';
import { toast } from 'react-toastify'; // Keep toast import for toast.success/info

const adminService = {
    getAdminDashboardStats: async () => {
        try {
            const response = await api.get('/admin/dashboard-stats');
            return response.data;
        } catch (error) {
            // REMOVED toast.error(errorMessage);
            console.error('Get admin dashboard stats error:', error);
            throw error; // Re-throw so api.js interceptor can handle toast if needed
        }
    },

    // Settings management
    getAdminWebsiteSettings: async () => {
        try {
            const response = await api.get('/admin/settings');
            return response.data;
        } catch (error) {
            // REMOVED toast.error(errorMessage);
            console.error('Get admin website settings error:', error);
            throw error;
        }
    },

    updateWebsiteSetting: async (settingName, settingValue, description = null) => {
        try {
            const response = await api.put('/admin/settings', { settingName, settingValue, description });
            toast.success(response.data.message || 'Website setting updated successfully!'); // Keep success toast
            return response.data;
        } catch (error) {
            // REMOVED toast.error(errorMessage);
            console.error('Update website setting error:', error);
            throw error;
        }
    },

    // User management
    getAllUsers: async (filters = {}) => {
        const { keyword, role, isPremium, active, pageNumber, pageSize } = filters;
        try {
            const response = await api.get('/admin/users', {
                params: { keyword, role, isPremium, active, pageNumber, pageSize }
            });
            return response.data;
        } catch (error) {
            // REMOVED toast.error(errorMessage);
            console.error('Get all users error:', error);
            throw error;
        }
    },

    getUserById: async (id) => {
        try {
            const response = await api.get(`/admin/users/${id}`);
            return response.data;
        } catch (error) {
            // REMOVED toast.error(errorMessage);
            console.error('Get user by ID error:', error);
            throw error;
        }
    },

    updateUserByAdmin: async (id, userData) => {
        try {
            const response = await api.put(`/admin/users/${id}`, userData);
            toast.success(response.data.message || 'User updated successfully!'); // Keep success toast
            return response.data;
        } catch (error) {
            // REMOVED toast.error(errorMessage);
            console.error('Update user by admin error:', error);
            throw error;
        }
    },

    deleteUserByAdmin: async (id) => {
        try {
            const response = await api.delete(`/admin/users/${id}`);
            toast.success(response.data.message || 'User deleted successfully!'); // Keep success toast
            return response.data;
        } catch (error) {
            // REMOVED toast.error(errorMessage);
            console.error('Delete user by admin error:', error);
            throw error;
        }
    },

    updateUserNewsletterStatusByAdmin: async (userId, newStatus) => {
        try {
            const response = await api.put(`/admin/users/${userId}/newsletter-status`, {
                newsletterSubscriber: newStatus
            });
            toast.success(response.data.message || 'User newsletter status updated successfully!'); // Keep success toast
            return response.data;
        } catch (error) {
            // REMOVED toast.error(errorMessage);
            console.error('Update user newsletter status error:', error);
            throw error;
        }
    },

    // Announcement management
    getAdminAnnouncements: async () => {
        try {
            const response = await api.get('/admin/announcements');
            return response.data;
        } catch (error) {
            // REMOVED toast.error(errorMessage);
            console.error('Get admin announcements error:', error);
            throw error;
        }
    },

    createAnnouncement: async (announcementData) => {
        try {
            const response = await api.post('/admin/announcements', announcementData);
            toast.success(response.data.message || 'Announcement created successfully!'); // Keep success toast
            return response.data;
        } catch (error) {
            // REMOVED toast.error(errorMessage);
            console.error('Create announcement error:', error);
            throw error;
        }
    },

    updateAnnouncement: async (id, announcementData) => {
        try {
            const response = await api.put(`/admin/announcements/${id}`, announcementData);
            toast.success(response.data.message || 'Announcement updated successfully!'); // Keep success toast
            return response.data;
        } catch (error) {
            // REMOVED toast.error(errorMessage);
            console.error('Update announcement error:', error);
            throw error;
        }
    },

    deleteAnnouncement: async (id) => {
        try {
            const response = await api.delete(`/admin/announcements/${id}`);
            toast.success(response.data.message || 'Announcement deleted successfully!'); // Keep success toast
            return response.data;
        } catch (error) {
            // REMOVED toast.error(errorMessage);
            console.error('Delete announcement error:', error);
            throw error;
        }
    },

    // Newsletter management
    getNewsletterSubscribers: async ({ pageNumber = 1, pageSize, keyword = '' }) => {
        try {
            const response = await api.get('/newsletter/admin/subscribers', {
                params: { page: pageNumber, limit: pageSize, keyword }
            });
            return response.data;
        } catch (error) {
            // REMOVED toast.error(errorMessage);
            console.error('Get newsletter subscribers error:', error);
            throw error;
        }
    },

    sendBulkNewsletterEmail: async (subject, htmlContent) => {
        try {
            const response = await api.post('/newsletter/admin/bulk-send', { subject, htmlContent });
            toast.success(response.data.message || 'Bulk email sent successfully!'); // Keep success toast
            return response.data;
        } catch (error) {
            // REMOVED toast.error(errorMessage);
            console.error('Send bulk newsletter email error:', error);
            throw error;
        }
    },

    sendIndividualNewsletterEmail: async (email, subject, htmlContent) => {
        try {
            const response = await api.post('/newsletter/admin/send-individual', { email, subject, htmlContent });
            toast.success(response.data.message || 'Individual email sent successfully!'); // Keep success toast
            return response.data;
        } catch (error) {
            // REMOVED toast.error(errorMessage);
            console.error('Send individual newsletter email error:', error);
            throw error;
        }
    },

    // Subscription Management (updated for server-side changes)
    getAllSubscriptionsForAdmin: async (filters = {}) => {
        const { pageNumber, pageSize, status, userId, transactionId, referenceCode, plan } = filters;
        try {
            const response = await api.get('/admin/subscriptions/all', {
                params: {
                    pageNumber,
                    pageSize,
                    status,
                    userId,
                    transactionId,
                    referenceCode,
                    plan
                }
            });
            return response.data;
        } catch (error) {
            // REMOVED toast.error(errorMessage);
            console.error('Fetch all subscriptions (admin) error:', error);
            throw error;
        }
    },

    // Refined to match server-side adminVerifyPaymentSchema
    updateSubscriptionStatusByAdmin: async (subscriptionId, newStatus, adminNotes = '') => {
        try {
            const response = await api.put(`/admin/subscriptions/${subscriptionId}/status`, {
                status: newStatus,
                adminNotes
            });
            toast.success(response.data.message || 'Subscription status updated successfully!'); // Keep success toast
            return response.data;
        } catch (error) {
            // REMOVED toast.error(errorMessage);
            console.error('Update subscription status (admin) error:', error);
            throw error;
        }
    }
};

export default adminService;