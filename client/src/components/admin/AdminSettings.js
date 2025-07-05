import React, { useState, useEffect, useContext, useCallback } from 'react';
import { SettingsContext } from '../../context/SettingsContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';
import {
    validateOptionalEmail,
    validateUrl,
    validateDate,
    validateOptionalString
} from '../../utils/validation';
import LoginBg from '../../assets/images/Login_bg.png'; // Import the background image


function AdminSettings() {
    const { settings, loadingSettings, error, updateSetting, fetchSettings } = useContext(SettingsContext);

    const [formValues, setFormValues] = useState({});
    const [formErrors, setFormErrors] = useState({});
    const [formLoading, setFormLoading] = useState(false);

    // Memoize default setting values for consistent initialization
    // This function defines the expected shape and default values of all your settings.
    // It's crucial that this list is comprehensive for all settings used in the form.
    const defaultSettingValues = useCallback(() => ({
        allowRegistration: false,
        allowLogin: false,
        websiteMaintenanceMode: false,
        upiIdForPremium: '',
        basicPlanPrice: 499,
        advancedPlanPrice: 999,
        proPlanPrice: 1999,
        newGuideNotificationToSubscribers: false,
        enableOtpVerification: false, // Explicit default for OTP
        // --- NEW SETTINGS ADDED (1/4) ---
        officePhone: '',
        officeAddress: '',
        officeMapUrl: '',
        contactEmail: '',
        socialFacebookUrl: '',
        socialTwitterUrl: '',
        socialInstagramUrl: '',
        globalAnnouncement: '',
        enableComments: false,
        enableRatings: false,
        adminPanelUrl: '',
        privacyPolicyLastUpdated: '',
        termsOfServiceLastUpdated: ''
    }), []); // Empty dependency array means this function is stable and won't cause re-renders

    // This useEffect will initialize formValues once settings are loaded from the context.
    useEffect(() => {
        // Only proceed if settings are done loading and there's no overall error from the context
        if (!loadingSettings && !error) {
            const initialFormValues = {};
            // Iterate over all known default setting keys to ensure formValues is always complete
            for (const key in defaultSettingValues()) {
                // If the setting exists and is not null/undefined in the fetched settings, use it
                if (settings && settings[key] !== undefined && settings[key] !== null) {
                    // Special handling for date fields: convert to 'YYYY-MM-DD' format for HTML date input
                    if (key === 'privacyPolicyLastUpdated' || key === 'termsOfServiceLastUpdated') {
                        initialFormValues[key] = settings[key] ? new Date(settings[key]).toISOString().split('T')[0] : '';
                    } else {
                        // For other types (booleans, strings, numbers), directly use the fetched value
                        initialFormValues[key] = settings[key];
                    }
                } else {
                    // Otherwise, use the predefined default value
                    initialFormValues[key] = defaultSettingValues()[key];
                }
            }
            setFormValues(initialFormValues);
        }
    }, [settings, loadingSettings, error, defaultSettingValues]); // Dependencies for this effect

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormValues(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
        }));
        setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateField = (name, value) => {
        switch (name) {
            case 'contactEmail': return validateOptionalEmail(value);
            case 'officePhone': return validateOptionalString(value, 15); // Max 15 chars for phone
            case 'officeAddress': return validateOptionalString(value, 200); // Max 200 chars for address
            case 'officeMapUrl': return validateUrl(value);
            case 'socialFacebookUrl':
            case 'socialTwitterUrl':
            case 'socialInstagramUrl':
            case 'adminPanelUrl': return validateUrl(value);
            case 'privacyPolicyLastUpdated':
            case 'termsOfServiceLastUpdated': return validateDate(value);
            case 'basicPlanPrice':
            case 'advancedPlanPrice':
            case 'proPlanPrice':
                // Allow 0 for prices, if that's a valid business case. If not, change to value <= 0.
                if (typeof value !== 'number' || isNaN(value) || value < 0) return "Must be a positive number or zero.";
                return null;
            case 'upiIdForPremium':
                if (typeof value !== 'string' || value.trim() === '') return "UPI ID cannot be empty.";
                return null;
            case 'globalAnnouncement':
                return validateOptionalString(value);
            default: return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        let hasFormErrors = false;
        const newFormErrors = {};

        // Validate all fields before submission
        for (const key in formValues) {
            const validationError = validateField(key, formValues[key]);
            if (validationError) {
                newFormErrors[key] = validationError;
                hasFormErrors = true;
            }
        }
        setFormErrors(newFormErrors);

        if (hasFormErrors) {
            setFormLoading(false);
            toast.error("Please correct the form errors.");
            return;
        }

        let successCount = 0;
        let failCount = 0;

        for (const settingName in formValues) {
            // Get the current value from the context's settings (the 'source of truth' from backend)
            let currentValueInSettings = settings ? settings[settingName] : undefined;

            // Special handling for date fields for accurate comparison
            if ((settingName === 'privacyPolicyLastUpdated' || settingName === 'termsOfServiceLastUpdated') && currentValueInSettings) {
                // Ensure the context value is in the same 'YYYY-MM-DD' format for comparison
                currentValueInSettings = new Date(currentValueInSettings).toISOString().split('T')[0];
            }

            // Only update settings that have actually changed to avoid unnecessary API calls
            if (currentValueInSettings !== formValues[settingName]) {
                const description = defaultSettingsDescriptions[settingName] || '';
                const success = await updateSetting(settingName, formValues[settingName], description);
                if (success) {
                    successCount++;
                } else {
                    failCount++;
                }
            }
        }

        if (successCount > 0) {
            toast.success(`${successCount} settings updated successfully.`);
            // After successful updates, re-fetch settings to ensure the UI reflects the latest state
            // and to account for any server-side transformations or consistency checks.
            await fetchSettings();
        }
        if (failCount > 0) {
            toast.error(`${failCount} settings failed to update.`);
        } else if (successCount === 0 && !hasFormErrors) {
            // Only show this info if no errors were found and no changes were made.
            toast.info("No settings were changed or saved.");
        }
        setFormLoading(false);
    };

    // Descriptions for each setting, mainly used for the updateSetting function in context
    const defaultSettingsDescriptions = {
        allowRegistration: 'Enable or disable new user registrations.',
        allowLogin: 'Enable or disable user logins.',
        websiteMaintenanceMode: 'Put the website in maintenance mode (only admin can access).',
        upiIdForPremium: 'The UPI ID for premium subscriptions (for UPI payment method).',
        basicPlanPrice: 'The price for the Basic premium plan (in INR).',
        advancedPlanPrice: 'The price for the Advanced premium plan (in INR).',
        proPlanPrice: 'The price for the Pro premium plan (in INR).',
        newGuideNotificationToSubscribers: 'Send email notifications to newsletter subscribers for new guides.',
        enableOtpVerification: 'Enable OTP email verification for new user registrations.',
        contactEmail: 'Official contact email for the website.',
        // --- NEW DESCRIPTIONS ADDED (3/4) ---
        officePhone: 'Official business phone number.',
        officeAddress: 'Physical address of the office.',
        officeMapUrl: 'Full Google Maps URL for the office location.',
        socialFacebookUrl: 'URL for Facebook page.',
        socialTwitterUrl: 'URL for Twitter/X page.',
        socialInstagramUrl: 'URL for Instagram page.',
        globalAnnouncement: 'A general announcement displayed on the website.',
        enableComments: 'Allow users to post comments on guides.',
        enableRatings: 'Allow users to rate guides.',
        privacyPolicyLastUpdated: 'Date when the Privacy Policy was last updated (YYYY-MM-DD).',
        termsOfServiceLastUpdated: 'Date when the Terms of Service were last updated (YYYY-MM-DD).',
        adminPanelUrl: 'Base URL for the admin panel, used in admin notification emails.'
    };

    // --- Conditional Rendering for Loading and Error States ---
    if (loadingSettings) {
        return <LoadingSpinner fullScreen={false} message="Loading settings..." />;
    }

    if (error) {
        return <div className="text-center text-error-dark dark:text-error-light text-lg mt-8">{error}</div>;
    }

    // IMPORTANT: This check ensures the form doesn't render until `formValues` has been fully populated.
    // This prevents the flicker where a toggle might briefly show an incorrect (e.g., false) state
    // before the actual data from `settings` is reflected in `formValues`.
    if (Object.keys(formValues).length === 0) {
        return <LoadingSpinner fullScreen={false} message="Initializing form data..." />;
    }

    // --- Reusable ToggleSwitch Component ---
    const ToggleSwitch = ({ name, label, checked, onChange, disabled }) => (
        <div className="flex items-center justify-between py-2">
            <label htmlFor={name} className="text-sm font-medium text-textDefault dark:text-text-default">
                {label}
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    id={name}
                    name={name}
                    className="sr-only peer"
                    checked={checked} // This binding is crucial and correctly done
                    onChange={onChange}
                    disabled={disabled}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-light dark:peer-focus:ring-primary rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
        </div>
    );

    // --- Main AdminSettings Form JSX ---
    return (
        <div className="p-4 bg-cardBackground dark:bg-card-background rounded-lg shadow-lg border border-border dark:border-border">
            <h2 className="text-3xl font-bold text-textDefault dark:text-text-default mb-6 text-center">Website Settings</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* General Settings */}
                <div className="bg-background dark:bg-card-background p-6 rounded-lg border border-border dark:border-border">
                    <h3 className="text-xl font-semibold text-textDefault dark:text-text-default mb-4">General Website Control</h3>
                    <div className="grid grid-cols-1 gap-2">
                        <ToggleSwitch
                            name="allowRegistration"
                            label="Allow New Registrations"
                            checked={formValues.allowRegistration}
                            onChange={handleChange}
                            disabled={formLoading}
                        />
                        <ToggleSwitch
                            name="allowLogin"
                            label="Allow User Login"
                            checked={formValues.allowLogin}
                            onChange={handleChange}
                            disabled={formLoading}
                        />
                        <ToggleSwitch
                            name="websiteMaintenanceMode"
                            label="Enable Maintenance Mode"
                            checked={formValues.websiteMaintenanceMode}
                            onChange={handleChange}
                            disabled={formLoading}
                        />
                        <ToggleSwitch
                            name="enableOtpVerification"
                            label="Enable OTP for Registration"
                            checked={formValues.enableOtpVerification}
                            onChange={handleChange}
                            disabled={formLoading}
                        />
                        <ToggleSwitch
                            name="enableComments"
                            label="Enable Comments on Guides"
                            checked={formValues.enableComments}
                            onChange={handleChange}
                            disabled={formLoading}
                        />
                        <ToggleSwitch
                            name="enableRatings"
                            label="Enable Ratings on Guides"
                            checked={formValues.enableRatings}
                            onChange={handleChange}
                            disabled={formLoading}
                        />
                        <ToggleSwitch
                            name="newGuideNotificationToSubscribers"
                            label="Notify Newsletter Subscribers for New Guides"
                            checked={formValues.newGuideNotificationToSubscribers}
                            onChange={handleChange}
                            disabled={formLoading}
                        />
                    </div>
                </div>

                {/* Contact & Social Settings */}

                {/* --- NEW JSX SECTION ADDED (4/4) --- */}
                <div className="bg-background dark:bg-gray-900/50 p-6 rounded-lg border border-border dark:border-gray-700">
                    <h3 className="text-xl font-semibold text-textDefault dark:text-white mb-4">Office & Location Details</h3>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="officePhone" className="block text-sm font-medium text-textDefault dark:text-white mb-1">Office Phone</label>
                            <input
                                type="tel"
                                id="officePhone"
                                name="officePhone"
                                value={formValues.officePhone || ''}
                                onChange={handleChange}
                                className={`w-full p-2 border ${formErrors.officePhone ? 'border-red-500' : 'border-border'} rounded-md bg-background dark:bg-gray-800 text-textDefault dark:text-white focus:ring-red-500 focus:border-red-500`}
                                disabled={formLoading}
                                placeholder="+91 12345 67890"
                            />
                            {formErrors.officePhone && <p className="mt-1 text-sm text-red-500">{formErrors.officePhone}</p>}
                        </div>
                        <div>
                            <label htmlFor="officeAddress" className="block text-sm font-medium text-textDefault dark:text-white mb-1">Office Address</label>
                            <input
                                type="text"
                                id="officeAddress"
                                name="officeAddress"
                                value={formValues.officeAddress || ''}
                                onChange={handleChange}
                                className={`w-full p-2 border ${formErrors.officeAddress ? 'border-red-500' : 'border-border'} rounded-md bg-background dark:bg-gray-800 text-textDefault dark:text-white focus:ring-red-500 focus:border-red-500`}
                                disabled={formLoading}
                                placeholder="123 Innovation Drive, Tech City, 452001"
                            />
                            {formErrors.officeAddress && <p className="mt-1 text-sm text-red-500">{formErrors.officeAddress}</p>}
                        </div>
                        <div>
                            <label htmlFor="officeMapUrl" className="block text-sm font-medium text-textDefault dark:text-white mb-1">Office Google Maps URL</label>
                            <input
                                type="url"
                                id="officeMapUrl"
                                name="officeMapUrl"
                                value={formValues.officeMapUrl || ''}
                                onChange={handleChange}
                                className={`w-full p-2 border ${formErrors.officeMapUrl ? 'border-red-500' : 'border-border'} rounded-md bg-background dark:bg-gray-800 text-textDefault dark:text-white focus:ring-red-500 focus:border-red-500`}
                                disabled={formLoading}
                                placeholder="https://maps.google.com/..."
                            />
                            {formErrors.officeMapUrl && <p className="mt-1 text-sm text-red-500">{formErrors.officeMapUrl}</p>}
                        </div>
                    </div>
                </div>

                <div className="bg-background dark:bg-card-background p-6 rounded-lg border border-border dark:border-border">
                    <h3 className="text-xl font-semibold text-textDefault dark:text-text-default mb-4">Contact & Social Links</h3>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="contactEmail" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">Contact Email</label>
                            <input
                                type="email"
                                id="contactEmail"
                                name="contactEmail"
                                value={formValues.contactEmail || ''}
                                onChange={handleChange}
                                className={`w-full p-2 border ${formErrors.contactEmail ? 'border-error' : 'border-border'} rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary`}
                                disabled={formLoading}
                                placeholder="Leave empty if not applicable"
                            />
                            {formErrors.contactEmail && <p className="mt-1 text-sm text-error">{formErrors.contactEmail}</p>}
                        </div>
                        <div>
                            <label htmlFor="socialFacebookUrl" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">Facebook URL</label>
                            <input
                                type="url"
                                id="socialFacebookUrl"
                                name="socialFacebookUrl"
                                value={formValues.socialFacebookUrl || ''}
                                onChange={handleChange}
                                className={`w-full p-2 border ${formErrors.socialFacebookUrl ? 'border-error' : 'border-border'} rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary`}
                                disabled={formLoading}
                                placeholder="Leave empty if not applicable"
                            />
                            {formErrors.socialFacebookUrl && <p className="mt-1 text-sm text-error">{formErrors.socialFacebookUrl}</p>}
                        </div>
                        <div>
                            <label htmlFor="socialTwitterUrl" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">Twitter/X URL</label>
                            <input
                                type="url"
                                id="socialTwitterUrl"
                                name="socialTwitterUrl"
                                value={formValues.socialTwitterUrl || ''}
                                onChange={handleChange}
                                className={`w-full p-2 border ${formErrors.socialTwitterUrl ? 'border-error' : 'border-border'} rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary`}
                                disabled={formLoading}
                                placeholder="Leave empty if not applicable"
                            />
                            {formErrors.socialTwitterUrl && <p className="mt-1 text-sm text-error">{formErrors.socialTwitterUrl}</p>}
                        </div>
                        <div>
                            <label htmlFor="socialInstagramUrl" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">Instagram URL</label>
                            <input
                                type="url"
                                id="socialInstagramUrl"
                                name="socialInstagramUrl"
                                value={formValues.socialInstagramUrl || ''}
                                onChange={handleChange}
                                className={`w-full p-2 border ${formErrors.socialInstagramUrl ? 'border-error' : 'border-border'} rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary`}
                                disabled={formLoading}
                                placeholder="Leave empty if not applicable"
                            />
                            {formErrors.socialInstagramUrl && <p className="mt-1 text-sm text-error">{formErrors.socialInstagramUrl}</p>}
                        </div>
                        <div>
                            <label htmlFor="adminPanelUrl" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">Admin Panel URL</label>
                            <input
                                type="url"
                                id="adminPanelUrl"
                                name="adminPanelUrl"
                                value={formValues.adminPanelUrl || ''}
                                onChange={handleChange}
                                className={`w-full p-2 border ${formErrors.adminPanelUrl ? 'border-error' : 'border-border'} rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary`}
                                disabled={formLoading}
                                placeholder="e.g., http://localhost:3000/admin"
                            />
                            {formErrors.adminPanelUrl && <p className="mt-1 text-sm text-error">{formErrors.adminPanelUrl}</p>}
                        </div>
                    </div>
                </div>

                {/* Premium/Monetization Settings */}
                <div className="bg-background dark:bg-card-background p-6 rounded-lg border border-border dark:border-border">
                    <h3 className="text-xl font-semibold text-textDefault dark:text-text-default mb-4">Premium & Monetization</h3>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="upiIdForPremium" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">UPI ID for Premium Payments</label>
                            <input
                                type="text"
                                id="upiIdForPremium"
                                name="upiIdForPremium"
                                value={formValues.upiIdForPremium || ''}
                                onChange={handleChange}
                                className={`w-full p-2 border ${formErrors.upiIdForPremium ? 'border-error' : 'border-border'} rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary`}
                                disabled={formLoading}
                                placeholder="e.g., yourname@bankname"
                            />
                            {formErrors.upiIdForPremium && <p className="mt-1 text-sm text-error">{formErrors.upiIdForPremium}</p>}
                        </div>
                        <div>
                            <label htmlFor="basicPlanPrice" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">Basic Plan Price (INR)</label>
                            <input
                                type="number"
                                id="basicPlanPrice"
                                name="basicPlanPrice"
                                value={formValues.basicPlanPrice !== undefined ? formValues.basicPlanPrice : ''}
                                onChange={handleChange}
                                className={`w-full p-2 border ${formErrors.basicPlanPrice ? 'border-error' : 'border-border'} rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary`}
                                disabled={formLoading}
                                min="0" step="0.01"
                            />
                            {formErrors.basicPlanPrice && <p className="mt-1 text-sm text-error">{formErrors.basicPlanPrice}</p>}
                        </div>
                        <div>
                            <label htmlFor="advancedPlanPrice" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">Advanced Plan Price (INR)</label>
                            <input
                                type="number"
                                id="advancedPlanPrice"
                                name="advancedPlanPrice"
                                value={formValues.advancedPlanPrice !== undefined ? formValues.advancedPlanPrice : ''}
                                onChange={handleChange}
                                className={`w-full p-2 border ${formErrors.advancedPlanPrice ? 'border-error' : 'border-border'} rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary`}
                                disabled={formLoading}
                                min="0" step="0.01"
                            />
                            {formErrors.advancedPlanPrice && <p className="mt-1 text-sm text-error">{formErrors.advancedPlanPrice}</p>}
                        </div>
                        <div>
                            <label htmlFor="proPlanPrice" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">Pro Plan Price (INR)</label>
                            <input
                                type="number"
                                id="proPlanPrice"
                                name="proPlanPrice"
                                value={formValues.proPlanPrice !== undefined ? formValues.proPlanPrice : ''}
                                onChange={handleChange}
                                className={`w-full p-2 border ${formErrors.proPlanPrice ? 'border-error' : 'border-border'} rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary`}
                                disabled={formLoading}
                                min="0" step="0.01"
                            />
                            {formErrors.proPlanPrice && <p className="mt-1 text-sm text-error">{formErrors.proPlanPrice}</p>}
                        </div>
                    </div>
                </div>

                {/* Content & Policy Settings */}
                <div className="bg-background dark:bg-card-background p-6 rounded-lg border border-border dark:border-border">
                    <h3 className="text-xl font-semibold text-textDefault dark:text-text-default mb-4">Content & Policy Dates</h3>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="globalAnnouncement" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">Global Website Announcement</label>
                            <textarea
                                id="globalAnnouncement"
                                name="globalAnnouncement"
                                value={formValues.globalAnnouncement || ''}
                                onChange={handleChange}
                                rows="3"
                                className={`w-full p-2 border ${formErrors.globalAnnouncement ? 'border-error' : 'border-border'} rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary`}
                                disabled={formLoading}
                                placeholder="A message displayed globally on the website."
                            ></textarea>
                            {formErrors.globalAnnouncement && <p className="mt-1 text-sm text-error">{formErrors.globalAnnouncement}</p>}
                        </div>
                        <div>
                            <label htmlFor="privacyPolicyLastUpdated" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">Privacy Policy Last Updated (YYYY-MM-DD)</label>
                            <input
                                type="date"
                                id="privacyPolicyLastUpdated"
                                name="privacyPolicyLastUpdated"
                                value={formValues.privacyPolicyLastUpdated || ''}
                                onChange={handleChange}
                                className={`w-full p-2 border ${formErrors.privacyPolicyLastUpdated ? 'border-error' : 'border-border'} rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary`}
                                disabled={formLoading}
                            />
                            {formErrors.privacyPolicyLastUpdated && <p className="mt-1 text-sm text-error">{formErrors.privacyPolicyLastUpdated}</p>}
                        </div>
                        <div>
                            <label htmlFor="termsOfServiceLastUpdated" className="block text-sm font-medium text-textDefault dark:text-text-default mb-1">Terms of Service Last Updated (YYYY-MM-DD)</label>
                            <input
                                type="date"
                                id="termsOfServiceLastUpdated"
                                name="termsOfServiceLastUpdated"
                                value={formValues.termsOfServiceLastUpdated || ''}
                                onChange={handleChange}
                                className={`w-full p-2 border ${formErrors.termsOfServiceLastUpdated ? 'border-error' : 'border-border'} rounded-md bg-background text-textDefault dark:bg-card-background dark:text-text-default focus:ring-primary focus:border-primary`}
                                disabled={formLoading}
                            />
                            {formErrors.termsOfServiceLastUpdated && <p className="mt-1 text-sm text-error">{formErrors.termsOfServiceLastUpdated}</p>}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={formLoading}
                        className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-md font-medium text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                        {formLoading ? (
                            <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            'Save All Settings'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AdminSettings;