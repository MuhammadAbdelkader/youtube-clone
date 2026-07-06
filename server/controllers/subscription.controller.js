const Subscription = require("../models/subscription.model");
const Channel = require("../models/channel.model");
const Video = require("../models/video.model");
const { getRedisClient } = require("../config/redis");
const { createNotification } = require("./notification.controller");

const CACHE_TTL = 300; // 5 minutes in seconds
const subsKey   = (userId)    => `subs:${userId}`;
const countKey  = (channelId) => `subcount:${channelId}`;

// ─── Toggle Subscribe / Unsubscribe ──────────────────────────────────────────
const toggleSubscription = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const subscriberId = req.user.userId;

    const channel = await Channel.findById(channelId).select("_id owner");
    if (!channel) {
      return res.status(404).json({ status: "error", message: "Channel not found" });
    }

    if (channel.owner.toString() === subscriberId) {
      return res.status(400).json({ status: "error", message: "Cannot subscribe to your own channel" });
    }

    const existing = await Subscription.findOne({ subscriber: subscriberId, channel: channelId });

    let result = {};
    if (existing) {
      await Subscription.deleteOne({ _id: existing._id });
      result = { subscribed: false, action: "unsubscribed" };
    } else {
      await Subscription.create({ subscriber: subscriberId, channel: channelId });
      result = { subscribed: true, action: "subscribed" };
      // Notify the channel owner
      createNotification({
        recipient: channel.owner,
        sender: subscriberId,
        type: 'subscription',
        channel: channelId,
      });
    }

    // Update channel subscriber count
    await updateSubscriberCount(channelId);

    // Invalidate Redis caches
    try {
      const redis = getRedisClient();
      await Promise.all([
        redis.del(subsKey(subscriberId)),
        redis.del(countKey(channelId)),
      ]);
    } catch (redisErr) {
      console.warn("[Redis] Cache invalidation failed (non-critical):", redisErr.message);
    }

    return res.status(200).json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

// ─── Subscription Status ──────────────────────────────────────────────────────
const getSubscriptionStatus = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.userId;

    const subscription = await Subscription.findOne({
      subscriber: userId,
      channel: channelId,
    }).select("_id");

    return res.status(200).json({
      status: "success",
      data: { subscribed: !!subscription },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get User Subscriptions (Redis-cached) ────────────────────────────────────
const getUserSubscriptions = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const useCache = page === 1;

    if (useCache) {
      try {
        const redis = getRedisClient();
        const cached = await redis.get(subsKey(userId));
        // Cache now stores { data, total } together so a cache hit can still
        // report a real total instead of the length of just this page's array.
        if (cached && cached.data) {
          return res.status(200).json({
            status: "success",
            data: cached.data,
            pagination: { page, limit, total: cached.total, pages: Math.ceil(cached.total / limit) },
            fromCache: true,
          });
        }
      } catch (redisErr) {
        console.warn("[Redis] Cache read failed (non-critical):", redisErr.message);
      }
    }

    const [subscriptions, total] = await Promise.all([
      Subscription.find({ subscriber: userId })
        .populate("channel", "title description avatar subscribersCount")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Subscription.countDocuments({ subscriber: userId }),
    ]);

    if (useCache) {
      try {
        const redis = getRedisClient();
        await redis.set(subsKey(userId), { data: subscriptions, total }, { ex: CACHE_TTL });
      } catch (redisErr) {
        console.warn("[Redis] Cache write failed (non-critical):", redisErr.message);
      }
    }

    return res.status(200).json({
      status: "success",
      data: subscriptions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      fromCache: false,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Video Feed From Subscribed Channels ──────────────────────────────────
const getSubscriptionFeed = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const page  = parseInt(req.query.page)  || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip  = (page - 1) * limit;

    const subscriptions = await Subscription.find({ subscriber: userId }).select("channel");
    const channelIds = subscriptions.map((s) => s.channel);

    if (channelIds.length === 0) {
      return res.status(200).json({
        status: "success",
        message: "No subscriptions yet",
        data: [],
        hasSubscriptions: false,
        pagination: { page, limit, total: 0, pages: 0 },
      });
    }

    const filter = { channel: { $in: channelIds }, isPublic: true };

    const [videos, total] = await Promise.all([
      Video.find(filter)
        .populate("channel", "title avatar subscribersCount")
        .populate("userId", "username")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Video.countDocuments(filter),
    ]);

    return res.status(200).json({
      status: "success",
      message: "Subscription feed retrieved successfully",
      data: videos,
      hasSubscriptions: true,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Channel Subscribers ──────────────────────────────────────────────────
const getChannelSubscribers = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const channel = await Channel.findOne({ _id: channelId, owner: req.user.userId }).select("_id");
    if (!channel) {
      return res.status(403).json({ status: "error", message: "Access denied" });
    }

    const [subscribers, total] = await Promise.all([
      Subscription.find({ channel: channelId })
        .populate("subscriber", "username avatar_url")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Subscription.countDocuments({ channel: channelId }),
    ]);

    return res.status(200).json({
      status: "success",
      data: subscribers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Helper: update denormalized subscriber count on Channel doc ──────────────
const updateSubscriberCount = async (channelId) => {
  const count = await Subscription.countDocuments({ channel: channelId });
  await Channel.findByIdAndUpdate(channelId, { subscribersCount: count });
};

module.exports = {
  toggleSubscription,
  getSubscriptionStatus,
  getUserSubscriptions,
  getSubscriptionFeed,
  getChannelSubscribers,
};
