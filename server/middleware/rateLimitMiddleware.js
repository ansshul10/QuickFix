// quickfix-website/server/middleware/rateLimitMiddleware.js
const rateLimit = require('express-rate-limit');
const AppError = require('../utils/appError');

const createRateLimiter = (windowMs, maxRequests, message = 'Too many requests, please try again later.') => {
    return rateLimit({
        windowMs: windowMs, // time in milliseconds
        max: maxRequests, // maximum number of requests
        message: new AppError(message, 429), // Custom AppError for rate limit
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    });
};

// Common limiters
const authLimiter = createRateLimiter(15 * 60 * 1000, 100, 'Too many login/registration attempts from this IP, please try again after 15 minutes.');
const otpLimiter = createRateLimiter(5 * 60 * 1000, 5, 'Too many OTP requests from this IP, please try again after 5 minutes.');

module.exports = {
    createRateLimiter,
    authLimiter,
    otpLimiter
};