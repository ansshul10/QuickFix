// quickfix-website/server/services/authService.js
// This service layer would typically abstract complex business logic for authentication.
// For standard registration/login/profile updates, the authController
// often interacts directly with the User model, as the core logic is often intertwined
// with direct DB operations and JWT generation.

// If you were to add features like:
// - Third-party OAuth (Google, Facebook login)
// - More intricate user roles and permissions beyond simple 'admin'/'user'

// Then this file would contain that complex logic, and the authController would call
// functions from this service.

// For the current scope, authController largely handles the "service" role itself.
// This file serves as a placeholder for future expansion if needed.

const User = require('../models/User');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
// const generateToken = require('../config/jwt'); // Example of what it might use

// Example of a function this service *could* provide (but is currently in authController)
/*
const registerUserService = async (username, email, password) => {
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
        throw new AppError('User with that email or username already exists', 400);
    }
    const user = await User.create({ username, email, password, emailVerified: false });
    return user;
};
*/

module.exports = {
    // registerUserService, // Example export
};