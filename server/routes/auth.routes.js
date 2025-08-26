const Router = require("express").Router;
const authController = require("../controllers/auth.controller");
const authenticate = require("../middlewares/authenticate");
const validate = require("../middlewares/validation.middleware");
const { body } = require('express-validator');

const authRouter = Router();

// Validation rules
const registerValidation = [
    body('username')
        .notEmpty()
        .withMessage('Username is required')
        .isLength({ min: 3, max: 20 })
        .withMessage('Username must be 3-20 characters')
        .isAlphanumeric()
        .withMessage('Username must be alphanumeric'),
    body('email')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
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
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain uppercase, lowercase and number'),
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Password confirmation does not match password');
            }
            return true;
        })
];

authRouter
    .post("/register", validate(registerValidation), authController.register)
    .post("/login", validate(loginValidation), authController.login)
    .post("/forgot-password", validate(forgotPasswordValidation), authController.forgotPassword)
    .post("/reset-password/:token", validate(resetPasswordValidation), authController.resetPassword)
    .get("/me", authenticate, authController.getMe)
    .post("/logout", authenticate, authController.logout)
    .patch("/update-profile", authenticate, authController.updateProfile);

module.exports = authRouter;
