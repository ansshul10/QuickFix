// quickfix-website/server/controllers/guideController.js
const asyncHandler = require('express-async-handler');
const Guide = require('../models/Guide');
const Category = require('../models/Category');
const Comment = require('../models/Comment');
const Rating = require('../models/Rating');
const logger = require('../utils/logger');
const AppError = require('../utils/appError');
const slugify = require('slugify'); // For generating SEO-friendly slugs
const Settings = require('../models/Settings'); // To check dynamic website settings
const { marked } = require('marked'); // Import the marked library

// Configure marked to render code blocks properly for styling later (optional but good practice)
marked.setOptions({
    breaks: true, // Allow GFM line breaks (single newline means <br>)
    gfm: true, // Use GitHub flavored markdown
    // highlight: function(code, lang) { // Optional: for syntax highlighting on server
    //     const hljs = require('highlight.js');
    //     const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    //     return hljs.highlight(code, { language }).value;
    // },
    // langPrefix: 'hljs language-', // Class prefix for code blocks
});


// Helper to get a setting value from the database
const getSetting = async (name, defaultValue) => {
    const setting = await Settings.findOne({ settingName: name });
    return setting ? setting.settingValue : defaultValue;
};

// @desc    Get all guides with filtering, pagination, and search
// @route   GET /api/guides
// @access  Public
const getGuides = asyncHandler(async (req, res) => {
    const query = {}; // Build query object based on request parameters

    // Keyword search (title and description)
    if (req.query.keyword) {
        query.$or = [
            { title: { $regex: req.query.keyword, $options: 'i' } }, // Case-insensitive regex search
            { description: { $regex: req.query.keyword, $options: 'i' } },
        ];
    }
    // Filter by category slug
    if (req.query.category) {
        const category = await Category.findOne({ slug: req.query.category });
        if (category) {
            query.category = category._id; // Filter by category's ObjectId
        } else {
            // If category slug is invalid, return an empty array of guides
            return res.json({ guides: [], page: 1, pages: 1, total: 0 });
        }
    }
    // Filter by premium status
    if (req.query.isPremium) {
        query.isPremium = req.query.isPremium === 'true'; // Convert string to boolean
    }

    const pageSize = parseInt(req.query.pageSize) || 10; // Number of guides per page, default 10
    const page = parseInt(req.query.pageNumber) || 1; // Current page number, default 1

    // Count total documents matching the query for pagination metadata
    const count = await Guide.countDocuments(query);
    // Find guides, apply pagination, populate related fields, and sort
    const guides = await Guide.find(query)
        .populate('user', 'username profilePicture') // Populate creator's username and profile picture
        .populate('category', 'name')                // Populate category name
        .limit(pageSize)                             // Limit results per page
        .skip(pageSize * (page - 1))                 // Skip documents based on current page
        .sort({ createdAt: -1 });                    // Sort by newest first

    res.json({
        success: true,
        guides,
        page,
        pages: Math.ceil(count / pageSize), // Total number of pages
        total: count                         // Total number of guides found
    });
});

// @desc    Get single guide by slug
// @route   GET /api/guides/:slug
// @access  Public
const getGuide = asyncHandler(async (req, res, next) => {
    // Find a single guide by its unique slug
    const guide = await Guide.findOne({ slug: req.params.slug })
        .populate('user', 'username email profilePicture') // Populate creator's details
        .populate('category', 'name')                      // Populate category name
        .populate({
            path: 'comments', // Populate comments associated with this guide
            populate: {
                path: 'user', // Populate user details within each comment
                select: 'username profilePicture'
            }
        });

    if (!guide) {
        return next(new AppError('Guide not found', 404));
    }

    // Check if the guide is premium and if the user is authorized to view it
    if (guide.isPremium && (!req.user || !req.user.isPremium)) {
        return next(new AppError('This content is for premium users only. Please upgrade your plan.', 403));
    }

    // You were calculating averageRating and userRating in the old code.
    // Ensure the guide object has a 'ratings' virtual populated to calculate these.
    // Adding it back as per your original structure implies it's needed here.
    const populatedGuide = await Guide.populate(guide, {
        path: 'ratings',
        options: { sort: { createdAt: -1 } }
    });

    const ratings = populatedGuide.ratings;
    const totalRating = ratings.reduce((sum, r) => sum + r.stars, 0);
    populatedGuide.averageRating = ratings.length > 0 ? totalRating / ratings.length : 0;
    populatedGuide.numOfReviews = ratings.length;

    if (req.user) {
        const userRating = ratings.find(r => r.user.toString() === req.user.id);
        populatedGuide.userRating = userRating ? userRating.stars : 0;
    } else {
        populatedGuide.userRating = 0;
    }


    res.json({
        success: true,
        data: populatedGuide // Send the populated guide data
    });
});

