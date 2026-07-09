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
        if (!req.file) {
            throw new Error('Video file required');
        }
        if (!req.file.mimetype.startsWith('video/') && req.file.mimetype !== 'application/octet-stream' && req.file.mimetype !== 'application/mp4') {
            throw new Error('Must be a video file');
        }
        if (req.file.size > 100 * 1024 * 1024) {
            throw new Error('Video too large (max 100MB)');
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

// Accepts either a 24-char MongoDB ObjectId or an 11-char base64url videoId.
// The controller's dual-lookup logic handles which field to query based on the
// length and character set of the incoming id parameter.
const idValidation = [
    param('id')
        .notEmpty().withMessage("id is required")
        .custom((value) => {
            const isMongoId  = /^[0-9a-fA-F]{24}$/.test(value);
            const isVideoId  = /^[A-Za-z0-9_-]{11}$/.test(value);
            if (!isMongoId && !isVideoId) {
                throw new Error('Invalid video ID');
            }
            return true;
        }),
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