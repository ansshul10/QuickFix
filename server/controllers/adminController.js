const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Guide = require('../models/Guide');
const Category = require('../models/Category');
const Comment = require('../models/Comment');
const Rating = require('../models/Rating');
const Subscription = require('../models/Subscription');
const Notification = require('../models/Notification');
const Settings = require('../models/Settings'); // Make sure Settings model is imported
const Announcement = require('../models/Announcement');
const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { sendNotificationToUser } = require('../services/notificationService');
const { sendEmail, loadTemplate } = require('../utils/emailSender');
const { SUBSCRIPTION_STATUSES } = require('../../client/src/utils/constants'); // Ensure this path is correct for your project

// Helper to get a setting value from DB (re-fetches each time to get latest value)
// Note: For settings fetched in bulk, direct iteration in controllers is often more efficient.
const getSetting = asyncHandler(async (name, defaultValue) => {
    const setting = await Settings.findOne({ settingName: name });
    return setting ? setting.settingValue : defaultValue;
});

// @desc    Get Admin Dashboard Statistics
// @route   GET /api/admin/dashboard-stats
// @access  Private/Admin
const getAdminDashboardStats = asyncHandler(async (req, res) => {
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalGuides = await Guide.countDocuments();
    const totalCategories = await Category.countDocuments();
    const totalComments = await Comment.countDocuments();
    const totalRatings = await Rating.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({ status: SUBSCRIPTION_STATUSES.ACTIVE });
    const pendingVerifications = await Subscription.countDocuments({ status: SUBSCRIPTION_STATUSES.PENDING_MANUAL_VERIFICATION });
    const premiumGuidesCount = await Guide.countDocuments({ isPremium: true });
    const totalAnnouncements = await Announcement.countDocuments();
    const totalNewsletterSubscribers = await NewsletterSubscriber.countDocuments({ active: true });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newUsersLast30Days = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    const topRatedGuides = await Guide.find().sort({ averageRating: -1 }).limit(5).select('title averageRating numOfReviews slug');
    const mostCommentedGuides = await Comment.aggregate([
        { $group: { _id: '$guide', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
            $lookup: {
                from: 'guides',
                localField: '_id',
                foreignField: '_id',
                as: 'guideDetails'
            }
        },
        { $unwind: '$guideDetails' },
        { $project: { _id: 0, title: '$guideDetails.title', slug: '$guideDetails.slug', commentCount: '$count' } }
    ]);

    const subscriptionStats = await Subscription.aggregate([
        {
            $match: {
                status: SUBSCRIPTION_STATUSES.ACTIVE // Only active subscriptions for revenue stats
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: "$startDate" },
                    month: { $month: "$startDate" }
                },
                count: { $sum: 1 },
                totalAmount: { $sum: "$amount" }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    res.status(200).json({
        success: true,
        data: {
            totalUsers,
            totalAdmins,
            totalGuides,
            totalCategories,
            totalComments,
            totalRatings,
            activeSubscriptions,
            pendingVerifications,
            premiumGuidesCount,
            totalAnnouncements,
            totalNewsletterSubscribers,
            newUsersLast30Days,
            topRatedGuides,
            mostCommentedGuides,
            subscriptionStats,
        }
    });
    logger.info(`Admin ${req.user.username} fetched dashboard stats.`);
});

// @desc    Get all users (for admin management) with filters and pagination
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
    const pageSize = parseInt(req.query.pageSize) || 10;
    const page = parseInt(req.query.pageNumber) || 1;
    const keyword = req.query.keyword ? {
        $or: [
            { username: { $regex: req.query.keyword, $options: 'i' } },
            { email: { $regex: req.query.keyword, $options: 'i' } },
        ]
    } : {};
    const role = req.query.role ? { role: req.query.role } : {};
    const isPremium = req.query.isPremium ? { isPremium: req.query.isPremium === 'true' } : {};
    const active = req.query.active ? { active: req.query.active === 'true' } : {};

    const count = await User.countDocuments({ ...keyword, ...role, ...isPremium, ...active });
    const users = await User.find({ ...keyword, ...role, ...isPremium, ...active })
        .select('-password -otp -otpExpires -resetPasswordToken -resetPasswordExpire')
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: users.length,
        page,
        pages: Math.ceil(count / pageSize),
        data: users
    });
    logger.info(`Admin ${req.user.username} fetched users.`);
});

