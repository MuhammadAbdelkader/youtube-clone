const { body, param, query } = require('express-validator');

const validateVideo = [
    body('title').escape().notEmpty().withMessage('Title required'),
    body('thumbnailUrl').escape().notEmpty().withMessage('Thumbnail required'),
    body('description').escape().notEmpty().withMessage('Description required'),
    body('userId').notEmpty().isMongoId().withMessage('User ID required').optional(),
    body('duration').notEmpty().isNumeric().withMessage('Duration must be a number').optional(),

    body('video').custom((value, { req }) => {
        if (!req.files?.video) {
            throw new Error('Video file required');
        }
        if (!req.files.video.mimetype.startsWith('video/')) {
            throw new Error('Must be a video file');
        }
        if (req.files.video.size > 50 * 1024 * 1024) {
            throw new Error('Video too large (max 50MB)');
        }
        return true;
    }),
];

const updateVideoValidation = [
    param('id').notEmpty().withMessage("id is required").isMongoId().withMessage('Invalid video ID'),
    body("title").escape().optional().notEmpty().withMessage("Title is required"),
    body('thumbnailUrl').escape().optional().notEmpty().withMessage('Thumbnail required'),
    body('description').escape().optional().notEmpty().withMessage('Description required'),
    body('duration').optional().notEmpty().isNumeric().withMessage('Duration must be a number'),
];

const searchVideoValidation = [
    query("q").escape().isString().notEmpty().withMessage("Search query is required"),
];

const retrieveAllVideosValidation = [
    query("page").escape().optional().isNumeric().withMessage("Page must be a number"),
    query("limit").escape().optional().isNumeric().withMessage("Limit must be a number"),
];

const idValidation = [
    param('id').notEmpty().withMessage("id is required").isMongoId().withMessage('Invalid video ID'),
];

module.exports = {
    validateVideo,
    updateVideoValidation,
    searchVideoValidation,
    retrieveAllVideosValidation,
    idValidation
};
