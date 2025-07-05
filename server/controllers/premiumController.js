// quickfix-website/server/controllers/premiumController.js
const asyncHandler = require('express-async-handler');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { sendNotificationToUser } = require('../services/notificationService');
const { sendEmail, loadTemplate } = require('../config/email'); // Changed from utils/emailSender to config/email <--- MODIFIED
const Settings = require('../models/Settings');
const { SUBSCRIPTION_STATUSES, NOTIFICATION_TYPES, ROUTES } = require('../utils/constants'); // Import NOTIFICATION_TYPES and ROUTES <--- MODIFIED
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');

// Helper function to get settings from DB
const getSetting = async (name, defaultValue) => {
    try {
        const setting = await Settings.findOne({ settingName: name });
        return setting ? setting.settingValue : defaultValue;
    } catch (error) {
        logger.error(`Error fetching setting '${name}': ${error.message}`);
        return defaultValue;
    }
};

// Multer setup for screenshot uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../public/uploads/screenshots');
        fs.mkdirSync(uploadDir, { recursive: true }); // Ensure the directory exists
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        cb(null, 'screenshot-' + uniqueSuffix + ext);
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new AppError('Only image files (JPEG, PNG, GIF, WebP) are allowed.', 400), false);
        }
    }
});

// @desc    Get list of premium features and payment info for all plans
// @route   GET /api/premium/features
// @access  Public
const getPremiumFeatures = asyncHandler(async (req, res) => {
    const basicBenefits = ['Ad-free experience', 'Access to standard guides', 'Email support'];
    const advancedBenefits = [...basicBenefits, 'Exclusive advanced guides', 'Priority email support', 'Early access to new features'];
    const proBenefits = [...advancedBenefits, 'Access to all premium guides', '24/7 chat support', 'Community Badge', 'Personalized tips & tricks'];

    const basicPrice = await getSetting('basicPlanPrice', 499);
    const advancedPrice = await getSetting('advancedPlanPrice', 999);
    const proPrice = await getSetting('proPlanPrice', 1999);
    const upiId = await getSetting('upiIdForPremium', 'your.default.upi@bank');

    const plans = [
        { name: 'basic', displayName: 'Basic', price: basicPrice, currency: 'INR', benefits: basicBenefits, duration: '1 year' },
        { name: 'advanced', displayName: 'Advanced', price: advancedPrice, currency: 'INR', benefits: advancedBenefits, duration: '1 year' },
        { name: 'pro', displayName: 'Pro', price: proPrice, currency: 'INR', benefits: proBenefits, duration: '1 year' }
    ];

    res.status(200).json({
        success: true,
        plans: plans,
        paymentInfo: {
            method: 'UPI',
            upiId: upiId,
            instructions: `Please make the payment to ${upiId} and provide the Transaction ID (UTR/Ref ID) for verification.`
        }
    });
});

