const { Schema, model } = require("mongoose");

const videoSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: false },
    views: { type: Number, default: 0 },
    duration: { type: Number, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
})

const Video = model("Video", videoSchema);
module.exports = Video;