const Subscription = require("../models/subscription.model");
const Channel = require("../models/channel.model");
const User = require("../models/user.model");

const toggleSubscription = async (req, res, next) => {
    try {
        const { channelId } = req.params;
        const subscriberId = req.user.userId;

        const channel = await Channel.findById(channelId);
        if (!channel) {
            return next(new Error("Channel not found", { cause: 404 }));
        }

        if (channel.owner.toString() === subscriberId) {
            return next(new Error("Cannot subscribe to your own channel", { cause: 400 }));
        }

        const existingSubscription = await Subscription.findOne({
            subscriber: subscriberId,
            channel: channelId
        });

        let result = {};

        if (existingSubscription) {
            await Subscription.deleteOne({ _id: existingSubscription._id });
            result.subscribed = false;
            result.action = 'unsubscribed';
        } else {
            await Subscription.create({
                subscriber: subscriberId,
                channel: channelId
            });
            result.subscribed = true;
            result.action = 'subscribed';
        }

        await updateSubscriberCount(channelId);
        res.status(200).json({ status: true, data: result });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};

const getSubscriptionStatus = async (req, res, next) => {
    try {
        const { channelId } = req.params;
        const userId = req.user.userId;

        const subscription = await Subscription.findOne({
            subscriber: userId,
            channel: channelId
        });

        res.status(200).json({
            status: true,
            data: { subscribed: !!subscription }
        });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};

const getUserSubscriptions = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const subscriptions = await Subscription.find({ subscriber: userId })
            .populate('channel', 'title description avatar subscribersCount')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            status: true,
            data: subscriptions,
            pagination: { page, limit, total: subscriptions.length }
        });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};

const getChannelSubscribers = async (req, res, next) => {
    try {
        const { channelId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const channel = await Channel.findOne({ 
            _id: channelId, 
            owner: req.user.userId 
        });
        if (!channel) {
            return next(new Error("Access denied", { cause: 403 }));
        }

        const subscribers = await Subscription.find({ channel: channelId })
            .populate('subscriber', 'username avatar_url')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            status: true,
            data: subscribers,
            pagination: { page, limit, total: subscribers.length }
        });
    } catch (error) {
        next(new Error(error.message, { cause: 500 }));
    }
};

const updateSubscriberCount = async (channelId) => {
    const count = await Subscription.countDocuments({ channel: channelId });
    await Channel.findByIdAndUpdate(channelId, { subscribersCount: count });
};

module.exports = {
    toggleSubscription,
    getSubscriptionStatus,
    getUserSubscriptions,
    getChannelSubscribers
};