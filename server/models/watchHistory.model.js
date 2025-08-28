const mongoose = require("mongoose");

const watchHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'User is required']
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
        required: [true, 'Video is required']
    },
    watchedAt: {
        type: Date,
        default: Date.now
    },
    watchDuration: {
        type: Number, // in seconds
        default: 0,
        min: [0, 'Watch duration cannot be negative']
    },
    completed: {
        type: Boolean,
        default: false
    }
}, { 
    timestamps: true,
    versionKey: false
});

// Create indexes for efficient queries
watchHistorySchema.index({ user: 1, watchedAt: -1 });
watchHistorySchema.index({ user: 1, video: 1 });

const WatchHistory = mongoose.model("WatchHistory", watchHistorySchema);
module.exports = WatchHistory;
