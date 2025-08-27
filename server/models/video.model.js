const { Schema, model } = require("mongoose");

const videoSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: false, default: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhgBO9es3gnfmoILLgaplnrfQCAqYKl_rGf2TqRead8WjoMnpJ-rS7fFWEBn0oJy_-U1DFeTM-Gle7-Humwy3KDO8EjV0G3a7M6QOkEd2CPXaRbYWR94aRuiYp4sn9gttYvNpwS5X1etudg/s1600/file-MrylO8jADD.png" },
    views: { type: Number, default: 0 },
    duration: { type: Number, required: false },
    channel: { type: Schema.Types.ObjectId, ref: "Channel", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
})
videoSchema.index({ title: "text", description: "text" });
const Video = model("Video", videoSchema);
module.exports = Video;