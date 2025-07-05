// quickfix-website/server/config/email.js
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const AppError = require('../utils/appError');
const fs = require('fs');
const path = require('path');

// Helper function to load and parse HTML email templates
const loadTemplate = (templateName, data = {}) => {
    const templatePath = path.join(__dirname, '../emailTemplates', `${templateName}.html`);
    // Read the HTML content from the template file
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    // Replace placeholders (e.g., {{username}}, {{otp}}) with actual data
    for (const key in data) {
        // Use a global regular expression to replace all occurrences of the placeholder
        const regex = new RegExp(`{{${key}}}`, 'g');
        htmlContent = htmlContent.replace(regex, data[key]);
    }
    return htmlContent;
};

// Function to send an email using Nodemailer
const sendEmail = async (options) => {
    // Create a Nodemailer transporter object using SMTP settings from environment variables
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_PORT == 465, // Use true for port 465 (SMTPS), false for other ports (like 587 STARTTLS)
        auth: {
            user: process.env.EMAIL_USER, // Your email address
            pass: process.env.EMAIL_PASS, // Your email password or app-specific password
        },
        tls: {
            // Reject unauthorized certificates in production for security, allow in dev for flexibility
            rejectUnauthorized: process.env.NODE_ENV === 'production'
        }
    });

    // Define mail options (sender, recipient, subject, HTML/text content)
    const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_USER}>`, // Sender's display name and email
        to: options.email, // Recipient's email address
        subject: options.subject, // Email subject line
        html: options.html, // HTML content of the email
        // Fallback to plain text by stripping HTML tags if options.text is not provided
        text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
    };

    try {
        // Send the email
        const info = await transporter.sendMail(mailOptions);
        logger.info(`Email sent to ${options.email}: ${info.messageId}`);
    } catch (error) {
        // Log any errors during email sending
        logger.error(`Error sending email to ${options.email}: ${error.message}`, error);
        // In development, rethrow the error for immediate feedback; in production, just log
        if (process.env.NODE_ENV === 'development') {
            throw new AppError(`Failed to send email: ${error.message}`, 500);
        }
    }
};

module.exports = {
    sendEmail,
    loadTemplate // Export loadTemplate so controllers/services can use it
};