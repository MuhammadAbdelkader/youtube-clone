const { CloudUploader } = require("../utils/cloudinary.utils");
const Channel = require("../models/channel.model");

// ✅ EXISTING FUNCTIONS (keep as they are)
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
        let updateData = { ...req.body };
        
        // ➕ ENHANCED: Handle cover image upload
        if (req.files && req.files.coverImage) {
            const cloudUploader = new CloudUploader();
            const coverUrl = await cloudUploader.uploadToCloudinary(req.files.coverImage.data);
            updateData.coverImage = coverUrl;
        }
        
        // Handle avatar upload
        if (req.files && req.files.avatar) {
            const cloudUploader = new CloudUploader();
            const avatarUrl = await cloudUploader.uploadToCloudinary(req.files.avatar.data);
            updateData.avatar = avatarUrl;
        }
        
        const channel = await Channel.findByIdAndUpdate(channelId, updateData, { new: true });
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
        const channel = await Channel.findOne({ owner: userId })
            .populate('videos', 'title thumbnailUrl views createdAt');
            
        if (!channel) {
            return res.status(404).json({ message: "Channel not found" });
        }
        res.status(200).json({ status: true, data: channel });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};

// ➕ NEW FUNCTIONS
const getChannelById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const channel = await Channel.findById(id)
            .populate('owner', 'username')
            .populate('videos', 'title thumbnailUrl views duration createdAt');
            
        if (!channel) {
            return next(new Error("Channel not found", { cause: 404 }));
        }
        
        res.status(200).json({ status: true, data: channel });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};

const searchChannels = async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q) {
            return next(new Error("Search query is required", { cause: 400 }));
        }

        const channels = await Channel.find({
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ]
        })
        .populate('owner', 'username')
        .sort({ subscribersCount: -1 })
        .limit(20);

        res.status(200).json({ status: true, data: channels });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};

module.exports = { 
    createChannel, 
    updateChannel, 
    deleteChannel, 
    getUserChannel,
    getChannelById,    // ➕ NEW
    searchChannels     // ➕ NEW
};