const asyncHandler = require('express-async-handler');
const Settings = require('../models/Settings');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

// @desc    Get public website settings
// @route   GET /api/public/settings
// @access  Public
const getPublicSettings = asyncHandler(async (req, res) => {
    const publicSettingNames = [
        'allowRegistration',
        'allowLogin',
        'enableOtpVerification',
        'websiteMaintenanceMode',
        'globalAnnouncement',
        'contactEmail',
        'socialFacebookUrl',
        'socialTwitterUrl',
        'socialInstagramUrl',
        'enableComments',
        'enableRatings',
        'privacyPolicyLastUpdated',
        'termsOfServiceLastUpdated',
        'upiIdForPremium',
        'basicPlanPrice',
        'advancedPlanPrice',
        'proPlanPrice',
        'newGuideNotificationToSubscribers',
        'officePhone',
        'officeAddress',
        'officeMapUrl'
    ];

    const allSettings = await Settings.find({});

    const transformedSettings = {};
    allSettings.forEach(setting => {
        if (publicSettingNames.includes(setting.settingName)) {
            let value = setting.settingValue;

            // --- IMPORTANT: Type Coercion for Booleans and Numbers ---
            // Ensure values are sent as their intended types (e.g., boolean true/false, number 499)
            // as they might be stored as Mixed type in MongoDB or even strings.
            if (['allowRegistration', 'allowLogin', 'enableOtpVerification',
                 'newGuideNotificationToSubscribers', 'websiteMaintenanceMode',
                 'enableComments', 'enableRatings'].includes(setting.settingName)) {
                value = Boolean(value); // Explicitly convert to boolean
            } else if (['basicPlanPrice', 'advancedPlanPrice', 'proPlanPrice'].includes(setting.settingName)) {
                value = Number(value); // Explicitly convert to number
            }
            // Date values are sent as strings YYYY-MM-DD from client, and you're parsing them
            // on the client. If stored as Date objects in DB, keep as is or convert to string for consistency.
            // Your client logic `new Date(settings[key]).toISOString().split('T')[0]` handles ISO strings.
            // If stored as string 'YYYY-MM-DD', no conversion needed here.

            transformedSettings[setting.settingName] = value;
        }
    });

    res.status(200).json({
        success: true,
        data: transformedSettings,
        message: 'Public website settings fetched successfully.'
    });
    logger.info('Public settings API accessed.');
});

// @desc    Get premium payment settings (can be public or slightly restricted)
// @route   GET /api/public/premium-settings (new route)
// @access  Public (or if logged in)
const getPremiumPaymentSettings = asyncHandler(async (req, res) => {
    // This controller appears to be unused by AdminSettings, but including it.
    // It's also fetching 'premiumSubscriptionAmount' which was replaced by plan prices.
    // Consider updating this or removing it if no longer relevant.
    const paymentSettings = await Settings.find({
        settingName: { $in: ['upiIdForPremium', 'basicPlanPrice', 'advancedPlanPrice', 'proPlanPrice'] } // Adjusted for new prices
    });

    const transformedSettings = {};
    paymentSettings.forEach(setting => {
        let value = setting.settingValue;
        if (['basicPlanPrice', 'advancedPlanPrice', 'proPlanPrice'].includes(setting.settingName)) {
            value = Number(value);
        }
        transformedSettings[setting.settingName] = value;
    });


    res.status(200).json({
        success: true,
        data: {
            upiIdForPremium: transformedSettings.upiIdForPremium || '', // Default to empty string
            basicPlanPrice: transformedSettings.basicPlanPrice !== undefined ? transformedSettings.basicPlanPrice : 499,
            advancedPlanPrice: transformedSettings.advancedPlanPrice !== undefined ? transformedSettings.advancedPlanPrice : 999,
            proPlanPrice: transformedSettings.proPlanPrice !== undefined ? transformedSettings.proPlanPrice : 1999
        }
    });
    logger.info('Premium payment settings API accessed.');
});

module.exports = {
    getPublicSettings,
    getPremiumPaymentSettings
};