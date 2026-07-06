const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/user.model");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  setRefreshCookie,
} = require("../utils/jwt");
const { getRedisClient } = require("../config/redis");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../utils/resend.utils");
const { uploadImage } = require("../utils/cloudinary.utils");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Generate a cryptographically secure 6-digit OTP */
function generateOTP() {
  return String(crypto.randomInt(100000, 999999));
}

/** Issue tokens and set refresh cookie — shared by register verify, login, google auth */
function issueTokens(res, userId) {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);
  setRefreshCookie(res, refreshToken);
  return accessToken;
}

// ─── Register (Step 1 of 2) ─────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const exists = await User.findOne({ $or: [{ email: String(email) }, { username: String(username) }] });
    if (exists) {
      return res.status(409).json({
        status: "error",
        message: exists.email === email ? "Email already in use" : "Username already taken",
      });
    }

    const password_hash = await bcrypt.hash(password, 12);
    await User.create({ username, email, password_hash, isEmailVerified: false });

    // Generate OTP, store in Redis with 5-min TTL
    const otp = generateOTP();
    const redis = getRedisClient();
    await redis.set(`verify:${email}`, otp, { ex: 300 }); // 300 seconds = 5 min

    await sendVerificationEmail(email, otp, username);

    return res.status(202).json({
      status: "success",
      message: "Account created. Check your email for the 6-digit verification code.",
      email, // echo back so client can pre-fill the verify step
    });
  } catch (error) {
    next(error);
  }
};

// ─── Verify Email (Step 2 of 2) ─────────────────────────────────────────────
const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const redis = getRedisClient();
    const storedOtp = await redis.get(`verify:${email}`);

    if (!storedOtp || storedOtp !== otp) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired verification code.",
      });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { isEmailVerified: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found." });
    }

    // Delete OTP from Redis immediately after use
    await redis.del(`verify:${email}`);

    const accessToken = issueTokens(res, user._id);

    return res.status(200).json({
      status: "success",
      message: "Email verified successfully.",
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        isEmailVerified: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Resend Verification OTP ─────────────────────────────────────────────────
const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found." });
    }
    if (user.isEmailVerified) {
      return res.status(400).json({ status: "error", message: "Email is already verified." });
    }

    const otp = generateOTP();
    const redis = getRedisClient();
    await redis.set(`verify:${email}`, otp, { ex: 300 });

    await sendVerificationEmail(email, otp, user.username);

    return res.status(200).json({
      status: "success",
      message: "Verification code resent. Check your inbox.",
    });
  } catch (error) {
    next(error);
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: String(email) }).select("+password_hash");
    if (!user) {
      return res.status(401).json({ status: "error", message: "Invalid credentials." });
    }

    // Block Google-only accounts from password login
    if (!user.password_hash) {
      return res.status(400).json({
        status: "error",
        message: "This account uses Google Sign-In. Please continue with Google.",
      });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ status: "error", message: "Invalid credentials." });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        status: "error",
        message: "Please verify your email before logging in.",
        code: "EMAIL_NOT_VERIFIED",
        email: user.email,
      });
    }

    const accessToken = issueTokens(res, user._id);

    return res.status(200).json({
      status: "success",
      message: "Login successful.",
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Google OAuth ─────────────────────────────────────────────────────────────
const googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ status: "error", message: "Google credential is required." });
    }

    // Verify the ID token issued by Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Upsert user: find by googleId or email, create if new
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      user = await User.create({
        username: name.replace(/\s+/g, "").toLowerCase() + "_" + crypto.randomInt(1000, 9999),
        email,
        googleId,
        avatar_url: picture,
        isEmailVerified: true, // Google verifies emails for us
      });
    } else if (!user.googleId) {
      // Link existing email account to Google
      user.googleId = googleId;
      user.isEmailVerified = true;
      if (!user.avatar_url || user.avatar_url.includes("ui-avatars")) {
        user.avatar_url = picture;
      }
      await user.save();
    }

    const accessToken = issueTokens(res, user._id);

    return res.status(200).json({
      status: "success",
      message: "Google authentication successful.",
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    if (error.message?.includes("Token used too late") || error.message?.includes("Invalid token")) {
      return res.status(401).json({ status: "error", message: "Invalid or expired Google token." });
    }
    next(error);
  }
};

// ─── Refresh Access Token ─────────────────────────────────────────────────────
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ status: "error", message: "Refresh token missing.", code: "NO_REFRESH_TOKEN" });
    }

    const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
    const accessToken = generateAccessToken(decoded.userId);

    return res.status(200).json({ status: "success", accessToken });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ status: "error", message: "Session expired. Please log in again.", code: "REFRESH_EXPIRED" });
    }
    return res.status(401).json({ status: "error", message: "Invalid refresh token." });
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
const logout = (req, res) => {
  res.clearCookie("refreshToken", { httpOnly: true, sameSite: "strict" });
  return res.status(200).json({ status: "success", message: "Logged out successfully." });
};

// ─── Get Current User (me) ────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "username email avatar_url isEmailVerified googleId createdAt"
    );
    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found." });
    }
    // Normalized to `id` (not raw Mongoose `_id`) to match the shape login/
    // register/googleAuth already return -- this used to be the only auth
    // response with a different shape, which would have quietly broken
    // anything that expected `.id` the way the rest of the app does.
    return res.status(200).json({
      status: "success",
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update Profile ───────────────────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const allowedUpdates = {};
    if (username) allowedUpdates.username = username;
    if (email) allowedUpdates.email = email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      allowedUpdates.password_hash = await bcrypt.hash(password, salt);
    }

    if (req.file) {
      const uploadResult = await uploadImage(req.file.buffer, { folder: "youtube_clone/avatars" });
      allowedUpdates.avatar_url = uploadResult.secure_url;
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      allowedUpdates,
      { new: true, runValidators: true }
    ).select("username email avatar_url isEmailVerified createdAt");

    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found." });
    }

    return res.status(200).json({ status: "success", message: "Profile updated.", user });
  } catch (error) {
    next(error);
  }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: String(email) });
    if (!user) {
      // Respond with 200 to prevent email enumeration attacks
      return res.status(200).json({
        status: "success",
        message: "If an account with that email exists, a reset code has been sent.",
      });
    }

    if (user.googleId && !user.password_hash) {
      return res.status(400).json({
        status: "error",
        message: "This account uses Google Sign-In and has no password to reset.",
      });
    }

    const otp = generateOTP();
    const redis = getRedisClient();
    await redis.set(`reset:${email}`, otp, { ex: 300 }); // 5-minute TTL

    await sendPasswordResetEmail(email, otp);

    return res.status(200).json({
      status: "success",
      message: "If an account with that email exists, a reset code has been sent.",
    });
  } catch (error) {
    next(error);
  }
};

// ─── Reset Password ───────────────────────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;

    const redis = getRedisClient();
    const storedOtp = await redis.get(`reset:${email}`);

    if (!storedOtp || storedOtp !== otp) {
      return res.status(400).json({ status: "error", message: "Invalid or expired reset code." });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const user = await User.findOneAndUpdate(
      { email: String(email) },
      { password_hash },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found." });
    }

    // Consume the OTP
    await redis.del(`reset:${email}`);

    return res.status(200).json({ status: "success", message: "Password reset successfully." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  googleAuth,
  refresh,
  logout,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
};
