const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const fileUpload = require("express-fileupload");

// Import Routes
const authRoutes = require("./routes/auth.routes");
const videoRouter = require("./routes/video.routes");
const channelRouter = require("./routes/channel.routes");
const likeRoutes = require("./routes/like.routes");
const subscriptionRoutes = require("./routes/subscription.routes");
const commentRoutes = require("./routes/comment.routes");
const watchHistoryRoutes = require("./routes/watchHistory.routes");
const recommendationRoutes = require("./routes/recommendation.routes");

// Import Middlewares
const errorHandler = require("./middlewares/error.middleware");

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ['Content-Type', 'Authorization', 'token'],
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// File upload middleware
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
  abortOnLimit: true,
  responseOnLimit: "File size limit has been reached",
}));

// Logging middleware
app.use(morgan("dev"));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Specific rate limit for upload endpoints
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 uploads per hour
  message: 'Too many uploads from this IP, please try again later.',
  skip: (req, res) => {
    return !req.path.includes('/upload');
  }
});

// Apply upload rate limit to video routes
app.use('/videos', uploadLimiter);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'YouTube Clone API is running!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use("/", authRoutes);
app.use("/videos", videoRouter);
app.use("/channels", channelRouter);
app.use("/likes", likeRoutes);
app.use("/subscriptions", subscriptionRoutes);
app.use("/comments", commentRoutes);
app.use("/watch-history", watchHistoryRoutes);
app.use("/recommendations", recommendationRoutes);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;