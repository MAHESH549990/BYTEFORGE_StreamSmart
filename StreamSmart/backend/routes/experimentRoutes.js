
import express from "express";

import {
  createExperiment,
  getExperiments,
  getExperimentById,
} from "../controllers/experimentController.js";

const router = express.Router();

router.post("/", createExperiment);
router.get("/", getExperiments);
router.get("/:id", getExperimentById);

export default router;
