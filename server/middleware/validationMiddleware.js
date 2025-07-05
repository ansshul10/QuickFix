// quickfix-website/server/middleware/validationMiddleware.js
const Joi = require('joi');
const AppError = require('../utils/appError');
const asyncHandler = require('express-async-handler');
const logger = require('../utils/logger'); // Import the logger here

// FIX IS HERE: The `validate` middleware now accepts two optional schemas:
// `bodySchema` for req.body validation (POST, PUT)
// `paramSchema` for req.params validation (GET with URL params, PUT/DELETE by ID)
const validate = (bodySchema = null, paramSchema = null) => asyncHandler(async (req, res, next) => {
    try {
        if (bodySchema) {
            // Validate req.body if a bodySchema is provided
            await bodySchema.validateAsync(req.body, { abortEarly: false });
        }

        if (paramSchema) {
            // Validate req.params if a paramSchema is provided
            await paramSchema.validateAsync(req.params, { abortEarly: false });
        }

        // If neither schema is provided, just move to the next middleware (might be a valid case for some routes)
        if (!bodySchema && !paramSchema) {
            logger.warn(`[Validation Middleware] No schema provided for ${req.method} ${req.originalUrl}. Skipping validation.`);
        }

        next(); // Proceed to the next middleware/controller if validation passes
    } catch (error) {
        // Log the full error object for comprehensive debugging
        logger.error(`[Validation Error] for ${req.originalUrl}:`, error);

        // Joi validation errors have an 'details' array.
        // If 'error.details' is undefined, it means Joi threw a different kind of error (e.g., schema misuse).
        const messages = error.details
            ? error.details.map(detail => detail.message).join('; ')
            : error.message || 'An unknown validation error occurred.'; // Fallback if error.details is undefined

        throw new AppError(`Validation failed: ${messages}`, 400); // Throw a 400 Bad Request with details
    }
});

module.exports = validate;