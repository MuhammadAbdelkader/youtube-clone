const { body, param } = require('express-validator');

const toggleLikeValidation = [
    body('targetType')
        .notEmpty()
        .withMessage('Target type is required')
        .isIn(['video', 'comment'])
        .withMessage('Target type must be video or comment'),
    body('targetId')
        .notEmpty()
        .withMessage('Target ID is required')
        .isMongoId()
        .withMessage('Invalid target ID'),
    body('type')
        .notEmpty()
        .withMessage('Type is required')
        .isIn(['like', 'dislike'])
        .withMessage('Type must be like or dislike')
];

const getLikeStatusValidation = [
    param('targetType')
        .notEmpty()
        .withMessage('Target type is required')
        .isIn(['video', 'comment'])
        .withMessage('Target type must be video or comment'),
    param('targetId')
        .notEmpty()
        .withMessage('Target ID is required')
        .isMongoId()
        .withMessage('Invalid target ID')
];

module.exports = {
    toggleLikeValidation,
    getLikeStatusValidation
};