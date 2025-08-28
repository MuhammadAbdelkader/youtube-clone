const { body, param } = require('express-validator');

const addCommentValidation = [
    body('content')
        .notEmpty()
        .withMessage('Comment content is required')
        .isLength({ max: 1000 })
        .withMessage('Comment too long (max 1000 characters)')
        .escape(),
    body('videoId')
        .notEmpty()
        .withMessage('Video ID is required')
        .isMongoId()
        .withMessage('Invalid video ID'),
    body('parentCommentId')
        .optional()
        .isMongoId()
        .withMessage('Invalid parent comment ID')
];

const updateCommentValidation = [
    param('commentId')
        .notEmpty()
        .withMessage('Comment ID is required')
        .isMongoId()
        .withMessage('Invalid comment ID'),
    body('content')
        .notEmpty()
        .withMessage('Comment content is required')
        .isLength({ max: 1000 })
        .withMessage('Comment too long (max 1000 characters)')
        .escape()
];

const commentIdValidation = [
    param('commentId')
        .notEmpty()
        .withMessage('Comment ID is required')
        .isMongoId()
        .withMessage('Invalid comment ID')
];

const videoIdValidation = [
    param('videoId')
        .notEmpty()
        .withMessage('Video ID is required')
        .isMongoId()
        .withMessage('Invalid video ID')
];

module.exports = {
    addCommentValidation,
    updateCommentValidation,
    commentIdValidation,
    videoIdValidation
};
