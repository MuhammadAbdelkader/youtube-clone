const { body, param } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Validation rules for POST /api/watch-history
 * videoId must be a valid MongoDB ObjectId (the video's _id)
 */
const addWatchHistoryValidation = [
    body('videoId')
        .notEmpty()
        .withMessage('Video ID is required')
        .isMongoId()
        .withMessage('Invalid video ID — must be a MongoDB ObjectId'),
    body('watchDuration')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('watchDuration must be a non-negative number (seconds)'),
    body('completed')
        .optional()
        .isBoolean()
        .withMessage('completed must be a boolean'),
];

/**
 * Validation rules for DELETE /api/watch-history/:videoId
 * The :videoId param is the MongoDB _id of the video document.
 */
const videoIdParamValidation = [
    param('videoId')
        .notEmpty()
        .withMessage('Video ID param is required')
        .isMongoId()
        .withMessage('Invalid video ID param — must be a MongoDB ObjectId'),
];

module.exports = {
    addWatchHistoryValidation,
    videoIdParamValidation,
};