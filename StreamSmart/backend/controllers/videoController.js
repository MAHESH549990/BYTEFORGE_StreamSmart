
import Video from "../models/Video.js";

// Get authenticated user's ID.
function getUserId(req) {
  return req.user?._id;
}

// Get videos belonging to the logged-in user.
// Shared platform videos remain available to everyone.
export const getVideos = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to access videos."
      });
    }

    const videos = await Video.find({
      $or: [
        { owner: userId },
        { owner: null, sourceType: "platform" }
      ]
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      videos
    });

  } catch (error) {
    console.error("Get videos error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch videos"
    });
  }
};


// Upload a video from computer.
export const uploadVideo = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in before uploading a video."
      });
    }

    const { title, description } = req.body;

    if (!title || !req.file) {
      return res.status(400).json({
        success: false,
        message: "Title and video file are required"
      });
    }

    const mimeType = req.file.mimetype;

    const formatMap = {
      "video/mp4": "mp4",
      "video/webm": "webm",
      "video/ogg": "ogg",
      "application/vnd.apple.mpegurl": "hls",
      "application/x-mpegURL": "hls"
    };

    const format = formatMap[mimeType];

    if (!format) {
      return res.status(400).json({
        success: false,
        message: "Unsupported video format."
      });
    }

    const video = await Video.create({
      title,
      description,
      videoUrl: `/uploads/${req.file.filename}`,
      sourceType: "upload",
      format,
      owner: userId
    });

    return res.status(201).json({
      success: true,
      message: "Video uploaded successfully",
      video
    });

  } catch (error) {
    console.error("Upload video error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// Add an external video URL.
export const addExternalVideo = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in before adding a video."
      });
    }

    const { title, description, videoUrl } = req.body;

    if (!title || !videoUrl) {
      return res.status(400).json({
        success: false,
        message: "Title and video URL are required"
      });
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(videoUrl);
    } catch {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid URL"
      });
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return res.status(400).json({
        success: false,
        message: "Only HTTP and HTTPS URLs are allowed"
      });
    }

    const isHls = parsedUrl.pathname
      .toLowerCase()
      .endsWith(".m3u8");

    const isMp4 = parsedUrl.pathname
      .toLowerCase()
      .endsWith(".mp4");

    if (!isHls && !isMp4) {
      return res.status(400).json({
        success: false,
        message: "Use a direct MP4 or HLS (.m3u8) video URL"
      });
    }

    const video = await Video.create({
      title,
      description,
      videoUrl,
      sourceType: "external",
      format: isHls ? "hls" : "mp4",
      owner: userId
    });

    return res.status(201).json({
      success: true,
      message: "External video added successfully",
      video
    });

  } catch (error) {
    console.error("Add external video error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// Get a single video belonging to the logged-in user
// or a shared platform video.
export const getVideoById = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to access this video."
      });
    }

    const { id } = req.params;

    const video = await Video.findOne({
      _id: id,
      $or: [
        { owner: userId },
        { owner: null, sourceType: "platform" }
      ]
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found or you do not have access."
      });
    }

    return res.status(200).json({
      success: true,
      video
    });

  } catch (error) {
    console.error("Get video error:", error);

    return res.status(400).json({
      success: false,
      message: "Invalid video ID"
    });
  }
};
