const mongoose = require("mongoose");
const { buildAvatarUrl } = require("../utils/avatar.utils");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
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
      // Falls back to a dynamic ui-avatars.com URL seeded from the username.
      // The `get` function runs at creation time so `name` is already set.
      default: null,
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

// ─── Pre-save hook: assign dynamic avatar when none is set ──────────────────
// We use a pre-save hook (not a schema `default`) because Mongoose `default`
// functions run before the rest of the document is populated, so `this.username`
// would still be undefined. The hook runs after all fields are set.
userSchema.pre("save", function (next) {
  if (!this.avatar_url) {
    this.avatar_url = buildAvatarUrl(this.name);
  }
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;
