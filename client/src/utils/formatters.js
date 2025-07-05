// quickfix-website/client/src/utils/formatters.js

/**
 * Formats a given date string or Date object into a readable string.
 * @param {string|Date} dateInput - The date to format.
 * @param {object} options - Intl.DateTimeFormatOptions (e.g., { month: 'long', day: 'numeric', year: 'numeric' })
 * @returns {string} The formatted date string.
 */
export const formatDate = (dateInput, options = { year: 'numeric', month: 'short', day: 'numeric' }) => {
    if (!dateInput) return '';
    try {
        const date = new Date(dateInput);
        return new Intl.DateTimeFormat('en-US', options).format(date);
    } catch (error) {
        console.error("Error formatting date:", error);
        return String(dateInput); // Return original if invalid
    }
};

/**
 * Capitalizes the first letter of a string.
 * @param {string} str - The input string.
 * @returns {string} The string with the first letter capitalized.
 */
export const capitalizeFirstLetter = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Truncates a string to a specified length and appends an ellipsis.
 * @param {string} str - The input string.
 * @param {number} maxLength - The maximum length of the string.
 * @returns {string} The truncated string.
 */
export const truncateString = (str, maxLength) => {
    if (!str || str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
};

/**
 * Formats a number as a currency string.
 * @param {number} amount - The amount to format.
 * @param {string} currency - The currency code (e.g., 'USD', 'INR').
 * @param {string} locale - The locale string (e.g., 'en-US', 'en-IN').
 * @returns {string} The formatted currency string.
 */
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
    if (typeof amount !== 'number') return '';
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
    }).format(amount);
};

/**
 * Converts bytes to a human-readable size (KB, MB, GB).
 * @param {number} bytes - The number of bytes.
 * @returns {string} The human-readable size.
 */
export const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};