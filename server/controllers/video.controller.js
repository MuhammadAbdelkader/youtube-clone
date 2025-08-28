const Video = require("../models/video.model");
const Channel = require("../models/channel.model");
const { CloudUploader } = require("../utils/cloudinary.utils");
const ResponseHelper = require("../utils/responseHelper");
const dateConstants = require("../constants/date-filtering");

const uploadVideo = async (req, res, next) => {
    try {
        if (!req.files || !req.files.video) {
            return ResponseHelper.error(res, 'Video file is required', 400);
        }

        const videoFile = req.files.video;

        if (!videoFile.mimetype.startsWith('video/')) {
            return ResponseHelper.error(res, 'Please upload a valid video file', 400);
        }

        const cloudUploader = new CloudUploader();
        const videoUrl = await cloudUploader.uploadToCloudinary(videoFile.data);

        const videoData = {
            title: req.body.title,
            description: req.body.description,
            videoUrl,
            thumbnailUrl: req.body.thumbnailUrl || "",
            channel: req.body.channel,
            userId: req.user.userId,
            category: req.body.category || 'Other',
            tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
            language: req.body.language || 'en',
            duration: req.body.duration || 0
        };

        const video = await Video.create(videoData);

        // Add video to channel
        await Channel.findByIdAndUpdate(req.body.channel, {
            $push: { videos: video._id }
        });

        const populatedVideo = await Video.findById(video._id)
            .populate('channel', 'title avatar subscribersCount');

        return ResponseHelper.success(res, "Video uploaded successfully", populatedVideo, 201);
    } catch (error) {
        next(error);
    }
};

const retrieveAllVideos = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = { isPublic: true };
        if (req.query.category) filter.category = req.query.category;
        if (req.query.language) filter.language = req.query.language;

        const videos = await Video.find(filter)
            .populate('channel', 'title avatar subscribersCount')
            .populate('userId', 'username')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Video.countDocuments(filter);

        return ResponseHelper.paginated(res, videos, {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        next(error);
    }
};

const retrieveVideoById = async (req, res, next) => {
    try {
        const video = await Video.findById(req.params.id)
            .populate('channel', 'title avatar subscribersCount isVerified')
            .populate('userId', 'username avatar_url');

        if (!video) {
            return ResponseHelper.notFound(res, "Video not found");
        }

        return ResponseHelper.success(res, "Video retrieved successfully", video);
    } catch (error) {
        next(error);
    }
};

const streamVideo = async (req, res, next) => {
    try {
        const { id } = req.params;
        const video = await Video.findById(id);
        
        if (!video) {
            return ResponseHelper.notFound(res, "Video not found");
        }

        // Increment views
        await Video.findByIdAndUpdate(id, { $inc: { views: 1 } });

        return ResponseHelper.success(res, "Video stream URL retrieved", {
            videoUrl: video.videoUrl,
            title: video.title
        });
    } catch (error) {
        next(error);
    }
};

const updateVideo = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Handle tags properly
        if (updates.tags && typeof updates.tags === 'string') {
            updates.tags = updates.tags.split(',').map(tag => tag.trim());
        }

        const video = await Video.findOneAndUpdate(
            { _id: id, userId: req.user.userId },
            updates,
            { new: true }
        ).populate('channel', 'title avatar');

        if (!video) {
            return ResponseHelper.notFound(res, "Video not found or access denied");
        }

        return ResponseHelper.success(res, "Video updated successfully", video);
    } catch (error) {
        next(error);
    }
};

const deleteVideo = async (req, res, next) => {
    try {
        const { id } = req.params;

        const video = await Video.findOneAndDelete({ 
            _id: id, 
            userId: req.user.userId 
        });

        if (!video) {
            return ResponseHelper.notFound(res, "Video not found or access denied");
        }

        // Remove from channel
        await Channel.findByIdAndUpdate(video.channel, {
            $pull: { videos: id }
        });

        return ResponseHelper.success(res, "Video deleted successfully");
    } catch (error) {
        next(error);
    }
};

const videoSearching = async (req, res, next) => {
    try {
        const { q, date, category, sortBy } = req.query;

        let searchFilter = {
            $text: { $search: q },
            isPublic: true
        };

        if (category) searchFilter.category = category;

        let videos = await Video.find(searchFilter)
            .populate('channel', 'title avatar subscribersCount')
            .populate('userId', 'username')
            .lean();

        // Date filtering
        const now = new Date();
        switch (date) {
            case "today":
                videos = videos.filter(v => v.createdAt > dateConstants.UploadedToday());
                break;
            case "this week":
                videos = videos.filter(v => v.createdAt >= dateConstants.ThisWeek());
                break;
            case "this month":
                videos = videos.filter(v => v.createdAt >= dateConstants.ThisMonth());
                break;
            case "this year":
                videos = videos.filter(v => v.createdAt >= dateConstants.ThisYear());
                break;
        }

        // Sorting
        switch (sortBy) {
            case "views":
                videos.sort((a, b) => b.views - a.views);
                break;
            case "date":
                videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case "rating":
                videos.sort((a, b) => (b.likesCount - b.dislikesCount) - (a.likesCount - a.dislikesCount));
                break;
        }

        return ResponseHelper.success(res, "Search results retrieved", videos);
    } catch (error) {
        next(error);
    }
};

const getTrendingVideos = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const videos = await Video.find({ isPublic: true })
            .populate('channel', 'title avatar subscribersCount')
            .populate('userId', 'username')
            .sort({ views: -1, likesCount: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Video.countDocuments({ isPublic: true });

        return ResponseHelper.paginated(res, videos, {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }, "Trending videos retrieved");
    } catch (error) {
        next(error);
    }
};

const getVideosByCategory = async (req, res, next) => {
    try {
        const { category } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const videos = await Video.find({
            category: category,
            isPublic: true
        })
        .populate('channel', 'title avatar subscribersCount')
        .populate('userId', 'username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

        const total = await Video.countDocuments({ category, isPublic: true });

        return ResponseHelper.paginated(res, videos, {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }, `${category} videos retrieved`);
    } catch (error) {
        next(error);
    }
};

const getUserVideos = async (req, res, next) => {
    try {
        const { id } = req.params;

        const videos = await Video.find({ userId: id })
            .populate('channel', 'title avatar')
            .sort({ createdAt: -1 });

        return ResponseHelper.success(res, "User videos retrieved", videos);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    uploadVideo,
    retrieveAllVideos,
    retrieveVideoById,
    streamVideo,
    updateVideo,
    deleteVideo,
    videoSearching,
    getTrendingVideos,
    getVideosByCategory,
    getUserVideos
};
