// quickfix-website/server/utils/validation.js (No changes needed, already correct based on provided code)
const Joi = require('joi');
const AppError = require('./appError');

// Main validation middleware factory
const validate = (bodySchema, paramSchema = null) => (req, res, next) => {
    try {
        if (bodySchema) {
            const { error: bodyError, value: validatedBody } = bodySchema.validate(req.body, { abortEarly: false });
            if (bodyError) {
                const errorMessage = bodyError.details.map(d => d.message).join('; ');
                return next(new AppError(`Validation failed: ${errorMessage}`, 400, bodyError));
            }
            req.body = validatedBody;
        }

        if (paramSchema) {
            const { error: paramError, value: validatedParams } = paramSchema.validate(req.params, { abortEarly: false });
            if (paramError) {
                const errorMessage = paramError.details.map(d => d.message).join('; ');
                return next(new AppError(`Validation failed: ${errorMessage}`, 400, paramError));
            }
            req.params = validatedParams;
        }
        next();
    } catch (err) {
        console.error("Internal error in validation middleware:", err.message, err.stack);
        next(new AppError('An unexpected validation server error occurred.', 500));
    }
};

// Custom Joi extension for password validation
const passwordComplexity = Joi.string().min(8).pattern(
    new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+[\\]{};\':"\\\\|,.<>/?~`]).{8,}$')
).messages({
    'string.min': 'Password must be at least 8 characters long.',
    'string.pattern.base': 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.'
});

// --- AUTH SCHEMAS ---
const registerSchema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: passwordComplexity.required(), // Using the custom password complexity
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only': 'Passwords do not match'
    }),
    newsletterSubscriber: Joi.boolean().default(false)
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
    password: passwordComplexity.required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only': 'Passwords do not match'
    }),
});

const emailVerificationSchema = Joi.object({
    token: Joi.string().hex().length(64).required(),
});

const resendEmailVerificationLinkSchema = Joi.object({
    email: Joi.string().email().required(),
});

const updateUserProfileSchema = Joi.object({
    username: Joi.string().min(3).max(30).allow(null, ''),
    profilePicture: Joi.string().uri().allow(null, ''),
    password: passwordComplexity.allow(null, ''),
    confirmPassword: Joi.string()
        .valid(Joi.ref('password'))
        .when('password', {
            is: Joi.exist(),
            then: Joi.required(),
            otherwise: Joi.optional()
        })
        .messages({
            'any.only': 'Passwords do not match'
        }),
    newsletterSubscriber: Joi.boolean()
}).min(1);


// --- ADMIN SPECIFIC SCHEMAS ---
const adminUpdateUserSchema = Joi.object({
    username: Joi.string().min(3).max(30).allow(null, ''),
    email: Joi.string().email().allow(null, ''),
    role: Joi.string().valid('user', 'admin'),
    isPremium: Joi.boolean(),
    active: Joi.boolean(),
    password: passwordComplexity.allow(null, ''),
    profilePicture: Joi.string().uri().allow(null, ''),
    newsletterSubscriber: Joi.boolean()
}).min(1);

const toggleNewsletterStatusSchema = Joi.object({
    newsletterSubscriber: Joi.boolean().required()
});

const updateSettingSchema = Joi.object({
    settingName: Joi.string().required(),
    settingValue: Joi.any().required(),
    description: Joi.string().allow(null, '')
});

const createAnnouncementSchema = Joi.object({
    title: Joi.string().min(3).max(100).required(),
    content: Joi.string().min(10).required(),
    type: Joi.string().valid('info', 'warning', 'danger', 'success').default('info'),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    isActive: Joi.boolean().default(true)
});

const updateAnnouncementSchema = Joi.object({
    title: Joi.string().min(3).max(100).allow(null, ''),
    content: Joi.string().min(10).allow(null, ''),
    type: Joi.string().valid('info', 'warning', 'danger', 'success'),
    startDate: Joi.date().iso().allow(null),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).allow(null),
    isActive: Joi.boolean()
}).min(1);


// --- GUIDE SCHEMAS ---
const createGuideSchema = Joi.object({
    title: Joi.string().min(5).max(100).required(),
    content: Joi.string().min(50).required(),
    category: Joi.string().hex().length(24).required(),
    tags: Joi.array().items(Joi.string().trim()).default([]),
    isPremium: Joi.boolean().default(false),
    featuredImage: Joi.string().uri().allow(null, ''),
    status: Joi.string().valid('draft', 'published', 'archived').default('draft'),
    keywords: Joi.array().items(Joi.string().trim()).default([]),
    estimatedReadingTime: Joi.number().integer().min(1).default(5)
});

const updateGuideSchema = Joi.object({
    title: Joi.string().min(5).max(100).allow(null, ''),
    content: Joi.string().min(50).allow(null, ''),
    category: Joi.string().hex().length(24).allow(null, ''),
    tags: Joi.array().items(Joi.string().trim()),
    isPremium: Joi.boolean(),
    featuredImage: Joi.string().uri().allow(null, ''),
    status: Joi.string().valid('draft', 'published', 'archived'),
    keywords: Joi.array().items(Joi.string().trim()),
    estimatedReadingTime: Joi.number().integer().min(1)
}).min(1);

