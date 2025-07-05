// quickfix-website/server/controllers/publicController.js

const asyncHandler = require('express-async-handler');
const Settings = require('../models/Settings');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

// @desc    Get public-facing website settings (e.g., premium plan prices, contact info, UPI ID)
// @route   GET /api/public/settings
// @access  Public
const getPublicSettings = asyncHandler(async (req, res) => {
    // Define which settings are safe to expose publicly
    const publicSettingNames = [
        'upiIdForPremium',
        'basicPlanPrice',
        'advancedPlanPrice',
        'proPlanPrice',
        'contactEmail',
        'socialFacebookUrl',
        'socialTwitterUrl',
        'socialInstagramUrl',
        'globalAnnouncement',
        'allowRegistration',
        'allowLogin',
        'enableOtpVerification',
        'enableComments',
        'enableRatings',
        'privacyPolicyLastUpdated',
        'websiteMaintenanceMode',
        'newGuideNotificationToSubscribers',
        'termsOfServiceLastUpdated',
        // --- NEW SETTINGS ADDED ---
        'officePhone',
        'officeAddress',
        'officeMapUrl'
    ];

    const settings = await Settings.find({ settingName: { $in: publicSettingNames } }).select('settingName settingValue');

    // Format the settings into an object for easier consumption on the frontend
    const formattedSettings = settings.reduce((acc, setting) => {
        acc[setting.settingName] = setting.settingValue;
        return acc;
    }, {});

    res.status(200).json({
        success: true,
        data: formattedSettings
    });
    logger.info('Public settings fetched.');
});

// Assuming other public functions might exist in this controller
module.exports = {
    getPublicSettings,
    // ... other public functions like getPublicAnnouncements, etc.
};