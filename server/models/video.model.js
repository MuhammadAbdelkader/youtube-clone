const { Schema, model } = require("mongoose");

const videoSchema = new Schema({
    title: { 
        type: String, 
        required: [true, 'Video title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: { 
        type: String, 
        required: [true, 'Video description is required'],
        trim: true,
        maxlength: [5000, 'Description cannot exceed 5000 characters']
    },
    videoUrl: { 
        type: String, 
        required: [true, 'Video URL is required']
    },
    thumbnailUrl: { 
        type: String, 
        default: "https://res.cloudinary.com/demo/image/upload/v1/defaults/video_thumbnail.png"
    },
    views: { 
        type: Number, 
        default: 0,
        min: [0, 'Views cannot be negative']
    },
    duration: { 
        type: Number, // in seconds
        min: [0, 'Duration cannot be negative']
    },
    channel: { 
        type: Schema.Types.ObjectId, 
        ref: "Channel", 
        required: [true, 'Channel is required']
    },
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: "User", 
        required: [true, 'User ID is required']
    },
    category: {
        type: String,
        enum: {
            values: ['Education', 'Entertainment', 'Music', 'Gaming', 'Sports', 'Technology', 'News', 'Comedy', 'Other'],
            message: 'Invalid category'
        },
        default: 'Other'
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [50, 'Tag cannot exceed 50 characters']
    }],
    likesCount: {
        type: Number,
        default: 0,
        min: [0, 'Likes count cannot be negative']
    },
    dislikesCount: {
        type: Number,
        default: 0,
        min: [0, 'Dislikes count cannot be negative']
    },
    commentsCount: {
        type: Number,
        default: 0,
        min: [0, 'Comments count cannot be negative']
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    language: {
        type: String,
        default: 'en',
        maxlength: [5, 'Language code too long']
    }
}, {
    timestamps: true,
    versionKey: false
});

// Create indexes for better performance
videoSchema.index({ title: "text", description: "text", tags: "text" });
videoSchema.index({ userId: 1, createdAt: -1 });
videoSchema.index({ channel: 1, createdAt: -1 });
videoSchema.index({ category: 1, views: -1 });
videoSchema.index({ isPublic: 1, createdAt: -1 });
videoSchema.index({ views: -1, createdAt: -1 });

const Video = model("Video", videoSchema);
module.exports = Video;
