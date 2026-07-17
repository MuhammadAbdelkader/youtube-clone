const { uploadImage } = require("../utils/cloudinary.utils");
const Channel = require("../models/channel.model");
const ResponseHelper = require("../utils/responseHelper");

const CREATABLE_CHANNEL_FIELDS = ["title", "description", "category", "socialLinks"];
const UPDATABLE_CHANNEL_FIELDS = ["title", "description", "category", "socialLinks"];

const createChannel = async (req, res, next) => {
    try {
        const owner = req.user.userId;
        const channelData = { owner };

        for (const field of CREATABLE_CHANNEL_FIELDS) {
            if (req.body[field] !== undefined) channelData[field] = req.body[field];
        }
        
        channelData.handle = "@" + channelData.title.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(1000 + Math.random() * 9000);

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
        const updateData = {};

        for (const field of UPDATABLE_CHANNEL_FIELDS) {
            if (req.body[field] !== undefined) updateData[field] = req.body[field];
        }

        if (req.files && req.files.coverImage && req.files.coverImage[0]) {
            const result = await uploadImage(req.files.coverImage[0].buffer, "youcube/covers");
            updateData.coverImage = result.secure_url;
        }

        if (req.files && req.files.avatar && req.files.avatar[0]) {
            const result = await uploadImage(req.files.avatar[0].buffer, "youcube/avatars");
            updateData.avatar = result.secure_url;
        }

        const channel = await Channel.findByIdAndUpdate(channelId, updateData, { new: true, runValidators: true });
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
            .populate("videos", "title thumbnailUrl videoUrl views createdAt isPublic");
        if (!channel) return ResponseHelper.notFound(res, "Channel not found");
        return ResponseHelper.success(res, "Channel retrieved successfully", channel);
    } catch (error) {
        next(error);
    }
};

const getChannelById = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Find by ObjectId or Handle
        const query = id.startsWith('@') ? { handle: id } : { _id: id };
        
        const channel = await Channel.findOne(query)
            .populate("owner", "username")
            .populate("videos", "title thumbnailUrl videoUrl views duration createdAt isPublic videoId userId");
        if (!channel) return ResponseHelper.notFound(res, "Channel not found");
        return ResponseHelper.success(res, "Channel retrieved successfully", channel);
    } catch (error) {
        next(error);
    }
};

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const searchChannels = async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q) return ResponseHelper.error(res, "Search query is required", 400);
        if (q.length > 100) return ResponseHelper.error(res, "Search query is too long", 400);

        const safePattern = escapeRegex(q);

        const channels = await Channel.find({
            $or: [
                { title: { $regex: safePattern, $options: "i" } },
                { description: { $regex: safePattern, $options: "i" } },
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
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const skip = (page - 1) * limit;

        const [channels, total] = await Promise.all([
            Channel.find().select("-videos").skip(skip).limit(limit),
            Channel.countDocuments(),
        ]);

        return ResponseHelper.paginated(res, channels, {
            page, limit, total, pages: Math.ceil(total / limit),
        }, "Channels retrieved successfully");
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
