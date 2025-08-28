const express = require("express");
const channelController = require("../controllers/channel.controller");
const fileUpload = require("express-fileupload");
const authenticate = require("../middlewares/authenticate");
const { checkUserChannels, canModifyChannel } = require("../middlewares/channel-restriction");
const validate = require("../middlewares/validation.middleware");
const { body, param, query } = require('express-validator');

const channelRouter = express.Router();

// Validation rules
const createChannelValidation = [
    body('title')
        .notEmpty()
        .withMessage('Channel title is required')
        .isLength({ max: 50 })
        .withMessage('Title too long (max 50 characters)')
        .escape(),
    body('description')
        .notEmpty()
        .withMessage('Channel description is required')
        .isLength({ max: 1000 })
        .withMessage('Description too long (max 1000 characters)')
        .escape()
];

const updateChannelValidation = [
    param('id')
        .notEmpty()
        .withMessage('Channel ID is required')
        .isMongoId()
        .withMessage('Invalid channel ID'),
    body('title')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Title too long (max 50 characters)')
        .escape(),
    body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Description too long (max 1000 characters)')
        .escape()
];

const channelIdValidation = [
    param('id')
        .notEmpty()
        .withMessage('Channel ID is required')
        .isMongoId()
        .withMessage('Invalid channel ID')
];

const searchChannelValidation = [
    query('q')
        .notEmpty()
        .withMessage('Search query is required')
        .escape()
];

// Public routes
channelRouter
    .get("/search", validate(searchChannelValidation), channelController.searchChannels)
    .get("/:id", validate(channelIdValidation), channelController.getChannelById);

// Protected routes
channelRouter.use(authenticate);

channelRouter
    .get("/my-channel", channelController.getUserChannel)
    .post("/", fileUpload(), validate(createChannelValidation), checkUserChannels, channelController.createChannel)
    .patch("/:id", fileUpload(), validate(updateChannelValidation), canModifyChannel, channelController.updateChannel)
    .delete("/:id", validate(channelIdValidation), canModifyChannel, channelController.deleteChannel);

module.exports = channelRouter;