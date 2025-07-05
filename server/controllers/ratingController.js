// quickfix-website/server/controllers/ratingController.js
const asyncHandler = require('express-async-handler');
const Rating = require('../models/Rating');
const Guide = require('../models/Guide');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const Settings = require('../models/Settings'); // To check if ratings are enabled

// Helper to get a setting value from the database
const getSetting = async (name, defaultValue) => {
    const setting = await Settings.findOne({ settingName: name });
    return setting ? setting.settingValue : defaultValue;
};

// @desc    Get ratings for a specific guide
// @route   GET /api/ratings/guide/:guideId
// @access  Public
const getRatingsForGuide = asyncHandler(async (req, res, next) => {
    // Find all ratings for a given guide ID, populate user details, and sort
    const ratings = await Rating.find({ guide: req.params.guideId })
        .populate('user', 'username profilePicture') // Populate the user who made the rating
        .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json({
        success: true,
        count: ratings.length,
        data: ratings
    });
});

// @desc    Add a rating to a guide
// @route   POST /api/ratings
// @access  Private (requires authenticated user)
const addRating = asyncHandler(async (req, res, next) => {
    const { rating, guideId } = req.body;
    const userId = req.user._id;

    // Check if rating feature is enabled via website settings
    const enableRatings = await getSetting('enableRatings', true);
    if (!enableRatings) {
        return next(new AppError('Rating feature is currently disabled by the administrator.', 403));
    }

    // Ensure the guide exists before adding a rating
    const guide = await Guide.findById(guideId);
    if (!guide) {
        return next(new AppError('Guide not found', 404));
    }

    // Prevent a user from rating the same guide multiple times
    const existingRating = await Rating.findOne({ user: userId, guide: guideId });
    if (existingRating) {
        return next(new AppError('You have already rated this guide. Please update your existing rating instead.', 400));
    }

    // Create the new rating
    const newRating = await Rating.create({
        rating,
        user: userId, // User ID from the authenticated request
        guide: guideId
    });

    res.status(201).json({ // 201 Created status
        success: true,
        data: newRating,
        message: 'Rating added successfully.'
    });
    logger.info(`User ${req.user.username} added rating ${rating} to guide "${guide.title}"`);
});

// @desc    Update a rating
// @route   PUT /api/ratings/:id
// @access  Private (requires authentication)
const updateRating = asyncHandler(async (req, res, next) => {
    const { rating } = req.body;

    let existingRating = await Rating.findById(req.params.id);

    if (!existingRating) {
        return next(new AppError('Rating not found', 404));
    }

    // Authorization: Ensure the logged-in user is the owner of the rating
    if (existingRating.user.toString() !== req.user._id.toString()) {
        return next(new AppError('Not authorized to update this rating', 401));
    }

    existingRating.rating = rating; // Update rating value
    await existingRating.save(); // Save the updated rating (post-save hook will recalculate guide's average)

    res.status(200).json({
        success: true,
        data: existingRating,
        message: 'Rating updated successfully.'
    });
    logger.info(`User ${req.user.username} updated rating ID: ${existingRating._id} to ${rating}`);
});

// @desc    Delete a rating
// @route   DELETE /api/ratings/:id
// @access  Private (User can delete their own, Admin can delete any)
const deleteRating = asyncHandler(async (req, res, next) => {
    const rating = await Rating.findById(req.params.id);

    if (!rating) {
        return next(new AppError('Rating not found', 404));
    }

    // Authorization: Allow owner of the rating OR an admin to delete
    if (rating.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return next(new AppError('Not authorized to delete this rating', 401));
    }

    await Rating.deleteOne({ _id: rating._id }); // Delete the rating (post-deleteOne hook will recalculate guide's average)

    res.status(200).json({
        success: true,
        data: {}, // Return empty object after successful deletion
        message: 'Rating removed successfully.'
    });
    logger.info(`${req.user.username} deleted rating ID: ${rating._id}`);
});

module.exports = {
    getRatingsForGuide,
    addRating,
    updateRating,
    deleteRating
};