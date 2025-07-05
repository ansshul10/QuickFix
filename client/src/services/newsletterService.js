// quickfix-website/client/src/services/newsletterService.js
import api from '../utils/api'; // Import your configured axios instance
import { toast } from 'react-toastify'; // For showing notifications

/**
 * Subscribes an email to the newsletter.
 * @param {string} email - The email address to subscribe.
 * @returns {Promise<Object>} The response data from the server.
 */
export const subscribeNewsletter = async (email) => {
    try {
        const response = await api.post('/newsletter/subscribe', { email });
        toast.success(response.data.message || 'Successfully subscribed to the newsletter!');
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to subscribe to the newsletter.';
        toast.error(errorMessage);
        console.error('Newsletter subscription error:', error); // Log the full error for debugging
        throw error; // Re-throw the error so the component can handle loading states
    }
};

/**
 * Unsubscribes an email from the newsletter.
 * @param {string} email - The email address to unsubscribe.
 * @returns {Promise<Object>} The response data from the server.
 */
export const unsubscribeNewsletter = async (email) => {
    try {
        const response = await api.post('/newsletter/unsubscribe', { email });
        toast.success(response.data.message || 'Successfully unsubscribed from the newsletter.');
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to unsubscribe from the newsletter.';
        toast.error(errorMessage);
        console.error('Newsletter unsubscription error:', error);
        throw error;
    }
};

// --- NEW FUNCTIONS FOR ADMIN NEWSLETTER MANAGEMENT ---

/**
 * Fetches all newsletter subscribers (Admin Only).
 * @param {Object} filters - Pagination and search filters.
 * @param {number} filters.pageNumber
 * @param {number} filters.pageSize
 * @param {string} filters.keyword - Search keyword for email.
 * @returns {Promise<Object>} Object with data (subscribers array) and count (total subscribers).
 */
export const getNewsletterSubscribers = async ({ pageNumber = 1, pageSize, keyword = '' }) => {
    try {
        const response = await api.get('/newsletter/admin/subscribers', {
            params: { page: pageNumber, limit: pageSize, keyword }
        });
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to fetch newsletter subscribers.';
        toast.error(errorMessage);
        console.error('Fetch subscribers error:', error);
        throw error;
    }
};

/**
 * Fetches a single newsletter subscriber by email (Admin Only).
 * @param {string} email - The email address of the subscriber to fetch.
 * @returns {Promise<Object>} The response data from the server containing the subscriber object.
 */
export const getNewsletterSubscriberByEmail = async (email) => {
    try {
        const response = await api.get(`/newsletter/admin/subscribers/${encodeURIComponent(email)}`);
        toast.success("Subscriber fetched successfully!", { autoClose: 1000 });
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || `Failed to fetch subscriber with email: ${email}.`;
        toast.error(errorMessage);
        console.error('Fetch single subscriber error:', error);
        throw error;
    }
};


/**
 * Sends a bulk email to all active newsletter subscribers (Admin Only).
 * @param {string} subject - The email subject.
 * @param {string} htmlContent - The HTML content of the email.
 * @returns {Promise<Object>} The response data from the server.
 */
export const sendBulkNewsletterEmail = async (subject, htmlContent) => {
    try {
        const response = await api.post('/newsletter/admin/bulk-send', { subject, htmlContent });
        toast.success(response.data.message || 'Bulk email sending process started.');
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to send bulk email.';
        toast.error(errorMessage);
        console.error('Send bulk email error:', error);
        throw error;
    }
};

/**
 * Sends an individual email to a specific newsletter subscriber (Admin Only).
 * @param {string} email - The recipient's email address.
 * @param {string} subject - The email subject.
 * @param {string} htmlContent - The HTML content of the email.
 * @returns {Promise<Object>} The response data from the server.
 */
export const sendIndividualNewsletterEmail = async (email, subject, htmlContent) => {
    try {
        const response = await api.post('/newsletter/admin/send-individual', { email, subject, htmlContent });
        toast.success(response.data.message || `Email sent to ${email} successfully.`);
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || `Failed to send email to ${email}.`;
        toast.error(errorMessage);
        console.error('Send individual email error:', error);
        throw error;
    }
};