import express from "express";

import {
  getEdgeManifest,
  getEdgeResource,
  getEdgeStats,
  deleteEdgeCache,
} from "../controllers/edgeController.js";

import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Edge cache analytics.
router.get("/stats", requireAuth, getEdgeStats);

// Clear the edge cache.
router.delete("/cache", requireAuth, deleteEdgeCache);

// Retrieve a video's HLS manifest through the edge.
router.get("/:videoId/manifest", requireAuth, getEdgeManifest);

// Retrieve segments, nested playlists and other HLS resources.
router.get("/:videoId/resource", requireAuth, getEdgeResource);

export default router;