// @desc    User initiates a premium subscription and submits UPI payment confirmation for manual review
// @route   POST /api/premium/confirm-manual-payment
// @access  Private (requires authenticated user)
const submitUpiPaymentConfirmation = asyncHandler(async (req, res, next) => {
    try {
        const { transactionId, referenceCode, selectedPlan } = req.body;
        const userId = req.user?._id;
        const userEmail = req.user?.email;
        const username = req.user?.username;

        if (!userId) {
            return next(new AppError('Authentication failed. Please log in again.', 401));
        }

        const user = await User.findById(userId); // Fetch full user object to check emailVerified status
        if (!user) {
            return next(new AppError('User not found.', 404));
        }

        // --- NEW: Check if email is verified before allowing premium purchase ---
        const enableEmailVerification = await getSetting('enableEmailVerification', false);
        if (enableEmailVerification && !user.emailVerified) {
            return next(new AppError('Your email address must be verified to purchase a premium plan. Please verify your account via the link sent to your email.', 403));
        }

        if (!transactionId || !referenceCode || !selectedPlan) {
            return next(new AppError('Transaction ID, Reference Code, and selected plan are required.', 400));
        }

        const allowedPlans = ['basic', 'advanced', 'pro'];
        if (!allowedPlans.includes(selectedPlan)) {
            return next(new AppError('Invalid premium plan selected.', 400));
        }

        let planAmount;
        switch (selectedPlan) {
            case 'basic':
                planAmount = await getSetting('basicPlanPrice', 499);
                break;
            case 'advanced':
                planAmount = await getSetting('advancedPlanPrice', 999);
                break;
            case 'pro':
                planAmount = await getSetting('proPlanPrice', 1999);
                break;
            default:
                return next(new AppError('Could not determine price for the selected plan due to internal error. Contact support.', 500));
        }

        if (planAmount === null || planAmount === undefined || isNaN(planAmount) || planAmount <= 0) {
            return next(new AppError('Premium plan price not configured correctly. Please contact support.', 500));
        }

        const adminPanelUrl = await getSetting('adminPanelUrl', `${process.env.FRONTEND_URL}/admin`);

        // Check for an existing active or pending subscription for the same user
        let subscription = await Subscription.findOne({
            user: userId,
            status: { $in: [SUBSCRIPTION_STATUSES.ACTIVE, SUBSCRIPTION_STATUSES.PENDING_MANUAL_VERIFICATION] }
        });

        if (subscription) {
            if (subscription.status === SUBSCRIPTION_STATUSES.ACTIVE) {
                // If user has an active subscription, they cannot start a new one (or re-submit existing)
                return next(new AppError('You already have an active premium subscription. To change your plan, please cancel the current one first, or upgrade if that feature is implemented.', 400));
            } else if (subscription.status === SUBSCRIPTION_STATUSES.PENDING_MANUAL_VERIFICATION) {
                // User is re-submitting details for an existing pending subscription. UPDATE it.
                subscription.transactionId = transactionId;
                subscription.referenceCode = referenceCode;
                subscription.plan = selectedPlan;
                subscription.amount = planAmount;
                subscription.lastPaymentDate = new Date();

                try {
                    await subscription.save();
                    logger.info(`User ${username} re-submitted UPI payment confirmation for reference ${referenceCode}. Txn ID: ${transactionId}. Plan: ${selectedPlan}. (Updated existing pending sub)`);
                } catch (saveError) {
                    if (saveError.name === 'ValidationError') {
                        return next(new AppError(`Validation error updating your subscription: ${saveError.message}`, 400));
                    }
                    if (saveError.code === 11000) {
                        if (saveError.keyPattern && saveError.keyPattern.referenceCode) {
                            return next(new AppError('A subscription with this reference code already exists. Please ensure it is unique, or contact support if you believe this is an error.', 400));
                        }
                        return next(new AppError('A duplicate entry was found while updating. Please contact support.', 400));
                    }
                    return next(new AppError(`An unexpected error occurred while updating your subscription: ${saveError.message}`, 500));
                }

                const adminContactEmail = await getSetting('contactEmail', 'support@quickfix.com');
                if (adminContactEmail && adminContactEmail !== 'support@quickfix.com') {
                    const adminNotificationHtml = await loadTemplate('adminManualPaymentReview', {
                        username: username,
                        userEmail: userEmail,
                        amount: planAmount,
                        plan: selectedPlan.toUpperCase(),
                        transactionId: transactionId,
                        referenceCode: referenceCode,
                        reviewLink: `${adminPanelUrl}/admin-dashboard/manage-subscriptions?status=${SUBSCRIPTION_STATUSES.PENDING_MANUAL_VERIFICATION}`, // Updated link <--- MODIFIED
                        currentYear: new Date().getFullYear()
                    });
                    try {
                        await sendEmail({
                            email: adminContactEmail,
                            subject: `ACTION REQUIRED: UPI Payment Re-submitted - Ref: ${referenceCode} (Plan: ${selectedPlan.toUpperCase()})`,
                            html: adminNotificationHtml
                        });
                    } catch (emailError) {
                        logger.error(`Failed to send re-submission email to admin: ${emailError.message}`);
                    }
                } else {
                    logger.warn('Admin contact email not set, skipping re-submission review notification email.');
                }

                return res.status(202).json({
                    success: true,
                    message: 'Your payment confirmation has been updated and is awaiting manual verification. Thank you for your patience!',
                    subscription: subscription
                });
            }
        }

        // If no active or pending subscription exists, create a new one.
        subscription = await Subscription.create({
            user: userId,
            plan: selectedPlan,
            status: SUBSCRIPTION_STATUSES.PENDING_MANUAL_VERIFICATION,
            paymentMethod: 'UPI',
            referenceCode: referenceCode,
            transactionId: transactionId,
            amount: planAmount,
            currency: 'INR',
            lastPaymentDate: new Date()
        });
        logger.info(`User ${username} submitted UPI payment confirmation for reference ${referenceCode}. Txn ID: ${transactionId}. Plan: ${selectedPlan}. (Created new pending sub)`);

        const adminContactEmail = await getSetting('contactEmail', 'support@quickfix.com');
        if (adminContactEmail && adminContactEmail !== 'support@quickfix.com') {
            const adminNotificationHtml = await loadTemplate('adminManualPaymentReview', {
                username: username,
                userEmail: userEmail,
                amount: planAmount,
                plan: selectedPlan.toUpperCase(),
                transactionId: transactionId,
                referenceCode: referenceCode,
                reviewLink: `${adminPanelUrl}/admin-dashboard/manage-subscriptions?status=${SUBSCRIPTION_STATUSES.PENDING_MANUAL_VERIFICATION}`, // Updated link <--- MODIFIED
                currentYear: new Date().getFullYear()
            });
            try {
                await sendEmail({
                    email: adminContactEmail,
                    subject: `ACTION REQUIRED: New UPI Payment for Review - Ref: ${referenceCode} (Plan: ${selectedPlan.toUpperCase()})`,
                    html: adminNotificationHtml
                });
            } catch (emailError) {
                logger.error(`Failed to send new submission email to admin: ${emailError.message}`);
            }
        } else {
            logger.warn('Admin contact email not set, skipping manual payment review notification email.');
        }

        res.status(202).json({
            success: true,
            message: 'Your payment confirmation has been submitted for manual verification. We will activate your premium membership shortly!',
            subscription: subscription
        });

    } catch (err) {
        logger.error(`FATAL error in submitUpiPaymentConfirmation: ${err.message}`, err);
        if (err.name === 'ValidationError') {
            return next(new AppError(`Validation error: ${err.message}`, 400));
        }
        if (err.code === 11000) {
            if (err.keyPattern && err.keyPattern.referenceCode) {
                return next(new AppError('A subscription with this reference code already exists. Please ensure it is unique, or contact support if you believe this is an error.', 400));
            }
            return next(new AppError('A duplicate entry was found. Please contact support.', 400));
        }
        return next(new AppError(`An unexpected server error occurred during payment submission: ${err.message}`, 500));
    }
});

