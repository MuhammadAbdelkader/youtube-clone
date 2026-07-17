const { Router } = require("express");
const authController = require("../controllers/auth.controller");
const authenticate = require("../middlewares/authenticate");
const validate = require("../middlewares/validation.middleware");
const Joi = require("joi");

const authRouter = Router();

// ─── Validation Schemas (Joi) ────────────────────────────────────────────────

const registerValidation = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be 2–50 characters",
    "string.max": "Name must be 2–50 characters",
  }),
  username: Joi.string().min(3).max(30).pattern(/^[a-zA-Z0-9_]+$/).required().messages({
    "string.empty": "Username is required",
    "string.min": "Username must be 3–30 characters",
    "string.max": "Username must be 3–30 characters",
    "string.pattern.base": "Username may only contain letters, numbers and underscores",
  }),
  email: Joi.string().email().required().messages({
    "string.empty": "Valid email is required",
    "string.email": "Valid email is required",
  }),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 8 characters",
    "string.pattern.base": "Password must contain uppercase, lowercase and a number",
  }),
});

const verifyEmailValidation = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Valid email is required",
    "string.email": "Valid email is required",
  }),
  otp: Joi.string().length(6).pattern(/^[0-9]+$/).required().messages({
    "string.empty": "OTP must be exactly 6 digits",
    "string.length": "OTP must be exactly 6 digits",
    "string.pattern.base": "OTP must be numeric",
  }),
});

const loginValidation = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Valid email is required",
    "string.email": "Valid email is required",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password is required",
  }),
});

const googleAuthValidation = Joi.object({
  credential: Joi.string().required().messages({
    "string.empty": "Google credential token is required",
  }),
});

const forgotPasswordValidation = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Valid email is required",
    "string.email": "Valid email is required",
  }),
});

const resetPasswordValidation = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Valid email is required",
    "string.email": "Valid email is required",
  }),
  otp: Joi.string().length(6).pattern(/^[0-9]+$/).required().messages({
    "string.empty": "OTP must be 6 digits",
    "string.length": "OTP must be 6 digits",
    "string.pattern.base": "OTP must be numeric",
  }),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 8 characters",
    "string.pattern.base": "Password must contain uppercase, lowercase and a number",
  }),
});

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

const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max for avatars
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/") && file.mimetype !== "application/octet-stream") {
      return cb(new Error("Only image files are allowed for avatars"), false);
    }
    cb(null, true);
  },
});

// Protected routes
authRouter.get("/me",                   authenticate, authController.getMe);
authRouter.post("/logout",              authenticate, authController.logout);
authRouter.patch("/update-profile",     authenticate, upload.single("avatar"), authController.updateProfile);

module.exports = authRouter;