// @desc    Create new guide
// @route   POST /api/guides
// @access  Private/Admin (only admins can create guides)
const createGuide = asyncHandler(async (req, res, next) => {
    const { title, description, content, category, isPremium, imageUrl } = req.body;

    // Validate category ID
    const foundCategory = await Category.findById(category);
    if (!foundCategory) {
        return next(new AppError('Invalid category ID', 400));
    }

    // --- CONVERT MARKDOWN TO HTML HERE ---
    const htmlContent = marked.parse(content); // Use marked.parse for conversion

    // Create a new Guide instance
    const guide = new Guide({
        title,
        slug: slugify(title, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g }), // Generate a clean slug
        description,
        content: htmlContent, // Save the converted HTML content
        category: foundCategory._id, // Assign the actual category ObjectId
        user: req.user._id, // Assign the authenticated user as the guide creator
        isPremium: isPremium || false, // Default to false if not provided
        imageUrl: imageUrl || '/images/default-guide.png' // Default image if not provided
    });

    const createdGuide = await guide.save(); // Save the new guide to the database
    res.status(201).json({ // 201 Created status
        success: true,
        data: createdGuide
    });
    logger.info(`New guide created: "${createdGuide.title}" by ${req.user.username}`);

    // Optional: Notify newsletter subscribers about the new guide (if setting is enabled)
    const newGuideNotificationToSubscribers = await getSetting('newGuideNotificationToSubscribers', false);
    if (newGuideNotificationToSubscribers) {
        const { sendBulkNewsletterEmailFromService } = require('../services/newsletterService'); // Dynamically import to avoid circular dependency
        await sendBulkNewsletterEmailFromService(
            `New QuickFix Guide: "${createdGuide.title}"`,
            `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                    <div style="background-color: #3490dc; padding: 30px; text-align: center; color: #ffffff;">
                        <h1 style="margin: 0; font-size: 28px;">New Guide Alert!</h1>
                    </div>
                    <div style="padding: 30px; line-height: 1.6; color: #333333;">
                        <p>Hello QuickFix Subscriber,</p>
                        <p>We're thrilled to announce a new guide has just been published:</p>
                        <h2 style="color: #3490dc; margin-bottom: 15px;">${createdGuide.title}</h2>
                        <p>${createdGuide.description}</p>
                        <div style="text-align: center; margin: 25px 0;">
                            <a href="${process.env.FRONTEND_URL}/guides/${createdGuide.slug}" style="background-color: #28a745; color: #ffffff; padding: 12px 25px; border-radius: 5px; text-decoration: none; font-weight: bold;">Read the Full Guide</a>
                        </div>
                        <p>We hope this new guide helps you with your tech challenges!</p>
                        <p>Thank you,</p>
                        <p>The QuickFix Team</p>
                    </div>
                    <div style="background-color: #eeeeee; padding: 20px; text-align: center; font-size: 12px; color: #777777; border-top: 1px solid #dddddd;">
                        <p>&copy; ${new Date().getFullYear()} QuickFix. All rights reserved.</p>
                        <p>You received this email because you subscribed to our newsletter. If you wish to unsubscribe, please visit our website.</p>
                    </div>
                </div>
            </div>
            `,
            'new_guide_notification' // Custom type for email tracking/filtering
        );
    }
});

// @desc    Update a guide
// @route   PUT /api/guides/:id
// @access  Private/Admin
const updateGuide = asyncHandler(async (req, res, next) => {
    const { title, description, content, category, isPremium, imageUrl } = req.body;

    const guide = await Guide.findById(req.params.id);

    if (!guide) {
        return next(new AppError('Guide not found', 404));
    }

    // If category is provided, validate it
    if (category) {
        const foundCategory = await Category.findById(category);
        if (!foundCategory) {
            return next(new AppError('Invalid category ID', 400));
        }
        guide.category = foundCategory._id; // Assign the actual category ObjectId
    }

    // Update fields if they are provided in the request body
    if (title) {
        guide.title = title;
        guide.slug = slugify(title, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g }); // Regenerate slug if title changes
    }
    if (description) guide.description = description;

    // --- CONVERT MARKDOWN TO HTML HERE if content is updated ---
    if (content) {
        guide.content = marked.parse(content); // Update with converted HTML content
    }

    guide.isPremium = isPremium !== undefined ? isPremium : guide.isPremium; // Use !== undefined to allow false values
    guide.imageUrl = imageUrl || guide.imageUrl;

    const updatedGuide = await guide.save(); // Save the updated guide
    res.json({
        success: true,
        data: updatedGuide,
        message: 'Guide updated successfully.'
    });
    logger.info(`Guide updated: "${updatedGuide.title}" by ${req.user.username}`);
});

// @desc    Delete a guide
// @route   DELETE /api/guides/:id
// @access  Private/Admin
const deleteGuide = asyncHandler(async (req, res, next) => {
    const guide = await Guide.findById(req.params.id);

    if (!guide) {
        return next(new AppError('Guide not found', 404));
    }

    // Also delete associated comments and ratings to maintain data integrity
    await Comment.deleteMany({ guide: guide._id });
    await Rating.deleteMany({ guide: guide._id });

    await Guide.deleteOne({ _id: guide._id }); // Delete the guide itself
    res.json({
        success: true,
        message: 'Guide removed and associated comments/ratings deleted.'
    });
    logger.info(`Guide deleted: "${guide.title}" by ${req.user.username}`);
});

// @desc    Upload guide image (Placeholder - requires Multer/Cloudinary for actual file handling)
// @route   PUT /api/guides/:id/image
// @access  Private/Admin
const uploadGuideImage = asyncHandler(async (req, res, next) => {
    // This is a placeholder for actual file upload logic.
    // In a real application, you'd integrate a library like Multer for handling multipart/form-data
    // and then upload to a cloud storage service like Cloudinary, AWS S3, or Google Cloud Storage.

    const guide = await Guide.findById(req.params.id);
    if (!guide) {
        return next(new AppError('Guide not found', 404));
    }

    // Assuming `req.body.imageUrl` contains a URL string for the image (e.g., from Cloudinary upload on frontend)
    if (req.body.imageUrl) {
        guide.imageUrl = req.body.imageUrl;
    } else {
        return next(new AppError('Please provide an image URL', 400));
    }

    const updatedGuide = await guide.save();
    res.json({
        success: true,
        message: 'Image URL updated successfully',
        imageUrl: updatedGuide.imageUrl
    });
    logger.info(`Image updated for guide: "${guide.title}"`);
});

module.exports = {
    getGuides,
    getGuide,
    createGuide,
    updateGuide,
    deleteGuide,
    uploadGuideImage
};
