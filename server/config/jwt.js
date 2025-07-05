// quickfix-website/server/config/jwt.js
const jwt = require('jsonwebtoken'); // Import jsonwebtoken library

/**
 * Generates a JSON Web Token (JWT) for a given user ID.
 * The token is signed with the JWT_SECRET from environment variables
 * and expires after JWT_EXPIRES_IN duration.
 * @param {string} id - The user ID to include in the JWT payload.
 * @returns {string} The generated JWT string.
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN, // e.g., '1d', '10h'
    });
};

module.exports = generateToken;