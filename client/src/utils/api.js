import axios from 'axios';
import { toast } from 'react-toastify';
import logger from './logger';

const api = axios.create({
        baseURL: process.env.REACT_APP_API_BASE_URL,
        withCredentials: true,
        headers: {
                'Content-Type': 'application/json',
        },
        timeout: 30000,
});

// Request Interceptor: Logs outgoing requests
api.interceptors.request.use(
        (config) => {
                logger.debug(`[API Request] ${config.method.toUpperCase()} ${config.url}`);
                return config;
        },
        (error) => {
                logger.error('[API Request Error]', error);
                return Promise.reject(error);
        }
);

// Response Interceptor: Handles global API responses and errors
api.interceptors.response.use(
        (response) => {
                logger.debug(`[API Response] ${response.config.method.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
                return response;
        },
        async (error) => {
                const originalRequest = error.config;
                const statusCode = error.response ? error.response.status : null;
                const backendMessage = error.response?.data?.message;

                // Dismiss all current toasts before showing a new *global* error toast.
                // This ensures only one error message from the interceptor is shown at a time.
                // We do this here only for global errors, not for specific ones handled by contexts.
                // For 401s, we specifically handle.
                if (statusCode !== 401) { // Do not dismiss for 401 unless it's the specific redirect 401
                        toast.dismiss();
                }

                // Determine if this is an expected 401 on initial load for a public endpoint.
                const isExpectedPublic401 = statusCode === 401 && (
                        originalRequest.url === '/auth/profile' ||
                        originalRequest.url === '/admin/settings'
                );

                // --- Handle 401 Unauthorized ---
                if (statusCode === 401) {
                        if (isExpectedPublic401) {
                                logger.debug(`[API Response] ${originalRequest.method.toUpperCase()} ${originalRequest.url} - Status: 401 (Expected for unauthenticated users on public endpoint).`);
                        } else if (originalRequest.url === '/auth/login') {
                                logger.debug(`[API Response] ${originalRequest.method.toUpperCase()} ${originalRequest.url} - Status: 401 (Login attempt rejected).`);
                                // Let the AuthContext/Login component handle specific login failure messages.
                                // Re-throwing ensures `AuthContext` receives the full error for specific handling.
                        } else {
                                // For other 401s (e.g., session expired for protected routes)
                                if (!originalRequest._retry) {
                                        originalRequest._retry = true;
                                        toast.error(`Session Expired: ${backendMessage || 'Please log in again.'}`, { toastId: 'unauthorized-error', autoClose: 3000 });
                                        logger.error(`[API Response Error] ${originalRequest.method.toUpperCase()} ${originalRequest.url} - Status: 401 (Unauthorized - session expired or protected access).`);
                                        if (window.location.pathname !== '/login') {
                                                setTimeout(() => window.location.href = '/login', 500);
                                        }
                                } else {
                                        logger.error(`[API Response Error] ${originalRequest.method.toUpperCase()} ${originalRequest.url} - Status: 401 (Unauthorized on retry).`);
                                }
                        }
                }
                // --- Handle 400 Bad Request (specifically for expected validation errors) ---
                else if (statusCode === 400) {
                        logger.warn(`[API Response Error] ${originalRequest.method.toUpperCase()} ${originalRequest.url} - Status: 400 (Bad Request). Message: ${backendMessage}`);
                        // Do NOT show a generic toast here. Let the specific component/AuthContext handle the 400 messages,
                        // as 400s often represent expected validation errors that need specific UI feedback.
                }
                // --- Handle other common HTTP status codes ---
                else if (statusCode === 403) {
                        toast.error(`Forbidden: ${backendMessage || 'You do not have permission to perform this action.'}`, { toastId: 'forbidden-error', autoClose: 3000 });
                        logger.error(`[API Response Error] ${originalRequest.method.toUpperCase()} ${originalRequest.url} - Status: 403 (Forbidden).`);
                } else if (statusCode === 404) {
                        toast.error(`Not Found: ${backendMessage || 'The requested resource could not be found.'}`, { toastId: 'notfound-error', autoClose: 3000 });
                        logger.error(`[API Response Error] ${originalRequest.method.toUpperCase()} ${originalRequest.url} - Status: 404 (Not Found).`);
                } else if (statusCode === 429) {
                        toast.warn(`Too Many Requests: ${backendMessage || 'Please try again later.'}`, { toastId: 'rate-limit-error', autoClose: 5000 });
                        logger.warn(`[API Response Error] ${originalRequest.method.toUpperCase()} ${originalRequest.url} - Status: 429 (Rate Limited).`);
                } else if (statusCode === 503) {
                        toast.warn(`Maintenance: ${backendMessage || 'Website is under maintenance. Please try again later.'}`, { toastId: 'maintenance-error', autoClose: false, closeButton: true });
                        logger.warn(`[API Response Error] ${originalRequest.method.toUpperCase()} ${originalRequest.url} - Status: 503 (Maintenance Mode).`);
                }
                // Handle generic server errors (5xx)
                else if (statusCode && statusCode >= 500) {
                        toast.error(`Server Error (${statusCode}): ${backendMessage || 'An internal server error occurred. Please try again later.'}`, { toastId: 'server-error', autoClose: 5000 });
                        logger.error(`[API Response Error] ${originalRequest.method.toUpperCase()} ${originalRequest.url} - Status: ${statusCode} (Server Error).`, error);
                }
                // Handle network errors (request made, but no response received)
                else if (error.request) {
                        toast.error('Network Error: Please check your internet connection or try again later.', { toastId: 'network-error', autoClose: 5000 });
                        logger.error('[API Network Error]', error.message, error);
                }
                // Handle other unexpected client-side errors
                else {
                        toast.error(`Client Error: ${error.message || 'An unexpected client-side error occurred.'}`, { toastId: 'client-error', autoClose: 5000 });
                        logger.error('[API Client Error]', error.message, error);
                }

                return Promise.reject(error);
        }
);

export default api;