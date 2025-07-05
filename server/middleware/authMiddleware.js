// quickfix-website/server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const logger = require('../utils/logger');
const generateToken = require('../config/jwt');
const AppError = require('../utils/appError');
const { setCookie } = require('../utils/cookieHandler');
const Settings = require('../models/Settings'); // Import Settings model

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(new AppError('Not authorized, no token', 401));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = await User.findById(decoded.id).select('-password').where('active').equals(true);

        if (!req.user) {
            return next(new AppError('Not authorized, user not found or inactive.', 401));
        }

        // --- IMPORTANT NOTE ---
        // As per your request, email verification check is NOT strictly enforced here
        // for ALL protected routes. Users can log in even if unverified.
        // Critical features (like premium purchases) will have their own verification checks.
        // If you ever need to block ALL access to protected routes for unverified users,
        // you would uncomment and adjust the following block:
        /*
        const enableEmailVerificationSetting = await Settings.findOne({ settingName: 'enableEmailVerification' });
        const enableEmailVerification = enableEmailVerificationSetting ? enableEmailVerificationSetting.settingValue : false;
        if (enableEmailVerification && !req.user.emailVerified) {
            return next(new AppError('Your email address is not verified. Please verify your account to access this feature.', 403));
        }
        */

        // Token Refresh Logic (optional but good for UX)
        const now = Math.floor(Date.now() / 1000); // Current time in seconds
        const tokenExpiration = decoded.exp; // Token expiry time in seconds
        const refreshThreshold = 3600; // 1 hour (refresh if less than 1 hour to expire)

        if (tokenExpiration - now < refreshThreshold) {
            const newToken = generateToken(req.user._id);
            setCookie(res, newToken); // Sets new cookie with updated expiry
            logger.debug('Refreshed JWT token for user: ' + req.user.username);
        }

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return next(new AppError('Not authorized, token has expired.', 401));
        }
        return next(new AppError('Not authorized, token failed.', 401));
    }
});

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError(`User role (${req.user ? req.user.role : 'unauthenticated'}) is not authorized to access this route.`, 403));
        }
        next();
    };
};

module.exports = { protect, authorize };