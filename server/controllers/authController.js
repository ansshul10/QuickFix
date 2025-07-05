// quickfix-website/server/controllers/authController.js
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const Notification = require('../models/Notification');
const generateToken = require('../config/jwt');
const { setCookie } = require('../utils/cookieHandler');
const logger = require('../utils/logger');
const AppError = require('../utils/appError');
const { sendEmail, loadTemplate } = require('../config/email');
const crypto = require('crypto');
const Settings = require('../models/Settings');
const { NOTIFICATION_TYPES, ROUTES } = require('../utils/constants');
const { sendNotificationToUser } = require('../services/notificationService');


// Helper to get a setting value from the database
const getSetting = async (name, defaultValue) => {
    const setting = await Settings.findOne({ settingName: name });
    return setting ? setting.settingValue : defaultValue;
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res, next) => {
    const { username, email, password, newsletterSubscriber } = req.body;

    const allowRegistration = await getSetting('allowRegistration', true);
    if (!allowRegistration) {
        return next(new AppError('Registration is currently disabled. Please try again later.', 403));
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
        // If user exists with this email but is not verified, and verification is enabled
        if (userExists.email === email && !userExists.emailVerified && await getSetting('enableEmailVerification', false)) {
             // Check last sent time to prevent spamming
            const minResendInterval = 60 * 1000; // 1 minute
            if (userExists.lastVerificationEmailSent && (Date.now() - userExists.lastVerificationEmailSent.getTime() < minResendInterval)) {
                return next(new AppError('An account with this email already exists and is unverified. A verification link was recently sent. Please check your inbox or wait a minute before requesting another.', 429));
            }

            const verificationToken = userExists.getEmailVerificationToken(); // Generates new token, updates expiry
            userExists.lastVerificationEmailSent = Date.now(); // Update timestamp
            await userExists.save({ validateBeforeSave: false }); // Save user with new token and updated timestamp

            const verificationURL = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
            const emailVerificationHtml = loadTemplate('emailVerification', {
                username: userExists.username,
                verificationUrl: verificationURL,
                verification_expire_hours: process.env.EMAIL_VERIFICATION_EXPIRE_HOURS || 24,
                currentYear: new Date().getFullYear()
            });

            await sendEmail({
                email: userExists.email,
                subject: 'QuickFix: Your Account Needs Verification',
                html: emailVerificationHtml,
                text: `Your account needs verification. Please verify your email by clicking this link: ${verificationURL}. This link is valid for ${process.env.EMAIL_VERIFICATION_EXPIRE_HOURS || 24} hours.`
            });
            logger.info(`Resent verification link to existing unverified user: ${userExists.email}`);

            return next(new AppError('An account with this email already exists and is not verified. A new verification link has been sent to your email.', 400));
        }
        return next(new AppError('User with that email or username already exists. Please log in or use a different email/username.', 400));
    }

    const enableEmailVerification = await getSetting('enableEmailVerification', false);

    let user;
    if (enableEmailVerification) {
        // Create user as unverified but also log them in directly
        user = await User.create({ username, email, password, emailVerified: false, newsletterSubscriber, lastVerificationEmailSent: Date.now() });

        const verificationToken = user.getEmailVerificationToken();
        await user.save({ validateBeforeSave: false }); // Save with new token and updated timestamp

        const verificationURL = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
        logger.debug(`[DEBUG] registerUser: Verification URL generated: ${verificationURL}`);

        const emailVerificationHtml = loadTemplate('emailVerification', {
            username: user.username,
            verificationUrl: verificationURL,
            verification_expire_hours: process.env.EMAIL_VERIFICATION_EXPIRE_HOURS || 24,
            currentYear: new Date().getFullYear()
        });

        await sendEmail({
            email: user.email,
            subject: 'QuickFix: Verify Your Email Address to Complete Registration',
            html: emailVerificationHtml,
            text: `Welcome to QuickFix! Please verify your email by clicking this link: ${verificationURL}. This link is valid for ${process.env.EMAIL_VERIFICATION_EXPIRE_HOURS || 24} hours.`
        });
        logger.info(`Email verification link sent to ${user.email} for new registration.`);

        // Now, log the user in immediately after registration
        setCookie(res, generateToken(user._id));

        res.status(200).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            isPremium: user.isPremium,
            profilePicture: user.profilePicture,
            emailVerified: user.emailVerified, // Will be false here
            newsletterSubscriber: user.newsletterSubscriber,
            message: 'Registration successful! You are logged in. Please verify your email to unlock full features.' // Inform user they're logged in
        });

    } else {
        // No email verification required, user is immediately active and logged in
        user = await User.create({ username, email, password, emailVerified: true, newsletterSubscriber });

        setCookie(res, generateToken(user._id));

        if (newsletterSubscriber) {
            await NewsletterSubscriber.create({ email: user.email, active: true });
            logger.info(`User ${user.email} subscribed to newsletter during registration.`);
        }

        const welcomeHtml = loadTemplate('welcome', {
            username: user.username,
            loginUrl: `${process.env.FRONTEND_URL}/login`,
            contactUrl: `${process.env.FRONTEND_URL}/contact`,
            privacyUrl: `${process.env.FRONTEND_URL}/privacy-policy`,
            termsUrl: `${process.env.FRONTEND_URL}/terms-of-service`,
            currentYear: new Date().getFullYear()
        });

        await sendEmail({
            email: user.email,
            subject: 'Welcome to QuickFix!',
            html: welcomeHtml
        });

        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            isPremium: user.isPremium,
            profilePicture: user.profilePicture,
            emailVerified: user.emailVerified,
            newsletterSubscriber: user.newsletterSubscriber,
            message: 'Registration successful. Welcome!'
        });
        logger.info(`New user registered (no email verification): ${user.username}`);
    }
});

