const WatchHistory = require("../models/watchHistory.model");
const Video = require("../models/video.model");

const addToWatchHistory = async (req, res, next) => {
    try {
        const { videoId, watchDuration, completed } = req.body;
        const userId = req.user.userId;

        const video = await Video.findById(videoId);
        if (!video) {
            return next(new Error("Video not found", { cause: 404 }));
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let watchEntry = await WatchHistory.findOne({
            user: userId,
            video: videoId,
            watchedAt: { $gte: today }
        });

        if (watchEntry) {
            watchEntry.watchDuration = Math.max(watchEntry.watchDuration, watchDuration || 0);
            watchEntry.completed = completed || watchEntry.completed;
            watchEntry.watchedAt = new Date();
            await watchEntry.save();
        } else {
            watchEntry = await WatchHistory.create({
                user: userId,
                video: videoId,
                watchDuration: watchDuration || 0,
                completed: completed || false
            });
        }

        res.status(200).json({ status: true, data: watchEntry });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};

const getUserWatchHistory = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const history = await WatchHistory.find({ user: userId })
            .populate('video', 'title description thumbnailUrl duration views channel')
            .populate({
                path: 'video',
                populate: {
                    path: 'channel',
                    select: 'title avatar'
                }
            })
            .sort({ watchedAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            status: true,
            data: history,
            pagination: { page, limit }
        });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};

const removeFromWatchHistory = async (req, res, next) => {
    try {
        const { videoId } = req.params;
        const userId = req.user.userId;

        await WatchHistory.deleteMany({
            user: userId,
            video: videoId
        });

        res.status(200).json({ status: true, message: "Removed from watch history" });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};

const clearWatchHistory = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        await WatchHistory.deleteMany({ user: userId });

        res.status(200).json({ status: true, message: "Watch history cleared" });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};

module.exports = {
    addToWatchHistory,
    getUserWatchHistory,
    removeFromWatchHistory,
    clearWatchHistory
};