// @desc    Upload payment screenshot
// @route   POST /api/premium/upload-screenshot
// @access  Private (requires authenticated user)
const uploadPaymentScreenshot = asyncHandler(async (req, res, next) => {
    try {
        if (!req.file) {
            return next(new AppError('No screenshot file uploaded.', 400));
        }

        const { subscriptionId } = req.body;
        const userId = req.user?._id;

        if (!userId) {
            // Clean up uploaded file if authentication fails
            fs.unlink(req.file.path, (err) => { if (err) logger.error(`Error deleting uploaded file due to missing user ID: ${err.message}`); });
            return next(new AppError('Authentication failed. Please log in again.', 401));
        }

        if (!subscriptionId) {
            // Clean up uploaded file if subscriptionId is missing
            fs.unlink(req.file.path, (err) => { if (err) logger.error(`Error deleting uploaded file due to missing subscriptionId: ${err.message}`); });
            return next(new AppError('Subscription ID is required to link the screenshot.', 400));
        }

        const subscription = await Subscription.findOne({ _id: subscriptionId, user: userId });

        if (!subscription) {
            fs.unlink(req.file.path, (err) => { if (err) logger.error(`Error deleting uploaded file due to subscription not found/owned: ${err.message}`); });
            return next(new AppError('Subscription not found or you are not authorized to upload screenshot for this subscription.', 404));
        }

        // Ensure subscription is in a state where screenshot upload is relevant
        if (subscription.status !== SUBSCRIPTION_STATUSES.INITIATED &&
            subscription.status !== SUBSCRIPTION_STATUSES.PENDING_MANUAL_VERIFICATION) {
            fs.unlink(req.file.path, (err) => { if (err) logger.error(`Error deleting uploaded file due to invalid subscription status: ${err.message}`); });
            return next(new AppError('Screenshot can only be uploaded for subscriptions that are initiated or pending manual verification. Your current subscription status is ' + subscription.status.replace(/_/g, ' ') + '.', 400));
        }

        const screenshotUrl = `${req.protocol}://${req.get('host')}/uploads/screenshots/${req.file.filename}`;

        if (subscription.screenshotUrl) {
            const oldFilename = path.basename(subscription.screenshotUrl);
            const oldFilePath = path.join(__dirname, '../public/uploads/screenshots', oldFilename);
            fs.unlink(oldFilePath, (err) => {
                if (err) logger.error(`Error deleting old screenshot file for sub ${subscriptionId}: ${err.message}`);
            });
        }

        subscription.screenshotUrl = screenshotUrl;
        try {
            await subscription.save();
            logger.info(`User ${req.user.username} uploaded screenshot for subscription ${subscriptionId}. URL: ${screenshotUrl}`);
        } catch (saveError) {
            fs.unlink(req.file.path, (err) => { if (err) logger.error(`Error deleting newly uploaded file after failed DB save: ${err.message}`); });
            return next(new AppError(`Error saving screenshot to subscription: ${saveError.message}`, 500));
        }

        const adminContactEmail = await getSetting('contactEmail', 'support@quickfix.com');
        const adminPanelUrl = await getSetting('adminPanelUrl', `${process.env.FRONTEND_URL}/admin`);
        if (adminContactEmail && adminContactEmail !== 'support@quickfix.com') {
            const adminNotificationHtml = await loadTemplate('adminScreenshotUploaded', {
                username: req.user.username,
                userEmail: req.user.email,
                transactionId: subscription.transactionId || 'N/A',
                referenceCode: subscription.referenceCode || 'N/A',
                screenshotUrl: screenshotUrl,
                reviewLink: `${adminPanelUrl}/admin-dashboard/manage-subscriptions?status=${SUBSCRIPTION_STATUSES.PENDING_MANUAL_VERIFICATION}&userId=${req.user._id}`, // Updated link <--- MODIFIED
                currentYear: new Date().getFullYear()
            });
            try {
                await sendEmail({
                    email: adminContactEmail,
                    subject: `NEW SCREENSHOT: Payment Screenshot Uploaded for Ref: ${subscription.referenceCode || subscription.transactionId}`,
                    html: adminNotificationHtml
                });
            } catch (emailError) {
                logger.error(`Failed to send screenshot upload email to admin: ${emailError.message}`);
            }
        } else {
            logger.warn('Admin contact email not set, skipping screenshot upload notification email.');
        }

        res.status(200).json({
            success: true,
            message: 'Screenshot uploaded successfully and linked to your subscription.',
            screenshotUrl: screenshotUrl
        });

    } catch (err) {
        logger.error(`FATAL error in uploadPaymentScreenshot: ${err.message}`, err);
        if (err instanceof AppError) {
            return next(err);
        }
        return next(new AppError(`An unexpected server error occurred during screenshot upload: ${err.message}`, 500));
    }
});

