import express from "express";
import { PassThrough, Readable, Transform } from "node:stream";
import { randomUUID } from "node:crypto";
import { pipeline } from "node:stream/promises";

import {
  networkPresets,
  getNetworkConfig,
  updateNetworkConfig,
  applyNetworkPreset,
  applyNetworkSimulation,
  getNetworkSimulationSnapshot,
  simulateNetworkDelay,
  simulatePacketLoss,
} from "./networkSimulator.js";
import { edgeCaches } from "./edgeCache.js";
import {
  getServer,
  recordServerRequest,
} from "./edgeServers.js";
import { selectServer } from "./edgeRouter.js";
import edgeRoutes from "./edgeRoutes.js";
import {
  createExperiment,
  deleteExperiment,
  getExperiment,
  listExperiments,
} from "./experimentStore.js";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

const ALLOWED_HOSTS = new Set([
  "test-streams.mux.dev",
  "devstreaming-cdn.apple.com",
  "bitdash-a.akamaihd.net",
  "demo.unified-streaming.com",
]);

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Range"
  );
  res.setHeader(
    "Access-Control-Expose-Headers",
    "Content-Length, Content-Range, Accept-Ranges"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use("/api/edge", edgeRoutes);

// Validate upstream URLs to prevent unrestricted proxy access.
function validateUpstreamUrl(value) {
  if (typeof value !== "string" || !value) {
    throw new Error("Missing upstream media URL.");
  }

  const url = new URL(value);

  const testFixtureAllowed =
    process.env.STREAMSMART_TEST_MODE === "1" &&
    (url.hostname === "127.0.0.1" || url.hostname === "localhost") &&
    url.protocol === "http:";

  if (
    (!testFixtureAllowed && url.protocol !== "https:") ||
    (!testFixtureAllowed && !ALLOWED_HOSTS.has(url.hostname)) ||
    url.username ||
    url.password
  ) {
    throw new Error("This upstream media URL is not allowed.");
  }

  return url;
}

function validatePlaylistReferences(playlist, playlistUrl) {
  const references = [];

  for (const line of playlist.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("#")) {
      for (const match of trimmed.matchAll(/URI="([^"]+)"/g)) {
        references.push(match[1]);
      }
    } else {
      references.push(trimmed);
    }
  }

  for (const reference of references) {
    const absoluteUrl = new URL(reference, playlistUrl).href;
    validateUpstreamUrl(absoluteUrl);
  }
}

// Convert upstream media URLs into local proxy URLs.
function proxyUrl(upstreamUrl, serverId) {
  const route = serverId ? "/api/edge/proxy" : "/api/proxy";
  const server = serverId ? `&serverId=${encodeURIComponent(serverId)}` : "";
  return `${route}?url=${encodeURIComponent(upstreamUrl)}${server}`;
}

// Rewrite HLS playlists so every segment and child playlist
// is requested through our Express proxy.
function rewritePlaylist(playlist, playlistUrl, serverId) {
  return playlist
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();

      if (!trimmed) return line;

      // Handle URI attributes in EXT-X-KEY, EXT-X-MAP, etc.
      if (trimmed.startsWith("#")) {
        return line.replace(
          /URI="([^"]+)"/g,
          (_, uri) => {
            const absoluteUrl = new URL(
              uri,
              playlistUrl
            ).href;
          validateUpstreamUrl(absoluteUrl);

          return `URI="${proxyUrl(absoluteUrl, serverId)}"`;
          }
        );
      }

      // Handle media segments and nested playlists.
      const absoluteUrl = new URL(
        trimmed,
        playlistUrl
      ).href;
      validateUpstreamUrl(absoluteUrl);

      return proxyUrl(absoluteUrl, serverId);
    })
    .join("\n");
}

