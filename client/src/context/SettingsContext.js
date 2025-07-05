// quickfix-website/client/src/context/SettingsContext.js
import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({});
    // `loadingSettings` controls the initial loading of settings for the entire application.
    // It should be true on mount and set to false once settings are fetched.
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [errorSettings, setErrorSettings] = useState(null);

    // Function to fetch settings (used on mount and potentially for refresh)
    const fetchSettings = async () => {
        // Set loading to true only if it's not already true (to prevent redundant calls)
        if (!loadingSettings) setLoadingSettings(true);
        setErrorSettings(null);

        try {
            const response = await api.get('/public/settings');
            if (response.data && typeof response.data.data === 'object') {
                setSettings(response.data.data);
            } else {
                console.error("SettingsContext: Invalid data format from /public/settings", response.data);
                setErrorSettings("Invalid settings data received.");
            }
        } catch (err) {
            console.error("SettingsContext: Failed to fetch public settings:", err);
            setErrorSettings(err);
            // Only show a toast if it's not an expected 401 on initial load (handled by API interceptor)
            if (err.response?.status !== 401 && err.response?.status !== 503) { // 503 for maintenance
                 toast.error("Failed to load website settings.");
            }
        } finally {
            setLoadingSettings(false); // Always resolve the loading state after the fetch attempt
        }
    };

    // Function to update a single setting (used by AdminSettings)
    // This will call the protected /admin/settings endpoint
    const updateSetting = async (settingName, settingValue, description = '') => {
        // This function doesn't manage the global `loadingSettings` state,
        // as the component calling it (e.g., AdminSettings) should manage its own `formLoading`.
        try {
            const response = await api.put('/admin/settings', { settingName, settingValue, description });

            if (response.data && response.data.success) {
                setSettings(prevSettings => ({
                    ...prevSettings,
                    [settingName]: settingValue
                }));
                toast.success(`Setting '${settingName}' updated successfully!`);
                return true;
            } else {
                toast.error(response.data.message || `Failed to update setting: ${settingName}`);
                return false;
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || `Failed to update setting '${settingName}'.`;
            console.error(`SettingsContext: Error updating setting '${settingName}':`, err);
            toast.error(errorMessage);
            return false;
        }
    };

    // Fetch settings on initial component mount
    useEffect(() => {
        fetchSettings();
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, loadingSettings, error: errorSettings, updateSetting, fetchSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};