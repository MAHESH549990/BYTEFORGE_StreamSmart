import express from "express";
import {
  getVideos,
  getVideoById, // Add this
  uploadVideo,
  addExternalVideo
} from "../controllers/videoController.js";


const router = express.Router();

router.get("/", getVideos);

router.post("/external", addExternalVideo);

router.get("/:id", getVideoById);

export default router;