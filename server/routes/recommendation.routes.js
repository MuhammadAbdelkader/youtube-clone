const Router = require("express").Router;
const recommendationController = require("../controllers/recommendation.controller");
const authenticate = require("../middlewares/authenticate");

const recommendationRouter = Router();

// Optional authentication for recommendations
recommendationRouter.use((req, res, next) => {
    const token = req.headers.token;
    if (token) {
        return authenticate(req, res, next);
    }
    next();
});

recommendationRouter
    .get("/", recommendationController.getRecommendedVideos);

module.exports = recommendationRouter;
