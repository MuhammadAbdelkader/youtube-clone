const Subscription = require("../models/subscription.model");
const Channel = require("../models/channel.model");
const { getRedisClient } = require("../config/redis");

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
        if (cached) {
          return res.status(200).json({
            status: "success",
            data: cached,
            pagination: { page, limit, total: cached.length },
            fromCache: true,
          });
        }
      } catch (redisErr) {
        console.warn("[Redis] Cache read failed (non-critical):", redisErr.message);
      }
    }

    const subscriptions = await Subscription.find({ subscriber: userId })
      .populate("channel", "title description avatar subscribersCount")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    if (useCache && subscriptions.length > 0) {
      try {
        const redis = getRedisClient();
        await redis.set(subsKey(userId), subscriptions, { ex: CACHE_TTL });
      } catch (redisErr) {
        console.warn("[Redis] Cache write failed (non-critical):", redisErr.message);
      }
    }

    return res.status(200).json({
      status: "success",
      data: subscriptions,
      pagination: { page, limit, total: subscriptions.length },
      fromCache: false,
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

    const subscribers = await Subscription.find({ channel: channelId })
      .populate("subscriber", "username avatar_url")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      status: "success",
      data: subscribers,
      pagination: { page, limit, total: subscribers.length },
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
  getChannelSubscribers,
};