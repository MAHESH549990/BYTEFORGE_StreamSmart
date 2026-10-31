import Video from "../models/Video.js";

// Get all videos
export const getVideos = async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      videos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch videos"
    });
  }
};


// Upload a video from computer
export const uploadVideo = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !req.file) {
      return res.status(400).json({
        success: false,
        message: "Title and video file are required"
      });
    }

    const video = await Video.create({
      title,
      description,
      videoUrl: `/uploads/${req.file.filename}`,
      sourceType: "upload",
      format: req.file.mimetype.split("/")[1]
    });

    res.status(201).json({
      success: true,
      message: "Video uploaded successfully",
      video
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// Add an external video URL
export const addExternalVideo = async (req, res) => {
  try {
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

    const isHls = parsedUrl.pathname.toLowerCase().endsWith(".m3u8");
    const isMp4 = parsedUrl.pathname.toLowerCase().endsWith(".mp4");

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
      format: isHls ? "hls" : "mp4"
    });

    res.status(201).json({
      success: true,
      message: "External video added successfully",
      video
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getVideoById = async (req, res) => {
  try {
    const { id } = req.params;

    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found"
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