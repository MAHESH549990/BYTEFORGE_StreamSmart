import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { SimulatedNetworkLoader } from "../utils/SimulatedNetworkLoader";

import { useLocation, useSearchParams } from "react-router-dom";
import Hls from "hls.js";
import { selectQuality } from "./ABREngine";

import {
  Play,
  Pause,
  Volume2,
  Maximize,
  Settings2,
  LoaderCircle,
  RotateCcw,
  RotateCw,
} from "lucide-react";

import { Telemetry } from "./Telemetry";
import "./VideoPlayer.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const DEMO_VIDEO =
  "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

// Format playback time as MM:SS or HH:MM:SS.
const formatPlaybackTime = (time) => {
  if (!Number.isFinite(time) || time < 0) return "00:00";

  const totalSeconds = Math.floor(time);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const VideoPlayer = forwardRef(function VideoPlayer(props, ref) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const telemetryRef = useRef(new Telemetry());

  // Custom ABR references
  const previousLevelRef = useRef(0);
  const upgradeStreakRef = useRef(0);
  const bandwidthRef = useRef(0);
  const manualQualityRef = useRef(null);
  const runCustomABRRef = useRef(null);

  // Experiment references
  const experimentConfigRef = useRef(null);
  const experimentFinishingRef = useRef(false);
  const experimentModeRef = useRef("normal");
  const experimentRunningRef = useRef(false);
  const experimentResolveRef = useRef(null);
  const experimentRejectRef = useRef(null);
  const experimentTimerRef = useRef(null);
  const experimentStartTimeRef = useRef(null);

  const location = useLocation();
  const [searchParams] = useSearchParams();

  const videoId = searchParams.get("videoId");

  // Accept video from ExperimentRunner or normal player navigation
  const [selectedVideo, setSelectedVideo] = useState(
    props.video || location.state?.video || null
  );

  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Playback position and duration for the timeline controls.
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [quality, setQuality] = useState(-1);
  const [levels, setLevels] = useState([]);
  const [hlsReady, setHlsReady] = useState(false);
  const [isHlsActive, setIsHlsActive] = useState(false);

  const [experimentMode, setExperimentMode] = useState("normal");
  const [experimentRunning, setExperimentRunning] = useState(false);

  const [metrics, setMetrics] = useState({
    ttffSeconds: null,
    rebufferCount: 0,
    totalRebufferDuration: 0,
    bufferLength: 0,
    currentBitrate: 0,
    averageBitrate: null,
    estimatedThroughput: 0,
    resolution: "--",
    qualitySwitches: 0,
    testDurationSeconds: null,
  });

  // Fetch selected video from MongoDB
  useEffect(() => {
    // Priority 1: Video passed from ExperimentRunner
    const passedVideo = props.video || location.state?.video;

    if (passedVideo) {
      setSelectedVideo(passedVideo);
      setLoading(true);
      setError("");
      return;
    }

    // Priority 2: Fetch video using query parameter
    if (!videoId) {
      setSelectedVideo(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchSelectedVideo = async () => {
      try {
        setLoading(true);
        setError("");
        setSelectedVideo(null);

        const response = await fetch(
          `${API_URL}/api/videos/${videoId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Video not found");
        }

        if (!cancelled) {
          setSelectedVideo(data.video);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchSelectedVideo();

    return () => {
      cancelled = true;
    };
  }, [videoId, location.state, props.video]);

  // Set up video and HLS streaming engine
  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    if (videoId && !selectedVideo) return;

    const telemetry = telemetryRef.current;

    telemetry.reset();
    setMetrics(telemetry.getSummary());

    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setQuality(-1);
    setLevels([]);
    setHlsReady(false);
    setIsHlsActive(false);
    setError("");
    setLoading(true);

    previousLevelRef.current = 0;
    upgradeStreakRef.current = 0;
    bandwidthRef.current = 0;
    manualQualityRef.current = null;
    runCustomABRRef.current = null;

    experimentModeRef.current = "normal";
    experimentRunningRef.current = false;

    let hls = null;
    let hasStarted = false;

    // Use selected video's URL. Demo is only for normal player mode.
    const videoUrl = selectedVideo
  ? selectedVideo.videoUrl
  : DEMO_VIDEO;

if (!videoUrl) {
  setLoading(false);
  setError("Selected video URL is missing.");
  return;
}

  const isHls =
    selectedVideo?.format === "hls" ||
    videoUrl.toLowerCase().split("?")[0].endsWith(".m3u8");

  const edgeEligible =
    Boolean(selectedVideo?._id) &&
    isHls &&
    /^https?:\/\//i.test(videoUrl);

  const sourceUrl = edgeEligible
    ? `${API_URL}/api/edge/${selectedVideo._id}/manifest`
    : videoUrl.startsWith("/")
      ? `${API_URL}${videoUrl}`
      : videoUrl;

  console.log("Loading video:", selectedVideo?.title || "Demo Video");

  console.log(
    "Streaming route:",
    edgeEligible ? "StreamSmart Edge Server" : "Direct Origin"
  );

  console.log("Video source:", sourceUrl);

    console.log("Loading video:", selectedVideo?.title || "Demo Video");
    console.log("Video source:", sourceUrl);

    const updateMetrics = () => {
      telemetry.updateBuffer(video);
      setMetrics(telemetry.getSummary());
    };

    const getBufferSeconds = () => {
      if (!video.buffered.length) return 0;

      for (let i = 0; i < video.buffered.length; i++) {
        const start = video.buffered.start(i);
        const end = video.buffered.end(i);

        if (
          video.currentTime >= start &&
          video.currentTime <= end
        ) {
          return Math.max(0, end - video.currentTime);
        }
      }

      return 0;
    };

    // Custom Adaptive Bitrate algorithm
    const runCustomABR = (bandwidthKbps) => {
      // Do not override manually selected quality.
      if (manualQualityRef.current !== null) return;

      if (!hls || !hls.levels.length) return;

      // Baseline experiment uses fixed quality.
      if (experimentModeRef.current === "baseline") return;

      const result = selectQuality({
        levels: hls.levels,
        bandwidthKbps,
        bufferSeconds: getBufferSeconds(),
        previousLevel: previousLevelRef.current,
        upgradeStreak: upgradeStreakRef.current,
      });

      if (!result || !Number.isInteger(result.selectedLevel)) {
        return;
      }

      const selectedLevel = Math.max(
        0,
        Math.min(result.selectedLevel, hls.levels.length - 1)
      );

      upgradeStreakRef.current = result.upgradeStreak;

      if (selectedLevel !== previousLevelRef.current) {
        console.log("Custom ABR decision:", {
          bandwidthKbps,
          bufferSeconds: getBufferSeconds(),
          previousLevel: previousLevelRef.current,
          selectedLevel,
          resolution: hls.levels[selectedLevel]?.height
            ? `${hls.levels[selectedLevel].height}p`
            : "--",
        });

        // Switch the next playback segment without flushing
        // the entire existing video buffer.
        hls.nextLevel = selectedLevel;

        previousLevelRef.current = selectedLevel;
      }
    };

    runCustomABRRef.current = runCustomABR;

    // Finish and save the current experiment
    const finishExperiment = async () => {
      if (
        !experimentRunningRef.current ||
        experimentFinishingRef.current
      ) {
        return;
      }

      experimentFinishingRef.current = true;

      clearInterval(experimentTimerRef.current);
      experimentTimerRef.current = null;

      video.pause();

      setPlaying(false);
      setLoading(false);

      const config = experimentConfigRef.current;

      try {
        if (!config || !config.videoId) {
          throw new Error("Experiment configuration is missing");
        }

        const result = telemetry.finish();

        setMetrics(result);

        const response = await fetch(
          `${API_URL}/api/experiments`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              video: config.videoId,
              mode: config.mode,
              networkProfile: config.networkProfile,
              fixedQuality:
                config.mode === "baseline"
                  ? Number(config.fixedQuality)
                  : null,
              durationSeconds: Number(config.durationSeconds),
              metrics: result,
              status: "completed",
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to save experiment"
          );
        }

        console.log(
          `${config.mode} experiment saved:`,
          data.experiment
        );

        experimentResolveRef.current?.(result);
      } catch (err) {
        console.error("Experiment saving failed:", err);
        experimentRejectRef.current?.(err);
      } finally {
        experimentRunningRef.current = false;
        experimentFinishingRef.current = false;

        setExperimentRunning(false);

        experimentResolveRef.current = null;
        experimentRejectRef.current = null;
        experimentConfigRef.current = null;
        experimentStartTimeRef.current = null;
      }
    };

    // Keep the playback timeline synchronized with the media element.
    const handleLoadedMetadata = () => {
      setCurrentTime(video.currentTime || 0);
      setDuration(
        Number.isFinite(video.duration) ? video.duration : 0
      );
    };

    const handleDurationChange = () => {
      setDuration(
        Number.isFinite(video.duration) ? video.duration : 0
      );
    };

    // Video event handlers
    const handlePlay = () => {
      if (!hasStarted) {
        if (!experimentRunningRef.current) {
          telemetry.start();
        }

        hasStarted = true;
      }

      setPlaying(true);
      updateMetrics();
    };

    const handlePause = () => {
      setPlaying(false);
    };

    const handlePlaying = () => {
      telemetry.markFirstFrame();
      telemetry.stopBuffering();

      setLoading(false);
      updateMetrics();
    };

    const handleCanPlay = () => {
      setLoading(false);
    };

    const handleWaiting = () => {
      telemetry.startBuffering();

      setLoading(true);
      updateMetrics();
    };

    // Check experiment duration during playback
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime || 0);
      updateMetrics();

      if (!experimentRunningRef.current) return;

      const duration =
        Number(experimentConfigRef.current?.durationSeconds);

      const startTime = experimentStartTimeRef.current;

      if (!duration || !startTime) return;

      const elapsedSeconds =
        (Date.now() - startTime) / 1000;

      if (elapsedSeconds >= duration) {
        finishExperiment();
      }
    };

    // Restart video if it ends before test duration
    const handleEnded = async () => {
      if (!experimentRunningRef.current) {
        setPlaying(false);
        setLoading(false);
        updateMetrics();
        return;
      }

      const duration =
        Number(experimentConfigRef.current?.durationSeconds);

      const startTime = experimentStartTimeRef.current;

      const elapsedSeconds = startTime
        ? (Date.now() - startTime) / 1000
        : duration;

      if (elapsedSeconds >= duration) {
        await finishExperiment();
        return;
      }

      try {
        video.currentTime = 0;
        await video.play();
      } catch (err) {
        experimentRejectRef.current?.(
          new Error("Unable to restart video during experiment")
        );

        clearInterval(experimentTimerRef.current);
        experimentTimerRef.current = null;

        experimentRunningRef.current = false;
        setExperimentRunning(false);
      }
    };

    const handleError = () => {
      setLoading(false);
      setError("Unable to play this video. Check its URL or format.");

      if (experimentRunningRef.current) {
        clearInterval(experimentTimerRef.current);
        experimentTimerRef.current = null;

        experimentRunningRef.current = false;
        setExperimentRunning(false);

        experimentRejectRef.current?.(
          new Error("Video playback failed")
        );

        experimentResolveRef.current = null;
        experimentRejectRef.current = null;
      }
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("loadeddata", handleCanPlay);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);

    if (isHls) {
          if (Hls.isSupported()) {
          hls = new Hls({
  enableWorker: true,
  capLevelToPlayerSize: true,

  loader: SimulatedNetworkLoader,

  xhrSetup: (xhr, url) => {
    try {
      const requestOrigin = new URL(
        url,
        window.location.href
      ).origin;

      const backendOrigin = new URL(API_URL).origin;

      // Send JWT only to our own backend Edge Server.
      // Do not send authentication headers to public HLS providers.
      if (requestOrigin === backendOrigin) {
        const token = localStorage.getItem("token");

            if (token) {
              xhr.setRequestHeader(
                "Authorization",
                `Bearer ${token}`
              );
              }
            }
          } catch (error) {
            console.error("Unable to configure HLS request:", error);
          }
        },
      });

        hlsRef.current = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          console.log("Available HLS quality levels:", data.levels);

          console.table(
            data.levels.map((level, index) => ({
              index,
              height: level.height,
              width: level.width,
              bitrate: `${(level.bitrate / 1000).toFixed(0)} Kbps`,
            }))
          );

          const availableLevels = data.levels.map(
            (level, index) => ({
              ...level,
              originalIndex: index,
            })
          );

          setLevels(availableLevels);
          setHlsReady(data.levels.length > 0);
          setIsHlsActive(true);
          setLoading(false);
          setError("");

          previousLevelRef.current = 0;
          upgradeStreakRef.current = 0;

          // Start in Auto mode instead of locking the player
          // to the lowest level.
          hls.startLevel = -1;
          hls.loadLevel = -1;

          manualQualityRef.current = null;
          setQuality(-1);

          console.log("HLS Auto mode enabled:", {
            autoLevelEnabled: hls.autoLevelEnabled,
            startLevel: hls.startLevel,
            availableLevels: hls.levels.length,
          });
        });

        // Quality changed
        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          const level = hls.levels[data.level];

          if (!level) return;

          const previousResolution = telemetry.resolution;

          const resolution = level.height
            ? `${level.height}p`
            : "--";

          // Keep track of the currently active level.
          previousLevelRef.current = data.level;

          telemetry.updateStreamMetrics({
            bitrate: level.bitrate,
            resolution,
          });

          if (
            previousResolution !== "--" &&
            previousResolution !== resolution
          ) {
            telemetry.recordQualitySwitch({
              from: previousResolution,
              to: resolution,
            });
          }

          updateMetrics();
        });

        // Record the resolution of the actual loaded playback fragment.
        hls.on(Hls.Events.FRAG_CHANGED, (_, data) => {
          const fragmentLevel = data.frag?.level;
          const level = hls.levels[fragmentLevel];

          if (!level) return;

          const resolution = level.height
            ? `${level.height}p`
            : "--";

          telemetry.updateStreamMetrics({
            bitrate: level.bitrate,
            resolution,
          });

          updateMetrics();
        });

        // Measure fragment throughput
        hls.on(Hls.Events.FRAG_LOADED, (_, data) => {
          const stats = data.frag.stats;

          const durationMs =
            stats.loading?.end - stats.loading?.start;

          const loadedBytes = stats.loaded;

          if (durationMs > 0 && loadedBytes > 0) {
            const throughputKbps =
              (loadedBytes * 8) / durationMs;

            bandwidthRef.current = throughputKbps;

            telemetry.updateStreamMetrics({
              throughput: throughputKbps,
            });

            // Custom ABR makes a new decision using
            // the latest measured throughput.
            runCustomABR(throughputKbps);

            updateMetrics();
          }
        });

        // HLS errors
           hls.on(Hls.Events.ERROR, (_, data) => {
            console.error("HLS error details:", {
              type: data.type,
              details: data.details,
              reason: data.reason,
              fatal: data.fatal,
              response: data.response,
              url: data.url,
            });

            if (data.fatal) {
              setLoading(false);

              setError(
                `HLS Error: ${data.details || data.type}. Check the video URL and network requests.`
              );

            if (experimentRunningRef.current) {
              clearInterval(experimentTimerRef.current);
              experimentTimerRef.current = null;

              experimentRunningRef.current = false;
              setExperimentRunning(false);

              experimentRejectRef.current?.(
                new Error("Fatal HLS streaming error")
              );

              experimentResolveRef.current = null;
              experimentRejectRef.current = null;
            }
          }
        });

        hls.loadSource(sourceUrl);
        hls.attachMedia(video);
      } else if (
        video.canPlayType("application/vnd.apple.mpegurl")
      ) {
        video.src = sourceUrl;
        video.load();
      } else {
        setLoading(false);
        setError("HLS is not supported in this browser.");
      }
    } else {
      video.src = sourceUrl;
      video.load();
    }

    return () => {
      runCustomABRRef.current = null;

      clearInterval(experimentTimerRef.current);
      experimentTimerRef.current = null;

      if (experimentRunningRef.current) {
        experimentRejectRef.current?.(
          new Error("Player was closed during the experiment")
        );
      }

      experimentRunningRef.current = false;
      experimentResolveRef.current = null;
      experimentRejectRef.current = null;

      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("loadeddata", handleCanPlay);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);

      hls?.destroy();

      if (hlsRef.current === hls) {
        hlsRef.current = null;
      }

      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [selectedVideo, videoId]);

  // Methods exposed to ExperimentRunner
  useImperativeHandle(ref, () => ({
    isReady() {
      const video = videoRef.current;
      const hls = hlsRef.current;

      return Boolean(
        video &&
        hls &&
        hls.levels.length >= 2 &&
        video.readyState >= HTMLMediaElement.HAVE_METADATA
      );
    },

    async runPlayback(config) {
      const video = videoRef.current;
      const hls = hlsRef.current;

      if (!video || !hls) {
        throw new Error("Video player is not ready");
      }

      if (hls.levels.length < 2) {
        throw new Error(
          "Experiment requires an HLS video with at least two quality levels"
        );
      }

      if (experimentRunningRef.current) {
        throw new Error("Another playback test is already running");
      }

      if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
        throw new Error("Video is not ready yet");
      }

      const mode = config.mode;

      if (!["baseline", "optimized"].includes(mode)) {
        throw new Error("Invalid experiment mode");
      }

      const durationSeconds = Number(config.durationSeconds);

      if (
        !Number.isFinite(durationSeconds) ||
        durationSeconds <= 0
      ) {
        throw new Error("Invalid experiment duration");
      }

      if (!config.videoId) {
        throw new Error("Video ID is missing");
      }

      if (mode === "baseline") {
        const fixedLevel = Number(config.fixedQuality);

        if (
          !Number.isInteger(fixedLevel) ||
          fixedLevel < 0 ||
          fixedLevel >= hls.levels.length
        ) {
          throw new Error("Invalid fixed quality level");
        }

        manualQualityRef.current = fixedLevel;
        previousLevelRef.current = fixedLevel;

        hls.currentLevel = fixedLevel;

        setQuality(fixedLevel);
      } else {
        // Optimized experiment uses Custom ABR.
        manualQualityRef.current = null;

        previousLevelRef.current = 0;
        upgradeStreakRef.current = 0;

        // Start at the lowest level, but keep adaptive
        // selection enabled for subsequent segments.
        hls.startLevel = 0;
        hls.nextLevel = -1;

        setQuality(-1);
      }

      experimentModeRef.current = mode;
      setExperimentMode(mode);

      experimentConfigRef.current = {
        videoId: config.videoId,
        mode,
        networkProfile: config.networkProfile,
        fixedQuality: config.fixedQuality,
        durationSeconds,
      };

      experimentFinishingRef.current = false;

      video.pause();

      try {
        video.currentTime = 0;
      } catch (err) {
        console.error("Unable to reset video position:", err);
      }

      telemetryRef.current.reset();

      const telemetry = telemetryRef.current;

      setMetrics(telemetry.getSummary());

      setError("");
      setLoading(false);

      experimentRunningRef.current = true;
      setExperimentRunning(true);

      experimentStartTimeRef.current = Date.now();

      return new Promise((resolve, reject) => {
        experimentResolveRef.current = resolve;
        experimentRejectRef.current = reject;

        experimentTimerRef.current = setInterval(() => {
          const startTime = experimentStartTimeRef.current;

          if (!startTime) return;

          const elapsedSeconds =
            (Date.now() - startTime) / 1000;

          if (elapsedSeconds >= durationSeconds) {
            const videoElement = videoRef.current;

            if (videoElement) {
              videoElement.pause();
              videoElement.dispatchEvent(
                new Event("timeupdate")
              );
            }
          }
        }, 500);

        video.play().catch((err) => {
          clearInterval(experimentTimerRef.current);
          experimentTimerRef.current = null;

          experimentRunningRef.current = false;
          experimentFinishingRef.current = false;

          setExperimentRunning(false);

          experimentResolveRef.current = null;
          experimentRejectRef.current = null;

          experimentConfigRef.current = null;
          experimentStartTimeRef.current = null;

          reject(err);
        });
      });
    },

    async resetTest() {
      const video = videoRef.current;
      const hls = hlsRef.current;

      if (!video) {
        throw new Error("Video player is not ready");
      }

      if (experimentRunningRef.current) {
        throw new Error("Cannot reset while a test is running");
      }

      video.pause();

      try {
        video.currentTime = 0;
      } catch (err) {
        console.error("Unable to reset playback position:", err);
      }

      telemetryRef.current.reset();

      setMetrics(telemetryRef.current.getSummary());

      previousLevelRef.current = 0;
      upgradeStreakRef.current = 0;
      bandwidthRef.current = 0;
      manualQualityRef.current = null;

      experimentModeRef.current = "normal";
      setExperimentMode("normal");

      setQuality(-1);
      setPlaying(false);
      setError("");

      if (hls) {
        // Return to Auto mode after resetting.
        hls.startLevel = -1;
        hls.nextLevel = -1;
      }
    },

    getTelemetry() {
      return telemetryRef.current.getSummary();
    },
  }));

  // Seek forward or backward without changing experiment playback.
  const seekVideo = (offsetSeconds) => {
    const video = videoRef.current;

    if (
      !video ||
      experimentRunningRef.current ||
      !Number.isFinite(video.duration)
    ) {
      return;
    }

    const nextTime = Math.max(
      0,
      Math.min(video.duration, video.currentTime + offsetSeconds)
    );

    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  // Seek to a selected position on the timeline.
  const handleTimelineChange = (event) => {
    const video = videoRef.current;
    const nextTime = Number(event.target.value);

    if (
      !video ||
      experimentRunningRef.current ||
      !Number.isFinite(video.duration) ||
      !Number.isFinite(nextTime)
    ) {
      return;
    }

    video.currentTime = Math.max(0, Math.min(video.duration, nextTime));
    setCurrentTime(video.currentTime);
  };

  // Normal player controls
  const togglePlay = async () => {
    const video = videoRef.current;

    if (!video || experimentRunningRef.current) return;

    if (video.paused) {
      try {
        await video.play();
      } catch {
        setError("Playback could not start. Try again.");
      }
    } else {
      video.pause();
    }
  };

  // Manual quality and Custom ABR selection
  const changeQuality = (value) => {
    const level = Number(value);
    const hls = hlsRef.current;

    if (!hls || experimentRunningRef.current) return;

    // Auto / Custom ABR mode
    if (level === -1) {
      // Release the manual quality lock.
      manualQualityRef.current = null;

      setQuality(-1);
      upgradeStreakRef.current = 0;

      // Keep track of the currently playing level
      // before enabling adaptive selection.
      const activeLevel =
        hls.currentLevel >= 0
          ? hls.currentLevel
          : hls.loadLevel;

      if (activeLevel >= 0) {
        previousLevelRef.current = activeLevel;
      }

      // -1 tells HLS.js to release its manual level lock.
      hls.nextLevel = -1;

      console.log("Custom ABR mode enabled:", {
        autoLevelEnabled: hls.autoLevelEnabled,
        activeLevel,
        bandwidthKbps: bandwidthRef.current,
      });

      // Re-evaluate immediately if throughput is already available.
      if (bandwidthRef.current > 0) {
        runCustomABRRef.current?.(bandwidthRef.current);
      }

      return;
    }

    // Manual quality mode
    if (
      !Number.isInteger(level) ||
      level < 0 ||
      level >= hls.levels.length
    ) {
      return;
    }

    manualQualityRef.current = level;
    previousLevelRef.current = level;
    upgradeStreakRef.current = 0;

    // Immediately switch to the selected manual quality.
    hls.currentLevel = level;

    setQuality(level);

    console.log("Manual quality selected:", {
      level,
      resolution: hls.levels[level]?.height
        ? `${hls.levels[level].height}p`
        : "Unknown",
      bitrate: hls.levels[level]?.bitrate,
    });
  };

  // Display unique labels when resolutions are duplicated
  const getQualityLabel = (level) => {
    const sameHeightCount = levels.filter(
      (item) => item.height === level.height
    ).length;

    const resolution = level.height
      ? `${level.height}p`
      : `Level ${level.originalIndex + 1}`;

    if (sameHeightCount > 1) {
      return `${resolution} (${Math.round(level.bitrate / 1000)} Kbps)`;
    }

    return resolution;
  };

  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement;

    if (!container) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen?.();
    }
  };

  return (
    <div className="video-player-page">
      <div className="video-player-card">

        <div className="player-header">
          <div>
            <h3>StreamSmart Player</h3>

            <p>
              {selectedVideo?.title || "Demo HLS Stream"}
            </p>
          </div>

          <span className="live-badge">
            ● STREAMING TEST
          </span>
        </div>

        <div className="video-screen">
          <video
            ref={videoRef}
            className="video-element"
            controls={false}
            playsInline
          />

          {loading && !error && (
            <div className="player-overlay">
              <LoaderCircle className="loader" size={35} />
              <p>Loading stream...</p>
            </div>
          )}

          {error && (
            <div className="player-overlay error-overlay">
              <p>{error}</p>
            </div>
          )}

          {!playing && !loading && !error && (
            <button
              className="center-play"
              onClick={togglePlay}
              disabled={experimentRunning}
            >
              <Play size={30} fill="currentColor" />
            </button>
          )}
        </div>

        {/* Playback timeline */}
        <div className="player-timeline">
          <div className="timeline-time-labels">
            <span>{formatPlaybackTime(currentTime)}</span>
            <span>
              {duration > 0
                ? formatPlaybackTime(duration)
                : "--:--"}
            </span>
          </div>

          <input
            className="timeline-slider"
            type="range"
            min="0"
            max={duration > 0 ? duration : 0}
            step="0.1"
            value={
              duration > 0
                ? Math.min(currentTime, duration)
                : 0
            }
            onChange={handleTimelineChange}
            disabled={duration <= 0 || experimentRunning}
            aria-label="Video playback position"
          />
        </div>

        <div className="player-controls">
          <button
            className="control-button"
            onClick={togglePlay}
            disabled={experimentRunning}
          >
            {playing ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <button
            className="control-button seek-control"
            onClick={() => seekVideo(-10)}
            disabled={duration <= 0 || experimentRunning}
            title="Backward 10 seconds"
            aria-label="Backward 10 seconds"
          >
            <RotateCcw size={18} />
            <span>10s</span>
          </button>

          <Volume2 size={19} />

          <button
            className="control-button seek-control"
            onClick={() => seekVideo(10)}
            disabled={duration <= 0 || experimentRunning}
            title="Forward 10 seconds"
            aria-label="Forward 10 seconds"
          >
            <RotateCw size={18} />
            <span>10s</span>
          </button>

          <div className="quality-control">
            <Settings2 size={17} />

            <select
              value={quality}
              onChange={(e) => changeQuality(e.target.value)}
              disabled={
                !hlsReady ||
                !levels.length ||
                experimentRunning
              }
            >
              <option value={-1}>Auto (Custom ABR)</option>

              {levels.map((level) => (
                <option
                  key={level.originalIndex}
                  value={level.originalIndex}
                >
                  {getQualityLabel(level)}
                </option>
              ))}
            </select>
          </div>

          <p className="quality-debug">
            HLS Ready: {String(hlsReady)} | Available Levels: {levels.length}
          </p>

          <button
            className="control-button fullscreen-button"
            onClick={toggleFullscreen}
          >
            <Maximize size={19} />
          </button>
        </div>

        <div className="player-footer">
          <span>
            Streaming Engine: {isHlsActive ? "HLS.js" : "HTML5 Video"}
          </span>

          <span>
            {experimentRunning
              ? `${experimentMode.toUpperCase()} TEST RUNNING`
              : !isHlsActive
                ? "Single Quality"
                : manualQualityRef.current !== null
                  ? "Manual Quality"
                  : "Custom ABR"}
          </span>
        </div>
      </div>

      <section className="telemetry-panel">
        <h3>Playback Telemetry</h3>

        <div className="telemetry-grid">
          <div className="metric-card">
            <span>Time to First Frame</span>
            <strong>
              {metrics.ttffSeconds === null
                ? "--"
                : `${metrics.ttffSeconds}s`}
            </strong>
          </div>

          <div className="metric-card">
            <span>Rebuffer Count</span>
            <strong>{metrics.rebufferCount}</strong>
          </div>

          <div className="metric-card">
            <span>Buffer Length</span>
            <strong>{metrics.bufferLength}s</strong>
          </div>

          <div className="metric-card">
            <span>Resolution</span>
            <strong>{metrics.resolution}</strong>
          </div>

          <div className="metric-card">
            <span>Current Bitrate</span>
            <strong>
              {metrics.currentBitrate
                ? `${(metrics.currentBitrate / 1000000).toFixed(2)} Mbps`
                : "--"}
            </strong>
          </div>

          <div className="metric-card">
            <span>Estimated Throughput</span>
            <strong>
               {metrics.estimatedThroughput
                  ? `${(metrics.estimatedThroughput / 1000).toFixed(2)} Mbps`
                  : "--"}
            </strong>
          </div>

          <div className="metric-card">
            <span>Total Rebuffer Duration</span>
            <strong>{metrics.totalRebufferDuration}s</strong>
          </div>

          <div className="metric-card">
            <span>Quality Switches</span>
            <strong>{metrics.qualitySwitches}</strong>
          </div>
        </div>
      </section>
    </div>
  );
});

export default VideoPlayer;