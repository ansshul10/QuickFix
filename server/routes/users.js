// quickfix-website/server/routes/users.js
const express = require('express');
const {
    getUserGuides,
    getUserComments,
    getUserRatings
} = require('../controllers/userController'); // User-specific data controllers
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes in this file are protected, accessible by the authenticated user
router.use(protect);

// Get guides created by the authenticated user
router.get('/my-guides', getUserGuides);
// Get comments made by the authenticated user
router.get('/my-comments', getUserComments);
// Get ratings made by the authenticated user
router.get('/my-ratings', getUserRatings);


module.exports = router;