const Router = require("express").Router;
const likeController = require("../controllers/like.controller");
const authenticate = require("../middlewares/authenticate");
const validate = require("../middlewares/validation.middleware");
const { toggleLikeValidation, getLikeStatusValidation } = require("../validators/like.validator");

const likeRouter = Router();

likeRouter.use(authenticate);

likeRouter
    .post("/toggle", validate(toggleLikeValidation), likeController.toggleLike)
    .get("/:targetType/:targetId", validate(getLikeStatusValidation), likeController.getLikeStatus);

module.exports = likeRouter;
