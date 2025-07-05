// quickfix-website/server/controllers/userController.js
const asyncHandler = require('express-async-handler');
const Guide = require('../models/Guide');
const Comment = require('../models/Comment');
const Rating = require('../models/Rating');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const User = require('../models/User'); // Required for populating user-specific virtuals if needed

// @desc    Get guides created by the authenticated user
// @route   GET /api/users/my-guides
// @access  Private
const getUserGuides = asyncHandler(async (req, res) => {
    // Find all guides where the creator matches the authenticated user's ID
    const guides = await Guide.find({ user: req.user._id })
        .populate('category', 'name') // Populate the category name
        .sort({ createdAt: -1 });    // Sort by newest first

    res.status(200).json({
        success: true,
        count: guides.length,
        data: guides
    });
    logger.info(`User ${req.user.username} fetched their guides.`);
});

// @desc    Get comments made by the authenticated user
// @route   GET /api/users/my-comments
// @access  Private
const getUserComments = asyncHandler(async (req, res) => {
    // Find all comments where the user matches the authenticated user's ID
    const comments = await Comment.find({ user: req.user._id })
        .populate('guide', 'title slug') // Populate the guide title and slug related to the comment
        .sort({ createdAt: -1 });    // Sort by newest first

    res.status(200).json({
        success: true,
        count: comments.length,
        data: comments
    });
    logger.info(`User ${req.user.username} fetched their comments.`);
});

// @desc    Get ratings made by the authenticated user
// @route   GET /api/users/my-ratings
// @access  Private
const getUserRatings = asyncHandler(async (req, res) => {
    // Find all ratings where the user matches the authenticated user's ID
    const ratings = await Rating.find({ user: req.user._id })
        .populate('guide', 'title slug') // Populate the guide title and slug related to the rating
        .sort({ createdAt: -1 });    // Sort by newest first

    res.status(200).json({
        success: true,
        count: ratings.length,
        data: ratings
    });
    logger.info(`User ${req.user.username} fetched their ratings.`);
});

module.exports = {
    getUserGuides,
    getUserComments,
    getUserRatings
};