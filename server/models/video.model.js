const { Schema, model } = require("mongoose");

const videoSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000
    },
    videoUrl: {
        type: String,
        required: true
    },
    // Cloudinary public_id for proper deletion (includes folder prefix)
    cloudinaryPublicId: {
        type: String,
        default: null
    },
    thumbnailUrl: {
        type: String,
        required: false,
        default: ""
    },
    views: {
        type: Number,
        default: 0
    },
    duration: {
        type: Number,
        required: false,
        default: 0
    },
    channel: {
        type: Schema.Types.ObjectId,
        ref: "Channel",
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    category: {
        type: String,
        enum: ['Education', 'Entertainment', 'Music', 'Gaming', 'Sports', 'Technology', 'News', 'Comedy', 'Other'],
        default: 'Other'
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    // ─── AI-Generated Fields (Gemini async hook) ───
    aiSummary: {
        type: String,
        default: ""
    },
    aiTags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    aiProcessed: {
        type: Boolean,
        default: false
    },
    // ─────────────────────────────────────────────
    likesCount: {
        type: Number,
        default: 0
    },
    dislikesCount: {
        type: Number,
        default: 0
    },
    commentsCount: {
        type: Number,
        default: 0
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    language: {
        type: String,
        default: 'en'
    }
}, {
    timestamps: true,
    versionKey: false
});

// Full-text search index
videoSchema.index({
    title: "text",
    description: "text",
    tags: "text",
    category: "text",
    aiTags: "text"
});
videoSchema.index({ userId: 1, createdAt: -1 });
videoSchema.index({ channel: 1, createdAt: -1 });
videoSchema.index({ category: 1, views: -1 });
videoSchema.index({ isPublic: 1, createdAt: -1 });

const Video = model("Video", videoSchema);
module.exports = Video;