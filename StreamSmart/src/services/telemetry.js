
export class Telemetry {
  constructor() {
    this.reset();
  }

  reset() {
    this.sessionId = crypto.randomUUID();
    this.startedAt = null;
    this.firstFrameAt = null;

    this.rebufferCount = 0;
    this.totalRebufferDuration = 0;
    this.waitingStartedAt = null;

    this.events = [];
    this.currentBitrate = 0;
    this.estimatedThroughput = 0;
    this.resolution = "--";
    this.bufferLength = 0;
    this.qualitySwitches = 0;
  }

  start() {
    this.reset();
    this.startedAt = performance.now();

    this.record("session_started", {
      sessionId: this.sessionId,
    });
  }

  record(type, data = {}) {
    this.events.push({
      type,
      timestamp: new Date().toISOString(),
      elapsedMs: this.startedAt
        ? Math.round(performance.now() - this.startedAt)
        : 0,
      ...data,
    });
  }

  markFirstFrame() {
    if (this.firstFrameAt !== null || this.startedAt === null) {
      return;
    }

    this.firstFrameAt = performance.now();

    this.record("first_frame", {
      ttffMs: Math.round(this.firstFrameAt - this.startedAt),
    });
  }

  startBuffering() {
    if (this.waitingStartedAt !== null) return;

    this.waitingStartedAt = performance.now();
    this.rebufferCount += 1;

    this.record("rebuffer_started", {
      rebufferCount: this.rebufferCount,
    });
  }

  stopBuffering() {
    if (this.waitingStartedAt === null) return;

    const duration =
      (performance.now() - this.waitingStartedAt) / 1000;

    this.totalRebufferDuration += duration;
    this.waitingStartedAt = null;

    this.record("rebuffer_ended", {
      durationSeconds: Number(duration.toFixed(3)),
    });
  }

  updateBuffer(video) {
    if (!video || !video.buffered.length) {
      this.bufferLength = 0;
      return;
    }

    const time = video.currentTime;
    let buffer = 0;

    for (let i = 0; i < video.buffered.length; i++) {
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

  updateStreamMetrics({ bitrate, throughput, resolution }) {
    if (Number.isFinite(bitrate)) {
      this.currentBitrate = bitrate;
    }

    if (Number.isFinite(throughput)) {
      this.estimatedThroughput = throughput;
    }

    if (resolution) {
      this.resolution = resolution;
    }
  }

  recordQualitySwitch(data) {
    this.qualitySwitches += 1;

    this.record("quality_switch", {
      ...data,
      switchNumber: this.qualitySwitches,
    });
  }

  getSummary() {
    return {
      sessionId: this.sessionId,
      ttffSeconds: this.firstFrameAt !== null && this.startedAt !== null
        ? Number(((this.firstFrameAt - this.startedAt) / 1000).toFixed(3))
        : null,

      rebufferCount: this.rebufferCount,
      totalRebufferDuration: Number(
        this.totalRebufferDuration.toFixed(3)
      ),

      bufferLength: Number(this.bufferLength.toFixed(2)),
      currentBitrate: this.currentBitrate,
      estimatedThroughput: this.estimatedThroughput,
      resolution: this.resolution,
      qualitySwitches: this.qualitySwitches,

      events: [...this.events],
    };
  }
}
