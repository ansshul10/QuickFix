const express = require('express');
const {
    registerUser,
    verifyEmail, // Renamed from verifyOtp
    resendEmailVerificationLink, // Renamed from resendOtp
    loginUser,
    logoutUser,
    getUserProfile,
    updateUserProfile,
    forgotPassword,
    resetPassword,
    toggleNewsletterSubscription
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware'); // Assuming this is the custom validate middleware
const {
    registerSchema,
    emailVerificationSchema, // New schema for email verification link
    resendEmailVerificationLinkSchema, // New schema for resending link
    loginSchema,
    updateUserProfileSchema,
    forgotPasswordSchema,
    resetPasswordSchema
} = require('../utils/validation');
const { authLimiter, otpLimiter } = require('../middleware/rateLimitMiddleware'); // otpLimiter can be reused for email verification links

const router = express.Router();

// Public Authentication Routes
router.post('/register', authLimiter, validate(registerSchema), registerUser);
// New route for email verification via link
router.get('/verify-email/:token', otpLimiter, validate(null, emailVerificationSchema), verifyEmail); // No body, only params
router.post('/resend-verification-link', otpLimiter, validate(resendEmailVerificationLinkSchema), resendEmailVerificationLink);
router.post('/login', authLimiter, validate(loginSchema), loginUser);

router.post('/forgotpassword', otpLimiter, validate(forgotPasswordSchema), forgotPassword);
router.put('/resetpassword/:resettoken', validate(resetPasswordSchema), resetPassword);

// Protected Authentication Routes (requires logged-in user)
router.get('/logout', protect, logoutUser);
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, validate(updateUserProfileSchema), updateUserProfile);

router.put('/toggle-newsletter', protect, toggleNewsletterSubscription);


module.exports = router;
