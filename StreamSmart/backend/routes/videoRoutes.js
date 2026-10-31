
import express from "express";

import {
  getVideos,
  getVideoById,
  uploadVideo,
  addExternalVideo
} from "../controllers/videoController.js";

import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Only authenticated users can access videos.
router.get("/", requireAuth, getVideos);

router.post("/external", requireAuth, addExternalVideo);

router.get("/:id", requireAuth, getVideoById);

export default router;
