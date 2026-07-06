const Comment = require("../models/comment.model");
const Video = require("../models/video.model");
const ResponseHelper = require("../utils/responseHelper");
const { createNotification } = require("./notification.controller");

const addComment = async (req, res, next) => {
    try {
        const { content, videoId, parentCommentId } = req.body;
        const authorId = req.user.userId;

        const video = await Video.findById(videoId);
        if (!video) {
            return ResponseHelper.notFound(res, "Video not found");
        }

        if (parentCommentId) {
            const parentComment = await Comment.findById(parentCommentId);
            if (!parentComment || parentComment.video.toString() !== videoId) {
                return ResponseHelper.notFound(res, "Parent comment not found");
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

        // Notify video owner about a new comment
        if (!parentCommentId) {
            createNotification({
                recipient: video.userId,
                sender: authorId,
                type: 'comment',
                video: videoId,
                comment: comment._id,
            });
        } else {
            // Notify parent comment author about a reply
            const parentComment = await Comment.findById(parentCommentId).select('author');
            if (parentComment) {
                createNotification({
                    recipient: parentComment.author,
                    sender: authorId,
                    type: 'reply',
                    video: videoId,
                    comment: comment._id,
                });
            }
        }

        return ResponseHelper.success(res, "Comment added successfully", populatedComment, 201);
    } catch (error) {
        
        next(error);
    }
};

const getVideoComments = async (req, res, next) => {
    try {
        const { videoId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const REPLY_PREVIEW_COUNT = 5;

        const [comments, total] = await Promise.all([
            Comment.find({ video: videoId, parentComment: null })
                .populate('author', 'username avatar_url')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Comment.countDocuments({ video: videoId, parentComment: null }),
        ]);

        const topLevelIds = comments.map((c) => c._id);

        const [allReplies, replyCounts] = topLevelIds.length
            ? await Promise.all([
                Comment.find({ parentComment: { $in: topLevelIds } })
                    .populate('author', 'username avatar_url')
                    .sort({ createdAt: 1 }),
                Comment.aggregate([
                    { $match: { parentComment: { $in: topLevelIds } } },
                    { $group: { _id: "$parentComment", count: { $sum: 1 } } },
                ]),
            ])
            : [[], []];

        const repliesByParent = new Map();
        for (const reply of allReplies) {
            const key = reply.parentComment.toString();
            if (!repliesByParent.has(key)) repliesByParent.set(key, []);
            repliesByParent.get(key).push(reply);
        }

        const countByParent = new Map(replyCounts.map((r) => [r._id.toString(), r.count]));

        const commentsWithReplies = comments.map((comment) => {
            const key = comment._id.toString();
            return {
                ...comment.toObject(),
                replies: (repliesByParent.get(key) || []).slice(0, REPLY_PREVIEW_COUNT),
                repliesCount: countByParent.get(key) || 0,
            };
        });

        return ResponseHelper.paginated(res, commentsWithReplies, {
            page, limit, total, pages: Math.ceil(total / limit),
        }, "Comments retrieved successfully");
    } catch (error) {
        next(error);
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
            return ResponseHelper.notFound(res, "Comment not found or access denied");
        }

        comment.content = content;
        comment.isEdited = true;
        await comment.save();

        return ResponseHelper.success(res, "Comment updated successfully", comment);
    } catch (error) {
        next(error);
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
            return ResponseHelper.notFound(res, "Comment not found or access denied");
        }

        await Comment.deleteMany({
            $or: [
                { _id: commentId },
                { parentComment: commentId }
            ]
        });

        await updateVideoCommentsCount(comment.video);

        return ResponseHelper.success(res, "Comment deleted successfully");
    } catch (error) {
        next(error);
    }
};

const getCommentReplies = async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [replies, total] = await Promise.all([
            Comment.find({ parentComment: commentId })
                .populate('author', 'username avatar_url')
                .sort({ createdAt: 1 })
                .skip(skip)
                .limit(limit),
            Comment.countDocuments({ parentComment: commentId }),
        ]);

        return ResponseHelper.paginated(res, replies, {
            page, limit, total, pages: Math.ceil(total / limit),
        }, "Replies retrieved successfully");
    } catch (error) {
        next(error);
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
