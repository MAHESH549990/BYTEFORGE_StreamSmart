import mongoose from "mongoose";
import { isIP } from "node:net";

import Video from "../models/Video.js";

import {
  getCachedResource,
  setCachedResource,
  getEdgeCacheStats,
  clearEdgeCache,
  recordOriginBytes,
} from "../services/edgeCache.js";

const EDGE_CACHE_CONTROL = "no-store";
const MAX_RESOURCE_SIZE = 64 * 1024 * 1024;

const isPrivateHost = (hostname) => {
  const host = hostname.toLowerCase();

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return true;
  }

  const ipVersion = isIP(host);

  if (ipVersion === 4) {
    const parts = host.split(".").map(Number);

    return (
      parts[0] === 0 ||
      parts[0] === 10 ||
      parts[0] === 127 ||
      (parts[0] === 169 && parts[1] === 254) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168)
    );
  }

  if (ipVersion === 6) {
    return (
      host === "::1" ||
      host === "::" ||
      host.startsWith("fc") ||
      host.startsWith("fd") ||
      host.startsWith("fe80:")
    );
  }

  return false;
};

// Validate video origin URL.
const parsePublicUrl = (value) => {
  let url;

  try {
    url = new URL(value);
  } catch {
    throw new Error("Invalid video URL");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS video URLs are supported");
  }

  if (
    url.username ||
    url.password ||
    isPrivateHost(url.hostname)
  ) {
    throw new Error("Video URL is not allowed");
  }

  return url;
};

// Allow the original host and explicitly configured CDN hosts.
const isAllowedResourceUrl = (resourceUrl, rootUrl) => {
  const allowedHosts = new Set([
    rootUrl.hostname.toLowerCase(),

    ...(process.env.EDGE_ALLOWED_HOSTS || "")
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
  ]);

  return (
    ["http:", "https:"].includes(resourceUrl.protocol) &&
    !resourceUrl.username &&
    !resourceUrl.password &&
    !isPrivateHost(resourceUrl.hostname) &&
    allowedHosts.has(resourceUrl.hostname.toLowerCase())
  );
};

// Load a video and verify its owner.
const getAccessibleVideo = async (req) => {
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    const error = new Error("Invalid video ID");
    error.status = 400;
    throw error;
  }

  const video = await Video.findById(videoId);

  if (!video) {
    const error = new Error("Video not found");
    error.status = 404;
    throw error;
  }

  // Videos with owner=null are shared platform videos.
  if (
    video.owner &&
    String(video.owner) !== String(req.user?._id)
  ) {
    const error = new Error("You cannot access this video");
    error.status = 404;
    throw error;
  }

  if (
    video.format !== "hls" &&
    !video.videoUrl.toLowerCase().split("?")[0].endsWith(".m3u8")
  ) {
    const error = new Error(
      "Edge caching currently supports HLS videos only"
    );

    error.status = 400;
    throw error;
  }

  const rootUrl = parsePublicUrl(video.videoUrl);

  return { video, rootUrl };
};

// Fetch an origin resource without allowing unsafe redirects.
const fetchOriginResource = async (
  initialUrl,
  rootUrl,
  rangeHeader = null
) => {
  let currentUrl = new URL(initialUrl);

  const headers = {};

  if (rangeHeader) {
    headers.Range = rangeHeader;
  }

  for (let attempt = 0; attempt < 4; attempt++) {
    if (!isAllowedResourceUrl(currentUrl, rootUrl)) {
      throw new Error("HLS resource host is not allowed");
    }

    const response = await fetch(currentUrl, {
      method: "GET",
      headers,
      redirect: "manual",
      signal: AbortSignal.timeout(20000),
    });

    // Follow only validated redirects.
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");

      if (!location) {
        throw new Error("Origin returned an invalid redirect");
      }

      currentUrl = new URL(location, currentUrl);
      continue;
    }

    return {
      response,
      finalUrl: currentUrl,
    };
  }

  throw new Error("Too many origin redirects");
};

// Build a URL that sends the resource request through this edge server.
const buildEdgeResourceUrl = (videoId, absoluteUrl) => {
  return (
    `/api/edge/${videoId}/resource?url=` +
    encodeURIComponent(absoluteUrl)
  );
};

// Rewrite HLS manifest URLs.
const rewriteManifest = (manifest, manifestUrl, videoId) => {
  const lines = manifest.split(/\r?\n/);

  const rewrittenLines = lines.map((line) => {
    const trimmed = line.trim();

    if (!trimmed) return line;

    // Rewrite URI attributes such as encryption keys and init maps.
    if (trimmed.startsWith("#")) {
      return line.replace(
        /URI="([^"]+)"/g,
        (match, uri) => {
          if (/^(data:|skd:)/i.test(uri)) {
            return match;
          }

          const absoluteUrl = new URL(uri, manifestUrl).href;

          return `URI="${buildEdgeResourceUrl(
            videoId,
            absoluteUrl
          )}"`;
        }
      );
    }

    // Rewrite segment and nested playlist URLs.
    const absoluteUrl = new URL(trimmed, manifestUrl).href;

    return buildEdgeResourceUrl(videoId, absoluteUrl);
  });

  return Buffer.from(
    rewrittenLines.join("\n"),
    "utf8"
  );
};

