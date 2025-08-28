const Router = require("express").Router;
const watchHistoryController = require("../controllers/watchHistory.controller");
const authenticate = require("../middlewares/authenticate");
const validate = require("../middlewares/validation.middleware");
const {
    addWatchHistoryValidation,
    videoIdParamValidation
} = require("../validators/watchHistory.validator");

const watchHistoryRouter = Router();

watchHistoryRouter.use(authenticate);

watchHistoryRouter
    .post("/", validate(addWatchHistoryValidation), watchHistoryController.addToWatchHistory)
    .get("/", watchHistoryController.getUserWatchHistory)
    .delete("/clear", watchHistoryController.clearWatchHistory)
    .delete("/:videoId", validate(videoIdParamValidation), watchHistoryController.removeFromWatchHistory);

module.exports = watchHistoryRouter;