// @desc    Cancel premium subscription
// @route   POST /api/premium/cancel
// @access  Private
const cancelSubscription = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return next(new AppError('User not authenticated.', 401));
        }

        const subscription = await Subscription.findOne({ user: userId, status: SUBSCRIPTION_STATUSES.ACTIVE });

        if (!subscription) {
            return next(new AppError('No active subscription found to cancel.', 404));
        }

        subscription.status = SUBSCRIPTION_STATUSES.CANCELLED;
        try {
            await subscription.save();
        } catch (saveError) {
            logger.error(`Error saving cancelled subscription status: ${saveError.message}`, saveError);
            return next(new AppError(`Failed to update subscription status to cancelled: ${saveError.message}`, 500));
        }

        const userToUpdate = await User.findById(userId);
        if (userToUpdate) {
            userToUpdate.isPremium = false;
            try {
                await userToUpdate.save({ validateBeforeSave: false });
            } catch (userSaveError) {
                logger.error(`Failed to save user's isPremium status after cancellation: ${userSaveError.message}`);
            }
        }
        
        logger.info(`User ${req.user.username} cancelled their premium subscription (Sub ID: ${subscription._id}).`);

        res.status(200).json({
            success: true,
            message: 'Subscription cancelled successfully. Your premium access will continue until the current period ends (if applicable).'
        });

        await sendNotificationToUser(userId, 'Subscription Cancelled', `Your QuickFix Premium subscription has been cancelled.`, NOTIFICATION_TYPES.SUBSCRIPTION, ROUTES.PREMIUM); // Added Notification Type and Link <--- MODIFIED
    } catch (err) {
        logger.error(`FATAL error in cancelSubscription: ${err.message}`, err);
        if (err instanceof AppError) {
            return next(err);
        }
        return next(new AppError(`An unexpected server error occurred during subscription cancellation: ${err.message}`, 500));
    }
});

