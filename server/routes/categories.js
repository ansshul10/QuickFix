// quickfix-website/server/routes/categories.js
const express = require('express');
const {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');
const { createCategorySchema, updateCategorySchema } = require('../utils/validation');

const router = express.Router();

// Public routes for categories
router.get('/', getCategories);       // Get all categories
router.get('/:slug', getCategory);    // Get a single category by slug

// Admin routes for categories (CRUD operations)
router.route('/')
    .post(protect, authorize('admin'), validate(createCategorySchema), createCategory);

router.route('/:id')
    .put(protect, authorize('admin'), validate(updateCategorySchema), updateCategory)
    .delete(protect, authorize('admin'), deleteCategory);

module.exports = router;