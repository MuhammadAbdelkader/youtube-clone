const ResponseHelper = require("../utils/responseHelper");

const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return ResponseHelper.validationError(res, errors);
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return ResponseHelper.conflict(res, `${field} already exists`);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return ResponseHelper.unauthorized(res, "Invalid token");
    }

    if (err.name === 'TokenExpiredError') {
        return ResponseHelper.unauthorized(res, "Token expired");
    }

    // Custom errors with cause
    if (err.cause) {
        return ResponseHelper.error(res, err.message, err.cause);
    }

    // Default error
    return ResponseHelper.error(res, "Internal server error");
};

module.exports = errorHandler;
