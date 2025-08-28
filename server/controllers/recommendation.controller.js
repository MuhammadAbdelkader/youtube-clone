const Video = require("../models/video.model");
const WatchHistory = require("../models/watchHistory.model");
const Subscription = require("../models/subscription.model");

const getRecommendedVideos = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        let recommendedVideos = [];

        if (userId) {
            // 1. Get videos from subscribed channels
            const subscriptions = await Subscription.find({ subscriber: userId })
                .select('channel');
            const subscribedChannels = subscriptions.map(sub => sub.channel);

            if (subscribedChannels.length > 0) {
                const channelVideos = await Video.find({
                    channel: { $in: subscribedChannels },
                    isPublic: true
                })
                .sort({ createdAt: -1 })
                .limit(10);
                
                recommendedVideos = [...recommendedVideos, ...channelVideos];
            }

            // 2. Get videos based on watch history
            const watchHistory = await WatchHistory.find({ user: userId })
                .populate('video', 'category tags')
                .limit(10);

            const watchedCategories = [...new Set(
                watchHistory.map(w => w.video?.category).filter(Boolean)
            )];
            const watchedTags = [...new Set(
                watchHistory.flatMap(w => w.video?.tags || [])
            )];

            if (watchedCategories.length > 0 || watchedTags.length > 0) {
                const similarVideos = await Video.find({
                    $or: [
                        { category: { $in: watchedCategories } },
                        { tags: { $in: watchedTags } }
                    ],
                    isPublic: true,
                    userId: { $ne: userId }
                })
                .sort({ views: -1, createdAt: -1 })
                .limit(10);

                recommendedVideos = [...recommendedVideos, ...similarVideos];
            }
        }

        // 3. Fill remaining with trending videos
        const remainingLimit = limit - recommendedVideos.length;
        if (remainingLimit > 0) {
            const trendingVideos = await Video.find({
                isPublic: true,
                _id: { $nin: recommendedVideos.map(v => v._id) }
            })
            .sort({ views: -1, createdAt: -1 })
            .limit(remainingLimit);

            recommendedVideos = [...recommendedVideos, ...trendingVideos];
        }

        // Remove duplicates and populate
        const uniqueVideos = recommendedVideos
            .filter((video, index, self) => 
                index === self.findIndex(v => v._id.toString() === video._id.toString())
            )
            .slice(skip, skip + limit);

        const populatedVideos = await Video.populate(uniqueVideos, {
            path: 'channel',
            select: 'title avatar subscribersCount'
        });

        res.status(200).json({
            status: true,
            data: populatedVideos,
            pagination: { page, limit, total: populatedVideos.length }
        });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};

module.exports = {
    getRecommendedVideos
};