// @desc    Get single user by ID (for admin management)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUser = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id)
        .select('-password -otp -otpExpires -resetPasswordToken -resetPasswordExpire')
        .populate('subscription'); // Populate subscription to see linked subscription info
    if (!user) {
        return next(new AppError('User not found', 404));
    }
    res.status(200).json({
        success: true,
        data: user
    });
});

// @desc    Update user (by admin)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res, next) => {
    const { username, email, role, isPremium, active, password, profilePicture, newsletterSubscriber } = req.body;
    let user = await User.findById(req.params.id).select('+password'); // Select password to potentially update it

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    // Prevent admin from demoting or deactivating themselves
    if (req.user._id.toString() === req.params.id) {
        if (role && role !== 'admin') {
            return next(new AppError('Admin cannot demote themselves.', 403));
        }
        if (active === false) {
            return next(new AppError('Admin cannot deactivate themselves.', 403));
        }
    }

    // Store original isPremium status for logging/conditional logic
    const originalIsPremium = user.isPremium;

    user.username = username !== undefined ? username : user.username;
    user.email = email !== undefined ? email : user.email;
    user.role = role !== undefined ? role : user.role;
    user.isPremium = isPremium !== undefined ? isPremium : user.isPremium; // This will trigger subscription logic
    user.active = active !== undefined ? active : user.active;
    user.profilePicture = profilePicture !== undefined ? profilePicture : user.profilePicture;
    // Note: newsletterSubscriber field on User model is usually a boolean indicating interest.
    // The actual subscriber status is managed via the NewsletterSubscriber model.
    // user.newsletterSubscriber = newsletterSubscriber !== undefined ? newsletterSubscriber : user.newsletterSubscriber; // Handled separately below

    if (password) {
        user.password = password; // Mongoose pre-save hook should handle hashing
    }

    const updatedUser = await user.save({ validateBeforeSave: false }); // Bypass user schema validation for password hashing if not provided

    // Handle isPremium status change and associated subscription creation/cancellation
    if (updatedUser.isPremium && !originalIsPremium) { // If user became premium and wasn't before
        // Create a new subscription for admin-granted premium
        const startDate = new Date();
        const endDate = new Date();
        endDate.setFullYear(startDate.getFullYear() + 1); // 1 year premium

        const newSubscription = await Subscription.create({
            user: updatedUser._id,
            plan: 'admin-granted', // Special plan type for admin grants
            startDate,
            endDate,
            status: SUBSCRIPTION_STATUSES.ACTIVE,
            amount: 0, // Admin granted, so amount is 0
            currency: 'INR', // Default to INR
            paymentMethod: 'ADMIN',
            referenceCode: 'ADMIN_GRANT',
            transactionId: 'ADMIN_GRANT',
            verifiedBy: req.user._id,
            verifiedAt: new Date()
        });
        updatedUser.subscription = newSubscription._id; // Link the subscription to the user
        await updatedUser.save({ validateBeforeSave: false }); // Save user again to link subscription
        logger.info(`Admin ${req.user.username} granted premium status to ${updatedUser.username}, created active 'admin-granted' subscription.`);
        await sendNotificationToUser(updatedUser._id, 'Premium Access Granted', 'Your QuickFix account has been granted premium access by an administrator.');
        const emailHtml = await loadTemplate('subscriptionConfirmation', {
            username: updatedUser.username,
            plan: 'Admin Granted',
            amount: 0,
            currency: 'INR',
            startDate: newSubscription.startDate.toDateString(),
            endDate: newSubscription.endDate.toDateString(),
            contactEmail: await getSetting('contactEmail', 'support@quickfix.com'),
            privacyUrl: `${process.env.FRONTEND_URL}/privacy-policy`,
            termsUrl: `${process.env.FRONTEND_URL}/terms-of-service`,
            currentYear: new Date().getFullYear()
        });
        await sendEmail({
            email: updatedUser.email,
            subject: 'QuickFix Premium Activated (Admin Granted)!',
            html: emailHtml
        });
    } else if (!updatedUser.isPremium && originalIsPremium) { // If user ceased to be premium
        const existingSubscription = await Subscription.findOne({ user: updatedUser._id, status: SUBSCRIPTION_STATUSES.ACTIVE });
        if (existingSubscription) {
            existingSubscription.status = SUBSCRIPTION_STATUSES.CANCELLED;
            existingSubscription.adminNotes = `Admin ${req.user.username} revoked premium access.`;
            existingSubscription.verifiedBy = req.user._id;
            existingSubscription.verifiedAt = new Date();
            await existingSubscription.save();
            logger.info(`Admin ${req.user.username} revoked premium status from ${updatedUser.username}, cancelled active subscription ${existingSubscription._id}.`);
            await sendNotificationToUser(updatedUser._id, 'Premium Access Revoked', 'Your QuickFix premium access has been revoked by an administrator.');
            const emailHtml = await loadTemplate('subscriptionCancelled', {
                username: updatedUser.username,
                plan: existingSubscription.plan,
                contactEmail: await getSetting('contactEmail', 'support@quickfix.com'),
                privacyUrl: `${process.env.FRONTEND_URL}/privacy-policy`,
                termsUrl: `${process.env.FRONTEND_URL}/terms-of-service`,
                currentYear: new Date().getFullYear()
            });
            await sendEmail({
                email: updatedUser.email,
                subject: 'QuickFix Premium Access Revoked',
                html: emailHtml
            });
        }
        // Ensure user's subscription field is cleared if no active subscription exists
        updatedUser.subscription = null;
        await updatedUser.save({ validateBeforeSave: false }); // Save user again to clear subscription link
    }

    if (newsletterSubscriber !== undefined) {
        let newsletterEntry = await NewsletterSubscriber.findOne({ email: updatedUser.email });
        if (newsletterEntry) {
            newsletterEntry.active = newsletterSubscriber;
            await newsletterEntry.save();
            logger.info(`NewsletterSubscriber entry for ${updatedUser.email} updated to active: ${newsletterSubscriber}.`);
        } else if (newsletterSubscriber) { // If newsletterSubscriber is true and no entry exists, create one
            await NewsletterSubscriber.create({ email: updatedUser.email, active: true, subscribedAt: Date.now() });
            logger.info(`New NewsletterSubscriber entry created for ${updatedUser.email}.`);
        }
    }

    res.status(200).json({
        success: true,
        data: updatedUser.toObject({ getters: true, virtuals: false }),
        message: `User ${updatedUser.username} updated successfully by admin.`
    });
    logger.info(`Admin ${req.user.username} updated user ${updatedUser.username}.`);

    await sendNotificationToUser(updatedUser._id, 'Account Update by Admin', `Your account details have been updated by an administrator. Role: ${updatedUser.role}, Premium: ${updatedUser.isPremium ? 'Yes' : 'No'}, Active: ${updatedUser.active ? 'Yes' : 'No'}.`);
});

