const Channel = require("../models/channel.model");



const checkUserChannels = async (req, res, next) => {
    const userId = req.user.userId;
    const channel = await Channel.findOne({ owner: userId });
    if (channel) {
        return res.status(400).json({ message: "User already has a channel" });
    }
    next();
};

const canModifyChannel = async (req, res, next) => {
    let channelId = req.params.id;
    const userId = req.user.userId;
    const channel = await Channel.findOne({ _id: channelId, owner: userId });
    if (!channel) {
        return res.status(403).json({ message: "Access denied" });
    }
    next();
};

module.exports = { checkUserChannels, canModifyChannel };