// quickfix-website/server/utils/errorHandler.js
const AppError = require('./appError');
const logger = require('./logger'); // Your custom Winston logger

// --- Helper Functions to create AppError instances for specific DB/JWT errors ---
const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400); // 400 Bad Request
};

const handleDuplicateFieldsDB = err => {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate field value: '${value}' for field '${field}'. Please use another value!`;
    return new AppError(message, 400); // 400 Bad Request
};

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data: ${errors.join('. ')}`;
    return new AppError(message, 400); // 400 Bad Request
};

const handleJWTError = () =>
    new AppError('Invalid authentication token. Please log in again!', 401); // 401 Unauthorized

const handleJWTExpiredError = () =>
    new AppError('Your authentication session has expired! Please log in again.', 401); // 401 Unauthorized

// --- Send Error Responses based on Environment ---

// Development environment: send full error details for debugging
const sendErrorDev = (err, req, res) => {
    logger.error(`Development Error: ${err.name} - ${err.message}`, {
        originalErrorDetails: err.originalError ? {
            name: err.originalError.name,
            message: err.originalError.message,
            details: err.originalError.details
        } : undefined,
        stack: err.stack
    });

    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
        joiDetails: err.originalError && err.originalError.isJoi ? err.originalError.details : undefined
    });
};

// Production environment: send generalized, operational error messages
const sendErrorProd = (err, req, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    } else {
        logger.error('UNEXPECTED SERVER ERROR 💥', err);

        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong! Please try again later.'
        });
    }
};

// --- Main Error Handling Middleware ---
module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err };
        error.message = err.message; // Ensure message is copied

        // Handle specific known errors and convert them to operational AppErrors
        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, req, res);
    }
};