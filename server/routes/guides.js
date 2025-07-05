// quickfix-website/server/routes/guides.js
const express = require('express');
const {
    getGuides,
    getGuide,          // This controller needs req.user
    createGuide,
    updateGuide,
    deleteGuide,
    uploadGuideImage
} = require('../controllers/guideController');
const { protect, authorize } = require('../middleware/authMiddleware'); // Import protect and authorize
const validate = require('../middleware/validationMiddleware');
const { createGuideSchema, updateGuideSchema } = require('../utils/validation');

const router = express.Router();

// Public routes for guides (anyone can view)
router.get('/', getGuides);

// Get a single guide by its SEO-friendly slug
// ADDED 'protect' MIDDLEWARE HERE. It populates req.user if logged in.
// If not logged in, req.user will be undefined, and the controller's logic handles that.
router.get('/:slug', protect, getGuide); // <--- THIS IS THE KEY CHANGE

// Admin routes for guides (CRUD operations)
router.route('/')
    .post(protect, authorize('admin'), validate(createGuideSchema), createGuide); // Create guide

router.route('/:id')
    .put(protect, authorize('admin'), validate(updateGuideSchema), updateGuide)   // Update guide by ID
    .delete(protect, authorize('admin'), deleteGuide);                          // Delete guide by ID

// Route for uploading/updating a guide's image
// Note: This assumes imageUrl is sent in the body. For actual file uploads, you'd use Multer here.
router.put('/:id/image', protect, authorize('admin'), uploadGuideImage);

module.exports = router;
