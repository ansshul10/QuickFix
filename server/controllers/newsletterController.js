// quickfix-website/server/controllers/newsletterController.js
const asyncHandler = require('express-async-handler');
const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const User = require('../models/User'); // Ensure User model is imported
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { sendEmail, loadTemplate } = require('../config/email');
const { sendBulkNewsletterEmailFromService, sendIndividualEmailFromService } = require('../services/newsletterService');

// @desc    Subscribe to the newsletter
// @route   POST /api/newsletter/subscribe
// @access  Public
const subscribeToNewsletter = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    let subscriber = await NewsletterSubscriber.findOne({ email });

    if (subscriber && subscriber.active) {
        return next(new AppError('This email is already subscribed to the newsletter.', 400));
    }

    if (subscriber && !subscriber.active) {
        subscriber.active = true;
        subscriber.subscribedAt = Date.now();
        await subscriber.save();
        res.status(200).json({ success: true, message: 'Successfully re-subscribed to the newsletter.' });
        logger.info(`Email ${email} re-subscribed to newsletter.`);
        return;
    }

    subscriber = await NewsletterSubscriber.create({ email, active: true });

    const user = await User.findOne({ email });
    if (user) {
        user.newsletterSubscriber = true;
        await user.save({ validateBeforeSave: false });
    }

    const welcomeHtml = loadTemplate('welcomeNewsletter', {
        email: email,
        unsubscribeUrl: `${process.env.FRONTEND_URL}/newsletter/unsubscribe?email=${encodeURIComponent(email)}`,
        currentYear: new Date().getFullYear()
    });
    await sendEmail({
        email,
        subject: 'Welcome to the QuickFix Newsletter!',
        html: welcomeHtml
    });

    res.status(201).json({ success: true, message: 'Successfully subscribed to the newsletter!' });
    logger.info(`New email ${email} subscribed to newsletter.`);
});

// @desc    Unsubscribe from the newsletter
// @route   POST /api/newsletter/unsubscribe
// @access  Public
const unsubscribeFromNewsletter = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    const subscriber = await NewsletterSubscriber.findOne({ email });

    if (!subscriber || !subscriber.active) {
        return next(new AppError('This email is not subscribed or already unsubscribed.', 400));
    }

    subscriber.active = false;
    await subscriber.save();

    const user = await User.findOne({ email });
    if (user) {
        user.newsletterSubscriber = false;
        await user.save({ validateBeforeSave: false });
    }

    const goodbyeHtml = loadTemplate('goodbyeNewsletter', {
        email: email,
        currentYear: new Date().getFullYear()
    });
    await sendEmail({
        email,
        subject: 'You have unsubscribed from QuickFix Newsletter',
        html: goodbyeHtml
    });

    res.status(200).json({ success: true, message: 'Successfully unsubscribed from the newsletter.' });
    logger.info(`Email ${email} unsubscribed from newsletter.`);
});

