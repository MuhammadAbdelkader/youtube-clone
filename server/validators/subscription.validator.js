const { param } = require('express-validator');

const subscriptionValidation = [
    param('channelId')
        .notEmpty()
        .withMessage('Channel ID is required')
        .isMongoId()
        .withMessage('Invalid channel ID')
];

module.exports = {
    subscriptionValidation
};
