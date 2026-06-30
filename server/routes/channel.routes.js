const { Router } = require("express");
const multer = require("multer");
const authenticate = require("../middlewares/authenticate");
const channelControllers = require("../controllers/channel.controller");
const channelAuth = require("../middlewares/channel-restriction");

// Multer: memoryStorage for image uploads (avatar, cover)
const imageUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Only image files are allowed"), false);
        }
        cb(null, true);
    },
});

const channelImageFields = imageUpload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
]);

const channelRouter = Router();

channelRouter
    .use(authenticate)
    .get("/myChannel", channelControllers.getUserChannel)
    .get("/search", channelControllers.searchChannels)
    .get("/", channelControllers.getAllChannels)
    .post("/", channelImageFields, channelAuth.checkUserChannels, channelControllers.createChannel)
    .route("/:id")
    .patch(channelImageFields, channelAuth.canModifyChannel, channelControllers.updateChannel)
    .delete(channelAuth.canModifyChannel, channelControllers.deleteChannel);

module.exports = channelRouter;
