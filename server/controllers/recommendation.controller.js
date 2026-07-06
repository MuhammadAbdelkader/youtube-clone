const Video = require("../models/video.model");
const WatchHistory = require("../models/watchHistory.model");
const Subscription = require("../models/subscription.model");

const getRecommendedVideos = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const skip = (page - 1) * limit;

        const fetchSize = Math.min(skip + limit, 500);

        let recommendedVideos = [];

        if (userId) {
            // 1. Videos from subscribed channels
            const subscriptions = await Subscription.find({ subscriber: userId }).select('channel');
            const subscribedChannels = subscriptions.map(sub => sub.channel);

            if (subscribedChannels.length > 0) {
                const channelVideos = await Video.find({
                    channel: { $in: subscribedChannels },
                    isPublic: true
                })
                    .sort({ createdAt: -1 })
                    .limit(fetchSize);

                recommendedVideos = [...recommendedVideos, ...channelVideos];
            }

            // 2. Videos similar to recent watch history
            const watchHistory = await WatchHistory.find({ user: userId })
                .populate('video', 'category tags')
                .limit(50); // signal source only, not part of the output -- fine to look further back

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
                    .limit(fetchSize);

                recommendedVideos = [...recommendedVideos, ...similarVideos];
            }
        }

        recommendedVideos = recommendedVideos.filter((video, index, self) =>
            index === self.findIndex(v => v._id.toString() === video._id.toString())
        );

        // 3. Fill remaining slots with trending videos
        const remaining = fetchSize - recommendedVideos.length;
        if (remaining > 0) {
            const trendingVideos = await Video.find({
                isPublic: true,
                _id: { $nin: recommendedVideos.map(v => v._id) }
            })
                .sort({ views: -1, createdAt: -1 })
                .limit(remaining);

            recommendedVideos = [...recommendedVideos, ...trendingVideos];
        }

        const pageOfVideos = recommendedVideos.slice(skip, skip + limit);

        const populatedVideos = await Video.populate(pageOfVideos, {
            path: 'channel',
            select: 'title avatar subscribersCount'
        });

        res.status(200).json({
            status: "success",
            message: "Recommended videos retrieved successfully",
            data: populatedVideos,
            pagination: {
                page,
                limit,
                hasMore: pageOfVideos.length === limit,
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getRecommendedVideos
};
