// quickfix-website/server/routes/admin.js
const express = require('express');
const {
    getAdminDashboardStats,
    getUsers,
    getUser,
    updateUser,
    deleteUser,
    toggleUserNewsletterSubscription, // Import the new controller function
    getAllSubscriptions,
    updateSubscriptionStatusByAdmin,
    getSettings,
    manageSettings,
    getAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');
const {
    adminUpdateUserSchema,
    updateSettingSchema,
    createAnnouncementSchema,
    updateAnnouncementSchema,
    adminVerifyPaymentSchema,
    toggleNewsletterStatusSchema // NEW: Import this schema (we'll define it next)
} = require('../utils/validation');

const router = express.Router();

router.use(protect, authorize('admin'));

// --- Dashboard & Analytics ---
router.get('/dashboard-stats', getAdminDashboardStats);

// --- User Management ---
router.route('/users')
    .get(getUsers);
router.route('/users/:id')
    .get(getUser)
    .put(validate(adminUpdateUserSchema), updateUser)
    .delete(deleteUser);

// NEW: Route to toggle user's newsletter subscription status
router.put('/users/:id/newsletter-status', validate(toggleNewsletterStatusSchema), toggleUserNewsletterSubscription);


// --- Subscription Management ---
router.get('/subscriptions/all', getAllSubscriptions);
router.put('/subscriptions/:subscriptionId/status', validate(adminVerifyPaymentSchema, null), updateSubscriptionStatusByAdmin);


// --- Global Website Settings Management ---
router.route('/settings')
    .get(getSettings)
    .put(validate(updateSettingSchema), manageSettings);

// --- Announcement Management (from Admin Panel) ---
router.route('/announcements')
    .get(getAnnouncements)
    .post(validate(createAnnouncementSchema), createAnnouncement);
router.route('/announcements/:id')
    .put(validate(updateAnnouncementSchema), updateAnnouncement)
    .delete(deleteAnnouncement);


module.exports = router;