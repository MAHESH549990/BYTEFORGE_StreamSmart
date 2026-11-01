
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, FlaskConical, Activity } from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ExperimentPage() {
  const navigate = useNavigate();

  const [videos, setVideos] = useState([]);
  const [videoId, setVideoId] = useState("");
  const [network, setNetwork] = useState("Good");
  const [fixedQuality, setFixedQuality] = useState("2");
  const [duration, setDuration] = useState("60");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch available videos
  // Fetch available videos
useEffect(() => {
  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please log in to access your videos.");
      }

      const response = await fetch(`${API_URL}/api/videos`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load videos");
      }

      const videoList = Array.isArray(data)
        ? data
        : data.videos || [];

      setVideos(videoList);

      if (videoList.length > 0) {
        setVideoId(videoList[0]._id);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchVideos();
}, []);

  // Start experiment
  const handleStartExperiment = () => {
    setError("");

    if (!videoId) {
      setError("Please select a video first.");
      return;
    }

    const selectedVideo = videos.find(
      (video) => video._id === videoId
    );

    if (!selectedVideo) {
      setError("Selected video was not found.");
      return;
    }

    if (selectedVideo.format !== "hls") {
      setError("Experiments currently require an HLS video.");
      return;
    }

    const experimentConfig = {
      videoId: selectedVideo._id,
      networkProfile: network,
      fixedQuality: Number(fixedQuality),
      durationSeconds: Number(duration),
      modes: ["baseline", "optimized"],
    };

    navigate("/dashboard/experiment/run", {
    state: {
    video: selectedVideo,
    experimentConfig,
  },
   });
  };

  return (
    <div className="experiment-page container-fluid py-4">

      <div className="mb-4">
        <div className="d-flex align-items-center gap-2 mb-2">
          <FlaskConical size={26} />

          <h2 className="mb-0">
            Streaming Experiments
          </h2>
        </div>

        <p className="text-secondary mb-0">
          Compare fixed-quality streaming with your custom
          adaptive bitrate algorithm.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="row g-4">

        <div className="col-lg-7">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4">

              <h5 className="mb-4">
                <Activity size={19} className="me-2" />
                Experiment Configuration
              </h5>

              {/* Video selection */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Select Video
                </label>

                <select
                  className="form-select"
                  value={videoId}
                  onChange={(e) => setVideoId(e.target.value)}
                  disabled={loading || videos.length === 0}
                >
                  {loading && (
                    <option value="">
                      Loading videos...
                    </option>
                  )}

                  {!loading && videos.length === 0 && (
                    <option value="">
                      No videos available
                    </option>
                  )}

                  {videos.map((video) => (
                    <option key={video._id} value={video._id}>
                      {video.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Network profile */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Network Profile
                </label>

                <select
                  className="form-select"
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Poor">Poor</option>
                </select>

                <small className="text-secondary">
                  This is a profile label, not an actual network
                  simulation yet.
                </small>
              </div>

              {/* Fixed quality */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Baseline Fixed Quality
                </label>

                <select
                  className="form-select"
                  value={fixedQuality}
                  onChange={(e) => setFixedQuality(e.target.value)}
                >
                  <option value="0">Lowest available level</option>
                  <option value="1">Quality level 1</option>
                  <option value="2">Quality level 2</option>
                  <option value="3">Quality level 3</option>
                </select>

                <small className="text-secondary">
                  The selected level must exist in the video's
                  HLS manifest.
                </small>
              </div>

              {/* Duration */}
              <div className="mb-4">
                <label className="form-label fw-semibold">
                  Test Duration
                </label>

                <select
                  className="form-select"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="1800">30 minutes</option>
                  <option value="60">1 minute</option>
                  <option value="120">2 minutes</option>
                  <option value="300">5 minutes</option>
                  <option value="600">10 minutes</option>
                  <option value="1800">30 minutes</option>
                </select>

                <small className="text-secondary">
                  Selected duration: {Number(duration) / 60} minute(s)
                  {Number(duration) < 60 && " (less than one minute)"}
                </small>
              </div>

              {/* Start experiment */}
              <button
                className="btn btn-primary w-100"
                onClick={handleStartExperiment}
                disabled={
                  loading ||
                  videos.length === 0 ||
                  !videoId
                }
              >
                <Play size={18} className="me-2" />
                Start Experiment
              </button>

            </div>
          </div>
        </div>

        {/* Workflow information */}
        <div className="col-lg-5">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body p-4">

              <h5 className="mb-3">
                Experiment Workflow
              </h5>

              <div className="mb-3">
                <span className="badge bg-secondary me-2">
                  1
                </span>

                <strong>Baseline Test</strong>

                <p className="text-secondary ms-4 mb-0">
                  Play the selected video at a fixed quality.
                </p>
              </div>

              <div className="mb-3">
                <span className="badge bg-secondary me-2">
                  2
                </span>

                <strong>Optimized Test</strong>

                <p className="text-secondary ms-4 mb-0">
                  Play the same video using your custom ABR
                  algorithm.
                </p>
              </div>

              <div>
                <span className="badge bg-secondary me-2">
                  3
                </span>

                <strong>Save and Compare Results</strong>

                <p className="text-secondary ms-4 mb-0">
                  Store playback metrics in MongoDB and compare
                  startup time, buffering, bitrate and quality
                  switches.
                </p>
              </div>

              <hr />

              <p className="small text-secondary mb-0">
                Both tests should use matching network conditions
                for a fair comparison. The network profile is
                currently a configuration choice, not an actual
                network simulation.
              </p>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
