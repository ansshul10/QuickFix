const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
    settingName: {
        type: String,
        required: true,
        unique: true,
        enum: [
            'allowRegistration',
            'allowLogin',
            'websiteMaintenanceMode',
            'upiIdForPremium',
            'basicPlanPrice',
            'advancedPlanPrice',
            'proPlanPrice',
            'newGuideNotificationToSubscribers',
            // UPDATED: Replaced 'enableOtpVerification' with 'enableEmailVerification'
            'enableEmailVerification', 
            'contactEmail',
            'socialFacebookUrl',
            'socialTwitterUrl',
            'socialInstagramUrl',
            'globalAnnouncement',
            'enableComments',
            'enableRatings',
            'privacyPolicyLastUpdated',
            'termsOfServiceLastUpdated',
            'adminPanelUrl',
            // --- NEW SETTINGS ADDED ---
            'officePhone',
            'officeAddress',
            'officeMapUrl'
        ]
    },
    settingValue: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    description: String,
    lastUpdatedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Settings', SettingsSchema);
