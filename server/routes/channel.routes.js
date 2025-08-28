const Router = require("express").Router
const authenticate = require("../middlewares/authenticate")
const channelControllers = require("../controllers/channel.controller");
const fileUpload = require("express-fileupload");
const channelAuth = require("../middlewares/channel-restriction");
let channelRouter = Router();
channelRouter
    .use(authenticate)
    .get("/myChannel", channelControllers.getUserChannel)
    .get("/", channelControllers.getAllChannels)
    .post("/", fileUpload(), channelAuth.checkUserChannels, channelControllers.createChannel)
    .route("/:id")
    .patch(fileUpload(), channelAuth.canModifyChannel, channelControllers.updateChannel)
    .delete(channelAuth.canModifyChannel, channelControllers.deleteChannel)



module.exports = channelRouter;
