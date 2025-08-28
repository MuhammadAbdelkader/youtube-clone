const express = require("express");
const likeController = require("../controllers/like.controller");
const authenticate = require("../middlewares/authenticate");
const validate = require("../middlewares/validation.middleware");
const { toggleLikeValidation, getLikeStatusValidation } = require("../validators/like.validator");

const likeRouter = express.Router();

likeRouter.use(authenticate);

likeRouter
    .post("/toggle", validate(toggleLikeValidation), likeController.toggleLike)
    .get("/:targetType/:targetId", validate(getLikeStatusValidation), likeController.getLikeStatus);

module.exports = likeRouter;
