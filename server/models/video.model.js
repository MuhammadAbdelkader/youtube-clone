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
    thumbnailUrl: { 
        type: String, 
        required: false, 
        default: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhgBO9es3gnfmoILLgaplnrfQCAqYKl_rGf2TqRead8WjoMnpJ-rS7fFWEBn0oJy_-U1DFeTM-Gle7-Humwy3KDO8EjV0G3a7M6QOkEd2CPXaRbYWR94aRuiYp4sn9gttYvNpwS5X1etudg/s1600/file-MrylO8jADD.png" 
    },
    views: { 
        type: Number, 
        default: 0 
    },
    duration: { 
        type: Number, 
        required: false 
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
    // ➕ NEW FIELDS
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
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Enhanced indexes
videoSchema.index({ 
    title: "text", 
    description: "text", 
    tags: "text",
    category: "text"
});
videoSchema.index({ userId: 1, createdAt: -1 });
videoSchema.index({ channel: 1, createdAt: -1 });
videoSchema.index({ category: 1, views: -1 });
videoSchema.index({ isPublic: 1, createdAt: -1 });

const Video = model("Video", videoSchema);
module.exports = Video;