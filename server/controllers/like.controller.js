const Like = require("../models/like.model");
const Video = require("../models/video.model");
const Comment = require("../models/comment.model");

const toggleLike = async (req, res, next) => {
    try {
        const { targetType, targetId, type } = req.body;
        const userId = req.user.userId;

        if (!['video', 'comment'].includes(targetType)) {
            return next(new Error("Invalid target type", { cause: 400 }));
        }
        if (!['like', 'dislike'].includes(type)) {
            return next(new Error("Invalid like type", { cause: 400 }));
        }

        const existingLike = await Like.findOne({
            user: userId,
            targetId,
            targetType
        });

        let result = {};

        if (existingLike) {
            if (existingLike.type === type) {
                await Like.deleteOne({ _id: existingLike._id });
                result.action = 'removed';
            } else {
                existingLike.type = type;
                await existingLike.save();
                result.action = 'updated';
            }
        } else {
            await Like.create({
                user: userId,
                targetType,
                targetId,
                type
            });
            result.action = 'created';
        }

        await updateLikeCounts(targetType, targetId);
        result.type = type;
        res.status(200).json({ status: true, data: result });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};

const getLikeStatus = async (req, res, next) => {
    try {
        const { targetType, targetId } = req.params;
        const userId = req.user.userId;

        const like = await Like.findOne({
            user: userId,
            targetType,
            targetId
        });

        res.status(200).json({
            status: true,
            data: {
                liked: like?.type === 'like' || false,
                disliked: like?.type === 'dislike' || false,
                type: like?.type || null
            }
        });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};

const updateLikeCounts = async (targetType, targetId) => {
    const likes = await Like.countDocuments({ targetId, targetType, type: 'like' });
    const dislikes = await Like.countDocuments({ targetId, targetType, type: 'dislike' });

    if (targetType === 'video') {
        await Video.findByIdAndUpdate(targetId, {
            likesCount: likes,
            dislikesCount: dislikes
        });
    } else if (targetType === 'comment') {
        await Comment.findByIdAndUpdate(targetId, {
            likesCount: likes,
            dislikesCount: dislikes
        });
    }
};

module.exports = {
    toggleLike,
    getLikeStatus
};