// @desc    Toggle user's newsletter subscription status (admin only)
// @route   PUT /api/admin/users/:id/newsletter-status
// @access  Private/Admin
const toggleUserNewsletterSubscription = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { newsletterSubscriber } = req.body;

    if (newsletterSubscriber === undefined || typeof newsletterSubscriber !== 'boolean') {
        return next(new AppError('Invalid newsletterSubscriber status provided.', 400));
    }

    let user = await User.findById(id);

    if (!user) {
        return next(new AppError('User not found.', 404));
    }

    user.newsletterSubscriber = newsletterSubscriber;
    await user.save({ validateBeforeSave: false });

    let newsletterEntry = await NewsletterSubscriber.findOne({ email: user.email });

    if (newsletterEntry) {
        newsletterEntry.active = newsletterSubscriber;
        await newsletterEntry.save();
    } else if (newsletterSubscriber) {
        await NewsletterSubscriber.create({
            email: user.email,
            active: true,
            subscribedAt: Date.now()
        });
    }

    const action = newsletterSubscriber ? 'enabled' : 'disabled';
    res.status(200).json({
        success: true,
        message: `Newsletter subscription ${action} for ${user.email}.`,
        data: { userId: user._id, newStatus: newsletterSubscriber }
    });
    logger.info(`Admin ${req.user.username} ${action} newsletter subscription for user ${user.email}.`);

    await sendNotificationToUser(user._id, 'Newsletter Status Update', `Your newsletter subscription has been ${action} by an administrator.`);
});

