
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

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
} from "lucide-react";

import { Telemetry } from "./Telemetry";
import "./VideoPlayer.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const DEMO_VIDEO =
  "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

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
  const experimentModeRef = useRef("normal");
  const experimentRunningRef = useRef(false);
  const experimentResolveRef = useRef(null);
  const experimentRejectRef = useRef(null);

  const location = useLocation();
  const [searchParams] = useSearchParams();

  const videoId = searchParams.get("videoId");

  const [selectedVideo, setSelectedVideo] = useState(
    location.state?.video || null
  );

  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    if (!videoId) {
      setSelectedVideo(null);
      return;
    }

    const passedVideo = location.state?.video;

    if (passedVideo?._id === videoId) {
      setSelectedVideo(passedVideo);
      return;
    }

    const fetchSelectedVideo = async () => {
      try {
        setLoading(true);
        setError("");
        setSelectedVideo(null);

        const response = await fetch(
          `${API_URL}/api/videos/${videoId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Video not found");
        }

        setSelectedVideo(data.video);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchSelectedVideo();
  }, [videoId, location.state]);

  // Set up video and HLS streaming engine
  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    if (videoId && !selectedVideo) return;

    const telemetry = telemetryRef.current;

    telemetry.reset();
    setMetrics(telemetry.getSummary());

    setPlaying(false);
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

    const videoUrl = selectedVideo?.videoUrl || DEMO_VIDEO;

    const sourceUrl = videoUrl.startsWith("/")
      ? `${API_URL}${videoUrl}`
      : videoUrl;

    const isHls =
      selectedVideo?.format === "hls" ||
      sourceUrl.toLowerCase().split("?")[0].endsWith(".m3u8");

    const updateMetrics = () => {
      telemetry.updateBuffer(video);
      setMetrics(telemetry.getSummary());
    };

    const getBufferSeconds = () => {
      if (!video.buffered.length) return 0;

      const end = video.buffered.end(
        video.buffered.length - 1
      );

      return Math.max(0, end - video.currentTime);
    };

    // Custom Adaptive Bitrate algorithm
    const runCustomABR = (bandwidthKbps) => {
      if (manualQualityRef.current !== null) return;

      if (!hls || !hls.levels.length) return;

      // Custom ABR should only run in optimized mode
      if (experimentModeRef.current === "baseline") return;

      const result = selectQuality({
        levels: hls.levels,
        bandwidthKbps,
        bufferSeconds: getBufferSeconds(),
        previousLevel: previousLevelRef.current,
        upgradeStreak: upgradeStreakRef.current,
      });

      upgradeStreakRef.current = result.upgradeStreak;

      const selectedLevel = result.selectedLevel;

      if (selectedLevel !== previousLevelRef.current) {
        console.log("Custom ABR decision:", {
          bandwidthKbps,
          bufferSeconds: getBufferSeconds(),
          previousLevel: previousLevelRef.current,
          selectedLevel,
          resolution: hls.levels[selectedLevel]?.height,
        });

        previousLevelRef.current = selectedLevel;
        hls.loadLevel = selectedLevel;
      }
    };

    runCustomABRRef.current = runCustomABR;

    // Video event handlers
    const handlePlay = () => {
      if (!hasStarted) {
        telemetry.start();
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
      if (telemetry.firstFrameAt !== null) {
        telemetry.startBuffering();
      } else {
        telemetry.record("startup_waiting");
      }

      setLoading(true);
      updateMetrics();
    };

    const handleEnded = () => {
      setPlaying(false);
      setLoading(false);

      if (experimentRunningRef.current) {
        const result = telemetry.finish();

        setMetrics(result);

        experimentRunningRef.current = false;
        setExperimentRunning(false);

        experimentResolveRef.current?.(result);

        experimentResolveRef.current = null;
        experimentRejectRef.current = null;
      } else {
        updateMetrics();
      }
    };

    const handleError = () => {
      setLoading(false);
      setError("Unable to play this video. Check its URL or format.");

      if (experimentRunningRef.current) {
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
    video.addEventListener("timeupdate", updateMetrics);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);

    if (isHls) {
      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          capLevelToPlayerSize: true,
        });

        hlsRef.current = hls;

        // Manifest loaded
        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          console.log("Available HLS quality levels:", data.levels);

          setLevels(data.levels);
          setHlsReady(data.levels.length > 0);
          setIsHlsActive(true);
          setLoading(false);
          setError("");

          previousLevelRef.current = 0;
          upgradeStreakRef.current = 0;

          hls.loadLevel = 0;
          setQuality(-1);
        });

        // Quality changed
        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          const level = hls.levels[data.level];

          if (!level) return;

          const previousResolution = telemetry.resolution;

          const resolution = level.height
            ? `${level.height}p`
            : "--";

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

        // Fragment loaded and throughput measured
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

            runCustomABR(throughputKbps);

            updateMetrics();
          }
        });

        // HLS errors
        hls.on(Hls.Events.ERROR, (_, data) => {
          console.log("HLS error:", data);

          if (data.fatal) {
            setLoading(false);

            setError(
              "Unable to load HLS stream. Please try another video."
            );

            if (experimentRunningRef.current) {
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

      // Reject a pending experiment if the player is unmounted
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
      video.removeEventListener("timeupdate", updateMetrics);
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
    // Run baseline or optimized playback until video ends
    async runPlayback(config) {
      const video = videoRef.current;
      const hls = hlsRef.current;

      if (!video) {
        throw new Error("Video player is not ready");
      }

      if (!hls || !hls.levels || hls.levels.length < 2) {
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

      if (mode !== "baseline" && mode !== "optimized") {
        throw new Error("Invalid experiment mode");
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

        // Disable custom ABR and use fixed quality
        manualQualityRef.current = fixedLevel;
        previousLevelRef.current = fixedLevel;

        hls.loadLevel = fixedLevel;

        setQuality(fixedLevel);

      } else {
        // Enable custom ABR
        manualQualityRef.current = null;

        previousLevelRef.current = 0;
        upgradeStreakRef.current = 0;

        hls.loadLevel = 0;

        setQuality(-1);
      }

      experimentModeRef.current = mode;
      setExperimentMode(mode);

      // Reset playback position and telemetry
      video.pause();
      video.currentTime = 0;

      const telemetry = telemetryRef.current;
      telemetry.start();

      setMetrics(telemetry.getSummary());

      setError("");
      setLoading(false);

      experimentRunningRef.current = true;
      setExperimentRunning(true);

      return new Promise((resolve, reject) => {
        experimentResolveRef.current = resolve;
        experimentRejectRef.current = reject;

        video.play().catch((err) => {
          experimentRunningRef.current = false;
          setExperimentRunning(false);

          experimentResolveRef.current = null;
          experimentRejectRef.current = null;

          reject(err);
        });
      });
    },

    // Reset player between baseline and optimized tests
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
        hls.loadLevel = 0;
      }
    },

    getTelemetry() {
      return telemetryRef.current.getSummary();
    },
  }));

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

    if (level === -1) {
      manualQualityRef.current = null;

      setQuality(-1);

      upgradeStreakRef.current = 0;

      if (bandwidthRef.current > 0) {
        runCustomABRRef.current?.(bandwidthRef.current);
      }

      return;
    }

    manualQualityRef.current = level;
    previousLevelRef.current = level;

    hls.loadLevel = level;

    setQuality(level);
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

        <div className="player-controls">
          <button
            className="control-button"
            onClick={togglePlay}
            disabled={experimentRunning}
          >
            {playing ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <Volume2 size={19} />

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
              <option value={-1}>Custom ABR</option>

              {levels.map((level, index) => (
                <option key={index} value={index}>
                  {level.height
                    ? `${level.height}p`
                    : `Level ${index + 1}`}
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
                ? `${metrics.estimatedThroughput.toFixed(2)} Kbps`
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
