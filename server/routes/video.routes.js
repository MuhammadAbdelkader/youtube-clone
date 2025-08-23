const Router = require("express").Router;
const vc = require("../controllers/video.controller");
const fileUpload = require("express-fileupload");
const validate = require("../middlewares/validation.middleware");
const validateVideo = require("../validators/video.validator");
let videoRouter = Router();
videoRouter
    .post("/upload", fileUpload(), validate(validateVideo), vc.uploadVideo)
    .get("/", vc.retrieveAllVideos)
    .get("/:id", vc.retrieveVideoById)
    .get("/:id/stream", vc.streamVideo)

module.exports = videoRouter;
