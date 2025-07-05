// quickfix-website/server/controllers/categoryController.js
const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const slugify = require('slugify'); // For generating URL-friendly slugs

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
    // Fetch all categories and sort them alphabetically by name
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json({
        success: true,
        count: categories.length,
        data: categories
    });
});

// @desc    Get single category by slug
// @route   GET /api/categories/:slug
// @access  Public
const getCategory = asyncHandler(async (req, res, next) => {
    // Find a category by its unique slug
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
        // If no category is found, throw an AppError
        return next(new AppError(`No category found with slug of ${req.params.slug}`, 404));
    }
    res.status(200).json({
        success: true,
        data: category
    });
});

// @desc    Create new category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = asyncHandler(async (req, res, next) => {
    const { name, description } = req.body;

    // Check if a category with the same name already exists
    const categoryExists = await Category.findOne({ name: name });
    if (categoryExists) {
        return next(new AppError('Category with this name already exists', 400));
    }

    // Create a new category, generating a slug from its name
    const category = await Category.create({
        name,
        slug: slugify(name, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g }), // Generate slug
        description
    });

    res.status(201).json({ // 201 Created status
        success: true,
        data: category
    });
    logger.info(`New category created: ${category.name} by ${req.user.username}`);
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = asyncHandler(async (req, res, next) => {
    const { name, description } = req.body;

    let category = await Category.findById(req.params.id);

    if (!category) {
        return next(new AppError(`No category found with id of ${req.params.id}`, 404));
    }

    // If name is being updated, check for uniqueness (excluding the current category itself)
    if (name) {
        const categoryExists = await Category.findOne({ name: name, _id: { $ne: req.params.id } });
        if (categoryExists) {
            return next(new AppError('Category with this name already exists', 400));
        }
        category.name = name;
        category.slug = slugify(name, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g }); // Regenerate slug
    }
    // Update description if provided
    if (description !== undefined) {
        category.description = description;
    }

    await category.save(); // Save the updated category

    res.status(200).json({
        success: true,
        data: category
    });
    logger.info(`Category updated: ${category.name} by ${req.user.username}`);
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = asyncHandler(async (req, res, next) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        return next(new AppError(`No category found with id of ${req.params.id}`, 404));
    }

    // Before deleting a category, ensure no guides are associated with it
    const guidesCount = await require('../models/Guide').countDocuments({ category: category._id });
    if (guidesCount > 0) {
        return next(new AppError(`Cannot delete category "${category.name}" because ${guidesCount} guides are still associated with it. Please reassign or delete those guides first.`, 400));
    }

    await Category.deleteOne({ _id: category._id }); // Use deleteOne for Mongoose 6+

    res.status(200).json({
        success: true,
        data: {}, // Return empty object as data is deleted
        message: `Category "${category.name}" deleted successfully.`
    });
    logger.info(`Category deleted: ${category.name} by ${req.user.username}`);
});

module.exports = {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory
};