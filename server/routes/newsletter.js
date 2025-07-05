// quickfix-website/server/routes/newsletter.js
const express = require('express');
const {
    subscribeToNewsletter,
    unsubscribeFromNewsletter,
    getNewsletterSubscribers,
    getNewsletterSubscriberByEmail, // Ensure this is imported
    sendBulkNewsletterEmail,
    sendIndividualNewsletterEmail
} = require('../controllers/newsletterController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware'); // This needs to be the UPDATED one
const {
    subscribeNewsletterSchema,
    sendEmailSchema,
    getSubscriberByEmailSchema // Ensure this is imported
} = require('../utils/validation');

const router = express.Router();

// Public routes for newsletter subscription/unsubscription
router.post('/subscribe', validate(subscribeNewsletterSchema), subscribeToNewsletter);
router.post('/unsubscribe', validate(subscribeNewsletterSchema), unsubscribeFromNewsletter);

// Admin-only routes for newsletter management and bulk/individual emails
router.get('/admin/subscribers', protect, authorize('admin'), getNewsletterSubscribers);
// FIX IS HERE: Pass null for bodySchema, and getSubscriberByEmailSchema for paramSchema
router.get('/admin/subscribers/:email', protect, authorize('admin'), validate(null, getSubscriberByEmailSchema), getNewsletterSubscriberByEmail);
router.post('/admin/bulk-send', protect, authorize('admin'), validate(sendEmailSchema), sendBulkNewsletterEmail);
router.post('/admin/send-individual', protect, authorize('admin'), validate(sendEmailSchema), sendIndividualNewsletterEmail);

module.exports = router;