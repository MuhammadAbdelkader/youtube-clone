const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
    subscriber: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'Subscriber is required']
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Channel",
        required: [true, 'Channel is required']
    },
    notificationEnabled: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true,
    versionKey: false
});

// Prevent duplicate subscriptions
subscriptionSchema.index({ subscriber: 1, channel: 1 }, { unique: true });

const Subscription = mongoose.model("Subscription", subscriptionSchema);
module.exports = Subscription;
