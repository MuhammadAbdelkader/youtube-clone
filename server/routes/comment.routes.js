const Router = require("express").Router;
const commentController = require("../controllers/comment.controller");
const authenticate = require("../middlewares/authenticate");
const validate = require("../middlewares/validation.middleware");
const {
    addCommentValidation,
    updateCommentValidation,
    commentIdValidation,
    videoIdValidation
} = require("../validators/comment.validator");

const commentRouter = Router();

// Public routes
commentRouter
    .get("/video/:videoId", validate(videoIdValidation), commentController.getVideoComments)
    .get("/:commentId/replies", validate(commentIdValidation), commentController.getCommentReplies);

// Protected routes
commentRouter
    .use(authenticate)
    .post("/", validate(addCommentValidation), commentController.addComment)
    .patch("/:commentId", validate(updateCommentValidation), commentController.updateComment)
    .delete("/:commentId", validate(commentIdValidation), commentController.deleteComment);

module.exports = commentRouter;
