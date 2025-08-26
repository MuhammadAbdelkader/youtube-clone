const express = require("express");
const { body } = require("express-validator");

const {
  signup,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,

} = require("../controllers/auth.controller");
const validate = require("../middlewares/validation.middleware");

const router = express.Router();

router.post(
  "/signup",
  validate([
    body("username").isLength({ min: 3 }).withMessage("Username too short"),
    body("email").isEmail().withMessage("Invalid email"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ]),
  signup
);

router.post(
  "/login",
  validate([
    body("email").isEmail().withMessage("Invalid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ]),
  login
);

router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);


module.exports = router;
