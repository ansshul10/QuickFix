// quickfix-website/client/src/services/publicService.js
import api from '../utils/api';

export const getPublicWebsiteSettings = async () => {
    return api.get('/public/settings'); // <--- NEW PUBLIC ENDPOINT
};

export const getPublicPremiumPaymentSettings = async () => {
    return api.get('/public/premium-settings'); // <--- NEW PUBLIC ENDPOINT
};