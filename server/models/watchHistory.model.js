const mongoose = require("mongoose");

const watchHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
        required: true
    },
    watchedAt: {
        type: Date,
        default: Date.now
    },
    watchDuration: {
        type: Number, // in seconds
        default: 0
    },
    completed: {
        type: Boolean,
        default: false
    }
}, { 
    timestamps: true 
});

// Index for efficient queries
watchHistorySchema.index({ user: 1, watchedAt: -1 });
watchHistorySchema.index({ user: 1, video: 1 });

module.exports = mongoose.model("WatchHistory", watchHistorySchema);
