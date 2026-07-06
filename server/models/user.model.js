const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    // Optional: Google OAuth users have no password
    password_hash: {
      type: String,
      select: false,
      default: null,
    },
    
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    avatar_url: {
      type: String,
      default: "https://ui-avatars.com/api/?background=1a1a2e&color=a78bfa&bold=true&name=User",
    },
    // Email verification (Resend + Redis OTP flow)
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    // Password reset fields (kept on model for index purposes, actual OTP in Redis)
    resetPasswordToken: {
      type: String,
      select: false,
      default: null,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
