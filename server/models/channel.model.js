const mongoose = require("mongoose");

const channelSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    avatar: {
        type: String,
        required: false,
        default: "https://www.example.com/default-avatar.png"
    },
    // ➕ NEW FIELDS
    coverImage: {
        type: String,
        required: false,
        default: ""
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    videos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    }],
    subscribersCount: {
        type: Number,
        default: 0
    },
    totalViews: {
        type: Number,
        default: 0
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    category: {
        type: String,
        enum: ['Education', 'Entertainment', 'Music', 'Gaming', 'Sports', 'Technology', 'News', 'Comedy', 'Other'],
        default: 'Other'
    },
    socialLinks: {
        website: { type: String, default: "" },
        twitter: { type: String, default: "" },
        instagram: { type: String, default: "" }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Channel", channelSchema);
