// quickfix-website/server/utils/emailSender.js
// This file is largely replaced by server/config/email.js for more centralized control
// and HTML templating. You can remove this file if you only use config/email.js directly.
// For completeness of the structure, it remains as a re-exporter.

const { sendEmail, loadTemplate } = require('../config/email');

module.exports = {
    sendEmail,
    loadTemplate
};