// @desc    Verify Email using a token from the link
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res, next) => {
    const receivedToken = req.params.token;
    logger.debug(`[DEBUG] verifyEmail: Received token from URL: ${receivedToken}`);

    const emailVerificationTokenHashed = crypto
        .createHash('sha256')
        .update(receivedToken)
        .digest('hex');
    logger.debug(`[DEBUG] verifyEmail: Hashed token for DB lookup: ${emailVerificationTokenHashed}`);

    const user = await User.findOne({
        emailVerificationToken: emailVerificationTokenHashed,
        emailVerificationExpires: { $gt: Date.now() }
    }).select('+emailVerificationToken +emailVerificationExpires +emailVerified');

    if (!user) {
        // If a token is provided but it's invalid/expired, find if it belongs to an unverified user
        const unverifiedUserWithExpiredToken = await User.findOne({ emailVerificationToken: emailVerificationTokenHashed, emailVerified: false });
        
        if (unverifiedUserWithExpiredToken) {
            // If the user exists and is unverified but the token is expired, and their account is older than UNVERIFIED_ACCOUNT_DELETION_HOURS, delete it.
            const deletionHours = parseInt(process.env.UNVERIFIED_ACCOUNT_DELETION_HOURS || 48); // Use env var for deletion threshold
            const deletionThreshold = new Date(Date.now() - deletionHours * 60 * 60 * 1000);

            if (unverifiedUserWithExpiredToken.createdAt < deletionThreshold) {
                logger.warn(`[DEBUG] verifyEmail: Deleting old expired unverified account for email: ${unverifiedUserWithExpiredToken.email}`);
                await User.deleteOne({ _id: unverifiedUserWithExpiredToken._id });
                // Also delete related notifications for this user
                await Notification.deleteMany({ user: unverifiedUserWithExpiredToken._id });
                logger.warn(`Deleted old unverified account for email: ${unverifiedUserWithExpiredToken.email} due to expired link and age.`);
                return next(new AppError('Invalid or expired email verification link. Your account has been removed due to inactivity. Please re-register.', 400));
            } else {
                // If token expired but account is not old enough for deletion (e.g., a new link was sent, invalidates old one)
                return next(new AppError('Invalid or expired email verification link. A new link might have been sent, or this one was already used. Please request a new link.', 400));
            }
        }
        // If no user found even with hashed token, or if it's already verified and doesn't match current token (edge case)
        return next(new AppError('Invalid or expired email verification link. Please request a new one.', 400));
    }

    if (user.emailVerified) {
        setCookie(res, generateToken(user._id)); // Log them in if already verified
        return res.status(200).json({ success: true, message: 'Your email is already verified. You are now logged in.', data: user });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save(); // Save without password re-hashing due to validateBeforeSave: false

    setCookie(res, generateToken(user._id));

    if (user.newsletterSubscriber) {
        await NewsletterSubscriber.create({ email: user.email, active: true });
        logger.info(`User ${user.email} subscribed to newsletter upon verification.`);
    }

    const welcomeHtml = loadTemplate('welcome', {
        username: user.username,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
        contactUrl: `${process.env.FRONTEND_URL}/contact`,
        privacyUrl: `${process.env.FRONTEND_URL}/privacy-policy`,
        termsUrl: `${process.env.FRONTEND_URL}/terms-of-service`,
        currentYear: new Date().getFullYear()
    });

    await sendEmail({
        email: user.email,
        subject: 'Welcome to QuickFix!',
        html: welcomeHtml
    });

    res.status(200).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium,
        profilePicture: user.profilePicture, // Added profile picture to response
        emailVerified: user.emailVerified,
        newsletterSubscriber: user.newsletterSubscriber,
        message: 'Account verified and registration complete! Welcome.'
    });
    logger.info(`User ${user.email} verified account via email link.`);
});

