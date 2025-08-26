const Comment = require("../models/comment.model");
const Video = require("../models/video.model");

const addComment = async (req, res, next) => {
    try {
        const { content, videoId, parentCommentId } = req.body;
        const authorId = req.user.userId;

        const video = await Video.findById(videoId);
        if (!video) {
            return next(new Error("Video not found", { cause: 404 }));
        }

        if (parentCommentId) {
            const parentComment = await Comment.findById(parentCommentId);
            if (!parentComment || parentComment.video.toString() !== videoId) {
                return next(new Error("Parent comment not found", { cause: 404 }));
            }
        }

        const comment = await Comment.create({
            content,
            author: authorId,
            video: videoId,
            parentComment: parentCommentId || null
        });

        await updateVideoCommentsCount(videoId);

        const populatedComment = await Comment.findById(comment._id)
            .populate('author', 'username avatar_url');

        res.status(201).json({ status: true, data: populatedComment });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};

const getVideoComments = async (req, res, next) => {
    try {
        const { videoId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const comments = await Comment.find({ 
            video: videoId, 
            parentComment: null 
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

        const commentsWithReplies = await Promise.all(
            comments.map(async (comment) => {
                const replies = await Comment.find({ 
                    parentComment: comment._id 
                })
                .sort({ createdAt: 1 })
                .limit(5);

                return {
                    ...comment.toObject(),
                    replies,
                    repliesCount: await Comment.countDocuments({ parentComment: comment._id })
                };
            })
        );

        res.status(200).json({
            status: true,
            data: commentsWithReplies,
            pagination: { page, limit }
        });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};

const updateComment = async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        const userId = req.user.userId;

        const comment = await Comment.findOne({
            _id: commentId,
            author: userId
        });

        if (!comment) {
            return next(new Error("Comment not found or access denied", { cause: 404 }));
        }

        comment.content = content;
        comment.isEdited = true;
        await comment.save();

        res.status(200).json({ status: true, data: comment });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};

const deleteComment = async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.userId;

        const comment = await Comment.findOne({
            _id: commentId,
            author: userId
        });

        if (!comment) {
            return next(new Error("Comment not found or access denied", { cause: 404 }));
        }

        await Comment.deleteMany({ 
            $or: [
                { _id: commentId },
                { parentComment: commentId }
            ]
        });

        await updateVideoCommentsCount(comment.video);

        res.status(200).json({ status: true, message: "Comment deleted successfully" });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};

const getCommentReplies = async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const replies = await Comment.find({ parentComment: commentId })
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            status: true,
            data: replies,
            pagination: { page, limit }
        });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};

const updateVideoCommentsCount = async (videoId) => {
    const count = await Comment.countDocuments({ video: videoId });
    await Video.findByIdAndUpdate(videoId, { commentsCount: count });
};

module.exports = {
    addComment,
    getVideoComments,
    updateComment,
    deleteComment,
    getCommentReplies
};