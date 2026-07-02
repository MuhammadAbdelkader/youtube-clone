const { uploadImage } = require("../utils/cloudinary.utils");
const Channel = require("../models/channel.model");
const ResponseHelper = require("../utils/responseHelper");

const createChannel = async (req, res, next) => {
    try {
        const owner = req.user.userId;
        let channelData = { owner, ...req.body };

        // req.files is set by multer .fields([...]) in the route
        if (req.files && req.files.avatar && req.files.avatar[0]) {
            const result = await uploadImage(req.files.avatar[0].buffer, "youcube/avatars");
            channelData.avatar = result.secure_url;
        }

        const newChannel = await Channel.create(channelData);
        return ResponseHelper.success(res, "Channel created successfully", newChannel, 201);
    } catch (error) {
        next(error);
    }
};

const updateChannel = async (req, res, next) => {
    try {
        const channelId = req.params.id;
        let updateData = { ...req.body };

        if (req.files && req.files.coverImage && req.files.coverImage[0]) {
            const result = await uploadImage(req.files.coverImage[0].buffer, "youcube/covers");
            updateData.coverImage = result.secure_url;
        }

        if (req.files && req.files.avatar && req.files.avatar[0]) {
            const result = await uploadImage(req.files.avatar[0].buffer, "youcube/avatars");
            updateData.avatar = result.secure_url;
        }

        const channel = await Channel.findByIdAndUpdate(channelId, updateData, { new: true });
        if (!channel) return ResponseHelper.notFound(res, "Channel not found");
        return ResponseHelper.success(res, "Channel updated successfully", channel);
    } catch (error) {
        next(error);
    }
};

const deleteChannel = async (req, res, next) => {
    try {
        const channelId = req.params.id;
        const channel = await Channel.findByIdAndDelete(channelId);
        if (!channel) return ResponseHelper.notFound(res, "Channel not found");
        return ResponseHelper.success(res, "Channel deleted successfully");
    } catch (error) {
        next(error);
    }
};

const getUserChannel = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const channel = await Channel.findOne({ owner: userId })
            .populate("videos", "title thumbnailUrl views createdAt");
        if (!channel) return ResponseHelper.notFound(res, "Channel not found");
        return ResponseHelper.success(res, "Channel retrieved successfully", channel);
    } catch (error) {
        next(error);
    }
};

const getChannelById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const channel = await Channel.findById(id)
            .populate("owner", "username")
            .populate("videos", "title thumbnailUrl views duration createdAt");
        if (!channel) return ResponseHelper.notFound(res, "Channel not found");
        return ResponseHelper.success(res, "Channel retrieved successfully", channel);
    } catch (error) {
        next(error);
    }
};

const searchChannels = async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q) return ResponseHelper.error(res, "Search query is required", 400);

        const channels = await Channel.find({
            $or: [
                { title: { $regex: q, $options: "i" } },
                { description: { $regex: q, $options: "i" } },
            ],
        })
            .populate("owner", "username")
            .sort({ subscribersCount: -1 })
            .limit(20);

        return ResponseHelper.success(res, "Search results retrieved", channels);
    } catch (error) {
        next(error);
    }
};

const getAllChannels = async (req, res, next) => {
    try {
        const channels = await Channel.find();
        return res.status(200).json({ status: true, data: channels });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createChannel,
    updateChannel,
    deleteChannel,
    getUserChannel,
    getChannelById,
    getAllChannels,
    searchChannels,
};