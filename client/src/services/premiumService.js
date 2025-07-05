// quickfix-website/client/src/services/premiumService.js
import api from '../utils/api';
import { toast } from 'react-toastify'; // Keep toast import for toast.success

export const getPremiumFeatures = async () => {
    try {
        const response = await api.get('/premium/features');
        // console.log("premiumService: Raw API response from axios:", response); // Removed console.log
        if (response && response.data) {
            // console.log("premiumService: Returning response.data:", response.data); // Removed console.log
            return response.data; // Return the actual data payload from the server
        } else {
            // console.error("premiumService: API response or data was empty/invalid.", response); // Removed console.log
            throw new Error("Empty or invalid API response from /premium/features"); // Throw a more specific error
        }
    } catch (error) {
        // REMOVED toast.error(errorMessage);
        console.error('premiumService: Error fetching premium features:', error);
        throw error; // Re-throw to be caught by api.js interceptor or consuming component
    }
};

export const submitPaymentConfirmation = async (transactionId, referenceCode, selectedPlan) => {
    try {
        const response = await api.post('/premium/confirm-manual-payment', {
            transactionId,
            referenceCode,
            selectedPlan
        });
        toast.success(response.data.message); // Keep success toast
        return response.data;
    } catch (error) {
        // REMOVED toast.error(errorMessage);
        console.error('Submit payment confirmation error:', error);
        throw error;
    }
};

export const uploadPaymentScreenshot = async (formData) => {
    try {
        const response = await api.post('/premium/upload-screenshot', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        toast.success(response.data.message); // Keep success toast
        return response.data;
    } catch (error) {
        // REMOVED toast.error(errorMessage);
        console.error('Upload payment screenshot error:', error);
        throw error;
    }
};

export const cancelSubscription = async () => {
    try {
        const response = await api.post('/premium/cancel');
        toast.success(response.data.message); // Keep success toast
        return response.data;
    } catch (error) {
        // REMOVED toast.error(errorMessage);
        console.error('Cancel subscription error:', error);
        throw error;
    }
};

export const getSubscriptionStatus = async () => {
    try {
        const response = await api.get('/premium/status');
        return response.data;
    } catch (error) {
        // REMOVED toast.error(errorMessage);
        console.error('Get subscription status error:', error);
        throw error;
    }
};