const guideIdSchema = Joi.object({
    id: Joi.string().hex().length(24).required()
});

const guideSlugSchema = Joi.object({
    slug: Joi.string().required()
});

// --- COMMENT SCHEMAS ---
const createCommentSchema = Joi.object({
    content: Joi.string().min(5).max(500).required(),
    guide: Joi.string().hex().length(24).required(),
    parentComment: Joi.string().hex().length(24).allow(null, '')
});

const updateCommentSchema = Joi.object({
    content: Joi.string().min(5).max(500).required()
});

const commentIdSchema = Joi.object({
    id: Joi.string().hex().length(24).required()
});


// --- RATING SCHEMAS ---
const createRatingSchema = Joi.object({
    rating: Joi.number().integer().min(1).max(5).required(),
    guide: Joi.string().hex().length(24).required()
});

const ratingIdSchema = Joi.object({
    id: Joi.string().hex().length(24).required()
});


// --- CATEGORY SCHEMAS ---
const createCategorySchema = Joi.object({
    name: Joi.string().min(3).max(50).required().label('Category Name'),
    description: Joi.string().min(10).max(500).required().label('Category Description')
});

const updateCategorySchema = Joi.object({
    name: Joi.string().min(3).max(50).label('Category Name').allow(null, ''),
    description: Joi.string().min(10).max(500).label('Category Description').allow(null, '')
}).min(1);

const categoryIdSchema = Joi.object({
    id: Joi.string().hex().length(24).required().label('Category ID')
});


// --- NEWSLETTER SCHEMAS ---
const subscribeNewsletterSchema = Joi.object({
    email: Joi.string().email().required().label('Email')
});

const sendEmailSchema = Joi.object({
    email: Joi.string().email(),
    subject: Joi.string().required().label('Subject'),
    htmlContent: Joi.string().required().label('HTML Content')
});

const getSubscriberByEmailSchema = Joi.object({
    email: Joi.string().email().required().label('Email')
});

// --- PREMIUM/SUBSCRIPTION SCHEMAS ---
const submitUpiPaymentConfirmationSchema = Joi.object({
    transactionId: Joi.string().trim().required().label('Transaction ID'),
    referenceCode: Joi.string().trim().required().label('Reference Code'),
    selectedPlan: Joi.string().valid('basic', 'advanced', 'pro').required().label('Selected Plan')
});

const adminVerifyPaymentSchema = Joi.object({
    status: Joi.string().valid('active', 'failed', 'cancelled').required().label('Status'),
    adminNotes: Joi.string().allow(null, '').label('Admin Notes'),
});

const uploadScreenshotSchema = Joi.object({
    subscriptionId: Joi.string().hex().length(24).required().label('Subscription ID')
});

// Schema for submitting a new contact message
const submitContactMessageSchema = Joi.object({
    name: Joi.string().trim().max(100).required().messages({
        'string.empty': 'Name cannot be empty',
        'any.required': 'Name is required'
    }),
    email: Joi.string().email().required().messages({
        'string.empty': 'Email cannot be empty',
        'any.required': 'Email is required'
    }),
    message: Joi.string().trim().max(1000).required().messages({
        'string.empty': 'Message cannot be empty',
        'any.required': 'Message is required'
    })
});

const updateContactMessageSchema = Joi.object({
    isRead: Joi.boolean(),
    status: Joi.string().valid('Pending', 'Under Review', 'Completed'),
    adminResponse: Joi.string().trim().max(5000).allow(''),
}).min(1).messages({
    'object.min': 'At least one field (isRead, status, or adminResponse) is required for an update.'
});

const replyContactMessageSchema = Joi.object({
    replyMessage: Joi.string().trim().max(1000).required().messages({
        'string.empty': 'Reply message cannot be empty',
        'any.required': 'Reply message is required'
    })
});


module.exports = {
    validate,
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    emailVerificationSchema,
    resendEmailVerificationLinkSchema,
    updateUserProfileSchema,
    adminUpdateUserSchema,
    toggleNewsletterStatusSchema,
    updateSettingSchema,
    createAnnouncementSchema,
    updateAnnouncementSchema,
    createGuideSchema,
    updateGuideSchema,
    guideIdSchema,
    guideSlugSchema,
    createCommentSchema,
    updateCommentSchema,
    commentIdSchema,
    createRatingSchema,
    ratingIdSchema,
    createCategorySchema,
    updateCategorySchema,
    categoryIdSchema,
    subscribeNewsletterSchema,
    sendEmailSchema,
    getSubscriberByEmailSchema,
    submitUpiPaymentConfirmationSchema,
    adminVerifyPaymentSchema,
    uploadScreenshotSchema,
    submitContactMessageSchema,
    updateContactMessageSchema,
    replyContactMessageSchema
};