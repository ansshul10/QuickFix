const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const ContactMessage = require('../models/ContactMessage');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { sendEmail, loadTemplate } = require('../utils/emailSender');
const Settings = require('../models/Settings');

// Helper to get a specific setting value safely
const getSetting = async (name, defaultValue) => {
    try {
        const setting = await Settings.findOne({ settingName: name });
        return setting ? setting.settingValue : defaultValue;
    } catch (error) {
        logger.error(`Error fetching setting '${name}': ${error.message}`);
        return defaultValue;
    }
};

// @desc    Submit a new contact message & create a ticket
// @route   POST /api/contact
// @access  Public
const submitContactMessage = asyncHandler(async (req, res, next) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return next(new AppError('Please fill in all fields (name, email, message).', 400));
    }

    try {
        const ticketNumber = `QF-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

        const contactMessage = await ContactMessage.create({
            name,
            email,
            message,
            ticketNumber,
            // --- MODIFIED: Set initial status to 'Pending' as requested ---
            status: 'Pending'
        });

        logger.info(`New Ticket #${ticketNumber} created from ${name} (${email}).`);

        const adminContactEmail = await getSetting('contactEmail', 'support@quickfix.com');
        if (adminContactEmail) {
            const adminNotificationHtml = await loadTemplate('adminContactMessage', {
                name: name,
                email: email,
                message: message,
                ticketNumber: contactMessage.ticketNumber,
                reviewLink: `${process.env.FRONTEND_URL}/admin-dashboard/user-help`,
                currentYear: new Date().getFullYear()
            });

            try {
                await sendEmail({
                    email: adminContactEmail,
                    subject: `[Ticket #${ticketNumber}] New Support Ticket from ${name}`,
                    html: adminNotificationHtml
                });
            } catch (emailError) {
                logger.error(`Failed to send new ticket notification email to admin: ${emailError.message}`);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Your ticket has been submitted!',
            ticketNumber: contactMessage.ticketNumber
        });

    } catch (error) {
        logger.error(`Error submitting contact message: ${error.message}`, error);
        return next(new AppError('Failed to send message. Please try again later.', 500));
    }
});

// @desc    Get ticket status by ticket number
// @route   GET /api/contact/ticket/:ticketNumber
// @access  Public
const getTicketByNumber = asyncHandler(async (req, res, next) => {
    const { ticketNumber } = req.params;
    const ticket = await ContactMessage.findOne({
        ticketNumber: { $regex: new RegExp(`^${ticketNumber}$`, 'i') }
    });

    if (!ticket) {
        return next(new AppError('Ticket not found. Please check the number and try again.', 404));
    }

    res.status(200).json({
        success: true,
        ticket: {
            ticketNumber: ticket.ticketNumber,
            status: ticket.status,
            message: ticket.message,
            adminResponse: ticket.adminResponse,
            createdAt: ticket.createdAt,
        },
    });
});


// @desc    Get all contact messages (Admin only)
// @route   GET /api/contact/admin
// @access  Private (Admin)
const getAllContactMessages = asyncHandler(async (req, res, next) => {
    const { isRead, keyword, pageNumber, pageSize, status } = req.query;
    const query = {};

    if (isRead !== undefined) query.isRead = isRead === 'true';
    if (status) query.status = status;
    if (keyword) {
        query.$or = [
            { name: { $regex: keyword, $options: 'i' } },
            { email: { $regex: keyword, $options: 'i' } },
            { message: { $regex: keyword, $options: 'i' } },
            { ticketNumber: { $regex: keyword, $options: 'i' } }
        ];
    }

    const currentPage = parseInt(pageNumber, 10) || 1;
    const limit = parseInt(pageSize, 10) || 10;
    const skip = (currentPage - 1) * limit;

    const totalMessages = await ContactMessage.countDocuments(query);
    const messages = await ContactMessage.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);

    res.status(200).json({
        success: true,
        count: totalMessages,
        page: currentPage,
        pages: Math.ceil(totalMessages / limit),
        data: messages
    });
});


// @desc    Get single contact message by ID (Admin only)
// @route   GET /api/contact/admin/:id
// @access  Private (Admin)
const getContactMessageById = asyncHandler(async (req, res, next) => {
    const message = await ContactMessage.findById(req.params.id);
    if (!message) {
        return next(new AppError('Message not found', 404));
    }
    res.status(200).json({ success: true, data: message });
});


