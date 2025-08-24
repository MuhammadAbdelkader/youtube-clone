const { body } = require('express-validator');

const validateVideo = [
    body('title').escape().notEmpty().withMessage('Title required'),
    body('thumbnailUrl').escape().notEmpty().withMessage('Thumbnail required'),
    body('description').escape().notEmpty().withMessage('Description required'),
    body('userId').notEmpty().withMessage('User ID required'),
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

module.exports = validateVideo;

