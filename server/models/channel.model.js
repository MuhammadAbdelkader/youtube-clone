const mongoose = require("mongoose");
const channelSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        required: false,
        default: "https://www.example.com/default-avatar.png"
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true // user only got one channel
    },
    videos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    }]
}, { timestamps: true });
channelSchema.pre("save", function (next) {
    this.populate("owner", "username email avatar_url")
    this.title = this.title.trim();
    this.description = this.description.trim();
    next();
})
channelSchema.pre("findOne", function (next) {
    this.populate("videos");
    next();
});

// Optional: also auto-populate on find (many channels)
channelSchema.pre("find", function (next) {
    this.populate("videos");
    next();
})
module.exports = mongoose.model("Channel", channelSchema);