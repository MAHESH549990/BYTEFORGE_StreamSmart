import { useEffect, useState } from "react";
import {
  History,
  Activity,
  CheckCircle,
  FlaskConical,
  Search,
  Clock,
  Gauge,
  Wifi,
  RefreshCw,
  Film,
  TrendingUp,
} from "lucide-react";

import "./TestHistory.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const formatDate = (date) => {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatValue = (value, suffix = "") => {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "--";
  }

  return `${Number(value).toFixed(2)}${suffix}`;
};

const formatBitrate = (value) => {
  if (!Number.isFinite(Number(value)) || Number(value) <= 0) {
    return "--";
  }

  // Experiment metrics generally store bitrate in bits per second.
  return `${(Number(value) / 1000000).toFixed(2)} Mbps`;
};

export default function TestHistory() {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const fetchExperiments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/experiments`,
        {
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to fetch experiment history"
        );
      }

      setExperiments(data.experiments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  // Filter experiments by mode and video title.
  const filteredExperiments = experiments.filter((experiment) => {
    const videoTitle =
      typeof experiment.video === "object"
        ? experiment.video?.title || ""
        : "";

    const matchesSearch = videoTitle
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesFilter =
      filter === "All" ||
      experiment.mode?.toLowerCase() === filter.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  const completedExperiments = experiments.filter(
    (item) => item.status === "completed"
  );

  const baselineCount = experiments.filter(
    (item) => item.mode === "baseline"
  ).length;

  const optimizedCount = experiments.filter(
    (item) => item.mode === "optimized"
  ).length;

  return (
    <div className="test-history-page">

      {/* Header */}
      <div className="history-header">
        <div>
          <span className="history-eyebrow">
            STREAMSMART / ANALYTICS
          </span>

          <h2>Test History</h2>

          <p>
            Review your previous streaming experiments and
            analyze their performance.
          </p>
        </div>

        <button
          className="history-refresh-btn"
          onClick={fetchExperiments}
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={loading ? "refresh-spinning" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="history-error">
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="history-stats">

        <div className="history-stat-card">
          <div className="history-stat-icon blue">
            <History size={21} />
          </div>

          <div>
            <span>Total Experiments</span>
            <strong>{experiments.length}</strong>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-icon green">
            <CheckCircle size={21} />
          </div>

          <div>
            <span>Completed Tests</span>
            <strong>{completedExperiments.length}</strong>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-icon orange">
            <FlaskConical size={21} />
          </div>

          <div>
            <span>Baseline Tests</span>
            <strong>{baselineCount}</strong>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-icon purple">
            <TrendingUp size={21} />
          </div>

          <div>
            <span>Optimized Tests</span>
            <strong>{optimizedCount}</strong>
          </div>
        </div>

      </div>

      {/* History Section */}
      <section className="history-section">

        <div className="history-section-header">
          <div>
            <h3>Previous Experiments</h3>
            <p>
              Your saved video streaming test results.
            </p>
          </div>

          <span className="history-count">
            {filteredExperiments.length} Results
          </span>
        </div>

        {/* Search and filters */}
        <div className="history-toolbar">

          <div className="history-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search by video title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="history-filter"
          >
            <option value="All">All Experiments</option>
            <option value="baseline">Baseline</option>
            <option value="optimized">Optimized</option>
          </select>

        </div>

        {/* Experiment records */}
        {loading ? (
          <div className="history-loading">
            <RefreshCw size={25} className="refresh-spinning" />
            <p>Loading experiment history...</p>
          </div>
        ) : filteredExperiments.length === 0 ? (
          <div className="history-empty">
            <Film size={42} />

            <h3>No experiments found</h3>

            <p>
              Complete a streaming experiment to see its
              results here.
            </p>
          </div>
        ) : (
          <div className="experiment-list">

            {filteredExperiments.map((experiment) => {
              const metrics = experiment.metrics || {};

              const videoTitle =
                typeof experiment.video === "object"
                  ? experiment.video?.title
                  : null;

              return (
                <article
                  className="experiment-history-card"
                  key={experiment._id}
                >

                  {/* Card Header */}
                  <div className="experiment-card-header">

                    <div className="experiment-title">
                      <div className="experiment-video-icon">
                        <Film size={20} />
                      </div>

                      <div>
                        <h4>
                          {videoTitle || "Video Experiment"}
                        </h4>

                        <span>
                          <Clock size={13} />
                          {formatDate(experiment.createdAt)}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`experiment-status ${
                        experiment.status === "completed"
                          ? "completed"
                          : "pending"
                      }`}
                    >
                      {experiment.status || "Unknown"}
                    </span>

                  </div>

                  {/* Experiment Information */}
                  <div className="experiment-info">

                    <div>
                      <span>Experiment Mode</span>

                      <strong
                        className={
                          experiment.mode === "optimized"
                            ? "optimized-text"
                            : "baseline-text"
                        }
                      >
                        {experiment.mode?.toUpperCase() || "--"}
                      </strong>
                    </div>

                    <div>
                      <span>Network Profile</span>

                      <strong>
                        <Wifi size={14} />
                        {experiment.networkProfile || "--"}
                      </strong>
                    </div>

                    <div>
                      <span>Test Duration</span>

                      <strong>
                        {formatValue(
                          experiment.durationSeconds,
                          " sec"
                        )}
                      </strong>
                    </div>

                    {experiment.mode === "baseline" && (
                      <div>
                        <span>Fixed Quality</span>

                        <strong>
                          {experiment.fixedQuality ?? "--"}
                        </strong>
                      </div>
                    )}

                  </div>

                  {/* Performance Metrics */}
                  <div className="experiment-metrics">

                    <div className="experiment-metric">
                      <Clock size={17} />
                      <span>TTFF</span>

                      <strong>
                        {metrics.ttffSeconds === null
                          ? "--"
                          : `${formatValue(metrics.ttffSeconds, " s")}`}
                      </strong>
                    </div>

                    <div className="experiment-metric">
                      <Activity size={17} />
                      <span>Rebuffer Count</span>

                      <strong>
                        {metrics.rebufferCount ?? "--"}
                      </strong>
                    </div>

                    <div className="experiment-metric">
                      <Gauge size={17} />
                      <span>Rebuffer Duration</span>

                      <strong>
                        {formatValue(
                          metrics.totalRebufferDuration,
                          " s"
                        )}
                      </strong>
                    </div>

                    <div className="experiment-metric">
                      <TrendingUp size={17} />
                      <span>Average Bitrate</span>

                      <strong>
                        {formatBitrate(metrics.averageBitrate)}
                      </strong>
                    </div>

                    <div className="experiment-metric">
                      <Activity size={17} />
                      <span>Quality Switches</span>

                      <strong>
                        {metrics.qualitySwitches ?? "--"}
                      </strong>
                    </div>

                    <div className="experiment-metric">
                      <Wifi size={17} />
                      <span>Resolution</span>

                      <strong>
                        {metrics.resolution || "--"}
                      </strong>
                    </div>

                  </div>

                </article>
              );
            })}

          </div>
        )}

      </section>
    </div>
  );
}