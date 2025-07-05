// quickfix-website/server/utils/scheduledTasks.js
const User = require('../models/User');
const Notification = require('../models/Notification');
const Settings = require('../models/Settings'); // Import Settings model
const { sendEmail, loadTemplate } = require('../config/email'); // Ensure correct path
const logger = require('./logger');
const { NOTIFICATION_TYPES, ROUTES } = require('./constants'); // Import constants

// Helper to get a setting value from the database
const getSetting = async (name, defaultValue) => {
    const setting = await Settings.findOne({ settingName: name });
    return setting ? setting.settingValue : defaultValue;
};

// Function to send email verification reminders to unverified users
const sendVerificationReminders = async () => {
    try {
        const emailVerificationEnabled = await getSetting('enableEmailVerification', false);
        if (!emailVerificationEnabled) {
            logger.info('Email verification is disabled. Skipping sending verification reminders.');
            return;
        }

        const initialDelayHours = parseInt(process.env.EMAIL_VERIFICATION_REMINDER_INITIAL_DELAY_HOURS || 24);
        const intervalHours = parseInt(process.env.EMAIL_VERIFICATION_REMINDER_INTERVAL_HOURS || 12);
        
        const reminderThresholdDate = new Date(Date.now() - initialDelayHours * 60 * 60 * 1000);
        const subsequentReminderThresholdDate = new Date(Date.now() - intervalHours * 60 * 60 * 1000);

        const usersToRemind = await User.find({
            emailVerified: false,
            // Find users who haven't verified and either:
            // 1. Were created 'initialDelayHours' ago and haven't had a verification email sent in the last 'intervalHours'
            // 2. Had their last verification email sent 'intervalHours' ago (for subsequent reminders)
            $or: [
                {
                    createdAt: { $lte: reminderThresholdDate },
                    lastVerificationEmailSent: { $lte: subsequentReminderThresholdDate }
                },
                {
                    lastVerificationEmailSent: { $exists: false, $lte: reminderThresholdDate } // For users who registered before lastVerificationEmailSent was added
                }
            ]
        }).select('username email lastVerificationEmailSent emailVerificationToken emailVerificationExpires');


        if (usersToRemind.length === 0) {
            logger.info('No unverified users found to send reminders to based on schedule.');
            return;
        }

        logger.info(`Found ${usersToRemind.length} unverified users to send reminders to.`);

        for (const user of usersToRemind) {
            // Generate a new token even if one exists, as the old one might be expired or already used.
            const verificationToken = user.getEmailVerificationToken(); // This updates token and expiry on the user object
            user.lastVerificationEmailSent = Date.now(); // Update the timestamp
            await user.save({ validateBeforeSave: false }); // Save the new token and timestamp

            const verificationURL = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
            const emailVerificationHtml = loadTemplate('emailVerification', {
                username: user.username,
                verificationUrl: verificationURL,
                verification_expire_hours: process.env.EMAIL_VERIFICATION_EXPIRE_HOURS || 24,
                currentYear: new Date().getFullYear()
            });

            try {
                await sendEmail({
                    email: user.email,
                    subject: 'Action Required: Verify Your QuickFix Account!',
                    html: emailVerificationHtml,
                    text: `Your QuickFix account needs verification to unlock full access. Please verify your email by clicking this link: ${verificationURL}. This link is valid for ${process.env.EMAIL_VERIFICATION_EXPIRE_HOURS || 24} hours.`
                });

                // Also send an in-app notification to the user
                await Notification.create({
                    user: user._id,
                    title: 'Urgent: Verify Your Account!',
                    message: 'Your account is not yet verified. Click here to receive a new verification link and activate full features.',
                    type: NOTIFICATION_TYPES.ACCOUNT_VERIFICATION,
                    link: ROUTES.VERIFY_EMAIL // Link to the generic verification page
                });
                logger.info(`Sent verification reminder email and added in-app notification for user: ${user.email}`);
            } catch (emailError) {
                logger.error(`Failed to send verification reminder email to ${user.email}: ${emailError.message}`);
            }
        }
    } catch (error) {
        logger.error(`Error in sendVerificationReminders scheduled task: ${error.message}`, error);
    }
};

// Function to clean up old unverified accounts
const cleanupUnverifiedAccounts = async () => {
    try {
        const emailVerificationEnabled = await getSetting('enableEmailVerification', false);
        if (!emailVerificationEnabled) {
            logger.info('Email verification is disabled. Skipping cleanup of unverified accounts.');
            return;
        }

        const deletionHours = parseInt(process.env.UNVERIFIED_ACCOUNT_DELETION_HOURS || 48); // Default 48 hours for deletion
        const deletionThresholdDate = new Date(Date.now() - deletionHours * 60 * 60 * 1000);

        const usersToDelete = await User.find({
            emailVerified: false,
            // Account must be older than the deletion threshold
            createdAt: { $lte: deletionThresholdDate },
            // AND the last verification email sent must also be older than the deletion threshold
            // This prevents deleting accounts if a new verification email was recently sent but not yet clicked.
            lastVerificationEmailSent: { $lte: deletionThresholdDate }
        });

        if (usersToDelete.length === 0) {
            logger.info('No old unverified accounts found for cleanup.');
            return;
        }

        logger.info(`Found ${usersToDelete.length} old unverified accounts to delete.`);

        for (const user of usersToDelete) {
            await User.deleteOne({ _id: user._id });
            // Optionally, delete any related data (e.g., pending notifications) for this user ID
            await Notification.deleteMany({ user: user._id });
            logger.info(`Deleted unverified account for email: ${user.email} (created at ${user.createdAt.toISOString()}).`);
        }
    } catch (error) {
        logger.error(`Error in cleanupUnverifiedAccounts scheduled task: ${error.message}`, error);
    }
};

module.exports = {
    sendVerificationReminders,
    cleanupUnverifiedAccounts
};