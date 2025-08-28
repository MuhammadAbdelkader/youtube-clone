const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'User is required']
    },
    targetType: {
        type: String,
        enum: {
            values: ['video', 'comment'],
            message: 'Target type must be either video or comment'
        },
        required: [true, 'Target type is required']
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Target ID is required']
    },
    type: {
        type: String,
        enum: {
            values: ['like', 'dislike'],
            message: 'Type must be either like or dislike'
        },
        required: [true, 'Like type is required']
    }
}, { 
    timestamps: true,
    versionKey: false
});

// Prevent duplicate likes/dislikes
likeSchema.index({ user: 1, targetId: 1, targetType: 1 }, { unique: true });

const Like = mongoose.model("Like", likeSchema);
module.exports = Like;