// @desc    Get user's subscription status
// @route   GET /api/premium/status
// @access  Private
const getSubscriptionStatus = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return next(new AppError('User not authenticated.', 401));
        }

        const user = await User.findById(userId).select('isPremium');
        if (!user) {
            return next(new AppError('User not found.', 404));
        }

        // Find the latest subscription for the user
        const subscription = await Subscription.findOne({ user: userId }).sort({ createdAt: -1 });

        if (!subscription) {
            // If no subscription record exists, return NONE status and current user.isPremium
            return res.status(200).json({
                success: true,
                data: {
                    status: SUBSCRIPTION_STATUSES.NONE,
                    isPremium: user.isPremium,
                    message: 'No subscription record found.'
                }
            });
        }

        // Synchronize user.isPremium with actual latest subscription status in DB
        // Check if the latest subscription is active and user.isPremium is false
        if (subscription.status === SUBSCRIPTION_STATUSES.ACTIVE && !user.isPremium) {
            user.isPremium = true;
            await user.save({ validateBeforeSave: false });
        } else if (subscription.status !== SUBSCRIPTION_STATUSES.ACTIVE && user.isPremium) {
            // Only set to false if the latest subscription is NOT active.
            // This prevents setting to false if a user has an active sub but also old cancelled ones.
            user.isPremium = false;
            await user.save({ validateBeforeSave: false });
        }

        // Return the full subscription object along with the synced isPremium status
        res.status(200).json({
            success: true,
            data: {
                _id: subscription._id,
                status: subscription.status,
                plan: subscription.plan,
                startDate: subscription.startDate,
                endDate: subscription.endDate,
                amount: subscription.amount,
                currency: subscription.currency,
                transactionId: subscription.transactionId,
                referenceCode: subscription.referenceCode,
                screenshotUrl: subscription.screenshotUrl,
                adminNotes: subscription.adminNotes,
                isPremium: user.isPremium // Return the synced isPremium status
            },
            message: `Your current subscription is ${subscription.status.replace(/_/g, ' ')}.`
        });

    } catch (err) {
        logger.error(`FATAL error in getSubscriptionStatus: ${err.message}`, err);
        if (err instanceof AppError) {
            return next(err);
        }
        return next(new AppError(`An unexpected server error occurred while fetching subscription status: ${err.message}`, 500));
    }
});


module.exports = {
    getPremiumFeatures,
    submitUpiPaymentConfirmation,
    uploadPaymentScreenshot,
    upload, // EXPORT MULTER INSTANCE HERE
    cancelSubscription,
    getSubscriptionStatus
};