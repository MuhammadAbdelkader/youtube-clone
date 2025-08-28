const Channel = require("../models/channel.model");
const ResponseHelper = require("../utils/responseHelper");

const checkUserChannels = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const existingChannel = await Channel.findOne({ owner: userId });
        
        if (existingChannel) {
            return ResponseHelper.conflict(res, "User already has a channel");
        }
        
        next();
    } catch (error) {
        return ResponseHelper.error(res, "Error checking user channels");
    }
};

const canModifyChannel = async (req, res, next) => {
    try {
        const channelId = req.params.id;
        const userId = req.user.userId;
        
        const channel = await Channel.findOne({ 
            _id: channelId, 
            owner: userId 
        });
        
        if (!channel) {
            return ResponseHelper.forbidden(res, "Access denied: Not your channel");
        }
        
        next();
    } catch (error) {
        return ResponseHelper.error(res, "Error verifying channel ownership");
    }
};

module.exports = { checkUserChannels, canModifyChannel };
