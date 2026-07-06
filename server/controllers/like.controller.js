const Like = require("../models/like.model");
const Video = require("../models/video.model");
const Comment = require("../models/comment.model");
const ResponseHelper = require("../utils/responseHelper");
const { createNotification } = require("./notification.controller");

const TARGET_MODELS = { video: Video, comment: Comment };

const toggleLike = async (req, res, next) => {
    try {
        const { targetType, targetId, type } = req.body;
        const userId = req.user.userId;

        if (!['video', 'comment'].includes(targetType)) {
            return ResponseHelper.error(res, "Invalid target type", 400);
        }
        if (!['like', 'dislike'].includes(type)) {
            return ResponseHelper.error(res, "Invalid like type", 400);
        }

        const targetExists = await TARGET_MODELS[targetType].exists({ _id: targetId });
        if (!targetExists) {
            return ResponseHelper.notFound(res, `${targetType === 'video' ? 'Video' : 'Comment'} not found`);
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
            // Notify video owner when their video is liked
            if (targetType === 'video' && type === 'like') {
                const video = await Video.findById(targetId).select('userId');
                if (video) {
                    createNotification({
                        recipient: video.userId,
                        sender: userId,
                        type: 'like',
                        video: targetId,
                    });
                }
            }
        }

        await updateLikeCounts(targetType, targetId);
        result.type = result.action === 'removed' ? null : type;

        return ResponseHelper.success(res, "Like status updated", result);
    } catch (error) {
        next(error);
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

        return ResponseHelper.success(res, "Like status retrieved", {
            liked: like?.type === 'like' || false,
            disliked: like?.type === 'dislike' || false,
            type: like?.type || null
        });
    } catch (error) {
        next(error);
    }
};

const updateLikeCounts = async (targetType, targetId) => {
    const [likes, dislikes] = await Promise.all([
        Like.countDocuments({ targetId, targetType, type: 'like' }),
        Like.countDocuments({ targetId, targetType, type: 'dislike' }),
    ]);

    const Model = TARGET_MODELS[targetType];
    if (Model) {
        await Model.findByIdAndUpdate(targetId, {
            likesCount: likes,
            dislikesCount: dislikes
        });
    }
};

module.exports = {
    toggleLike,
    getLikeStatus
};
