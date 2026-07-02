const { body, param } = require('express-validator');

const addWatchHistoryValidation = [
    body('videoId')
        .notEmpty()
        .withMessage('Video ID is required')
        .isMongoId()
        .withMessage('Invalid video ID'),
    body('watchDuration')
        .optional()
        .isNumeric()
        .withMessage('Watch duration must be a number'),
    body('completed')
        .optional()
        .isBoolean()
        .withMessage('Completed must be boolean')
];

const videoIdParamValidation = [
    param('videoId')
        .notEmpty()
        .withMessage('Video ID is required')
        .isMongoId()
        .withMessage('Invalid video ID')
];

module.exports = {
    addWatchHistoryValidation,
    videoIdParamValidation
};