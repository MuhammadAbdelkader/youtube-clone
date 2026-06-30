const express = require("express");
const multer = require("multer");
const vc = require("../controllers/video.controller");
const validate = require("../middlewares/validation.middleware");
const videoValidation = require("../validators/video.validator");
const authenticate = require("../middlewares/authenticate");

const videoRouter = express.Router();

// ─── Multer: memoryStorage for streaming directly to Cloudinary ───────────────
// Files are held in req.file.buffer — no temp files on disk.
const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("video/")) {
      return cb(new Error("Only video files are allowed"), false);
    }
    cb(null, true);
  },
});

// ─── Routes ───────────────────────────────────────────────────────────────────

videoRouter
  // Public routes (no authentication required)
  .get("/",                 validate(videoValidation.retrieveAllVideosValidation), vc.retrieveAllVideos)
  .get("/search",           validate(videoValidation.searchVideoValidation),       vc.videoSearching)
  .get("/trending",                                                                vc.getTrendingVideos)
  .get("/category/:category", validate(videoValidation.categoryValidation),        vc.getVideosByCategory)
  .get("/stream/:id",       validate(videoValidation.idValidation),                vc.streamVideo)
  .get("/:id",              validate(videoValidation.idValidation),                vc.retrieveVideoById)

  // Protected routes (authentication required)
  .use(authenticate)
  .post("/upload",
    videoUpload.single("video"),                      // multer parses the multipart file
    validate(videoValidation.validateVideo),
    vc.uploadVideo
  )
  .get("/user/:id",         validate(videoValidation.idValidation),                vc.getUserVideos)
  .patch("/:id",            validate(videoValidation.updateVideoValidation),       vc.updateVideo)
  .delete("/:id",           validate(videoValidation.idValidation),                vc.deleteVideo);

module.exports = videoRouter;
