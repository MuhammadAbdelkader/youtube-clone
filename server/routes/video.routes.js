const express = require("express");
const vc = require("../controllers/video.controller");
const fileUpload = require("express-fileupload");
const validate = require("../middlewares/validation.middleware");
const videoValidation = require("../validators/video.validator");
const authenticate = require("../middlewares/authenticate");

const videoRouter = express.Router();

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

