
import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  Maximize,
  Settings2,
  LoaderCircle,
} from "lucide-react";

import "./VideoPlayer.css";

const DEMO_VIDEO =
  "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

function VideoPlayer() {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quality, setQuality] = useState(-1);
  const [levels, setLevels] = useState([]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        capLevelToPlayerSize: true,
      });

      hlsRef.current = hls;

      hls.loadSource(DEMO_VIDEO);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setLevels(data.levels);
        setLoading(false);
        setError("");
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setLoading(false);
          setError("Unable to load video. Please try again.");
        }
      });

    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = DEMO_VIDEO;
      video.addEventListener("loadedmetadata", () => {
        setLoading(false);
      });
    } else {
      setError("HLS is not supported in this browser.");
      setLoading(false);
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, []);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

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

  const changeQuality = (value) => {
    const level = Number(value);
    setQuality(level);

    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
    }
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.parentElement.requestFullscreen();
    }
  };

  return (
    <div className="video-player-card">
      <div className="player-header">
        <div>
          <h3>StreamSmart Player</h3>
          <p>HLS Adaptive Streaming</p>
        </div>

        <span className="live-badge">● LIVE TEST</span>
      </div>

      <div className="video-screen">
        <video
          ref={videoRef}
          className="video-element"
          controls={false}
          playsInline
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onWaiting={() => setLoading(true)}
          onPlaying={() => setLoading(false)}
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
          <button className="center-play" onClick={togglePlay}>
            <Play size={30} fill="currentColor" />
          </button>
        )}
      </div>

      <div className="player-controls">
        <button className="control-button" onClick={togglePlay}>
          {playing ? <Pause size={20} /> : <Play size={20} />}
        </button>

        <Volume2 size={19} />

        <div className="quality-control">
          <Settings2 size={17} />
          <select
            value={quality}
            onChange={(e) => changeQuality(e.target.value)}
            disabled={!levels.length}
          >
            <option value={-1}>Auto Quality</option>
            {levels.map((level, index) => (
              <option key={index} value={index}>
                {level.height
                  ? `${level.height}p`
                  : `Level ${index + 1}`}
              </option>
            ))}
          </select>
        </div>

        <button
          className="control-button fullscreen-button"
          onClick={toggleFullscreen}
        >
          <Maximize size={19} />
        </button>
      </div>

      <div className="player-footer">
        <span>Streaming Engine: HLS.js</span>
        <span>
          {quality === -1 ? "Adaptive Mode" : "Manual Quality"}
        </span>
      </div>
    </div>
  );
}

export default VideoPlayer;
