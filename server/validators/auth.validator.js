const { body } = require('express-validator');

const registerValidation = [
    body('username')
        .notEmpty()
        .withMessage('Username is required')
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be 3-30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers and underscores'),
    body('email')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain uppercase, lowercase and number')
];

const loginValidation = [
    body('email')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

const forgotPasswordValidation = [
    body('email')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail()
];

const resetPasswordValidation = [
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain uppercase, lowercase and number')
];

module.exports = {
    registerValidation,
    loginValidation,
    forgotPasswordValidation,
    resetPasswordValidation
};