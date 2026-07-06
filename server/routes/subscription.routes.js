const Router = require("express").Router;
const subscriptionController = require("../controllers/subscription.controller");
const authenticate = require("../middlewares/authenticate");
const validate = require("../middlewares/validation.middleware");
const { subscriptionValidation } = require("../validators/subscription.validator");

const subscriptionRouter = Router();

subscriptionRouter.use(authenticate);

subscriptionRouter
    .get("/my-subscriptions", subscriptionController.getUserSubscriptions)
    .get("/feed", subscriptionController.getSubscriptionFeed)
    .post("/:channelId/toggle", validate(subscriptionValidation), subscriptionController.toggleSubscription)
    .get("/:channelId/status", validate(subscriptionValidation), subscriptionController.getSubscriptionStatus)
    .get("/:channelId/subscribers", validate(subscriptionValidation), subscriptionController.getChannelSubscribers);

module.exports = subscriptionRouter;
