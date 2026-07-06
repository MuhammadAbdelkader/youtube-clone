const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

// ─── Route Imports ─────────────────────────────────────────────────────────
const authRoutes         = require("./routes/auth.routes");
const videoRouter        = require("./routes/video.routes");
const channelRouter      = require("./routes/channel.routes");
const likeRoutes         = require("./routes/like.routes");
const subscriptionRoutes = require("./routes/subscription.routes");
const commentRoutes      = require("./routes/comment.routes");
const watchHistoryRoutes = require("./routes/watchHistory.routes");
const recommendationRoutes = require("./routes/recommendation.routes");
const notificationRoutes = require("./routes/notification.routes");

// ─── Middleware Imports ────────────────────────────────────────────────────
const errorHandler = require("./middlewares/error.middleware");
const { getRedisClient } = require("./config/redis");

const app = express();

// ─── Security Headers ──────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow Cloudinary media
  })
);

// ─── CORS ─────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:4200",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],  // Standard Bearer auth only
    credentials: true,
  })
);

// ─── Body Parsers ─────────────────────────────────────────────────────────
// Note: multipart/form-data (video uploads) is handled per-route by Multer.
// Do NOT add global fileUpload middleware here.
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ─── Logging ──────────────────────────────────────────────────────────────
app.use(morgan("dev"));

// ─── Rate Limiting ─────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { status: "error", message: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Stricter limit on auth endpoints
  message: { status: "error", message: "Too many authentication attempts. Please wait 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15,
  message: { status: "error", message: "Upload limit reached. Please wait an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);
app.use("/api/auth", authLimiter);
app.use("/api/videos/upload", uploadLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────
app.get("/health", async (req, res) => {
  const checks = { status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() };

  try {
    const redis = getRedisClient();
    await redis.ping();
    checks.redis = "connected";
  } catch {
    checks.redis = "unavailable";
  }

  res.status(200).json(checks);
});

// ─── API Routes (all prefixed with /api) ──────────────────────────────────
app.use("/api/auth",          authRoutes);
app.use("/api/videos",        videoRouter);
app.use("/api/channels",      channelRouter);
app.use("/api/likes",         likeRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/comments",      commentRoutes);
app.use("/api/watch-history", watchHistoryRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/notifications", notificationRoutes);

// ─── 404 Handler — catches all unmatched routes ───────────────────────────
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.originalUrl} not found`,
  });
});

// ─── Global Error Handler (must be last) ──────────────────────────────────
app.use(errorHandler);

module.exports = app;