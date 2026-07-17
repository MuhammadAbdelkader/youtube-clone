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

    // Validate that the video exists and is public
    const video = await Video.findOne({ _id: videoId, isPublic: true }).select("_id");
    if (!video) {
      return res.status(404).json({ status: "error", message: "Video not found or unavailable." });
    }

    // One entry per user-video pair per calendar day (UTC midnight boundary)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    let watchEntry = await WatchHistory.findOne({
      user: userId,
      video: videoId,
      watchedAt: { $gte: today },
    });

    if (watchEntry) {
      // Preserve the longest-watched position; mark complete if signalled
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

    // Invalidate cached history for this user (non-critical — log but never throw)
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

// ─── Get User Watch History (Redis-cached page 1) ─────────────────────────────
const getUserWatchHistory = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip  = (page - 1) * limit;

    // Cache only the default first page (no explicit page/limit params)
    const useCache = page === 1 && !req.query.limit;

    if (useCache) {
      try {
        const redis = getRedisClient();
        const cached = await redis.get(cacheKey(userId));
        if (cached) {
          // Upstash REST SDK returns already-parsed JSON; handle both cases
          const data = typeof cached === "string" ? JSON.parse(cached) : cached;
          if (Array.isArray(data)) {
            return res.status(200).json({
              status: "success",
              data,
              pagination: { page, limit, total: data.length },
              fromCache: true,
            });
          }
        }
      } catch (redisErr) {
        console.warn("[Redis] Cache read failed (non-critical):", redisErr.message);
      }
    }

    // Run data query and count in parallel for efficiency
    const [history, total] = await Promise.all([
      WatchHistory.find({ user: userId })
        .populate({
          path: "video",
          // Include videoId so the frontend can build correct /watch?v=<videoId> links
          select: "title description thumbnailUrl videoUrl videoId duration views channel isPublic",
          populate: { path: "channel", select: "title avatar handle" },
        })
        .sort({ watchedAt: -1 })
        .skip(skip)
        .limit(limit),
      WatchHistory.countDocuments({ user: userId }),
    ]);

    // Filter out entries whose video was deleted or made private after being watched
    const publicHistory = history.filter((entry) => entry.video?.isPublic !== false);

    // Persist page-1 result to Redis — JSON.stringify for safe serialization
    if (useCache && publicHistory.length > 0) {
      try {
        const redis = getRedisClient();
        await redis.set(cacheKey(userId), JSON.stringify(publicHistory), { ex: CACHE_TTL });
      } catch (redisErr) {
        console.warn("[Redis] Cache write failed (non-critical):", redisErr.message);
      }
    }

    return res.status(200).json({
      status: "success",
      data: publicHistory,
      pagination: { page, limit, total },
      fromCache: false,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Remove Single Entry ──────────────────────────────────────────────────────
const removeFromWatchHistory = async (req, res, next) => {
  try {
    const { videoId } = req.params; // this is the MongoDB _id of the video
    const userId = req.user.userId;

    const result = await WatchHistory.deleteMany({ user: userId, video: videoId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ status: "error", message: "Entry not found in watch history." });
    }

    // Invalidate cache
    try {
      const redis = getRedisClient();
      await redis.del(cacheKey(userId));
    } catch (redisErr) {
      console.warn("[Redis] Cache invalidation failed (non-critical):", redisErr.message);
    }

    return res.status(200).json({ status: "success", message: "Removed from watch history." });
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

    return res.status(200).json({ status: "success", message: "Watch history cleared." });
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
