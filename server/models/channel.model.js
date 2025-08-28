const mongoose = require("mongoose");

const channelSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Channel title is required'],
        trim: true,
        maxlength: [50, 'Title cannot exceed 50 characters']
    },
    description: {
        type: String,
        required: [true, 'Channel description is required'],
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    avatar: {
        type: String,
        default: "https://res.cloudinary.com/demo/image/upload/v1/defaults/channel_avatar.png"
    },
    coverImage: {
        type: String,
        default: ""
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'Channel owner is required'],
        unique: true
    },
    videos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    }],
    subscribersCount: {
        type: Number,
        default: 0,
        min: [0, 'Subscribers count cannot be negative']
    },
    totalViews: {
        type: Number,
        default: 0,
        min: [0, 'Total views cannot be negative']
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    category: {
        type: String,
        enum: {
            values: ['Education', 'Entertainment', 'Music', 'Gaming', 'Sports', 'Technology', 'News', 'Comedy', 'Other'],
            message: 'Invalid category'
        },
        default: 'Other'
    },
    socialLinks: {
        website: { type: String, default: "", maxlength: [200, 'Website URL too long'] },
        twitter: { type: String, default: "", maxlength: [100, 'Twitter handle too long'] },
        instagram: { type: String, default: "", maxlength: [100, 'Instagram handle too long'] }
    }
}, { 
    timestamps: true,
    versionKey: false
});

// Create indexes
channelSchema.index({ owner: 1 });
channelSchema.index({ title: "text", description: "text" });
channelSchema.index({ subscribersCount: -1 });

const Channel = mongoose.model("Channel", channelSchema);
module.exports = Channel;