// @desc    Delete user (by admin)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    if (req.user._id.toString() === req.params.id) {
        return next(new AppError('Admin cannot delete themselves.', 403));
    }

    await User.deleteOne({ _id: user._id });
    await Guide.deleteMany({ user: user._id });
    await Comment.deleteMany({ user: user._id });
    await Rating.deleteMany({ user: user._id });
    await Subscription.deleteOne({ user: user._id }); // Delete related subscriptions
    await Notification.deleteMany({ user: user._id });
    await NewsletterSubscriber.deleteOne({ email: user.email }); // Delete newsletter subscriber entry

    res.status(200).json({
        success: true,
        data: {},
        message: `User ${user.username} and all associated data removed.`
    });
    logger.info(`Admin ${req.user.username} deleted user ${user.username}.`);
});

// @desc    Get all subscriptions (for admin review) with filters and pagination
// @route   GET /api/admin/subscriptions
// @access  Private/Admin
const getAllSubscriptions = asyncHandler(async (req, res) => {
    const pageSize = parseInt(req.query.pageSize) || 10;
    const page = parseInt(req.query.pageNumber) || 1;
    // Allow filtering by status, transactionId, referenceCode, and user ID
    const statusFilter = req.query.status ? { status: req.query.status } : {};
    const userIdFilter = req.query.userId ? { user: req.query.userId } : {};
    const transactionIdFilter = req.query.transactionId ? { transactionId: { $regex: req.query.transactionId, $options: 'i' } } : {};
    const referenceCodeFilter = req.query.referenceCode ? { referenceCode: { $regex: req.query.referenceCode, $options: 'i' } } : {};
    const planFilter = req.query.plan ? { plan: req.query.plan } : {};

    const query = {
        ...statusFilter,
        ...userIdFilter,
        ...transactionIdFilter,
        ...referenceCodeFilter,
        ...planFilter
    };

    const count = await Subscription.countDocuments(query);
    const subscriptions = await Subscription.find(query)
        .populate('user', 'username email') // Populate user details for display
        .populate('verifiedBy', 'username email') // See which admin verified it
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: count,
        page,
        pages: Math.ceil(count / pageSize),
        data: subscriptions
    });
    logger.info(`Admin ${req.user.username} fetched subscriptions with filters: ${JSON.stringify(query)}.`);
});

