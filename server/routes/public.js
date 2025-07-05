// quickfix-website/server/routes/public.js

const express = require('express');
const { getPublicSettings } = require('../controllers/publicController'); // Import the new function

const router = express.Router();

// Public routes that don't require authentication or authorization
router.get('/settings', getPublicSettings); // New route for public settings

// ... potentially other public routes like
// router.get('/announcements', getPublicAnnouncements);
// router.get('/guides/:slug', getPublicGuideDetail);

module.exports = router;