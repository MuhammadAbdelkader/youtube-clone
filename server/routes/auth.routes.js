const { Router } = require("express");
const authController = require("../controllers/auth.controller");
const authenticate = require("../middlewares/authenticate");
const validate = require("../middlewares/validation.middleware");
const { body } = require("express-validator");

const authRouter = Router();

// ─── Validation Rules ────────────────────────────────────────────────────────

const registerValidation = [
  body("username")
    .notEmpty().withMessage("Username is required")
    .isLength({ min: 3, max: 30 }).withMessage("Username must be 3–30 characters")
    .matches(/^[a-zA-Z0-9_]+$/).withMessage("Username may only contain letters, numbers and underscores"),
  body("email")
    .isEmail().withMessage("Valid email is required")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase and a number"),
];

const verifyEmailValidation = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("otp")
    .isLength({ min: 6, max: 6 }).withMessage("OTP must be exactly 6 digits")
    .isNumeric().withMessage("OTP must be numeric"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const googleAuthValidation = [
  body("credential").notEmpty().withMessage("Google credential token is required"),
];

const forgotPasswordValidation = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
];

const resetPasswordValidation = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("otp")
    .isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits")
    .isNumeric().withMessage("OTP must be numeric"),
  body("password")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase and a number"),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

// Public routes
authRouter.post("/register",            validate(registerValidation),       authController.register);
authRouter.post("/verify-email",        validate(verifyEmailValidation),    authController.verifyEmail);
authRouter.post("/resend-verification", authController.resendVerification);
authRouter.post("/login",               validate(loginValidation),          authController.login);
authRouter.post("/google",              validate(googleAuthValidation),     authController.googleAuth);
authRouter.post("/refresh",                                                 authController.refresh);
authRouter.post("/forgot-password",     validate(forgotPasswordValidation), authController.forgotPassword);
authRouter.post("/reset-password",      validate(resetPasswordValidation),  authController.resetPassword);

// Protected routes
authRouter.get("/me",                   authenticate, authController.getMe);
authRouter.post("/logout",              authenticate, authController.logout);
authRouter.patch("/update-profile",     authenticate, authController.updateProfile);

module.exports = authRouter;
