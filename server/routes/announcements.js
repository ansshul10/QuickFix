// quickfix-website/server/routes/announcements.js
const express = require('express');
const {
    getAnnouncements,      // Get active announcements for public view
    getSingleAnnouncement  // Get single active announcement for public view
} = require('../controllers/announcementController'); // Public-facing announcement controller

const router = express.Router();

// Public routes for announcements
// Users can view active announcements on the frontend
router.get('/', getAnnouncements); // Route to get all *active* announcements
router.get('/:id', getSingleAnnouncement); // Route to get a specific *active* announcement by ID


module.exports = router;