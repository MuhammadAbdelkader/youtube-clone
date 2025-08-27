const { default: rateLimit } = require("express-rate-limit");
const cloudinary = require("cloudinary").v2;
const Video = require("../models/video.model");
const Channel = require("../models/channel.model");
const { CloudUploader } = require("../utils/cloudinary.utils");
const extractPublicId = require("../helpers/extractPId");
const dateConstants = require("../constants/date-filtering");


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
        let url = await cloudUploader.uploadToCloudinary(videoFile.data)
        let video = await Video.create({
            title: req.body.title,
            description: req.body.description,
            videoUrl: url,
            thumbnailUrl: "",
            channel: req.body.channel,
            userId: req.user.userId
        })
        await Channel.findByIdAndUpdate(req.body.channel, {
            $push: { videos: video._id }
        });
        res.status(201).json({ status: "success", data: video });

    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
}
const retrieveAllVideos = async (req, res, next) => {
    try {
        const videos = await Video.find();
        if (!videos.length) return next(new Error("No videos found", { cause: 404 }));
        res.status(200).json({ status: "success", data: videos });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};

const retrieveVideoById = async (req, res, next) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return next(new Error("Video not found", { cause: 404 }));
        res.status(200).json({ status: "success", data: video });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};
const streamVideo = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Find video
        const video = await Video.findById(id);
        if (!video) {
            return next(new Error("Video not found", { cause: 404 }));
        }

        let streamUrl = video.videoUrl;


        res.status(200).json({ videourl: streamUrl });
        video.views += 1;
        await video.save();

    } catch (error) {
        console.error('Stream error:', error);
        next(new Error(error.message || "Failed to stream video", { cause: 500 }));
    }
};
const updateVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Validate video ID
        if (!id) {
            throw new Error("Video ID is required", { cause: 400 });
        }

        // Find and update video
        const video = await Video.findByIdAndUpdate(id, updates, { new: true });
        if (!video) {
            throw new Error("Video not found", { cause: 404 });
        }

        res.status(200).json({ status: true, data: video });
    } catch (error) {
        throw new Error(error.message, { cause: 500 });
    }
};



const deleteVideo = async (req, res) => {
    try {
        const { id } = req.params;
        // Validate video ID
        if (!id) {
            throw new Error("Video ID is required", { cause: 400 });
        }

        // Find and update video
        const video = await Video.findByIdAndDelete(id);
        if (!video) {
            throw new Error("Video not found", { cause: 404 });
        }

        res.status(200).json({ status: true, message: "video deleted successfuly", data: video });
    } catch (error) {
        throw new Error(error.message, { cause: 500 });
    }
}

const videoSearching = async (req, res) => {
    try {
        const { q, date } = req.query;
        if (!q) {
            throw new Error("Search query is required", { cause: 400 });
        }
        const videos = await Video.find({ $text: { $search: q } }).lean();
        switch (date) {
            case "today":
                videos.filter(v => v.createdAt > dateConstants.UploadedToday);
                break;
            case "this week":
                videos.filter(v => v.createdAt >= dateConstants.ThisWeek);
                break;
            case "this month":
                videos.filter(v => v.createdAt >= dateConstants.ThisMonth);
                break;
            case "this year":
                videos.filter(v => v.createdAt >= dateConstants.ThisYear);
                break;
        }

        res.status(200).json({ status: true, data: videos });
    } catch (error) {
        throw new Error(error.message, { cause: 500 });
    }
};
const getUserVideos = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            throw new Error("User ID is required", { cause: 400 });
        }
        const videos = await Video.find({ userId: id });
        if (!videos.length) throw new Error("No videos found for this user", { cause: 404 });
        res.status(200).json({ status: true, data: videos });
    } catch (error) {
        throw new Error(error.message, { cause: 500 });
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
    getUserVideos
};
