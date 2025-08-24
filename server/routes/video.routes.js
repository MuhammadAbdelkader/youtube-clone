const Router = require("express").Router;
const vc = require("../controllers/video.controller");
const fileUpload = require("express-fileupload");
const validate = require("../middlewares/validation.middleware");
const videoValidation = require("../validators/video.validator");
let videoRouter = Router();
videoRouter
    .post("/upload", fileUpload(), validate(videoValidation.validateVideo), vc.uploadVideo)

    .get("/", validate(videoValidation.retrieveAllVideosValidation), vc.retrieveAllVideos)

    .get("/search", validate(videoValidation.searchVideoValidation), vc.videoSearching)

    .get("/:id", validate(videoValidation.idValidation), vc.retrieveVideoById)

    .get("/:id/stream", vc.streamVideo)

    .get("/user/:id", validate(videoValidation.idValidation), vc.getUserVideos)

    .route("/:id")

    .patch(validate(videoValidation.updateVideoValidation), vc.updateVideo)

    .delete(validate(videoValidation.idValidation), vc.deleteVideo)

module.exports = videoRouter;
