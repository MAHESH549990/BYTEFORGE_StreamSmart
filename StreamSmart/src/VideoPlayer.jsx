
import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Settings2,
  LoaderCircle, Upload, Square, Activity, Clock, Wifi,
  MonitorPlay
} from "lucide-react";
import "./VideoPlayer.css";

const DEMO_VIDEO =
  "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function VideoPlayer() {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const bufferStartRef = useRef(null);
  const fileUrlRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quality, setQuality] = useState(-1);
  const [levels, setLevels] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [resolution, setResolution] = useState("--");
  const [bufferingTime, setBufferingTime] = useState(0);
  const [networkSpeed, setNetworkSpeed] = useState("--");
  const [qualityHistory, setQualityHistory] = useState([]);
  const [testActive, setTestActive] = useState(false);
  const [sourceName, setSourceName] = useState("Demo HLS Stream");

  const loadSource = (source, isHls, name) => {
    const video = videoRef.current;
    if (!video) return;

    hlsRef.current?.destroy();
    hlsRef.current = null;

    setLoading(true);
    setError("");
    setLevels([]);
    setQuality(-1);
    setResolution("--");
    setNetworkSpeed("--");
    setQualityHistory([]);
    setCurrentTime(0);
    setDuration(0);
    setSourceName(name);

    video.pause();
    video.removeAttribute("src");
    video.load();

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        capLevelToPlayerSize: true,
      });

      hlsRef.current = hls;
      hls.loadSource(source);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setLevels(data.levels);
        setLoading(false);
        setError("");
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        const level = hls.levels[data.level];
        if (!level) return;

        const label = level.height ? `${level.height}p` : `Level ${data.level}`;
        setResolution(label);

        setQualityHistory((previous) => [
          `${new Date().toLocaleTimeString()} — ${label}`,
          ...previous,
        ].slice(0, 8));
      });

      hls.on(Hls.Events.FRAG_LOADED, () => {
        const estimate = hls.bandwidthEstimate;
        if (estimate) {
          setNetworkSpeed(`${(estimate / 1_000_000).toFixed(2)} Mbps`);
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setLoading(false);
          setError("Unable to load stream. Check your connection or try another video.");
        }
      });
    } else {
      video.src = source;
      video.load();
    }
  };

  useEffect(() => {
    loadSource(DEMO_VIDEO, true, "Demo HLS Stream");

    return () => {
      hlsRef.current?.destroy();
      if (fileUrlRef.current) {
        URL.revokeObjectURL(fileUrlRef.current);
      }
    };
  }, []);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      try {
        await video.play();
      } catch {
        setError("Playback could not start. Please try again.");
      }
    } else {
      video.pause();
    }
  };

  const startTest = async () => {
    setTestActive(true);
    setBufferingTime(0);
    await togglePlay();
  };

  const stopTest = () => {
    videoRef.current?.pause();
    setTestActive(false);
    setPlaying(false);
  };

  const changeQuality = (value) => {
    const level = Number(value);
    setQuality(level);

    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
    }
  };

  const changeVolume = (value) => {
    const nextVolume = Number(value);
    setVolume(nextVolume);
    setMuted(nextVolume === 0);

    if (videoRef.current) {
      videoRef.current.volume = nextVolume;
      videoRef.current.muted = nextVolume === 0;
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setMuted(video.muted);
  };

  const changeSpeed = (value) => {
    const nextSpeed = Number(value);
    setSpeed(nextSpeed);

    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  const seekVideo = (value) => {
    const nextTime = Number(value);
    if (videoRef.current) {
      videoRef.current.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
  };

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setError("Please select a valid video file.");
      return;
    }

    if (fileUrlRef.current) {
      URL.revokeObjectURL(fileUrlRef.current);
    }

    const url = URL.createObjectURL(file);
    fileUrlRef.current = url;

    loadSource(url, false, file.name);
    setTestActive(false);
  };

  const toggleFullscreen = () => {
    const screen = videoRef.current?.parentElement;
    if (!screen) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      screen.requestFullscreen?.();
    }
  };

  const handleWaiting = () => {
    if (bufferStartRef.current === null) {
      bufferStartRef.current = Date.now();
    }
    setLoading(true);
  };

  const handlePlaying = () => {
    if (bufferStartRef.current !== null) {
      const elapsed = (Date.now() - bufferStartRef.current) / 1000;
      setBufferingTime((previous) => previous + elapsed);
      bufferStartRef.current = null;
    }

    setLoading(false);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    setCurrentTime(video.currentTime);
    setDuration(video.duration || 0);

    if (video.videoHeight) {
      setResolution(`${video.videoHeight}p`);
    }
  };

  return (
    <div className="video-player-card">
      <div className="player-header">
        <div>
          <h3>StreamSmart Experiment Player</h3>
          <p>{sourceName} · Streaming Performance Lab</p>
        </div>
        <span className={`test-badge ${testActive ? "test-running" : ""}`}>
          ● {testActive ? "TEST RUNNING" : "TEST IDLE"}
        </span>
      </div>

      <div className="video-screen">
        <video
          ref={videoRef}
          className="video-element"
          playsInline
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onWaiting={handleWaiting}
          onStalled={handleWaiting}
          onPlaying={handlePlaying}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleTimeUpdate}
          onError={() => {
            setLoading(false);
            setError("Video could not be loaded. Try another source.");
          }}
        />

        {loading && !error && (
          <div className="player-overlay">
            <LoaderCircle className="loader" size={35} />
            <p>Loading video...</p>
          </div>
        )}

        {error && (
          <div className="player-overlay error-overlay">
            <p>{error}</p>
          </div>
        )}

        {!playing && !loading && !error && (
          <button className="center-play" onClick={togglePlay}>
            <Play size={30} fill="currentColor" />
          </button>
        )}
      </div>

      <div className="timeline-section">
        <input
          className="seek-bar"
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={Math.min(currentTime, duration || 0)}
          onChange={(e) => seekVideo(e.target.value)}
          disabled={!duration}
        />
        <div className="time-labels">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="player-controls">
        <button className="control-button" onClick={togglePlay} title="Play/Pause">
          {playing ? <Pause size={20} /> : <Play size={20} />}
        </button>

        <button className="control-button" onClick={toggleMute} title="Mute/Unmute">
          {muted || volume === 0 ? <VolumeX size={19} /> : <Volume2 size={19} />}
        </button>

        <input
          className="volume-slider"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={muted ? 0 : volume}
          onChange={(e) => changeVolume(e.target.value)}
          aria-label="Volume"
        />

        <div className="quality-control">
          <Settings2 size={17} />
          <select
            value={quality}
            onChange={(e) => changeQuality(e.target.value)}
            disabled={!levels.length}
            aria-label="Video quality"
          >
            <option value={-1}>Auto</option>
            {levels.map((level, index) => (
              <option key={index} value={index}>
                {level.height ? `${level.height}p` : `Level ${index + 1}`}
              </option>
            ))}
          </select>
        </div>

        <select
          className="speed-select"
          value={speed}
          onChange={(e) => changeSpeed(e.target.value)}
          aria-label="Playback speed"
        >
          <option value="0.5">0.5x</option>
          <option value="0.75">0.75x</option>
          <option value="1">1x</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
          <option value="1.75">1.75x</option>
          <option value="2">2x</option>
        </select>

        <button
          className="control-button fullscreen-button"
          onClick={toggleFullscreen}
          title="Fullscreen"
        >
          <Maximize size={19} />
        </button>
      </div>

      <div className="test-actions">
        <button className="start-test-button" onClick={startTest} disabled={testActive}>
          <Play size={16} fill="currentColor" /> Start Test
        </button>
        <button className="stop-test-button" onClick={stopTest} disabled={!testActive}>
          <Square size={15} /> Stop Test
        </button>

        <label className="upload-button">
          <Upload size={16} /> Upload Video
          <input
            type="file"
            accept="video/*"
            onChange={handleUpload}
            hidden
          />
        </label>
      </div>

      <div className="player-footer">
        <span>Engine: {hlsRef.current ? "HLS.js" : "HTML5 Video"}</span>
        <span>{quality === -1 ? "Adaptive Mode" : "Manual Quality"}</span>
      </div>

      <div className="metrics-grid">
        <div className="metric-box">
          <Wifi size={18} />
          <span>Est. Network Speed</span>
          <strong>{networkSpeed}</strong>
        </div>
        <div className="metric-box">
          <MonitorPlay size={18} />
          <span>Current Resolution</span>
          <strong>{resolution}</strong>
        </div>
        <div className="metric-box">
          <Clock size={18} />
          <span>Buffering Time</span>
          <strong>{bufferingTime.toFixed(2)}s</strong>
        </div>
        <div className="metric-box">
          <Activity size={18} />
          <span>Playback Speed</span>
          <strong>{speed}x</strong>
        </div>
      </div>

      <div className="quality-history">
        <h4>Quality Switching History</h4>
        {qualityHistory.length === 0 ? (
          <p>No quality switches recorded yet.</p>
        ) : (
          <ul>
            {qualityHistory.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default VideoPlayer;
