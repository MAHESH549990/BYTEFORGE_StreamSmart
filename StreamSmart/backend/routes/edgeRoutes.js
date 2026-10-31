import express from "express";

import {
  getEdgeManifest,
  getEdgeResource,
  getEdgeStats,
  deleteEdgeCache
} from "../controllers/edgeController.js";

import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/stats", requireAuth, getEdgeStats);
router.delete("/cache", requireAuth, deleteEdgeCache);

router.get("/:videoId/manifest", requireAuth, getEdgeManifest);
router.get("/:videoId/resource", requireAuth, getEdgeResource);

export default router;