const Router = require("express").Router;
const recommendationController = require("../controllers/recommendation.controller");
const authenticate = require("../middlewares/authenticate");

const recommendationRouter = Router();

// Optional authentication — attach user context if Bearer token is provided
recommendationRouter.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        return authenticate(req, res, next);
    }
    next();
});

recommendationRouter
    .get("/", recommendationController.getRecommendedVideos);

module.exports = recommendationRouter;
