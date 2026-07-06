const Video = require("../models/video.model");
const Channel = require("../models/channel.model");
const { uploadVideo: cloudinaryUploadVideo, deleteAsset } = require("../utils/cloudinary.utils");
const { generateVideoInsights } = require("../utils/gemini.utils");
const ResponseHelper = require("../utils/responseHelper");
const dateConstants = require("../constants/date-filtering");
const { getRedisClient } = require("../config/redis");

// The feed cache has one entry per unique (page, limit, category, language)
// combination, so there's no single key to invalidate when a video is
// uploaded/edited/deleted -- and Upstash's REST-based client makes
// pattern-matching commands (KEYS/SCAN) impractical to rely on here. Instead,
// every cache write records its own key in this set, so invalidation just
// means "delete everything this set remembers, then clear the set itself" --
// no pattern matching needed. This is what closes the "I uploaded a video and
// it doesn't show up for 5 minutes" staleness gap.
const FEED_CACHE_KEYS_SET = "videos:feed:active-keys";

async function cacheFeedResponse(redis, cacheKey, payload, ttlSeconds) {
  await redis.set(cacheKey, payload, { ex: ttlSeconds });
  await redis.sadd(FEED_CACHE_KEYS_SET, cacheKey);
}

async function invalidateFeedCache() {
  try {
    const redis = getRedisClient();
    const keys = await redis.smembers(FEED_CACHE_KEYS_SET);
    if (keys && keys.length > 0) {
      await redis.del(...keys);
    }
    await redis.del(FEED_CACHE_KEYS_SET);
  } catch (err) {
    // Cache invalidation is best-effort -- a Redis hiccup here should never
    // fail the actual upload/update/delete the user is waiting on. Worst
    // case, stale feed results linger until their TTL expires anyway.
    console.warn("[Redis] Feed cache invalidation failed (non-critical):", err.message);
  }
}

// ─── Upload Video ─────────────────────────────────────────────────────────────
const uploadVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return ResponseHelper.error(res, "Video file is required", 400);
    }

    if (!req.file.mimetype.startsWith("video/")) {
      return ResponseHelper.error(res, "Please upload a valid video file", 400);
    }

    // Resolve channelId — use provided value or fall back to the user's default channel
    let channelId = req.body.channel;
    if (!channelId) {
      const userChannel = await Channel.findOne({ owner: req.user.userId });
      if (!userChannel) {
        return ResponseHelper.error(res, "No channel found for your account. Please create a channel first.", 400);
      }
      channelId = userChannel._id;
    }

    // Stream buffer directly to Cloudinary — no disk I/O
    const uploadResult = await cloudinaryUploadVideo(req.file.buffer, "youcube/videos");

    const tags = req.body.tags && typeof req.body.tags === "string"
      ? req.body.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
      : [];

    const videoData = {
      title: req.body.title,
      description: req.body.description,
      videoUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      thumbnailUrl: req.body.thumbnailUrl || "",
      channel: channelId,
      userId: req.user.userId,
      category: req.body.category || "Other",
      tags,
      language: req.body.language || "en",
      duration: uploadResult.duration || req.body.duration || 0,
    };

    const video = await Video.create(videoData);

    // Link video to its channel
    await Channel.findByIdAndUpdate(channelId, { $push: { videos: video._id } });

    const populatedVideo = await Video.findById(video._id).populate(
      "channel",
      "title avatar subscribersCount"
    );

    // ── Fire-and-forget Gemini AI enrichment (non-blocking) ───────────────────
    setImmediate(async () => {
      try {
        const insights = await generateVideoInsights({
          title: video.title,
          description: video.description,
          category: video.category,
          tags: video.tags,
        });
        await Video.findByIdAndUpdate(video._id, {
          aiSummary: insights.aiSummary,
          aiTags: insights.aiTags,
          aiProcessed: true,
        });
      } catch (err) {
        console.error(`[Gemini] AI processing failed for video ${video._id}:`, err.message);
      }
    });

    // Invalidate cached feed pages so this video shows up immediately instead
    // of waiting out the cache TTL.
    await invalidateFeedCache();

    return ResponseHelper.success(res, "Video uploaded successfully", populatedVideo, 201);
  } catch (error) {
    next(error);
  }
};