// @desc    Resend Email Verification Link
// @route   POST /api/auth/resend-verification-link
// @access  Public
const resendEmailVerificationLink = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        // Always respond with success for security reasons, to avoid exposing if an email exists
        return res.status(200).json({ success: true, message: 'If an account exists with that email and requires verification, a new link will be sent.' });
    }

    if (user.emailVerified) {
        return next(new AppError('Your email is already verified. Please log in.', 400));
    }

    const minResendInterval = 60 * 1000; // 1 minute
    if (user.lastVerificationEmailSent && (Date.now() - user.lastVerificationEmailSent.getTime() < minResendInterval)) {
        return next(new AppError('A verification link was recently sent. Please check your inbox or wait a minute before requesting another.', 429));
    }

    const verificationToken = user.getEmailVerificationToken(); // Generates new token, updates expiry
    user.lastVerificationEmailSent = Date.now(); // Update the timestamp
    await user.save({ validateBeforeSave: false }); // Save the new token and timestamp

    const verificationURL = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    logger.debug(`[DEBUG] resendEmailVerificationLink: New Verification URL generated: ${verificationURL}`);

    const emailVerificationHtml = loadTemplate('emailVerification', {
        username: user.username,
        verificationUrl: verificationURL,
        verification_expire_hours: process.env.EMAIL_VERIFICATION_EXPIRE_HOURS || 24,
        currentYear: new Date().getFullYear()
    });

    await sendEmail({
        email: user.email,
        subject: 'QuickFix: Your New Email Verification Link',
        html: emailVerificationHtml,
        text: `Your new email verification link for QuickFix is: ${verificationURL}. It is valid for ${process.env.EMAIL_VERIFICATION_EXPIRE_HOURS || 24} hours.`
    });

    res.status(200).json({
        success: true,
        message: 'New verification link sent to your email. Please check your inbox.'
    });
    logger.info(`New email verification link sent to ${user.email}.`);
});


// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    const allowLogin = await getSetting('allowLogin', true);
    if (!allowLogin) {
        return next(new AppError('Login is currently disabled. Please try again later.', 403));
    }

    const websiteMaintenanceMode = await getSetting('websiteMaintenanceMode', false);
    if (websiteMaintenanceMode) {
        return next(new AppError('Website is currently under maintenance. Please try again later.', 503));
    }

    const user = await User.findOne({ email }).select('+password +emailVerificationToken +emailVerificationExpires').where('active').equals(true);

    if (!user || !(await user.matchPassword(password))) {
        return next(new AppError('Invalid credentials or account is inactive.', 401));
    }

    const enableEmailVerification = await getSetting('enableEmailVerification', false);

    // If email verification is enabled and user is not verified
    if (enableEmailVerification && !user.emailVerified) {
        // Log the user in but inform them about unverified status.
        setCookie(res, generateToken(user._id));

        // Resend a new verification link if the existing one is old or doesn't exist
        const minResendInterval = 60 * 1000; // 1 minute
        const shouldResendEmail = !user.lastVerificationEmailSent || (Date.now() - user.lastVerificationEmailSent.getTime() >= minResendInterval);

        if (shouldResendEmail) {
            const newUnhashedToken = user.getEmailVerificationToken();
            user.lastVerificationEmailSent = Date.now(); // Update timestamp
            await user.save({ validateBeforeSave: false }); // Save user with new token and updated timestamp

            const verificationURL = `${process.env.FRONTEND_URL}/verify-email/${newUnhashedToken}`;
            const emailVerificationHtml = loadTemplate('emailVerification', {
                username: user.username,
                verificationUrl: verificationURL,
                verification_expire_hours: process.env.EMAIL_VERIFICATION_EXPIRE_HOURS || 24,
                currentYear: new Date().getFullYear()
            });

            await sendEmail({
                email: user.email,
                subject: 'QuickFix: Verify Your Email Address to Unlock Full Access',
                html: emailVerificationHtml,
                text: `Your account needs verification to unlock full access. Please verify your email by clicking this link: ${verificationURL}. This link is valid for ${process.env.EMAIL_VERIFICATION_EXPIRE_HOURS || 24} hours.`
            });
            logger.info(`New verification link sent to ${user.email} upon unverified login attempt.`);
        }

        // Send an in-app notification to the user's profile if their email is not verified
        const notificationIntervalHours = parseInt(process.env.EMAIL_VERIFICATION_REMINDER_INTERVAL_HOURS || 24);
        const notificationThreshold = new Date(Date.now() - notificationIntervalHours * 60 * 60 * 1000);

        const lastVerificationNotification = await Notification.findOne({
            user: user._id,
            type: NOTIFICATION_TYPES.ACCOUNT_VERIFICATION
        }).sort({ createdAt: -1 });

        // Send notification only if no previous verification notification or if it's older than the interval
        if (!lastVerificationNotification || lastVerificationNotification.createdAt < notificationThreshold) {
            await sendNotificationToUser(
                user._id,
                'Verify Your Account!',
                'Your account needs email verification to unlock premium features and full access. Click here to go to the verification page and resend the link if needed.',
                NOTIFICATION_TYPES.ACCOUNT_VERIFICATION,
                ROUTES.VERIFY_EMAIL // Link to the verification page
            );
            logger.info(`Account verification reminder notification sent to user ${user.username} after unverified login.`);
        }

        // Return user object with current (unverified) status
        return res.status(200).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            isPremium: user.isPremium,
            profilePicture: user.profilePicture,
            emailVerified: user.emailVerified, // This will be false
            newsletterSubscriber: user.newsletterSubscriber,
            message: 'Login successful, but your email is not verified. Please check your email for a verification link to unlock full features.'
        });
    }

    // If email is verified or verification is disabled, proceed with normal login
    setCookie(res, generateToken(user._id));
    res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium,
        profilePicture: user.profilePicture,
        emailVerified: user.emailVerified,
        newsletterSubscriber: user.newsletterSubscriber,
        message: 'Login successful'
    });
    logger.info(`User logged in: ${user.username}. Email verified: ${user.emailVerified}`);
});

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
    res.cookie('jwt', 'loggedout', {
        httpOnly: true,
        expires: new Date(Date.now() + 10 * 1000),
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
    });
    res.status(200).json({ message: 'Logged out successfully' });
    logger.info(`User logged out.`);
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
        return next(new AppError('User not found', 404));
    }
    res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium,
        profilePicture: user.profilePicture,
        emailVerified: user.emailVerified,
        newsletterSubscriber: user.newsletterSubscriber
    });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    if (req.body.username !== undefined) {
        user.username = req.body.username;
    }

    if (req.body.profilePicture !== undefined) {
        user.profilePicture = req.body.profilePicture;
    }

    if (req.body.password) {
        user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        isPremium: updatedUser.isPremium,
        profilePicture: updatedUser.profilePicture,
        emailVerified: updatedUser.emailVerified,
        newsletterSubscriber: updatedUser.newsletterSubscriber,
        message: 'Profile updated successfully'
    });
    logger.info(`User profile updated: ${updatedUser.username}`);
});