// @desc    Admin verifies or rejects a manual payment subscription
// @route   PUT /api/admin/subscriptions/:subscriptionId/status
// @access  Private/Admin
const updateSubscriptionStatusByAdmin = asyncHandler(async (req, res, next) => {
    const { subscriptionId } = req.params;
    const { status, adminNotes } = req.body; // transactionId and referenceCode are already on the subscription

    if (!Object.values(SUBSCRIPTION_STATUSES).includes(status)) {
        return next(new AppError('Invalid subscription status provided.', 400));
    }

    const subscription = await Subscription.findById(subscriptionId).populate('user', 'email username isPremium');
    if (!subscription) {
        return next(new AppError('Subscription not found.', 404));
    }

    const user = subscription.user; // User object is already populated
    if (!user) {
        return next(new AppError('Associated user not found for this subscription.', 404));
    }

    // Define allowed status transitions for robust state management
    const allowedStatusTransitions = {
        [SUBSCRIPTION_STATUSES.INITIATED]: [SUBSCRIPTION_STATUSES.PENDING_MANUAL_VERIFICATION, SUBSCRIPTION_STATUSES.ACTIVE, SUBSCRIPTION_STATUSES.FAILED],
        [SUBSCRIPTION_STATUSES.PENDING_MANUAL_VERIFICATION]: [SUBSCRIPTION_STATUSES.ACTIVE, SUBSCRIPTION_STATUSES.FAILED, SUBSCRIPTION_STATUSES.CANCELLED], // Added CANCELLED for pending
        [SUBSCRIPTION_STATUSES.ACTIVE]: [SUBSCRIPTION_STATUSES.CANCELLED, SUBSCRIPTION_STATUSES.EXPIRED],
        [SUBSCRIPTION_STATUSES.CANCELLED]: [], // Once cancelled, usually no transition unless re-subscribed
        [SUBSCRIPTION_STATUSES.EXPIRED]: [], // Once expired, no transition unless re-subscribed
        [SUBSCRIPTION_STATUSES.FAILED]: [SUBSCRIPTION_STATUSES.PENDING_MANUAL_VERIFICATION, SUBSCRIPTION_STATUSES.ACTIVE] // Can re-initiate verification
    };

    if (!allowedStatusTransitions[subscription.status] || !allowedStatusTransitions[subscription.status].includes(status)) {
        return next(new AppError(`Invalid status transition from '${subscription.status}' to '${status}'.`, 400));
    }

    // Update subscription details
    subscription.status = status;
    subscription.adminNotes = adminNotes || subscription.adminNotes; // Allow updating notes
    subscription.verifiedBy = req.user._id;
    subscription.verifiedAt = new Date();

    let notificationMessage = '';
    let emailSubject = '';
    let emailTemplateName = '';

    const adminContactEmail = await getSetting('contactEmail', 'support@quickfix.com');
    const frontendUrl = process.env.FRONTEND_URL;

    // Base email template data
    let emailTemplateData = {
        username: user.username,
        userEmail: user.email,
        plan: subscription.plan.toUpperCase().replace(/_/g, ' '), // Format plan name nicely
        amount: subscription.amount,
        currency: subscription.currency,
        transactionId: subscription.transactionId || 'N/A',
        referenceCode: subscription.referenceCode || 'N/A',
        adminNotes: adminNotes,
        contactEmail: adminContactEmail,
        privacyUrl: `${frontendUrl}/privacy-policy`,
        termsUrl: `${frontendUrl}/terms-of-service`,
        currentYear: new Date().getFullYear()
    };

    if (status === SUBSCRIPTION_STATUSES.ACTIVE) {
        // Set endDate for 1 year from now, or from lastPaymentDate if available
        const effectiveStartDate = subscription.lastPaymentDate || new Date();
        const endDate = new Date(effectiveStartDate);
        endDate.setFullYear(endDate.getFullYear() + 1);
        subscription.endDate = endDate;
        subscription.startDate = effectiveStartDate; // Ensure startDate is also set if it wasn't

        // Update user's premium status and link subscription
        user.isPremium = true;
        user.subscription = subscription._id; // Link the subscription
        await user.save({ validateBeforeSave: false }); // Save user without full validation

        notificationMessage = `Congratulations! Your QuickFix Premium subscription (${subscription.plan.toUpperCase().replace(/_/g, ' ')}) is now active. Enjoy all the premium benefits!`;
        emailSubject = 'QuickFix Premium Activated!';
        emailTemplateName = 'subscriptionConfirmation';
        emailTemplateData = {
            ...emailTemplateData,
            startDate: subscription.startDate.toDateString(),
            endDate: subscription.endDate.toDateString()
        };

        logger.info(`Admin ${req.user.username} activated premium for ${user.email} (Subscription ID: ${subscriptionId}).`);

    } else if (status === SUBSCRIPTION_STATUSES.FAILED) {
        // Revoke premium status if it was active or pending for verification
        if (user.isPremium || user.subscription) { // Check if user currently has premium status or a linked subscription
            user.isPremium = false;
            user.subscription = null;
            await user.save({ validateBeforeSave: false });
        }

        notificationMessage = `Your premium subscription payment for ${subscription.plan.toUpperCase().replace(/_/g, ' ')} could not be verified. Reason: ${adminNotes}. Please check details and try again or contact support.`;
        emailSubject = 'QuickFix Premium Payment Verification Failed';
        emailTemplateName = 'paymentVerificationFailed';
        emailTemplateData = {
            ...emailTemplateData,
            rejectionReason: adminNotes || 'No specific reason provided by admin.'
        };
        logger.warn(`Admin ${req.user.username} marked subscription ${subscriptionId} for ${user.email} as FAILED. Reason: ${adminNotes}.`);

    } else if (status === SUBSCRIPTION_STATUSES.CANCELLED) {
        // Revoke premium status if it was active
        if (user.isPremium || user.subscription) {
            user.isPremium = false;
            user.subscription = null;
            await user.save({ validateBeforeSave: false });
        }

        notificationMessage = `Your QuickFix Premium subscription (${subscription.plan.toUpperCase().replace(/_/g, ' ')}) has been cancelled.`;
        emailSubject = 'QuickFix Premium Subscription Cancelled';
        emailTemplateName = 'subscriptionCancelled';
        logger.info(`Admin ${req.user.username} cancelled subscription ${subscriptionId} for ${user.email}.`);
    }
    // For other statuses like 'initiated' or 'expired', no specific user-facing action or email is triggered here.

    await subscription.save(); // Save the updated subscription

    // Send notifications and emails
    if (notificationMessage) {
        await sendNotificationToUser(user._id, emailSubject, notificationMessage);
    }
    if (emailTemplateName && user.email) {
        try {
            const emailHtml = await loadTemplate(emailTemplateName, emailTemplateData);
            await sendEmail({
                email: user.email,
                subject: emailSubject,
                html: emailHtml
            });
            logger.info(`Email sent to ${user.email} for subscription status update (${status}).`);
        } catch (emailError) {
            logger.error(`Failed to send email for subscription update to ${user.email}: ${emailError.message}`);
        }
    }

    res.status(200).json({
        success: true,
        data: subscription,
        message: `Subscription for ${user.email} marked as ${status.toUpperCase().replace(/_/g, ' ')}.`
    });
    logger.info(`Admin ${req.user.username} updated subscription ${subscriptionId} to status: ${status}.`);
});

