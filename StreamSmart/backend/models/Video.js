import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: ""
    },

    videoUrl: {
      type: String,
      required: true
    },

    thumbnail: {
      type: String,
      default: ""
    },

    sourceType: {
      type: String,
      enum: ["platform", "upload", "external"],
      required: true
    },

    format: {
      type: String,
      enum: ["mp4", "hls", "webm", "ogg"],
      default: "mp4"
    },

    duration: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const Video = mongoose.model("Video", videoSchema);

export default Video;