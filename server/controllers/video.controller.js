const { default: rateLimit } = require("express-rate-limit");
const cloudinary = require("cloudinary").v2;
const Video = require("../models/video.model");
const { CloudUploader } = require("../utils/cloudinary.utils");
const extractPublicId = require("../helpers/extractPId");

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
const streamVideo = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { quality = 'auto' } = req.query;

        // Find video
        const video = await Video.findById(id);
        if (!video) {
            return next(new Error("Video not found", { cause: 404 }));
        }

        let streamUrl = video.videoUrl;

        // Apply quality if requested
        if (quality !== 'auto') {
            const publicId = extractPublicId(video.videoUrl);

            if (publicId) {
                const qualitySettings = {
                    '720p': { height: 720, width: 1280 },
                    '480p': { height: 480, width: 854 },
                    '360p': { height: 360, width: 640 },
                    "240p": { height: 240, width: 426 },
                    "144p": { height: 144, width: 256 }
                };

                if (qualitySettings[quality]) {
                    streamUrl = cloudinary.url(publicId, {
                        resource_type: 'video',
                        transformation: [
                            {
                                ...qualitySettings[quality],
                                crop: 'scale',
                                quality: 'auto',
                                format: 'mp4'
                            }
                        ]
                    });
                }
            }
        }

        // Simple headers (Cloudinary handles range requests)
        res.set({
            'Content-Type': 'video/mp4',
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',

        });

        res.redirect(streamUrl);
        video.views += 1;
        await video.save();

    } catch (error) {
        console.error('Stream error:', error);
        next(new Error(error.message || "Failed to stream video", { cause: 500 }));
    }
};
module.exports = {
    uploadVideo,
    retrieveAllVideos,
    retrieveVideoById,
    streamVideo
};
