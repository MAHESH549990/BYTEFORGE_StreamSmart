import Hls from "hls.js";

import { getNetworkSimulation } from "./networkSimulation";

export class SimulatedNetworkLoader extends Hls.DefaultConfig.loader {
  constructor(config) {
    super(config);

    this.simulationTimer = null;
    this.cancelled = false;
    this.requestId = 0;
  }

  load(context, config, callbacks) {
    this.cancelled = false;

    const requestId = ++this.requestId;

    const settings = getNetworkSimulation();

    // No simulation? Use normal HLS.js loading.
    if (!settings.enabled) {
      super.load(context, config, callbacks);
      return;
    }

    const startRequest = () => {
      if (
        this.cancelled ||
        requestId !== this.requestId
      ) {
        return;
      }

      this.simulationTimer = null;

      // Simulate occasional packet loss.
      const shouldDropPacket =
        Math.random() * 100 < settings.packetLoss;

      if (shouldDropPacket) {
        console.warn("Simulated packet loss:", context.url);

        callbacks.onError?.(
          {
            code: 0,
            text: "Simulated packet loss",
          },
          context,
          null
        );

        return;
      }

      // Load the actual HLS resource using the default loader.
      super.load(context, config, {
        ...callbacks,

        onSuccess: (
          response,
          stats,
          responseContext,
          networkDetails
        ) => {
          const data = response?.data;

          let fallbackBytes = 0;

          if (data instanceof ArrayBuffer) {
            fallbackBytes = data.byteLength;
          } else if (ArrayBuffer.isView(data)) {
            fallbackBytes = data.byteLength;
          } else if (typeof data === "string") {
            fallbackBytes = new Blob([data]).size;
          }

          const loadedBytes =
            Number(stats?.loaded) || fallbackBytes;

          const loadingStart = stats?.loading?.start;
          const loadingEnd = stats?.loading?.end;

          const actualDuration =
            Number.isFinite(loadingStart) &&
            Number.isFinite(loadingEnd)
              ? Math.max(0, loadingEnd - loadingStart)
              : 0;

          // Calculate how long this resource should take
          // under the selected simulated bandwidth.
          const targetDuration =
            loadedBytes > 0 && settings.bandwidth > 0
              ? (loadedBytes * 8) /
                (settings.bandwidth * 1000000) *
                1000
              : 0;

          // Wait only for the additional time required
          // to represent the selected bandwidth.
          const additionalDelay = Math.max(
            0,
            targetDuration - actualDuration
          );

          const completeRequest = () => {
            this.simulationTimer = null;

            if (
              this.cancelled ||
              requestId !== this.requestId
            ) {
              return;
            }

            // Update the loader timing so HLS.js and
            // StreamSmart can measure simulated throughput.
            if (stats?.loading) {
              stats.loading.end = performance.now();
            }

            callbacks.onSuccess(
              response,
              stats,
              responseContext,
              networkDetails
            );
          };

          if (additionalDelay <= 0) {
            completeRequest();
          } else {
            this.simulationTimer = setTimeout(
              completeRequest,
              additionalDelay
            );
          }
        },
      });
    };

    // Simulate network response latency before making
    // the actual request.
    this.simulationTimer = setTimeout(
      startRequest,
      settings.latency
    );
  }

  abort() {
    this.cancelled = true;
    this.requestId++;

    if (this.simulationTimer !== null) {
      clearTimeout(this.simulationTimer);
      this.simulationTimer = null;
    }

    super.abort();
  }

  destroy() {
    this.cancelled = true;
    this.requestId++;

    if (this.simulationTimer !== null) {
      clearTimeout(this.simulationTimer);
      this.simulationTimer = null;
    }

    super.destroy();
  }
}