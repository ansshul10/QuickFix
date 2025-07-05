// quickfix-website/server/routes/ratings.js
const express = require('express');
const {
    getRatingsForGuide, // Publicly viewable ratings for a guide
    addRating,
    updateRating,
    deleteRating
} = require('../controllers/ratingController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');
const { createRatingSchema } = require('../utils/validation'); // Re-use create schema for content validation on update

const router = express.Router();

// Public route to get ratings for a specific guide
router.get('/guide/:guideId', getRatingsForGuide);

// Protected routes for adding/updating/deleting ratings
router.post('/', protect, validate(createRatingSchema), addRating); // Adding a rating requires login
router.route('/:id')
    .put(protect, validate(createRatingSchema), updateRating) // Updating a rating requires login (and ownership check)
    .delete(protect, deleteRating); // Deleting a rating requires login (and ownership/admin check)

module.exports = router;