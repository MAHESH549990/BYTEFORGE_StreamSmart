
export class Telemetry {
  constructor() {
    this.reset();
  }

  // Reset all metrics for a new playback test
  reset() {
    this.sessionId = crypto.randomUUID();

    this.startedAt = null;
    this.firstFrameAt = null;
    this.completedAt = null;

    this.rebufferCount = 0;
    this.totalRebufferDuration = 0;
    this.waitingStartedAt = null;

    this.events = [];

    this.currentBitrate = 0;
    this.estimatedThroughput = 0;
    this.resolution = "--";
    this.bufferLength = 0;

    this.qualitySwitches = 0;
    this.bitrateSamples = [];
  }

  // Start a new telemetry session
  start() {
    this.reset();

    this.startedAt = performance.now();

    this.record("session_started", {
      sessionId: this.sessionId,
    });
  }

  // Store playback events
  record(type, data = {}) {
    this.events.push({
      type,
      timestamp: new Date().toISOString(),

      elapsedMs:
        this.startedAt !== null
          ? Math.round(performance.now() - this.startedAt)
          : 0,

      ...data,
    });
  }

  // Record the first displayed video frame
  markFirstFrame() {
    if (
      this.firstFrameAt !== null ||
      this.startedAt === null
    ) {
      return;
    }

    this.firstFrameAt = performance.now();

    this.record("first_frame", {
      ttffMs: Math.round(
        this.firstFrameAt - this.startedAt
      ),
    });

    // If startup waiting is still active, close it.
    // Startup waiting is not counted as rebuffering.
    if (this.waitingStartedAt !== null) {
      this.waitingStartedAt = null;
      this.record("startup_waiting_ended");
    }
  }

  // Start buffering
  startBuffering() {
    if (
      this.waitingStartedAt !== null ||
      this.completedAt !== null
    ) {
      return;
    }

    this.waitingStartedAt = performance.now();

    // Only count buffering after the first frame
    if (this.firstFrameAt !== null) {
      this.rebufferCount++;

      this.record("rebuffer_started", {
        rebufferCount: this.rebufferCount,
      });
    } else {
      this.record("startup_waiting");
    }
  }

  // Stop buffering and calculate its duration
  stopBuffering() {
    if (this.waitingStartedAt === null) {
      return;
    }

    const duration =
      (performance.now() - this.waitingStartedAt) / 1000;

    const isRebuffering = this.firstFrameAt !== null;

    if (isRebuffering) {
      this.totalRebufferDuration += duration;

      this.record("rebuffer_ended", {
        durationSeconds: Number(duration.toFixed(3)),
      });
    } else {
      this.record("startup_waiting_ended", {
        durationSeconds: Number(duration.toFixed(3)),
      });
    }

    this.waitingStartedAt = null;
  }

  // Calculate current video buffer length
  updateBuffer(video) {
    if (!video || !video.buffered.length) {
      this.bufferLength = 0;
      return;
    }

    const time = video.currentTime;
    let buffer = 0;

    for (
      let i = 0;
      i < video.buffered.length;
      i++
    ) {
      if (
        video.buffered.start(i) <= time &&
        video.buffered.end(i) >= time
      ) {
        buffer = video.buffered.end(i) - time;
        break;
      }
    }

    this.bufferLength = Math.max(0, buffer);
  }

  // Update bitrate, throughput and resolution
  updateStreamMetrics({
    bitrate,
    throughput,
    resolution,
  }) {
    if (
      Number.isFinite(bitrate) &&
      bitrate > 0
    ) {
      this.currentBitrate = bitrate;
      this.bitrateSamples.push(bitrate);
    }

    if (
      Number.isFinite(throughput) &&
      throughput >= 0
    ) {
      this.estimatedThroughput = throughput;
    }

    if (resolution) {
      this.resolution = resolution;
    }
  }

  // Record a quality switch
  recordQualitySwitch(data) {
    this.qualitySwitches++;

    this.record("quality_switch", {
      ...data,
      switchNumber: this.qualitySwitches,
    });
  }

  // Finish the playback test
  finish() {
    if (this.completedAt !== null) {
      return this.getSummary();
    }

    // Close any active buffering period
    this.stopBuffering();

    this.completedAt = performance.now();

    this.record("session_completed");

    return this.getSummary();
  }

  // Return the final experiment metrics
  getSummary() {
    const averageBitrate =
      this.bitrateSamples.length > 0
        ? this.bitrateSamples.reduce(
            (sum, value) => sum + value,
            0
          ) / this.bitrateSamples.length
        : null;

    return {
      sessionId: this.sessionId,

      ttffSeconds:
        this.firstFrameAt !== null &&
        this.startedAt !== null
          ? Number(
              (
                (this.firstFrameAt - this.startedAt) /
                1000
              ).toFixed(3)
            )
          : null,

      rebufferCount: this.rebufferCount,

      totalRebufferDuration: Number(
        this.totalRebufferDuration.toFixed(3)
      ),

      bufferLength: Number(
        this.bufferLength.toFixed(2)
      ),

      currentBitrate: this.currentBitrate,

      averageBitrate:
        averageBitrate !== null
          ? Number(averageBitrate.toFixed(2))
          : null,

      estimatedThroughput: this.estimatedThroughput,

      resolution: this.resolution,

      qualitySwitches: this.qualitySwitches,

      testDurationSeconds:
        this.startedAt !== null &&
        this.completedAt !== null
          ? Number(
              (
                (this.completedAt - this.startedAt) /
                1000
              ).toFixed(3)
            )
          : null,

      events: [...this.events],
    };
  }
}