// @desc    Get all global settings (for admin management)
// @route   GET /api/admin/settings
// @access  Private/Admin
const getSettings = asyncHandler(async (req, res) => {
    const allSettings = await Settings.find({}); // Fetch all settings

    const transformedSettings = {};
    allSettings.forEach(setting => {
        let value = setting.settingValue;

        // Apply type coercion for all settings to ensure correct types are sent to frontend
        if (['allowRegistration', 'allowLogin', 'enableOtpVerification',
             'newGuideNotificationToSubscribers', 'websiteMaintenanceMode' ,
             'enableComments', 'enableRatings'].includes(setting.settingName)) {
            value = Boolean(value); // Explicitly convert to boolean
        } else if (['basicPlanPrice', 'advancedPlanPrice', 'proPlanPrice'].includes(setting.settingName)) {
            value = Number(value); // Explicitly convert to number
        }
        // For privacyPolicyLastUpdated and termsOfServiceLastUpdated, your client expects 'YYYY-MM-DD' string
        // If they are stored as Date objects in DB, convert them:
        if (['privacyPolicyLastUpdated', 'termsOfServiceLastUpdated'].includes(setting.settingName) && value instanceof Date) {
            value = value.toISOString().split('T')[0];
        }

        transformedSettings[setting.settingName] = value;
    });

    res.status(200).json({
        success: true,
        data: transformedSettings, // Send as a single object keyed by settingName
        message: 'All website settings fetched successfully.'
    });
    logger.info(`Admin ${req.user.username} fetched global settings.`);
});

// @desc    Manage/Update global settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
const manageSettings = asyncHandler(async (req, res, next) => {
    const { settingName, settingValue, description } = req.body;

    if (!settingName || settingValue === undefined) {
        return next(new AppError('Please provide settingName and settingValue', 400));
    }

    // --- Validation and Type Coercion for specific settings before saving to DB ---
    // This ensures data integrity and correct type storage in MongoDB.
    let valueToSave = settingValue; // Default to the raw value

    if (['allowRegistration', 'allowLogin', 'enableOtpVerification', 'newGuideNotificationToSubscribers',
        'websiteMaintenanceMode', 'enableComments', 'enableRatings'].includes(settingName)) {
        if (typeof settingValue !== 'boolean') {
            return next(new AppError(`${settingName} must be a boolean (true/false)`, 400));
        }
        valueToSave = Boolean(settingValue); // Ensure it's a strict boolean
    } else if (['basicPlanPrice', 'advancedPlanPrice', 'proPlanPrice'].includes(settingName)) {
        if (typeof settingValue !== 'number' || isNaN(settingValue) || settingValue < 0) { // Allow 0 for price if needed
            return next(new AppError(`${settingName} must be a positive number or zero`, 400));
        }
        valueToSave = Number(settingValue); // Ensure it's a strict number
    } else if (['upiIdForPremium', 'contactEmail', 'socialFacebookUrl', 'socialTwitterUrl',
        'socialInstagramUrl', 'globalAnnouncement', 'adminPanelUrl','officePhone','officeAddress','officeMapUrl'].includes(settingName)) {
        if (typeof settingValue !== 'string') {
            return next(new AppError(`${settingName} must be a string`, 400));
        }
        // Validate URL format if it's a URL field and not empty
        if (settingName.includes('Url') && settingValue && !settingValue.match(/^(ftp|http|https):\/\/[^ "]+$/)) {
            return next(new AppError(`${settingName} must be a valid URL`, 400));
        }
        // Validate email format if it's the contactEmail field and not empty
        if (settingName === 'contactEmail' && settingValue && !settingValue.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-1]{1,3}\.[0-1]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) {
            return next(new AppError(`Please provide a valid contact email`, 400));
        }
        valueToSave = String(settingValue); // Ensure it's a strict string
    } else if (['privacyPolicyLastUpdated', 'termsOfServiceLastUpdated'].includes(settingName)) {
        if (!(/^\d{4}-\d{2}-\d{2}$/.test(settingValue))) {
            return next(new AppError(`${settingName} must be in YYYY-MM-DD format`, 400));
        }
        valueToSave = new Date(settingValue); // Convert YYYY-MM-DD string to Date object for storage
    } else {
        // If an unknown settingName is sent, return an error
        logger.warn(`Admin ${req.user.username} attempted to update an unrecognized setting: ${settingName}`);
        return next(new AppError(`Unrecognized setting name: ${settingName}`, 400));
    }

    let setting = await Settings.findOne({ settingName: settingName });

    if (setting) {
        setting.settingValue = valueToSave; // Use the coerced value
        setting.description = description || setting.description; // Allow description to be updated or remain unchanged
        setting.lastUpdatedBy = req.user._id;
        await setting.save();
    } else {
        // Create new setting if it doesn't exist
        setting = await Settings.create({
            settingName,
            settingValue: valueToSave, // Use the coerced value
            description,
            lastUpdatedBy: req.user._id
        });
    }

    res.status(200).json({
        success: true,
        data: setting, // You can choose to send back the updated setting or a simple success message
        message: 'Website setting updated successfully.'
    });
    logger.info(`Admin ${req.user.username} updated setting: ${settingName} to ${valueToSave}.`);
});


// @desc    Get all announcements (admin specific, includes inactive ones for management)
// @route   GET /api/admin/announcements
// @access  Private/Admin
const getAnnouncements = asyncHandler(async (req, res) => {
    const announcements = await Announcement.find().populate('createdBy', 'username email').sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        count: announcements.length,
        data: announcements
    });
    logger.info(`Admin ${req.user.username} fetched all announcements.`);
});

