// quickfix-website/server/middleware/adminMiddleware.js
const { authorize } = require('./authMiddleware'); // Re-use authorize from authMiddleware

const adminProtect = authorize('admin');

module.exports = { adminProtect };