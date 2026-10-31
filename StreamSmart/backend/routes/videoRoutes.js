import express from "express";

import {
  getVideos,
  getVideoById,
  uploadVideo,
  addExternalVideo
} from "../controllers/videoController.js";

import { requireAuth } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Get authenticated user's videos.
router.get("/", requireAuth, getVideos);

// Upload a video from the computer.
router.post(
  "/upload",
  requireAuth,
  upload.single("video"),
  uploadVideo
);

// Add an external MP4 or HLS URL.
router.post("/external", requireAuth, addExternalVideo);

// Get one video.
router.get("/:id", requireAuth, getVideoById);

export default router;