
import mongoose from "mongoose";
import Experiment from "../models/Experiment.js";

export const createExperiment = async (req, res) => {
  try {
    const {
      video,
      mode,
      networkProfile,
      fixedQuality,
      durationSeconds,
      metrics,
      status,
    } = req.body;

    if (!video || !mongoose.Types.ObjectId.isValid(video)) {
      return res.status(400).json({
        success: false,
        message: "Valid video ID is required",
      });
    }

    if (!["baseline", "optimized"].includes(mode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid experiment mode",
      });
    }

    if (!["Excellent", "Good", "Moderate", "Poor"].includes(networkProfile)) {
      return res.status(400).json({
        success: false,
        message: "Invalid network profile",
      });
    }

    if (!metrics || typeof metrics !== "object") {
      return res.status(400).json({
        success: false,
        message: "Experiment metrics are required",
      });
    }

    const experiment = await Experiment.create({
      video,
      mode,
      networkProfile,
      fixedQuality,
      durationSeconds,
      metrics,
      status: status || "completed",
    });

    res.status(201).json({
      success: true,
      message: "Experiment saved successfully",
      experiment,
    });
  } catch (error) {
    console.error("Create experiment error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to save experiment",
    });
  }
};

// Get all experiment results
export const getExperiments = async (req, res) => {
  try {
    const experiments = await Experiment.find()
      .populate("video", "title videoUrl format")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: experiments.length,
      experiments,
    });
  } catch (error) {
    console.error("Get experiments error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch experiments",
    });
  }
};

// Get one experiment by ID
export const getExperimentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid experiment ID",
      });
    }

    const experiment = await Experiment.findById(id)
      .populate("video", "title videoUrl format");

    if (!experiment) {
      return res.status(404).json({
        success: false,
        message: "Experiment not found",
      });
    }

    res.status(200).json({
      success: true,
      experiment,
    });
  } catch (error) {
    console.error("Get experiment error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch experiment",
    });
  }
};