// @desc    Update a ticket's status and response (Admin only)
// @route   PUT /api/contact/admin/:id
// @access  Private (Admin)
const updateContactMessage = asyncHandler(async (req, res, next) => {
    const { isRead, status, adminResponse } = req.body;

    let message = await ContactMessage.findById(req.params.id);
    if (!message) {
        return next(new AppError('Message not found', 404));
    }

    const wasCompleted = message.status === 'Completed';

    if (isRead !== undefined) message.isRead = isRead;
    if (status) message.status = status;
    // --- MODIFIED: Use adminResponse for consistency ---
    if (adminResponse !== undefined) {
        message.adminResponse = adminResponse;
        message.repliedAt = new Date();
        message.repliedBy = req.user._id;
        message.isRead = true;
    }

    await message.save();
    
    // --- NEW: Send email notification if ticket is marked as 'Completed' ---
    if (status === 'Completed' && !wasCompleted && message.adminResponse) {
        const emailSubject = `Update on your Support Ticket #${message.ticketNumber}`;
        const replyEmailHtml = await loadTemplate('contactReply', {
            userName: message.name,
            ticketNumber: message.ticketNumber,
            originalMessage: message.message,
            replyMessage: message.adminResponse,
            currentYear: new Date().getFullYear(),
        });
        
        try {
            await sendEmail({
                email: message.email,
                subject: emailSubject,
                html: replyEmailHtml
            });
            logger.info(`User notification sent for completed ticket #${message.ticketNumber}`);
        } catch (emailError) {
            logger.error(`Failed to send completion email for ticket #${message.ticketNumber}: ${emailError.message}`);
        }
    }

    res.status(200).json({
        success: true,
        message: 'Ticket updated successfully.',
        data: message
    });
});

// @desc    Reply to a contact message (Admin only) - This function is kept for legacy purposes
// @route   POST /api/contact/admin/:id/reply
// @access  Private (Admin)
const replyToContactMessage = asyncHandler(async (req, res, next) => {
    // No changes were made to this function as requested.
    // Our new admin UI will use the updateContactMessage function above.
    const { replyMessage } = req.body;
    const messageId = req.params.id;

    if (!replyMessage) {
        return next(new AppError('Reply message is required.', 400));
    }

    let message = await ContactMessage.findById(messageId);
    if (!message) {
        return next(new AppError('Contact message not found.', 404));
    }
    
    message.replyMessage = replyMessage; // This will update the old field if you still use it
    message.adminResponse = replyMessage; // Also update the new field for consistency
    message.status = 'Completed'; // Set status to Completed
    message.repliedAt = new Date();
    message.repliedBy = req.user._id;
    message.isRead = true;
    await message.save();

    const emailSubject = `Reply from QuickFix Support regarding your Ticket #${message.ticketNumber}`;
    const replyEmailHtml = await loadTemplate('contactReply', {
        userName: message.name,
        ticketNumber: message.ticketNumber,
        originalMessage: message.message,
        replyMessage: replyMessage,
        currentYear: new Date().getFullYear(),
    });

    try {
        await sendEmail({
            email: message.email,
            subject: emailSubject,
            html: replyEmailHtml
        });
        logger.info(`Reply email sent to ${message.email} for Ticket #${message.ticketNumber}`);
    } catch (emailError) {
        logger.error(`Failed to send reply email to ${message.email}: ${emailError.message}`);
    }

    res.status(200).json({
        success: true,
        message: 'Reply sent and ticket updated.',
        data: message
    });
});


// @desc    Delete a contact message (Admin only)
// @route   DELETE /api/contact/admin/:id
// @access  Private (Admin)
const deleteContactMessage = asyncHandler(async (req, res, next) => {
    const message = await ContactMessage.findById(req.params.id);
    if (!message) {
        return next(new AppError('Message not found', 404));
    }
    await message.deleteOne();
    res.status(200).json({ success: true, message: 'Ticket deleted successfully.' });
});

module.exports = {
    submitContactMessage,
    getAllContactMessages,
    getContactMessageById,
    updateContactMessage,
    replyToContactMessage,
    deleteContactMessage,
    getTicketByNumber
};