// quickfix-website/server/utils/constants.js
// This file can define constants used across your backend, including for notifications.

module.exports = {
    NOTIFICATION_TYPES: {
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info',
        SYSTEM: 'system',
        GUIDE_UPDATE: 'guide_update',
        ANNOUNCEMENT: 'announcement',
        SUBSCRIPTION: 'subscription',
        ACCOUNT_VERIFICATION: 'account_verification', // New type for email verification notifications <--- ADDED
    },
    
    // Add other constants you might have, e.g., for subscription statuses
    SUBSCRIPTION_STATUSES: {
        INITIATED: 'initiated',
        PENDING_MANUAL_VERIFICATION: 'pending_manual_verification',
        ACTIVE: 'active',
        CANCELLED: 'cancelled',
        EXPIRED: 'expired',
        FAILED: 'failed',
        NONE: 'none' // Custom status for no subscription record
    },

    // Define backend-relevant routes for linking in notifications/emails
    ROUTES: {
        HOME: '/',
        LOGIN: '/login',
        PROFILE: '/profile',
        VERIFY_EMAIL: '/verify-email', // Frontend route for verification page
        PREMIUM: '/premium'
        // Add other routes as needed
    }
};