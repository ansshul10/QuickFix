// quickfix-website/server/utils/jwtUtils.js
// This utility file is largely replaced by `server/config/jwt.js` which
// contains the `generateToken` function.
// For completeness of the structure, it remains as a re-exporter.

const generateToken = require('../config/jwt'); // Import the generateToken function

module.exports = {
    generateToken,
    // Add other JWT specific utils if needed, e.g., verifyToken (though Passport does this)
};