// @desc    Forgot Password - Initiates password reset process by sending an email
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(200).json({ success: true, message: 'If a user with that email is found, a password reset email will be sent.' });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

    const passwordResetHtml = loadTemplate('passwordReset', {
        username: user.username,
        resetUrl: resetURL,
        reset_expire_minutes: parseInt(process.env.RESET_PASSWORD_EXPIRE, 10) / 60000,
        currentYear: new Date().getFullYear()
    });

    try {
        await sendEmail({
            email: user.email,
            subject: 'QuickFix Password Reset Request',
            html: passwordResetHtml,
            text: `You are receiving this email because you requested a password reset. Please go to this link to reset your password: ${resetURL}. This link is valid for ${parseInt(process.env.RESET_PASSWORD_EXPIRE, 10) / 60000} minutes.`
        });

        res.status(200).json({ success: true, message: 'Password reset email sent. Check your inbox.' });
        logger.info(`Password reset email sent to ${user.email}`);

    } catch (err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError(`Error sending reset email: ${err.message}`, 500));
    }
});

// @desc    Reset Password - Completes the password reset process
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
const resetPassword = asyncHandler(async (req, res, next) => {
    const { password, confirmPassword } = req.body;

    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resettoken)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
        return next(new AppError('Invalid or expired password reset token.', 400));
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    setCookie(res, generateToken(user._id));
    res.status(200).json({
        success: true,
        message: 'Password reset successful. You are now logged in.'
    });
    logger.info(`User ${user.username} successfully reset password.`);
});

// @desc    Toggle user's newsletter subscription status
// @route   PUT /api/auth/toggle-newsletter
// @access  Private
const toggleNewsletterSubscription = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    user.newsletterSubscriber = !user.newsletterSubscriber;
    await user.save({ validateBeforeSave: false });

    if (user.newsletterSubscriber) {
        await NewsletterSubscriber.findOneAndUpdate(
            { email: user.email },
            { email: user.email, active: true },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        res.status(200).json({ success: true, message: 'Successfully subscribed to newsletter.' });
        logger.info(`User ${user.username} subscribed to newsletter.`);
    } else {
        await NewsletterSubscriber.findOneAndUpdate(
            { email: user.email },
            { active: false }
        );
        res.status(200).json({ success: true, message: 'Successfully unsubscribed from newsletter.' });
        logger.info(`User ${user.username} unsubscribed from newsletter.`);
    }
});


module.exports = {
    registerUser,
    verifyEmail,
    resendEmailVerificationLink,
    loginUser,
    logoutUser,
    getUserProfile,
    updateUserProfile,
    forgotPassword,
    resetPassword,
    toggleNewsletterSubscription
};