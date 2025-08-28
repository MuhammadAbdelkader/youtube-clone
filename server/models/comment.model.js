const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, 'Comment content is required'],
        trim: true,
        maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'Author is required']
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
        required: [true, 'Video is required']
    },
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
        default: null
    },
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
    isEdited: {
        type: Boolean,
        default: false
    }
}, { 
    timestamps: true,
    versionKey: false
});

// Create indexes
commentSchema.index({ video: 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1, createdAt: 1 });

// Auto-populate author information
commentSchema.pre(/^find/, function(next) {
    this.populate('author', 'username avatar_url');
    next();
});

const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;