// ─── Get All Videos (paginated) ───────────────────────────────────────────────
const retrieveAllVideos = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // cap at 50
    const skip = (page - 1) * limit;

    const filter = { isPublic: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.language) filter.language = req.query.language;

    // Cache logic
    const redis = getRedisClient();
    const cacheKey = `videos:feed:page${page}:limit${limit}:cat${filter.category || 'all'}:lang${filter.language || 'all'}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const [videos, total] = await Promise.all([
      Video.find(filter)
        .populate("channel", "title avatar subscribersCount")
        .populate("userId", "username")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Video.countDocuments(filter),
    ]);

    const responsePayload = {
      status: "success",
      data: videos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };

    // Store in cache with 300 seconds TTL (5 minutes), tracked for invalidation
    await cacheFeedResponse(redis, cacheKey, responsePayload, 300);

    return res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
};

// ─── Get Video By ID ──────────────────────────────────────────────────────────
const retrieveVideoById = async (req, res, next) => {
  try {
    const videoId = String(req.params.id);
    const video = await Video.findById(videoId)
      .populate("channel", "title avatar subscribersCount isVerified")
      .populate("userId", "username avatar_url");

    if (!video) return ResponseHelper.notFound(res, "Video not found");

    return ResponseHelper.success(res, "Video retrieved successfully", video);
  } catch (error) {
    next(error);
  }
};

// ─── Stream Video (increment views + return URL) ──────────────────────────────
const streamVideo = async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const video = await Video.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!video) return ResponseHelper.notFound(res, "Video not found");

    return ResponseHelper.success(res, "Video stream URL retrieved", {
      videoUrl: video.videoUrl,
      title: video.title,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update Video ─────────────────────────────────────────────────────────────
// Only these fields may ever be changed by a PATCH request. Everything else
// (views, likesCount, dislikesCount, commentsCount, channel, cloudinaryPublicId,
// videoUrl, aiSummary, aiTags, aiProcessed, userId...) is server-managed and must
// never be settable directly from client input -- an allowlist here, not a
// denylist, is what actually closes that off.
const UPDATABLE_VIDEO_FIELDS = ["title", "description", "category", "tags", "language", "isPublic"];

const updateVideo = async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const updates = {};

    for (const field of UPDATABLE_VIDEO_FIELDS) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    // Sanitise tags
    if (updates.tags) {
      if (typeof updates.tags === "string") {
        updates.tags = updates.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
      } else if (Array.isArray(updates.tags)) {
        updates.tags = updates.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
      }
    }

    const video = await Video.findOneAndUpdate(
      { _id: id, userId: req.user.userId },
      updates,
      { new: true, runValidators: true }
    ).populate("channel", "title avatar");

    if (!video) return ResponseHelper.notFound(res, "Video not found or access denied");

    await invalidateFeedCache();

    return ResponseHelper.success(res, "Video updated successfully", video);
  } catch (error) {
    next(error);
  }
};

// ─── Delete Video ─────────────────────────────────────────────────────────────
const deleteVideo = async (req, res, next) => {
  try {
    const id = String(req.params.id);

    const video = await Video.findOneAndDelete({ _id: id, userId: req.user.userId });

    if (!video) return ResponseHelper.notFound(res, "Video not found or access denied");

    // Remove from channel and delete from Cloudinary (non-blocking cleanup)
    await Channel.findByIdAndUpdate(video.channel, { $pull: { videos: id } });

    if (video.cloudinaryPublicId) {
      deleteAsset(video.cloudinaryPublicId, "video").catch((err) =>
        console.error(`[Cloudinary] Delete failed for ${video.cloudinaryPublicId}:`, err.message)
      );
    }

    await invalidateFeedCache();

    return ResponseHelper.success(res, "Video deleted successfully");
  } catch (error) {
    next(error);
  }
};

// ─── Search Videos ────────────────────────────────────────────────────────────
const videoSearching = async (req, res, next) => {
  try {
    const { q, date, category, sortBy } = req.query;

    if (!q) return ResponseHelper.error(res, "Search query is required", 400);

    const searchFilter = { $text: { $search: q }, isPublic: true };
    if (category) searchFilter.category = category;

    let videos = await Video.find(searchFilter)
      .populate("channel", "title avatar subscribersCount")
      .populate("userId", "username")
      .lean();

    // Date filtering
    switch (date) {
      case "today":     videos = videos.filter((v) => v.createdAt > dateConstants.UploadedToday()); break;
      case "this week": videos = videos.filter((v) => v.createdAt >= dateConstants.ThisWeek()); break;
      case "this month":videos = videos.filter((v) => v.createdAt >= dateConstants.ThisMonth()); break;
      case "this year": videos = videos.filter((v) => v.createdAt >= dateConstants.ThisYear()); break;
    }

    // Sorting
    switch (sortBy) {
      case "views": videos.sort((a, b) => b.views - a.views); break;
      case "date":  videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
      case "rating":videos.sort((a, b) => (b.likesCount - b.dislikesCount) - (a.likesCount - a.dislikesCount)); break;
    }

    return ResponseHelper.success(res, "Search results retrieved", videos);
  } catch (error) {
    next(error);
  }
};

// ─── Trending Videos ──────────────────────────────────────────────────────────
const getTrendingVideos = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip  = (page - 1) * limit;

    const [videos, total] = await Promise.all([
      Video.find({ isPublic: true })
        .populate("channel", "title avatar subscribersCount")
        .populate("userId", "username")
        .sort({ views: -1, likesCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Video.countDocuments({ isPublic: true }),
    ]);

    return ResponseHelper.paginated(res, videos, {
      page, limit, total, pages: Math.ceil(total / limit),
    }, "Trending videos retrieved");
  } catch (error) {
    next(error);
  }
};

// ─── Videos By Category ───────────────────────────────────────────────────────
const getVideosByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const page  = parseInt(req.query.page)  || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip  = (page - 1) * limit;

    const filter = { category, isPublic: true };

    const [videos, total] = await Promise.all([
      Video.find(filter)
        .populate("channel", "title avatar subscribersCount")
        .populate("userId", "username")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Video.countDocuments(filter),
    ]);

    return ResponseHelper.paginated(res, videos, {
      page, limit, total, pages: Math.ceil(total / limit),
    }, `${category} videos retrieved`);
  } catch (error) {
    next(error);
  }
};

// ─── User Videos ──────────────────────────────────────────────────────────────
const getUserVideos = async (req, res, next) => {
  try {
    const { id } = req.params;
    const videos = await Video.find({ userId: id })
      .populate("channel", "title avatar")
      .sort({ createdAt: -1 });

    return ResponseHelper.success(res, "User videos retrieved", videos);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadVideo,
  retrieveAllVideos,
  retrieveVideoById,
  streamVideo,
  updateVideo,
  deleteVideo,
  videoSearching,
  getTrendingVideos,
  getVideosByCategory,
  getUserVideos,
};
