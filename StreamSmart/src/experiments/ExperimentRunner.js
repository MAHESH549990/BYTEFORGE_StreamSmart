
export default class ExperimentRunner {
  constructor() {
    this.results = {
      baseline: null,
      optimized: null,
    };

    this.isRunning = false;
    this.status = "idle";
  }

  // Validate experiment configuration
  validateConfig(config) {
    if (!config) {
      throw new Error("Experiment configuration is required");
    }

    if (!config.video) {
      throw new Error("Please select a video");
    }

    if (!config.network) {
      throw new Error("Please select a network profile");
    }

    if (
      config.fixedQuality === undefined ||
      config.fixedQuality === null
    ) {
      throw new Error("Please select a fixed quality");
    }
  }

  // Execute both tests under the same configuration
  async startExperiment(config, playerControls) {
    if (this.isRunning) {
      throw new Error("Experiment is already running");
    }

    if (
      !playerControls ||
      typeof playerControls.runPlayback !== "function" ||
      typeof playerControls.resetTest !== "function"
    ) {
      throw new Error("Player controls are not properly configured");
    }

    this.validateConfig(config);

    this.isRunning = true;
    this.status = "running";

    this.results = {
      baseline: null,
      optimized: null,
    };

    try {
      // Test 1: Fixed quality playback
      this.status = "baseline_running";

      console.log("Starting Baseline Test");

      const baselineResult = await this.runBaseline(
        config,
        playerControls
      );

      if (!baselineResult) {
        throw new Error("Baseline test did not return results");
      }

      this.results.baseline = baselineResult;

      // Reset player and telemetry before the next test
      await playerControls.resetTest();

      // Test 2: Adaptive quality playback
      this.status = "optimized_running";

      console.log("Starting Optimized Test");

      const optimizedResult = await this.runOptimized(
        config,
        playerControls
      );

      if (!optimizedResult) {
        throw new Error("Optimized test did not return results");
      }

      this.results.optimized = optimizedResult;

      // Generate final comparison
      this.status = "completed";

      return this.compareResults();

    } catch (error) {
      this.status = "failed";

      console.error("Experiment failed:", error);

      throw error;

    } finally {
      this.isRunning = false;
    }
  }

  // Run fixed-quality playback
  async runBaseline(config, playerControls) {
    return await playerControls.runPlayback({
      mode: "baseline",
      video: config.video,
      network: config.network,
      fixedQuality: config.fixedQuality,
      durationSeconds: config.durationSeconds,
    });
  }

  // Run adaptive playback
  async runOptimized(config, playerControls) {
    return await playerControls.runPlayback({
      mode: "optimized",
      video: config.video,
      network: config.network,
      durationSeconds: config.durationSeconds,
    });
  }

  // Calculate comparison metrics
  compareResults() {
    const baseline = this.results.baseline;
    const optimized = this.results.optimized;

    if (!baseline || !optimized) {
      throw new Error("Both test results are required for comparison");
    }

    const percentageImprovement = (oldValue, newValue) => {
      if (
        !Number.isFinite(oldValue) ||
        !Number.isFinite(newValue) ||
        oldValue === 0
      ) {
        return null;
      }

      return Number(
        (((oldValue - newValue) / oldValue) * 100).toFixed(2)
      );
    };

    return {
      baseline,
      optimized,

      comparison: {
        startupTimeImprovement: percentageImprovement(
          baseline.ttffSeconds,
          optimized.ttffSeconds
        ),

        rebufferReduction: percentageImprovement(
          baseline.rebufferCount,
          optimized.rebufferCount
        ),

        rebufferDurationReduction: percentageImprovement(
          baseline.totalRebufferDuration,
          optimized.totalRebufferDuration
        ),

        averageBitrateDifference:
          Number.isFinite(baseline.averageBitrate) &&
          Number.isFinite(optimized.averageBitrate)
            ? Number(
                (
                  optimized.averageBitrate -
                  baseline.averageBitrate
                ).toFixed(2)
              )
            : null,

        qualitySwitchDifference:
          Number.isFinite(baseline.qualitySwitches) &&
          Number.isFinite(optimized.qualitySwitches)
            ? optimized.qualitySwitches -
              baseline.qualitySwitches
            : null,
      },
    };
  }

  // Reset experiment results
  resetExperiment() {
    if (this.isRunning) {
      throw new Error("Cannot reset while an experiment is running");
    }

    this.results = {
      baseline: null,
      optimized: null,
    };

    this.status = "idle";
  }

  // Get current experiment status
  getStatus() {
    return this.status;
  }
}