async function validateHlsSource(value) {
  const upstreamUrl = validateUpstreamUrl(value);
  const response = await fetch(upstreamUrl, {
    headers: {
      "Accept": "application/vnd.apple.mpegurl, application/x-mpegURL",
    },
    signal: AbortSignal.timeout(10000),
    redirect: "error",
  });

  if (!response.ok) {
    throw new Error(`The source returned HTTP ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") || "";
  const body = await response.text();
  const looksLikePlaylist =
    upstreamUrl.pathname.toLowerCase().endsWith(".m3u8") ||
    contentType.toLowerCase().includes("mpegurl") ||
    body.trimStart().startsWith("#EXTM3U");

  if (!looksLikePlaylist || !body.trimStart().startsWith("#EXTM3U")) {
    throw new Error("The approved URL did not return a valid HLS playlist.");
  }
  validatePlaylistReferences(body, upstreamUrl.href);

  return {
    url: upstreamUrl.href,
    hostname: upstreamUrl.hostname,
    contentType: contentType || "application/vnd.apple.mpegurl",
    isMasterPlaylist: body.includes("#EXT-X-STREAM-INF"),
  };
}

// HEALTH CHECK
app.get("/api/health", (req, res) => {
  res.json({
    status: "running",
    service: "StreamSmart Network Simulator",
    nodeVersion: process.version,
  });

});

app.post("/api/sources/validate", async (req, res) => {
  try {
    const source = await validateHlsSource(req.body?.url);
    res.json({ valid: true, source });
  } catch (error) {
    const status = error.name === "TimeoutError" ? 504 : 400;
    res.status(status).json({
      valid: false,
      error: error.message.includes("not allowed")
        ? `${error.message} Add the hostname to the server allowlist before using it.`
        : error.message,
    });
  }
});

// NETWORK PRESETS
app.get("/api/network/presets", (req, res) => {
  res.json({
    presets: networkPresets,
    custom: {
      bandwidthMbps: "0.1ΓÇô100",
      latencyMs: "0ΓÇô2000",
      jitterMs: "0ΓÇô1000",
      packetLoss: "0ΓÇô20%",
    },
  });
});

// GET NETWORK CONFIGURATION
app.get("/api/network/config", (req, res) => {
  res.json(getNetworkConfig());
});

// UPDATE NETWORK CONFIGURATION
app.post("/api/network/config", (req, res) => {
  try {
    const { preset, ...config } = req.body;

    let updated;

    if (preset && preset !== "Custom") {
      updated = applyNetworkPreset(preset);

      if (typeof config.enabled === "boolean") {
        updated = updateNetworkConfig({
          enabled: config.enabled,
        });
      }
    } else {
      updated = updateNetworkConfig({
        ...config,
        preset: "Custom",
      });
    }

    res.json({
      success: true,
      message: "Network configuration updated.",
      config: updated,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// NETWORK SIMULATION TEST
app.get("/api/network/test", async (req, res) => {
  const config = getNetworkSimulationSnapshot();

  try {
    const startedAt = performance.now();

    // Packet loss is tested here, not on HLS media requests.
    if (simulatePacketLoss(config)) {
      return res.status(503).json({
        success: false,
        message: "Simulated request failure.",
        config,
      });
    }

    await simulateNetworkDelay(config);

    res.json({
      success: true,
      message: "Network simulation test completed.",
      simulatedDelayMs: Number(
        (performance.now() - startedAt).toFixed(2)
      ),
      config,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/experiments", async (req, res) => {
  try {
    res.json({ experiments: await listExperiments() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/experiments/:id", async (req, res) => {
  try {
    const experiment = await getExperiment(req.params.id);
    if (!experiment) return res.status(404).json({ error: "Experiment not found." });
    res.json({ experiment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/experiments", async (req, res) => {
  try {
    const input = req.body;
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return res.status(400).json({ error: "Experiment payload must be an object." });
    }
    if (!input.selectedServer || !input.userRegion || !input.deliveryMode) {
      return res.status(400).json({
        error: "selectedServer, userRegion and deliveryMode are required.",
      });
    }
    res.status(201).json({ experiment: await createExperiment(input) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/experiments/:id", async (req, res) => {
  try {
    const deleted = await deleteExperiment(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Experiment not found." });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/edge/cache", (req, res) => {
  const serverId = req.query.serverId;
  const caches = serverId
    ? [[serverId, edgeCaches.get(serverId)]]
    : [...edgeCaches.entries()];

  if (serverId && !edgeCaches.has(serverId)) {
    return res.status(404).json({ error: "Unknown edge server." });
  }

  res.json({
    generatedAt: new Date().toISOString(),
    caches: Object.fromEntries(
      caches.map(([id, cache]) => [id, cache.stats()])
    ),
  });
});

app.post("/api/edge/cache/clear", (req, res) => {
  const { serverId } = req.body || {};
  const caches = serverId
    ? [edgeCaches.get(serverId)]
    : [...edgeCaches.values()];
  if (serverId && !edgeCaches.has(serverId)) {
    return res.status(404).json({ error: "Unknown edge server." });
  }
  caches.forEach((cache) => cache.clear());
  res.json({ success: true, message: "Edge cache cleared." });
});

// Cached regional HLS route. Playlist rewrites retain the selected server.
app.get(["/api/edge/proxy", "/api/edge/stream"], async (req, res) => {
  let upstreamUrl;
  let activeCache;
  let activeCacheKey;
  let reservation = null;
  const startedAt = performance.now();
  const requestId = randomUUID();
  const simulationConfig = getNetworkSimulationSnapshot();

  try {
    upstreamUrl = validateUpstreamUrl(req.query.url);
    const requestedServerId = req.query.serverId;
    const region = req.query.region || "India";
    const mode = req.query.mode || "automatic";
    if (mode === "origin") {
      throw new Error("Direct origin delivery must use /api/proxy.");
    }
    const requestedServer = requestedServerId
      ? getServer(requestedServerId)
      : null;
    const failover = Boolean(requestedServerId && !requestedServer?.available);
    const decision = selectServer({
      mode,
      region,
      contentUrl: upstreamUrl.href,
      serverId: failover ? undefined : requestedServerId,
      cacheLookup: (id, url) => Boolean(edgeCaches.get(id)?.has(url)),
    });
    const server = decision.server;
    const cache = edgeCaches.get(server.id);
    if (!cache) throw new Error("Cache is not configured for this server.");
    activeCache = cache;

    let upstreamDurationMs = 0;
    const upstreamStartedAt = performance.now();
    const rangeHeader = req.headers.range;
    const cacheKey = rangeHeader
      ? `${upstreamUrl.href}${upstreamUrl.search ? "&" : "?"}__streamsmart_range=${encodeURIComponent(rangeHeader)}`
      : upstreamUrl.href;
    activeCacheKey = cacheKey;
    const cached = cache.get(cacheKey);
    let result = cached;
    let source;
    let cacheWriter = null;
    let cacheHit = Boolean(cached);
    let cacheWriteDurationMs = 0;
    if (cached) {
      source = cache.readStream(cached);
    } else {
      reservation = cache.reserve(cacheKey);
      if (!reservation.leader) {
        await reservation.promise;
        result = cache.get(cacheKey);
        if (!result) throw new Error("Concurrent cache fill did not complete.");
        source = cache.readStream(result);
        cacheHit = false;
      } else {
        const upstreamHeaders = { "Accept-Encoding": "identity" };
        if (rangeHeader) upstreamHeaders.Range = rangeHeader;
        const upstreamResponse = await fetch(upstreamUrl, {
          headers: upstreamHeaders,
          signal: AbortSignal.timeout(30000),
          redirect: "error",
        });
        if (!upstreamResponse.ok) {
          throw new Error(`Upstream media request failed (${upstreamResponse.status}).`);
        }

        const contentType = upstreamResponse.headers.get("content-type") || "";
        const isPlaylist =
          upstreamUrl.pathname.toLowerCase().endsWith(".m3u8") ||
          contentType.toLowerCase().includes("mpegurl");
        const status = upstreamResponse.status;
        const headers = {
          contentRange: upstreamResponse.headers.get("content-range"),
          acceptRanges: upstreamResponse.headers.get("accept-ranges"),
        };
        upstreamDurationMs = performance.now() - upstreamStartedAt;

        if (!upstreamResponse.body) throw new Error("Upstream response has no body.");
        if (isPlaylist) {
          const body = await upstreamResponse.text();
          const responseBody = Buffer.from(
            rewritePlaylist(body, upstreamUrl.href, server.id)
          );
          cacheWriter = cache.beginWrite(cacheKey, {
            contentType: "application/vnd.apple.mpegurl",
            status,
            headers,
            isPlaylist: true,
          });
          cacheWriter.addBytes(responseBody.length);
          cacheWriter.stream.end(responseBody);
          cacheWriter.promise.then((entry) => {
            cacheWriteDurationMs = entry.cacheWriteDurationMs;
          }).catch(() => {});
          source = Readable.from(responseBody);
        } else {
          cacheWriter = cache.beginWrite(cacheKey, {
            contentType,
            status,
            headers,
            isPlaylist: false,
          });
          const upstreamSource = Readable.fromWeb(upstreamResponse.body);
          let cacheFailed = false;
          const tee = new Transform({
            transform(chunk, encoding, callback) {
              cacheWriter.addBytes(chunk.length);
              cacheWriter.stream.write(chunk, (error) => {
                if (error) {
                  cacheFailed = true;
                  cacheWriter.abort(error);
                }
                callback(null, chunk);
              });
            },
            flush(callback) {
              if (!cacheWriter || cacheFailed) return callback();
              cacheWriter.stream.end(() => {
                cacheWriter.promise.then(() => callback()).catch(() => callback());
              });
            },
          });
          const downstreamSource = new PassThrough();
          pipeline(upstreamSource, tee, downstreamSource).catch((error) => {
            cacheFailed = true;
            cacheWriter.abort(error);
            downstreamSource.destroy(error);
          });
          source = downstreamSource;
          cacheWriter.promise.then((entry) => {
            cacheWriteDurationMs = entry.cacheWriteDurationMs;
          }).catch(() => {});
        }
        res.once("close", () => {
          if (!res.writableEnded && cacheWriter) {
            cacheWriter.abort(new Error("Client disconnected during cache fill."));
          }
        });
        result = {
          contentType: isPlaylist ? "application/vnd.apple.mpegurl" : contentType,
          status,
          headers,
          isPlaylist,
        };
      }
    }

    const responseTimeMs = Number((performance.now() - startedAt).toFixed(2));
    recordServerRequest(server.id, {
      cacheHit,
      responseTimeMs,
    });
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", result.contentType || "application/octet-stream");
    res.setHeader("X-Edge-Server", server.id);
    res.setHeader("X-Edge-Cache", cacheHit ? "HIT" : "MISS");
    res.setHeader("X-Edge-Failover", String(failover));
    res.setHeader("X-Edge-Response-Time-Ms", String(responseTimeMs));
    res.setHeader("X-Delivery-Mode", mode === "edge" ? "edge" : "automatic");
    res.setHeader("X-Origin-Server", "ru-origin");
    res.setHeader("X-Proxy-Request-Id", requestId);
    res.setHeader("X-Range-Forwarded", String(Boolean(rangeHeader)));
    res.setHeader("X-Simulation-Enabled", String(simulationConfig.enabled));
    res.setHeader("X-Simulation-Bandwidth-Mbps", String(simulationConfig.bandwidthMbps));
    res.setHeader("X-Simulation-Latency-Ms", String(simulationConfig.latencyMs));
    res.setHeader("X-Simulation-Jitter-Ms", String(simulationConfig.jitterMs));
    res.setHeader("X-Upstream-Duration-Ms", String(Number(upstreamDurationMs.toFixed(2))));
    res.setHeader(
      "X-Proxy-Processing-Duration-Ms",
      String(Number((performance.now() - startedAt).toFixed(2)))
    );
    if (result.headers?.contentRange) {
      res.setHeader("Content-Range", result.headers.contentRange);
    }
    if (result.headers?.acceptRanges) {
      res.setHeader("Accept-Ranges", result.headers.acceptRanges);
    }
    res.status(result.status || 200);
    const delivery = await applyNetworkSimulation(source, res, simulationConfig);
    console.log("[EDGE DELIVERY]", {
      requestId,
      mode,
      cacheHit,
      upstreamDurationMs: Number(upstreamDurationMs.toFixed(2)),
      downstreamDurationMs: delivery.downstreamDurationMs,
      bytesDelivered: delivery.bytesDelivered,
      cacheWriteDurationMs,
      configuredBandwidthMbps: simulationConfig.enabled
        ? simulationConfig.bandwidthMbps
        : null,
    });
  } catch (error) {
    if (reservation?.leader && activeCache?.getInFlight?.(activeCacheKey)?.promise === reservation.promise) {
      reservation.reject(error);
      activeCache.inFlight.delete(activeCacheKey);
    }
    console.error("[EDGE PROXY ERROR]", error.message, req.query.url);
    if (res.headersSent) {
      res.destroy(error);
      return;
    }
    res.status(error.name === "TimeoutError" ? 504 : 502).json({
      success: false,
      error: error.message,
    });
  }
});

// HLS PLAYLIST AND MEDIA SEGMENT PROXY
app.get("/api/proxy", async (req, res) => {
  let upstreamUrl;
  const requestId = randomUUID();
  const simulationConfig = getNetworkSimulationSnapshot();

  try {
    upstreamUrl = validateUpstreamUrl(req.query.url);

    const upstreamHeaders = {
      "Accept-Encoding": "identity",
    };

    // Preserve browser byte-range requests.
    if (req.headers.range) {
      upstreamHeaders.Range = req.headers.range;
    }

    const upstreamStartedAt = performance.now();
    const upstreamResponse = await fetch(
      upstreamUrl,
      {
        method: "GET",
        headers: upstreamHeaders,
        signal: AbortSignal.timeout(30000),
        redirect: "error",
      }
    );

    if (!upstreamResponse.ok) {
      console.error(
        "[HLS PROXY ERROR]",
        upstreamResponse.status,
        upstreamUrl.href
      );

      return res.status(502).json({
        success: false,
        error: "Upstream media request failed.",
        upstreamStatus: upstreamResponse.status,
      });
    }

    const contentType =
      upstreamResponse.headers.get("content-type") || "";
    const upstreamDurationMs = Number(
      (performance.now() - upstreamStartedAt).toFixed(2)
    );

    const isPlaylist =
      upstreamUrl.pathname.toLowerCase().endsWith(".m3u8") ||
      contentType.toLowerCase().includes("mpegurl");

    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Delivery-Mode", "origin");
    res.setHeader("X-Origin-Server", "ru-origin");
    res.setHeader("X-Proxy-Request-Id", requestId);
    res.setHeader("X-Simulation-Enabled", String(simulationConfig.enabled));
    res.setHeader("X-Simulation-Bandwidth-Mbps", String(simulationConfig.bandwidthMbps));
    res.setHeader("X-Simulation-Latency-Ms", String(simulationConfig.latencyMs));
    res.setHeader("X-Simulation-Jitter-Ms", String(simulationConfig.jitterMs));
    res.setHeader("X-Upstream-Duration-Ms", String(upstreamDurationMs));
    res.setHeader(
      "X-Proxy-Processing-Duration-Ms",
      String(Number((performance.now() - upstreamStartedAt).toFixed(2)))
    );

    if (isPlaylist) {
      const playlist = await upstreamResponse.text();

      const rewrittenPlaylist = rewritePlaylist(
        playlist,
        upstreamUrl.href
      );

      res.setHeader(
        "Content-Type",
        "application/vnd.apple.mpegurl"
      );
      res.status(200);
      const delivery = await applyNetworkSimulation(
        Readable.from(Buffer.from(rewrittenPlaylist)),
        res,
        simulationConfig
      );
      console.log("[ORIGIN DELIVERY]", {
        requestId,
        upstreamDurationMs,
        downstreamDurationMs: delivery.downstreamDurationMs,
        bytesDelivered: delivery.bytesDelivered,
        configuredBandwidthMbps: simulationConfig.enabled
          ? simulationConfig.bandwidthMbps
          : null,
      });
      return;
    }

    // Preserve partial-content responses.
    if (upstreamResponse.status === 206) {
      res.status(206);
    }

    const contentRange =
      upstreamResponse.headers.get("content-range");

    if (contentRange) {
      res.setHeader("Content-Range", contentRange);
    }

    res.setHeader("Accept-Ranges", "bytes");

    // Forward media content type.
    res.setHeader(
      "Content-Type",
      contentType || "application/octet-stream"
    );

    // Remove content length because throttling changes
    // the time taken to deliver the response.
    res.removeHeader("Content-Length");

    if (!upstreamResponse.body) {
      return res.end();
    }

    const source = Readable.fromWeb(
      upstreamResponse.body
    );

    const delivery = await applyNetworkSimulation(
      source,
      res,
      simulationConfig
    );
    console.log("[ORIGIN DELIVERY]", {
      requestId,
      upstreamDurationMs,
      downstreamDurationMs: delivery.downstreamDurationMs,
      bytesDelivered: delivery.bytesDelivered,
      configuredBandwidthMbps: simulationConfig.enabled
        ? simulationConfig.bandwidthMbps
        : null,
    });
  } catch (error) {
    console.error(
      "[HLS PROXY ERROR]",
      error.message,
      upstreamUrl?.href || req.query.url
    );

    if (res.headersSent) {
      res.destroy(error);
      return;
    }

    if (error.name === "TimeoutError") {
      return res.status(504).json({
        success: false,
        error: "Upstream media request timed out.",
      });
    }

    if (error.message?.includes("not allowed") ||
        error.message?.includes("Missing upstream")) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(502).json({
      success: false,
      error: "Media proxy request failed.",
      details: error.message,
    });
  }
});

// START SERVER
app.listen(PORT, () => {
  console.log("---------------------------------------");
  console.log(" StreamSmart Network Simulator");
  console.log("---------------------------------------");
  console.log(` Server: http://localhost:${PORT}`);
  console.log(` Health: http://localhost:${PORT}/api/health`);
  console.log(` Proxy:  http://localhost:${PORT}/api/proxy`);
  console.log("---------------------------------------");
});
