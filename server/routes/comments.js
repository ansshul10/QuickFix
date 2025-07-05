// quickfix-website/server/routes/comments.js
const express = require('express');
const {
    getCommentsForGuide,
    addComment,
    updateComment,
    deleteComment
} = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');
const { createCommentSchema } = require('../utils/validation'); // Using create schema for content validation on update too

const router = express.Router();

// Public route to get comments for a specific guide
router.get('/guide/:guideId', getCommentsForGuide);

// Protected routes for adding/updating/deleting comments
router.post('/', protect, validate(createCommentSchema), addComment); // Adding a comment requires login
router.route('/:id')
    .put(protect, validate(createCommentSchema), updateComment) // Updating a comment requires login (and ownership check in controller)
    .delete(protect, deleteComment); // Deleting a comment requires login (and ownership/admin check in controller)

module.exports = router;