// @desc    Create a new announcement
// @route   POST /api/admin/announcements
// @access  Private/Admin
const createAnnouncement = asyncHandler(async (req, res, next) => {
    const { title, content, type, startDate, endDate, isActive } = req.body;

    const announcement = await Announcement.create({
        title,
        content,
        type,
        startDate,
        endDate,
        isActive,
        createdBy: req.user._id
    });

    res.status(201).json({ success: true, data: announcement });
    logger.info(`Admin ${req.user.username} created new announcement: "${announcement.title}"`);

    // Consider if this should notify all users or only a subset based on announcement type
    await sendNotificationToUser(null, 'New Website Announcement', title, 'announcement', `/announcements/${announcement._id}`);
});

// @desc    Update an announcement
// @route   PUT /api/admin/announcements/:id
// @access  Private/Admin
const updateAnnouncement = asyncHandler(async (req, res, next) => {
    const { title, content, type, startDate, endDate, isActive } = req.body;

    let announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
        return next(new AppError('Announcement not found', 404));
    }

    announcement.title = title !== undefined ? title : announcement.title;
    announcement.content = content !== undefined ? content : announcement.content;
    announcement.type = type !== undefined ? type : announcement.type;
    announcement.startDate = startDate !== undefined ? startDate : announcement.startDate;
    announcement.endDate = endDate !== undefined ? endDate : announcement.endDate;
    announcement.isActive = isActive !== undefined ? isActive : announcement.isActive;

    await announcement.save();

    res.status(200).json({ success: true, data: announcement });
    logger.info(`Admin ${req.user.username} updated announcement: "${announcement.title}"`);
});

// @desc    Delete an announcement
// @route   DELETE /api/admin/announcements/:id
// @access  Private/Admin
const deleteAnnouncement = asyncHandler(async (req, res, next) => {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
        return next(new AppError('Announcement not found', 404));
    }

    await Announcement.deleteOne({ _id: announcement._id });

    res.status(200).json({ success: true, message: 'Announcement deleted' });
    logger.info(`Admin ${req.user.username} deleted announcement: "${announcement.title}"`);
});

module.exports = {
    getAdminDashboardStats,
    getUsers,
    getUser,
    updateUser,
    deleteUser,
    toggleUserNewsletterSubscription,
    getAllSubscriptions,
    updateSubscriptionStatusByAdmin,
    getSettings, // Export the updated getSettings
    manageSettings, // Export the updated manageSettings
    getAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
};