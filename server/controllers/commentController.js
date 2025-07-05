// quickfix-website/server/controllers/commentController.js
const asyncHandler = require('express-async-handler');
const Comment = require('../models/Comment');
const Guide = require('../models/Guide');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { sendNotificationToUser } = require('../services/notificationService');
const Settings = require('../models/Settings'); // To check if comments are enabled

// Helper to get a setting value from the database
const getSetting = async (name, defaultValue) => {
    const setting = await Settings.findOne({ settingName: name });
    return setting ? setting.settingValue : defaultValue;
};

// @desc    Get comments for a specific guide
// @route   GET /api/comments/guide/:guideId
// @access  Public
const getCommentsForGuide = asyncHandler(async (req, res, next) => {
    // Find all comments for a given guide ID, populate user details, and sort by creation date
    const comments = await Comment.find({ guide: req.params.guideId })
        .populate('user', 'username profilePicture') // Populate the user who made the comment
        .sort({ createdAt: 1 }); // Sort by oldest first

    res.status(200).json({
        success: true,
        count: comments.length,
        data: comments
    });
});

// @desc    Add a comment to a guide
// @route   POST /api/comments
// @access  Private (requires authenticated user)
const addComment = asyncHandler(async (req, res, next) => {
    const { content, guideId } = req.body;

    // Check if commenting is enabled via website settings
    const enableComments = await getSetting('enableComments', true);
    if (!enableComments) {
        return next(new AppError('Commenting is currently disabled by the administrator.', 403));
    }

    // Ensure the guide exists before adding a comment
    const guide = await Guide.findById(guideId);
    if (!guide) {
        return next(new AppError('Guide not found', 404));
    }

    // Create the new comment
    const comment = await Comment.create({
        content,
        user: req.user._id, // User ID from the authenticated request
        guide: guideId
    });

    res.status(201).json({ // 201 Created status
        success: true,
        data: comment
    });
    logger.info(`User ${req.user.username} added a comment to guide "${guide.title}"`);

    // Optional: Notify the guide owner about the new comment
    // Only send if the commenter is not the guide owner
    if (guide.user.toString() !== req.user._id.toString()) {
        await sendNotificationToUser(
            guide.user, // Recipient: Guide owner's ID
            'New Comment on Your Guide',
            `"${req.user.username}" commented on your guide "${guide.title}".`,
            'guide_update', // Custom notification type
            `/guides/${guide.slug}#comments` // Link to the guide's comment section
        );
    }
});

// @desc    Update a comment
// @route   PUT /api/comments/:id
// @access  Private (requires authentication)
const updateComment = asyncHandler(async (req, res, next) => {
    const { content } = req.body;

    let comment = await Comment.findById(req.params.id);

    if (!comment) {
        return next(new AppError('Comment not found', 404));
    }

    // Authorization: Ensure the logged-in user is the owner of the comment
    if (comment.user.toString() !== req.user._id.toString()) {
        return next(new AppError('Not authorized to update this comment', 401));
    }

    comment.content = content || comment.content; // Update content if provided
    await comment.save(); // Save the updated comment

    res.status(200).json({
        success: true,
        data: comment,
        message: 'Comment updated successfully.'
    });
    logger.info(`User ${req.user.username} updated comment ID: ${comment._id}`);
});

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private (User can delete their own, Admin can delete any)
const deleteComment = asyncHandler(async (req, res, next) => {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
        return next(new AppError('Comment not found', 404));
    }

    // Authorization: Allow owner of the comment OR an admin to delete
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return next(new AppError('Not authorized to delete this comment', 401));
    }

    await Comment.deleteOne({ _id: comment._id }); // Delete the comment

    res.status(200).json({
        success: true,
        data: {}, // Return empty object after successful deletion
        message: 'Comment removed successfully.'
    });
    logger.info(`${req.user.username} deleted comment ID: ${comment._id}`);
});

module.exports = {
    getCommentsForGuide,
    addComment,
    updateComment,
    deleteComment
};