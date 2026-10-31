
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Activity, CheckCircle, LoaderCircle } from "lucide-react";
import VideoPlayer from "../videos/VideoPlayer";

export default function ExperimentRunner() {
  const playerRef = useRef(null);
  const startedRef = useRef(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Receive selected video and experiment configuration
  const video = location.state?.video;
  const config = location.state?.experimentConfig;

  const [status, setStatus] = useState("Preparing experiment...");
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!config || !config.videoId || !video) {
      setError("Selected video or experiment configuration is missing.");
      return;
    }

    if (startedRef.current) return;

    let cancelled = false;

    const wait = (ms) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const waitForPlayer = async () => {
      setStatus("Waiting for HLS player...");

      for (let i = 0; i < 60; i++) {
        if (cancelled) return false;

        if (playerRef.current?.isReady?.()) {
          return true;
        }

        await wait(500);
      }

      throw new Error(
        "Player was not ready. Check the selected video's HLS manifest."
      );
    };

    const runExperiments = async () => {
      try {
        console.log("Selected experiment video:", video);
        console.log("Selected video URL:", video.videoUrl);

        const ready = await waitForPlayer();

        if (!ready || cancelled) return;

        startedRef.current = true;

        const modes = ["baseline", "optimized"];

        for (const mode of modes) {
          if (cancelled) return;

          setStatus(
            mode === "baseline"
              ? "Running baseline test..."
              : "Running optimized ABR test..."
          );

          await playerRef.current.runPlayback({
            mode,
            videoId: config.videoId,
            networkProfile: config.networkProfile,
            fixedQuality: config.fixedQuality,
            durationSeconds: config.durationSeconds,
          });

          if (cancelled) return;

          if (mode === "baseline") {
            setStatus("Baseline saved. Preparing optimized test...");

            await playerRef.current.resetTest();

            await wait(1000);
          }
        }

        if (!cancelled) {
          setCompleted(true);
          setStatus("Both experiment tests completed successfully.");
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Experiment runner error:", err);
          setError(err.message || "Experiment failed.");
          setStatus("Experiment failed.");
        }
      }
    };

    runExperiments();

    return () => {
      cancelled = true;
    };
  }, [config, video]);

  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <h3>
          <Activity size={24} className="me-2" />
          Experiment Runner
        </h3>

        <p className="text-secondary">
          Running baseline and optimized streaming tests.
        </p>
      </div>

      {config && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h5>{video?.title || "Selected video"}</h5>

            <p className="mb-1">
              Network profile: {config.networkProfile}
            </p>

            <p className="mb-1">
              Duration per test: {config.durationSeconds} seconds
            </p>

            <p className="mb-0">
              Baseline quality: {config.fixedQuality}
            </p>
          </div>
        </div>
      )}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center gap-2">
            {completed ? (
              <CheckCircle color="green" />
            ) : (
              <LoaderCircle className="spinner-border-sm" />
            )}

            <strong>{status}</strong>
          </div>

          {error && (
            <div className="alert alert-danger mt-3 mb-0">
              {error}
            </div>
          )}

          {completed && (
            <div className="alert alert-success mt-3 mb-0">
              Both test results have been sent to the backend.

              <button
                className="btn btn-success btn-sm ms-3"
                onClick={() => navigate("/dashboard/comparison")}
              >
                View Comparison
              </button>
            </div>
          )}
        </div>
      </div>

      <VideoPlayer
        ref={playerRef}
        experimentConfig={config}
        video={video}
      />
    </div>
  );
}
