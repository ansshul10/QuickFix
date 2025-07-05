// quickfix-website/server/services/newsletterService.js
const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const User = require('../models/User');
const { sendEmail, loadTemplate } = require('../config/email');
const logger = require('../utils/logger');
const AppError = require('../utils/appError');

// @desc    Send a bulk email to all active newsletter subscribers
const sendBulkNewsletterEmailFromService = async (subject, htmlContent, type = 'newsletter_campaign') => {
    const activeSubscribers = await NewsletterSubscriber.find({ active: true }).select('email');
    const emails = activeSubscribers.map(sub => sub.email);

    if (emails.length === 0) {
        logger.info('No active newsletter subscribers to send bulk email.');
        return { sentCount: 0, failedCount: 0 };
    }

    let sentCount = 0;
    let failedCount = 0;

    const sendPromises = emails.map(async (email) => {
        try {
            await sendEmail({
                email,
                subject,
                html: htmlContent
            });
            return { status: 'fulfilled', email };
        } catch (error) {
            logger.error(`Failed to send bulk email to ${email}: ${error.message}`);
            return { status: 'rejected', email, error };
        }
    });

    const results = await Promise.allSettled(sendPromises);

    results.forEach(result => {
        if (result.status === 'fulfilled') {
            sentCount++;
        } else {
            failedCount++;
        }
    });

    logger.info(`Bulk newsletter email sent summary: Subject "${subject}", Sent: ${sentCount}, Failed: ${failedCount}.`);
    return { sentCount, failedCount };
};


// @desc    Send an individual email
const sendIndividualEmailFromService = async (email, subject, htmlContent) => {
    try {
        await sendEmail({
            email,
            subject,
            html: htmlContent
        });
        logger.info(`Individual email sent to ${email}: "${subject}"`);
        return { success: true };
    } catch (error) {
        logger.error(`Failed to send individual email to ${email}: ${error.message}`);
        throw new AppError(`Failed to send email: ${error.message}`, 500);
    }
};

module.exports = {
    sendBulkNewsletterEmailFromService,
    sendIndividualEmailFromService
};