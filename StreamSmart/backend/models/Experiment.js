
import mongoose from "mongoose";

const experimentSchema = new mongoose.Schema(
  {
    // Video associated with this experiment
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
    },

    // Experiment type
    mode: {
      type: String,
      enum: ["baseline", "optimized"],
      required: true,
    },

    // Selected network profile
    networkProfile: {
      type: String,
      enum: ["Excellent", "Good", "Moderate", "Poor"],
      required: true,
    },

    // Fixed quality used in baseline testing
    fixedQuality: {
      type: Number,
      default: null,
    },

    // Configured experiment duration
    durationSeconds: {
      type: Number,
      default: 0,
    },

    // Playback telemetry data
    metrics: {
      sessionId: {
        type: String,
        default: null,
      },

      ttffSeconds: {
        type: Number,
        default: null,
      },

      rebufferCount: {
        type: Number,
        default: 0,
      },

      totalRebufferDuration: {
        type: Number,
        default: 0,
      },

      bufferLength: {
        type: Number,
        default: 0,
      },

      currentBitrate: {
        type: Number,
        default: 0,
      },

      averageBitrate: {
        type: Number,
        default: null,
      },

      estimatedThroughput: {
        type: Number,
        default: 0,
      },

      resolution: {
        type: String,
        default: "--",
      },

      qualitySwitches: {
        type: Number,
        default: 0,
      },

      testDurationSeconds: {
        type: Number,
        default: 0,
      },

      // Preserve all playback events
      events: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
    },

    // Experiment completion status
    status: {
      type: String,
      enum: ["completed", "failed"],
      default: "completed",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation errors
const Experiment =
  mongoose.models.Experiment ||
  mongoose.model("Experiment", experimentSchema);

export default Experiment;
