const Video = require("../models/video.model");
const { CloudUploader } = require("../utils/cloudinary.utils")

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
            userId: "507f1f77bcf86cd799439011"
        })
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
module.exports = {
    uploadVideo,
    retrieveAllVideos,
    retrieveVideoById
};
