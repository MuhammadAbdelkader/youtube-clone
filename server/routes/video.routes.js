const Router = require("express").Router;
const vc = require("../controllers/video.controller");
const fileUpload = require("express-fileupload");
const validate = require("../middlewares/validation.middleware");
const videoValidation = require("../validators/video.validator");
const authenticate = require("../middlewares/authenticate");

const videoRouter = Router();

videoRouter
    // Public routes (no authentication required)
    .get("/", validate(videoValidation.retrieveAllVideosValidation), vc.retrieveAllVideos)
    .get("/search", validate(videoValidation.searchVideoValidation), vc.videoSearching)
    .get("/trending", vc.getTrendingVideos)
    .get("/category/:category", validate(videoValidation.categoryValidation), vc.getVideosByCategory)
    .get("/:id", validate(videoValidation.idValidation), vc.retrieveVideoById)
    .get("/stream/:id", validate(videoValidation.idValidation), vc.streamVideo)
    
    // Protected routes (authentication required)
    .use(authenticate)
    .post("/upload", fileUpload(), validate(videoValidation.validateVideo), vc.uploadVideo)
    .get("/user/:id", validate(videoValidation.idValidation), vc.getUserVideos)
    .patch("/:id", validate(videoValidation.updateVideoValidation), vc.updateVideo)
    .delete("/:id", validate(videoValidation.idValidation), vc.deleteVideo);

module.exports = videoRouter;

// ===========================================
// 📄 routes/channel.routes.js (ENHANCED)
// ===========================================

const Router = require("express").Router;
const channelController = require("../controllers/channel.controller");
const fileUpload = require("express-fileupload");
const authenticate = require("../middlewares/authenticate");
const validate = require("../middlewares/validation.middleware");
const { body, param, query } = require('express-validator');

const channelRouter = Router();

// Validation rules
const createChannelValidation = [
    body('title')
        .notEmpty()
        .withMessage('Channel title is required')
        .isLength({ max: 50 })
        .withMessage('Title too long (max 50 characters)')
        .escape(),
    body('description')
        .notEmpty()
        .withMessage('Channel description is required')
        .isLength({ max: 1000 })
        .withMessage('Description too long (max 1000 characters)')
        .escape(),
    body('category')
        .optional()
        .isIn(['Education', 'Entertainment', 'Music', 'Gaming', 'Sports', 'Technology', 'News', 'Comedy', 'Other'])
        .withMessage('Invalid category')
];

const updateChannelValidation = [
    param('id')
        .notEmpty()
        .withMessage('Channel ID is required')
        .isMongoId()
        .withMessage('Invalid channel ID'),
    body('title')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Title too long (max 50 characters)')
        .escape(),
    body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Description too long (max 1000 characters)')
        .escape(),
    body('category')
        .optional()
        .isIn(['Education', 'Entertainment', 'Music', 'Gaming', 'Sports', 'Technology', 'News', 'Comedy', 'Other'])
        .withMessage('Invalid category')
];

const channelIdValidation = [
    param('id')
        .notEmpty()
        .withMessage('Channel ID is required')
        .isMongoId()
        .withMessage('Invalid channel ID')
];

const searchChannelValidation = [
    query('q')
        .notEmpty()
        .withMessage('Search query is required')
        .escape()
];

// Public routes
channelRouter
    .get("/search", validate(searchChannelValidation), channelController.searchChannels)
    .get("/:id", validate(channelIdValidation), channelController.getChannelById);

// Protected routes
channelRouter
    .use(authenticate)
    .get("/my-channel", channelController.getUserChannel)
    .post("/", fileUpload(), validate(createChannelValidation), channelController.createChannel)
    .patch("/:id", fileUpload(), validate(updateChannelValidation), channelController.updateChannel)
    .delete("/:id", validate(channelIdValidation), channelController.deleteChannel);

module.exports = channelRouter;
