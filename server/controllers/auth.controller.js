const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/user.model");
const ResponseHelper = require("../utils/responseHelper");
const {
    generateAccessToken,
    generateRefreshToken,
    verifyToken,
} = require("../utils/jwt");

const register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return ResponseHelper.conflict(res, "Email already in use");
            }
            return ResponseHelper.conflict(res, "Username already taken");
        }

        const password_hash = await bcrypt.hash(password, 12);
        const user = await User.create({ username, email, password_hash });

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return ResponseHelper.success(res, "User registered successfully", {
            accessToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar_url: user.avatar_url
            }
        }, 201);
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select("+password_hash");
        if (!user) {
            return ResponseHelper.unauthorized(res, "Invalid credentials");
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return ResponseHelper.unauthorized(res, "Invalid credentials");
        }

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return ResponseHelper.success(res, "Login successful", {
            accessToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar_url: user.avatar_url
            }
        });
    } catch (error) {
        next(error);
    }
};

const refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            return ResponseHelper.unauthorized(res, "Refresh token missing");
        }

        const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
        const accessToken = generateAccessToken(decoded.userId);

        return ResponseHelper.success(res, "Token refreshed successfully", { accessToken });
    } catch (error) {
        return ResponseHelper.unauthorized(res, "Invalid refresh token");
    }
};

const logout = (req, res) => {
    res.clearCookie("refreshToken");
    return ResponseHelper.success(res, "Logged out successfully");
};

const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return ResponseHelper.notFound(res, "User with this email not found");
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenHash = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        user.resetPasswordToken = resetTokenHash;
        user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

        await user.save({ validateBeforeSave: false });

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        const transporter = nodemailer.createTransporter({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: `"Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Password Reset Request",
            html: `
                <p>You requested a password reset.</p>
                <p>Click <a href="${resetUrl}">here</a> to reset your password.</p>
                <p>This link will expire in 15 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `,
        });

        return ResponseHelper.success(res, "Password reset email sent");
    } catch (error) {
        next(error);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const resetTokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await User.findOne({
            resetPasswordToken: resetTokenHash,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return ResponseHelper.error(res, "Invalid or expired token", 400);
        }

        user.password_hash = await bcrypt.hash(password, 12);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        return ResponseHelper.success(res, "Password reset successful");
    } catch (error) {
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return ResponseHelper.notFound(res, "User not found");
        }

        return ResponseHelper.success(res, "User profile retrieved successfully", {
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar_url: user.avatar_url,
                isVerified: user.isVerified,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const allowedUpdates = ['username', 'avatar_url'];
        const updates = {};

        // Filter out only allowed fields
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key) && req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        });

        // Check if username is being updated and if it's already taken
        if (updates.username) {
            const existingUser = await User.findOne({ 
                username: updates.username, 
                _id: { $ne: userId } 
            });
            
            if (existingUser) {
                return ResponseHelper.conflict(res, "Username already taken");
            }
        }

        const user = await User.findByIdAndUpdate(
            userId,
            updates,
            { new: true, runValidators: true }
        );

        if (!user) {
            return ResponseHelper.notFound(res, "User not found");
        }

        return ResponseHelper.success(res, "Profile updated successfully", {
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar_url: user.avatar_url,
                isVerified: user.isVerified,
                updatedAt: user.updatedAt
            }
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => ({
                field: err.path,
                message: err.message
            }));
            return ResponseHelper.validationError(res, errors);
        }
        next(error);
    }
};

module.exports = {
    register,
    login,
    refresh,
    logout,
    forgotPassword,
    resetPassword,
    getMe,
    updateProfile,
};