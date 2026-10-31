import express from "express";
import {
  getVideos,
  getVideoById, // Add this
  uploadVideo,
  addExternalVideo
} from "../controllers/videoController.js";

import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/", getVideos);

router.post("/upload", upload.single("video"), uploadVideo);

router.post("/external", addExternalVideo);

router.get("/:id", getVideoById);

export default router;