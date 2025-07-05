// quickfix-website/client/src/utils/constants.js

export const USER_ROLES = {
    USER: 'user',
    ADMIN: 'admin',
};

export const GUIDE_PREMIUM_STATUS = {
    FREE: false,
    PREMIUM: true,
};

export const NOTIFICATION_TYPES = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    SUCCESS: 'success',
    SYSTEM: 'system',
    GUIDE_UPDATE: 'guide_update',
    ANNOUNCEMENT: 'announcement',
    SUBSCRIPTION: 'subscription',
};

export const SUBSCRIPTION_STATUSES = {
    INITIATED: 'initiated',
    PENDING_MANUAL_VERIFICATION: 'pending_manual_verification',
    ACTIVE: 'active',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired',
    FAILED: 'failed',
    NONE: 'none',
};

export const ANNOUNCEMENT_TYPES = {
    INFO: 'info',
    WARNING: 'warning',
    URGENT: 'urgent',
    NEW_FEATURE: 'new_feature',
    MAINTENANCE: 'maintenance',
};

export const PAGINATION_DEFAULTS = {
    PAGE_SIZE: 10,
    PAGE_NUMBER: 1,
};

// Frontend route paths
export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgotpassword',
    RESET_PASSWORD: '/resetpassword/:resettoken',
    // UPDATED: Changed from OTP_VERIFICATION to EMAIL_VERIFICATION and updated path
    EMAIL_VERIFICATION: '/verify-email/:token',
    PROFILE: '/profile',
    GUIDES: '/guides',
    GUIDE_DETAIL: '/guides/:slug',
    ABOUT: '/about',
    CONTACT: '/contact',
    PREMIUM: '/premium',
    NOTIFICATIONS: '/notifications',
    PRIVACY_POLICY: '/privacy-policy',
    COOKIE_POLICY: '/cookie-policy',
    ADMIN_DASHBOARD: '/admin-dashboard',
    ADMIN_USERS: '/admin-dashboard/users',
    ADMIN_GUIDES: '/admin-dashboard/guides',
    ADMIN_CATEGORIES: '/admin-dashboard/categories',
    ADMIN_ANALYTICS: '/admin-dashboard/analytics', // Assuming analytics page exists
    ADMIN_SETTINGS: '/admin-dashboard/settings',
    ADMIN_ANNOUNCEMENTS: '/admin-dashboard/announcements',
    ADMIN_NEWSLETTER: '/admin-dashboard/newsletter',
    ADMIN_SUBSCRIPTIONS: '/admin-dashboard/subscriptions',
    ADMIN_USER_HELP: '/admin-dashboard/user-help', // NEW ROUTE FOR USER HELP
    SEARCH_RESULTS: '/search-results',
    NOT_FOUND: '*'
};

// Cookie names
export const COOKIE_NAMES = {
    COOKIE_CONSENT: 'quickfix_cookie_consent',
    THEME: 'quickfix_theme',
};