// @desc    Get all newsletter subscribers (Admin Only) with pagination and search
// @route   GET /api/newsletter/admin/subscribers
// @access  Private/Admin
const getNewsletterSubscribers = asyncHandler(async (req, res) => {
    const { page, limit, keyword } = req.query;

    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;

    let query = {};
    if (typeof keyword === 'string' && keyword.trim() !== '') {
        query.email = { $regex: keyword.trim(), $options: 'i' };
    }

    const totalCount = await NewsletterSubscriber.countDocuments(query);

    const subscribers = await NewsletterSubscriber.find(query)
        .sort({ subscribedAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        // NEW: Populate the user details if a user with this email exists
        // We'll add a virtual to NewsletterSubscriber model to link to User
        .populate({
            path: 'userAccount', // This refers to the virtual we will add in NewsletterSubscriber model
            select: '_id username email' // Select relevant fields from User
        });


    // Manually add userAccountExists property and _id if populated
    const formattedSubscribers = subscribers.map(sub => {
        const subscriberObject = sub.toObject({ virtuals: true }); // Ensure virtuals are included
        return {
            ...subscriberObject,
            userAccountExists: !!subscriberObject.userAccount, // True if userAccount is populated
            user: subscriberObject.userAccount || null // Pass the populated user object or null
        };
    });

    res.status(200).json({
        success: true,
        count: totalCount,
        page: pageNumber,
        pages: Math.ceil(totalCount / pageSize),
        data: formattedSubscribers // Send the formatted subscribers
    });
    logger.info(`Admin ${req.user ? req.user.username : 'Unknown'} fetched newsletter subscribers. Page: ${pageNumber}, Limit: ${pageSize}, Keyword: "${keyword || ''}"`);
});

// @desc    Get a single newsletter subscriber by email (Admin Only)
// @route   GET /api/newsletter/admin/subscriber/:email
// @access  Private/Admin
const getNewsletterSubscriberByEmail = asyncHandler(async (req, res, next) => {
    const { email } = req.params;

    const subscriber = await NewsletterSubscriber.findOne({ email })
        .populate({
            path: 'userAccount',
            select: '_id username email'
        });

    if (!subscriber) {
        return next(new AppError(`No newsletter subscriber found with email: ${email}`, 404));
    }

    const subscriberObject = subscriber.toObject({ virtuals: true });
    const formattedSubscriber = {
        ...subscriberObject,
        userAccountExists: !!subscriberObject.userAccount,
        user: subscriberObject.userAccount || null
    };

    res.status(200).json({
        success: true,
        data: formattedSubscriber
    });
    logger.info(`Admin ${req.user ? req.user.username : 'Unknown'} fetched single newsletter subscriber: ${email}`);
});


// @desc    Send a bulk email to all active newsletter subscribers (Admin Only)
// @route   POST /api/newsletter/admin/bulk-send
// @access  Private/Admin
const sendBulkNewsletterEmail = asyncHandler(async (req, res, next) => {
    const { subject, htmlContent } = req.body;

    if (!subject || !htmlContent) {
        return next(new AppError('Subject and HTML content are required for bulk email.', 400));
    }

    const { sentCount, failedCount } = await sendBulkNewsletterEmailFromService(subject, htmlContent);

    res.status(200).json({
        success: true,
        message: `Bulk email sending initiated. Sent to ${sentCount} subscribers, ${failedCount} failed.`
    });
    logger.info(`Admin ${req.user ? req.user.username : 'Unknown'} initiated bulk email: "${subject}". Sent: ${sentCount}, Failed: ${failedCount}.`);
});

// @desc    Send an individual email to a specific user/subscriber (Admin Only)
// @route   POST /api/newsletter/admin/send-individual
// @access  Private/Admin
const sendIndividualNewsletterEmail = asyncHandler(async (req, res, next) => {
    const { email, subject, htmlContent } = req.body;

    if (!email || !subject || !htmlContent) {
        return next(new AppError('Recipient email, subject, and HTML content are required for individual email.', 400));
    }

    const userOrSubscriber = await User.findOne({ email }) || await NewsletterSubscriber.findOne({ email });
    if (!userOrSubscriber) {
        return next(new AppError('No registered user or subscriber found with that email.', 404));
    }

    try {
        await sendIndividualEmailFromService(email, subject, htmlContent);
        res.status(200).json({ success: true, message: `Email sent to ${email} successfully.` });
        logger.info(`Admin ${req.user ? req.user.username : 'Unknown'} sent individual email to ${email}: "${subject}".`);
    } catch (error) {
        return next(new AppError(`Failed to send email to ${email}: ${error.message}`, 500));
    }
});


module.exports = {
    subscribeToNewsletter,
    unsubscribeFromNewsletter,
    getNewsletterSubscribers,
    getNewsletterSubscriberByEmail,
    sendBulkNewsletterEmail,
    sendIndividualNewsletterEmail
};