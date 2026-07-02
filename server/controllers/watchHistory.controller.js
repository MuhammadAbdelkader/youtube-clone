const WatchHistory = require("../models/watchHistory.model");
const Video = require("../models/video.model");
const { getRedisClient } = require("../config/redis");

const CACHE_TTL = 120; // 2 minutes in seconds
const cacheKey = (userId) => `wh:${userId}`;

// ─── Add to Watch History ─────────────────────────────────────────────────────
const addToWatchHistory = async (req, res, next) => {
  try {
    const { videoId, watchDuration, completed } = req.body;
    const userId = req.user.userId;

    const video = await Video.findById(videoId).select("_id");
    if (!video) {
      return res.status(404).json({ status: "error", message: "Video not found" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let watchEntry = await WatchHistory.findOne({
      user: userId,
      video: videoId,
      watchedAt: { $gte: today },
    });

    if (watchEntry) {
      watchEntry.watchDuration = Math.max(watchEntry.watchDuration, watchDuration || 0);
      watchEntry.completed = completed || watchEntry.completed;
      watchEntry.watchedAt = new Date();
      await watchEntry.save();
    } else {
      watchEntry = await WatchHistory.create({
        user: userId,
        video: videoId,
        watchDuration: watchDuration || 0,
        completed: completed || false,
      });
    }

    // Invalidate cached history for this user
    try {
      const redis = getRedisClient();
      await redis.del(cacheKey(userId));
    } catch (redisErr) {
      console.warn("[Redis] Cache invalidation failed (non-critical):", redisErr.message);
    }

    return res.status(200).json({ status: "success", data: watchEntry });
  } catch (error) {
    next(error);
  }
};

// ─── Get User Watch History (Redis-cached) ────────────────────────────────────
const getUserWatchHistory = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    // Only cache page 1 — paginated requests bypass cache
    const useCache = page === 1 && !req.query.limit;

    if (useCache) {
      try {
        const redis = getRedisClient();
        const cached = await redis.get(cacheKey(userId));
        if (cached) {
          return res.status(200).json({
            status: "success",
            data: cached,
            pagination: { page, limit },
            fromCache: true,
          });
        }
      } catch (redisErr) {
        console.warn("[Redis] Cache read failed (non-critical):", redisErr.message);
      }
    }

    const history = await WatchHistory.find({ user: userId })
      .populate({
        path: "video",
        select: "title description thumbnailUrl duration views channel",
        populate: { path: "channel", select: "title avatar" },
      })
      .sort({ watchedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Store in Redis cache for next request
    if (useCache && history.length > 0) {
      try {
        const redis = getRedisClient();
        await redis.set(cacheKey(userId), history, { ex: CACHE_TTL });
      } catch (redisErr) {
        console.warn("[Redis] Cache write failed (non-critical):", redisErr.message);
      }
    }

    return res.status(200).json({
      status: "success",
      data: history,
      pagination: { page, limit },
      fromCache: false,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Remove Single Entry ──────────────────────────────────────────────────────
const removeFromWatchHistory = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const userId = req.user.userId;

    await WatchHistory.deleteMany({ user: userId, video: videoId });

    try {
      const redis = getRedisClient();
      await redis.del(cacheKey(userId));
    } catch (redisErr) {
      console.warn("[Redis] Cache invalidation failed (non-critical):", redisErr.message);
    }

    return res.status(200).json({ status: "success", message: "Removed from watch history" });
  } catch (error) {
    next(error);
  }
};

// ─── Clear All History ────────────────────────────────────────────────────────
const clearWatchHistory = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    await WatchHistory.deleteMany({ user: userId });

    try {
      const redis = getRedisClient();
      await redis.del(cacheKey(userId));
    } catch (redisErr) {
      console.warn("[Redis] Cache invalidation failed (non-critical):", redisErr.message);
    }

    return res.status(200).json({ status: "success", message: "Watch history cleared" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addToWatchHistory,
  getUserWatchHistory,
  removeFromWatchHistory,
  clearWatchHistory,
};