// Send a response with edge cache information.
const sendEdgeResponse = (res, entry, cacheStatus) => {
  res.set({
    "Content-Type": entry.contentType || "application/octet-stream",
    "Cache-Control": EDGE_CACHE_CONTROL,
    "X-Edge-Server": "StreamSmart-Edge",
    "X-Edge-Cache": cacheStatus,
    "X-Edge-Cache-Status": cacheStatus,
  });

  res.status(entry.status || 200);

  for (const [name, value] of Object.entries(entry.responseHeaders || {})) {
    res.setHeader(name, value);
  }

  res.send(entry.body);
};

// Main function for fetching an HLS resource.
const serveEdgeResource = async ({
  req,
  res,
  video,
  rootUrl,
  resourceUrl,
}) => {
  const targetUrl = new URL(resourceUrl);

  if (!isAllowedResourceUrl(targetUrl, rootUrl)) {
    return res.status(403).json({
      success: false,
      message: "This video resource host is not allowed",
    });
  }

  const cacheKey = `${video._id}:${targetUrl.href}`;

  const rangeHeader = req.headers.range;

  // Byte-range resources are forwarded but not cached in this version.
  if (!rangeHeader) {
    const cached = getCachedResource(cacheKey);

    if (cached) {
      return sendEdgeResponse(res, cached, "HIT");
    }
  }

  const { response, finalUrl } = await fetchOriginResource(
    targetUrl.href,
    rootUrl,
    rangeHeader
  );

  if (!response.ok && response.status !== 206) {
    return res.status(response.status).json({
      success: false,
      message: `Origin server returned ${response.status}`,
    });
  }

  const contentLength = Number(
    response.headers.get("content-length") || 0
  );

  if (contentLength > MAX_RESOURCE_SIZE) {
    return res.status(413).json({
      success: false,
      message: "Video resource exceeds the allowed size",
    });
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.length > MAX_RESOURCE_SIZE) {
    return res.status(413).json({
      success: false,
      message: "Video resource exceeds the allowed size",
    });
  }

  recordOriginBytes(buffer.length);

  const contentType =
    response.headers.get("content-type") ||
    "application/octet-stream";

  const isPlaylist =
    contentType.toLowerCase().includes("mpegurl") ||
    /\.m3u8(?:$|\?)/i.test(finalUrl.href) ||
    buffer.toString("utf8", 0, Math.min(buffer.length, 7))
      .startsWith("#EXTM3U");

  let responseBody = buffer;

  let responseHeaders = {};

  const status = response.status;

  if (isPlaylist && response.status === 200) {
    responseBody = rewriteManifest(
      buffer.toString("utf8"),
      finalUrl.href,
      video._id
    );

    // Live playlists should expire quickly.
    // VOD playlists can remain cached longer.
    const isLive =
      !buffer.toString("utf8").includes("#EXT-X-ENDLIST");

    const ttl = isLive ? 2000 : 60000;

    setCachedResource(
      cacheKey,
      responseBody,
      "application/vnd.apple.mpegurl",
      ttl
    );
  } else if (response.status === 200 && !rangeHeader) {
    responseHeaders = {
      ...(response.headers.get("accept-ranges")
        ? {
            "Accept-Ranges": response.headers.get("accept-ranges"),
          }
        : {}),
    };

    // Cache successful video segments and other resources.
    setCachedResource(
      cacheKey,
      responseBody,
      contentType,
      300000,
      status,
      responseHeaders
    );
  }

  if (status === 206) {
    responseHeaders = {
      "Content-Range":
        response.headers.get("content-range") || "",
      "Accept-Ranges":
        response.headers.get("accept-ranges") || "bytes",
    };
  }

  return sendEdgeResponse(
    res,
    {
      body: responseBody,
      contentType: isPlaylist
        ? "application/vnd.apple.mpegurl"
        : contentType,
      status,
      responseHeaders,
    },
    rangeHeader ? "BYPASS" : "MISS"
  );
};

// GET /api/edge/:videoId/manifest
export const getEdgeManifest = async (req, res) => {
  try {
    const { video, rootUrl } = await getAccessibleVideo(req);

    await serveEdgeResource({
      req,
      res,
      video,
      rootUrl,
      resourceUrl: rootUrl.href,
    });
  } catch (error) {
    console.error("Edge manifest error:", error.message);

    res.status(error.status || 502).json({
      success: false,
      message: error.message || "Unable to load edge manifest",
    });
  }
};

// GET /api/edge/:videoId/resource?url=...
export const getEdgeResource = async (req, res) => {
  try {
    const { video, rootUrl } = await getAccessibleVideo(req);

    const resourceUrl = req.query.url;

    if (
      typeof resourceUrl !== "string" ||
      resourceUrl.length > 4096
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid resource URL is required",
      });
    }

    await serveEdgeResource({
      req,
      res,
      video,
      rootUrl,
      resourceUrl,
    });
  } catch (error) {
    console.error("Edge resource error:", error.message);

    res.status(error.status || 502).json({
      success: false,
      message: error.message || "Unable to load edge resource",
    });
  }
};

// GET /api/edge/stats
export const getEdgeStats = (req, res) => {
  res.status(200).json({
    success: true,
    edge: getEdgeCacheStats(),
  });
};

// DELETE /api/edge/cache
export const deleteEdgeCache = (req, res) => {
  clearEdgeCache();

  res.status(200).json({
    success: true,
    message: "Edge cache cleared successfully",
  });
};