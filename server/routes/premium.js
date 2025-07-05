// quickfix-website/server/routes/premium.js
const express = require('express');
const {
    getPremiumFeatures,
    submitUpiPaymentConfirmation,
    uploadPaymentScreenshot,
    cancelSubscription,
    getSubscriptionStatus
} = require('../controllers/premiumController');
const { protect, authorize } = require('../middleware/authMiddleware'); // authMiddleware for protect/authorize
const validate = require('../middleware/validationMiddleware'); // validationMiddleware for Joi schemas
const {
    submitUpiPaymentConfirmationSchema,
    uploadScreenshotSchema
} = require('../utils/validation');

// Import upload middleware from premiumController directly (or create a separate middleware file)
const { upload } = require('../controllers/premiumController'); // Assuming upload is exported

const router = express.Router();

// --- PUBLIC ROUTES (No authentication/authorization middleware) ---
// This route should be accessible to anyone to see premium plans and pricing.
router.get('/features', getPremiumFeatures);

// --- PROTECTED ROUTES (Require authentication - user must be logged in) ---
// Apply the 'protect' middleware to all routes below this line
// Any route defined after this 'router.use(protect)' will require a logged-in user.
router.use(protect); // This protects all subsequent routes in this router

router.post('/confirm-manual-payment',
    validate(submitUpiPaymentConfirmationSchema),
    submitUpiPaymentConfirmation
);

router.post('/upload-screenshot',
    upload.single('screenshot'), // Multer middleware to handle file upload
    validate(uploadScreenshotSchema, null), // Validation for the body (subscriptionId)
    uploadPaymentScreenshot
);

router.post('/cancel', cancelSubscription); // Already protected by router.use(protect) above
router.get('/status', getSubscriptionStatus); // Already protected by router.use(protect) above

module.exports = router;