const { body, param, query } = require('express-validator');

const validateVideo = [
    body('title').escape().notEmpty().withMessage('Title required'),
    body('description').escape().notEmpty().withMessage('Description required'),
    body('userId').notEmpty().isMongoId().withMessage('User ID required').optional(),
    body('duration').notEmpty().isNumeric().withMessage('Duration must be a number').optional(),
    // ➕ NEW VALIDATIONS
    body('category')
        .optional()
        .isIn(['Education', 'Entertainment', 'Music', 'Gaming', 'Sports', 'Technology', 'News', 'Comedy', 'Other'])
        .withMessage('Invalid category'),
    body('tags')
        .optional()
        .isString()
        .withMessage('Tags must be a string'),
    body('language')
        .optional()
        .isString()
        .withMessage('Language must be a string'),

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
    body('description').escape().optional().notEmpty().withMessage('Description required'),
    body('duration').optional().notEmpty().isNumeric().withMessage('Duration must be a number'),
    // ➕ NEW VALIDATIONS
    body('category')
        .optional()
        .isIn(['Education', 'Entertainment', 'Music', 'Gaming', 'Sports', 'Technology', 'News', 'Comedy', 'Other'])
        .withMessage('Invalid category'),
    body('tags')
        .optional()
        .isString()
        .withMessage('Tags must be a string'),
    body('isPublic')
        .optional()
        .isBoolean()
        .withMessage('isPublic must be boolean')
];

const searchVideoValidation = [
    query("q").escape().isString().notEmpty().withMessage("Search query is required"),
    // ➕ NEW VALIDATIONS
    query("category")
        .optional()
        .isIn(['Education', 'Entertainment', 'Music', 'Gaming', 'Sports', 'Technology', 'News', 'Comedy', 'Other'])
        .withMessage('Invalid category'),
    query("sortBy")
        .optional()
        .isIn(['views', 'date', 'rating', 'relevance'])
        .withMessage('Invalid sort option'),
    query("date")
        .optional()
        .isIn(['today', 'this week', 'this month', 'this year'])
        .withMessage('Invalid date filter')
];

const retrieveAllVideosValidation = [
    query("page").escape().optional().isNumeric().withMessage("Page must be a number"),
    query("limit").escape().optional().isNumeric().withMessage("Limit must be a number"),
    // ➕ NEW VALIDATIONS
    query("category")
        .optional()
        .isIn(['Education', 'Entertainment', 'Music', 'Gaming', 'Sports', 'Technology', 'News', 'Comedy', 'Other'])
        .withMessage('Invalid category'),
    query("language")
        .optional()
        .isString()
        .withMessage('Language must be string')
];

const idValidation = [
    param('id').notEmpty().withMessage("id is required").isMongoId().withMessage('Invalid video ID'),
];

const categoryValidation = [
    param('category')
        .notEmpty()
        .withMessage('Category is required')
        .isIn(['Education', 'Entertainment', 'Music', 'Gaming', 'Sports', 'Technology', 'News', 'Comedy', 'Other'])
        .withMessage('Invalid category')
];

module.exports = { 
    validateVideo, 
    updateVideoValidation, 
    searchVideoValidation, 
    retrieveAllVideosValidation, 
    idValidation,
    categoryValidation  };