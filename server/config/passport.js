// quickfix-website/server/config/passport.js
const JwtStrategy = require('passport-jwt').Strategy; // Import JWT Strategy
const { ExtractJwt } = require('passport-jwt'); // Helper to extract JWT
const User = require('../models/User'); // Import the User model
const logger = require('../utils/logger'); // Import our logger

// Function to extract JWT from an httpOnly cookie
// This is the preferred method for security as it prevents XSS attacks from accessing the token.
const cookieExtractor = req => {
    let token = null;
    if (req && req.cookies) {
        token = req.cookies.jwt; // The cookie name where your JWT is stored
    }
    return token;
};

/**
 * Configures Passport.js with the JWT strategy.
 * This strategy is used to authenticate requests by verifying the JWT.
 * @param {object} passport - The Passport.js instance.
 */
module.exports = passport => {
    passport.use(
        new JwtStrategy({
            jwtFromRequest: cookieExtractor, // How to extract the JWT from the request
            secretOrKey: process.env.JWT_SECRET // Secret key used to sign the JWT
        }, async (jwtPayload, done) => {
            try {
                // Find the user by ID from the JWT payload
                // Select('-password') excludes the password hash from the retrieved user object
                // .where('active').equals(true) ensures only active users can be authenticated
                const user = await User.findById(jwtPayload.id).select('-password').where('active').equals(true);

                if (user) {
                    return done(null, user); // User found, authentication successful
                } else {
                    return done(null, false); // User not found or inactive, authentication failed
                }
            } catch (err) {
                // Log any errors that occur during the user lookup process
                logger.error(`Passport JWT Strategy Error for user ID ${jwtPayload.id}: ${err.message}`, err.stack);
                return done(err, false); // Pass the error to Passport
            }
        })
    );
};