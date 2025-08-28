const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
    subscriber: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Channel",
        required: true
    },
    notificationEnabled: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true 
});

// Prevent duplicate subscriptions
subscriptionSchema.index({ subscriber: 1, channel: 1 }, { unique: true });

module.exports = mongoose.model("Subscription", subscriptionSchema);
