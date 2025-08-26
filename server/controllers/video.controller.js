const { default: rateLimit } = require("express-rate-limit");
const cloudinary = require("cloudinary").v2;
const Video = require("../models/video.model");
const Channel = require("../models/channel.model");
const { CloudUploader } = require("../utils/cloudinary.utils");
const extractPublicId = require("../helpers/extractPId");
const dateConstants = require("../constants/dateFiltering");

// ✅ EXISTING FUNCTIONS (keep as they are)
const uploadVideo = async (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return next(new Error('No files were uploaded.', { cause: 400 }));
    }

    const videoFile = req.files.video;

    if (!videoFile.mimetype.startsWith('video/')) {
        return next(new Error('Please upload a valid video file.', { cause: 400 }));
    }

    const cloudUploader = new CloudUploader();
    try {
        let url = await cloudUploader.uploadToCloudinary(videoFile.data);
        
        // ➕ ENHANCED: Add new fields
        let video = await Video.create({
            title: req.body.title,
            description: req.body.description,
            videoUrl: url,
            thumbnailUrl: req.body.thumbnailUrl || "",
            channel: req.body.channel,
            userId: req.user.userId,
            category: req.body.category || 'Other',
            tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
            language: req.body.language || 'en'
        });
        
        await Channel.findByIdAndUpdate(req.body.channel, {
            $push: { videos: video._id }
        });
        
        res.status(201).json({ status: "success", data: video });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};

const retrieveAllVideos = async (req, res, next) => {
    try {
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        let skip = (page - 1) * limit;

        // ➕ ENHANCED: Add filtering options
        const filter = { isPublic: true };
        if (req.query.category) filter.category = req.query.category;
        if (req.query.language) filter.language = req.query.language;

        const videos = await Video.find(filter)
            .populate('channel', 'title avatar subscribersCount')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
            
        if (!videos.length) return next(new Error("No videos found", { cause: 404 }));
        res.status(200).json({ status: true, data: videos });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};

const retrieveVideoById = async (req, res, next) => {
    try {
        const video = await Video.findById(req.params.id)
            .populate('channel', 'title avatar subscribersCount isVerified')
            .populate('userId', 'username');
            
        if (!video) return next(new Error("Video not found", { cause: 404 }));
        res.status(200).json({ status: true, data: video });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};

const streamVideo = async (req, res, next) => {
    try {
        const { id } = req.params;
        const video = await Video.findById(id);
        if (!video) {
            return next(new Error("Video not found", { cause: 404 }));
        }

        let streamUrl = video.videoUrl;
        res.status(200).json({ videourl: streamUrl });
        
        // Increment views
        video.views += 1;
        await video.save();
    } catch (error) {
        console.error('Stream error:', error);
        next(new Error(error.message || "Failed to stream video", { cause: 500 }));
    }
};

const updateVideo = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (!id) {
            return next(new Error("Video ID is required", { cause: 400 }));
        }

        // ➕ ENHANCED: Handle tags properly
        if (updates.tags && typeof updates.tags === 'string') {
            updates.tags = updates.tags.split(',').map(tag => tag.trim());
        }

        const video = await Video.findByIdAndUpdate(id, updates, { new: true })
            .populate('channel', 'title avatar');
            
        if (!video) {
            return next(new Error("Video not found", { cause: 404 }));
        }

        res.status(200).json({ status: true, data: video });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};

const deleteVideo = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            return next(new Error("Video ID is required", { cause: 400 }));
        }

        const video = await Video.findByIdAndDelete(id);
        if (!video) {
            return next(new Error("Video not found", { cause: 404 }));
        }

        // Remove from channel
        await Channel.findByIdAndUpdate(video.channel, {
            $pull: { videos: id }
        });

        res.status(200).json({ status: true, message: "Video deleted successfully", data: video });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};

const videoSearching = async (req, res, next) => {
    try {
        const { q, date, category, sortBy } = req.query;
        if (!q) {
            return next(new Error("Search query is required", { cause: 400 }));
        }

        let searchFilter = { 
            $text: { $search: q },
            isPublic: true
        };

        // ➕ ENHANCED: Add category filter
        if (category) searchFilter.category = category;

        let videos = await Video.find(searchFilter)
            .populate('channel', 'title avatar subscribersCount')
            .lean();

        // Date filtering
        switch (date) {
            case "today":
                videos = videos.filter(v => v.createdAt > dateConstants.UploadedToday);
                break;
            case "this week":
                videos = videos.filter(v => v.createdAt >= dateConstants.ThisWeek);
                break;
            case "this month":
                videos = videos.filter(v => v.createdAt >= dateConstants.ThisMonth);
                break;
            case "this year":
                videos = videos.filter(v => v.createdAt >= dateConstants.ThisYear);
                break;
        }

        // ➕ ENHANCED: Add sorting
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
            default:
                // Default MongoDB text search relevance
                break;
        }

        res.status(200).json({ status: true, data: videos });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};

const getUserVideos = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            return next(new Error("User ID is required", { cause: 400 }));
        }

        const videos = await Video.find({ userId: id })
            .populate('channel', 'title avatar')
            .sort({ createdAt: -1 });
            
        if (!videos.length) return next(new Error("No videos found for this user", { cause: 404 }));
        res.status(200).json({ status: true, data: videos });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};

// ➕ NEW FUNCTIONS
const getTrendingVideos = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const videos = await Video.find({ isPublic: true })
            .populate('channel', 'title avatar subscribersCount')
            .sort({ views: -1, likesCount: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            status: true,
            data: videos,
            pagination: { page, limit }
        });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
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
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

        res.status(200).json({
            status: true,
            data: videos,
            pagination: { page, limit }
        });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
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
    getUserVideos,
    getTrendingVideos,      // ➕ NEW
    getVideosByCategory    // ➕ NEW
};
