// quickfix-website/server/controllers/announcementController.js
const asyncHandler = require('express-async-handler');
const Announcement = require('../models/Announcement');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

// @desc    Get all active announcements for public/user view
// @route   GET /api/announcements
// @access  Public
const getAnnouncements = asyncHandler(async (req, res) => {
    // Only return announcements that are active and within their specified date range
    const announcements = await Announcement.find({
        isActive: true, // Must be marked as active
        startDate: { $lte: new Date() }, // Start date must be today or in the past
        $or: [
            { endDate: { $gte: new Date() } }, // End date must be today or in the future
            { endDate: null } // Or endDate is not set (announcement is perpetual)
        ]
    }).sort({ startDate: -1 }); // Sort by newest active first

    res.status(200).json({
        success: true,
        count: announcements.length,
        data: announcements
    });
    logger.info('Public fetched active announcements.');
});

// @desc    Get a single announcement by ID for public/user view
// @route   GET /api/announcements/:id
// @access  Public
const getSingleAnnouncement = asyncHandler(async (req, res, next) => {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
        return next(new AppError('Announcement not found.', 404));
    }

    // Check if the specific announcement is currently active for public viewing
    const isCurrentlyActive = announcement.isActive &&
                              announcement.startDate <= new Date() &&
                              (announcement.endDate === null || announcement.endDate >= new Date());

    if (!isCurrentlyActive) {
        // If the announcement exists but is not active for public view, treat as not found
        return next(new AppError('Announcement not currently active or found.', 404));
    }

    res.status(200).json({
        success: true,
        data: announcement
    });
    logger.info(`Public fetched announcement ID: ${announcement._id}`);
});

module.exports = {
    getAnnouncements,
    getSingleAnnouncement
};