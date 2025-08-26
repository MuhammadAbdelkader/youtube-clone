const { CloudUploader } = require("../utils/cloudinary.utils");
const Channel = require("../models/channel.model");

const createChannel = async (req, res, next) => {
    try {
        const owner = req.user.userId;
        console.log("owner:", req.user.userId);
        if (req.file) {
            console.log(req.file);
            const cloudUploader = new CloudUploader();
            const avatarUrl = await cloudUploader.uploadToCloudinary(req.file.data);
            if (avatarUrl) {
                const newChannel = await Channel.create({
                    owner,
                    ...req.body,
                    avatar: avatarUrl
                });
                return res.status(201).json({ status: true, data: newChannel });
            }
        }
        const newChannel = await Channel.create({
            ...req.body,
            owner
        });

        res.status(201).json({ status: true, data: newChannel });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};
const updateChannel = async (req, res, next) => {
    try {
        const channelId = req.params.id;
        const channel = await Channel.findByIdAndUpdate(channelId, { ...req.body }, { new: true });
        if (!channel) {
            return res.status(404).json({ message: "Channel not found" });
        }
        res.status(200).json({ status: true, data: channel });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};
const deleteChannel = async (req, res, next) => {
    try {
        const channelId = req.params.id;
        const channel = await Channel.findByIdAndDelete(channelId);
        if (!channel) {
            return res.status(404).json({ message: "Channel not found" });
        }
        res.status(200).json({ status: true, message: "Channel deleted successfully" });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};
const getUserChannel = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const channel = await Channel.findOne({ owner: userId });
        if (!channel) {
            return res.status(404).json({ message: "Channel not found" });
        }
        res.status(200).json({ status: true, data: channel });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};

module.exports = { createChannel, updateChannel, deleteChannel, getUserChannel };