
import { useEffect, useMemo, useState } from "react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const NETWORK_PROFILES = [
  "Excellent",
  "Good",
  "Moderate",
  "Poor",
];

// Convert database values into valid numbers.
function readNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

// Calculate the average while ignoring missing values.
function average(values) {
  const validValues = values.filter(
    (value) => value !== null && value !== undefined
  );

  if (validValues.length === 0) {
    return null;
  }

  return (
    validValues.reduce((total, value) => total + value, 0) /
    validValues.length
  );
}

function formatNumber(value, digits = 2) {
  if (value === null || value === undefined) {
    return "—";
  }

  return Number(value).toFixed(digits);
}

function formatMbps(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${(value / 1000000).toFixed(2)} Mbps`;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// Use TTFF directly. If unavailable, look for the
// startup_waiting_ended event in the metrics.
function getStartupTime(experiment) {
  const metrics = experiment.metrics || {};

  const directValue = readNumber(metrics.ttffSeconds);

  if (directValue !== null) {
    return directValue;
  }

  const events = Array.isArray(metrics.events)
    ? metrics.events
    : [];

  const startupEvent = events.find(
    (event) => event.type === "startup_waiting_ended"
  );

  return readNumber(startupEvent?.durationSeconds);
}

// Convert MongoDB experiment documents into a consistent format.
function normalizeExperiment(experiment, index) {
  const video =
    experiment.video && typeof experiment.video === "object"
      ? experiment.video
      : null;

  const metrics = experiment.metrics || {};

  const videoId =
    video?._id ||
    experiment.video ||
    `unknown-video-${index}`;

  const videoTitle =
    video?.title ||
    `Video ${String(videoId).slice(-6)}`;

  return {
    id: experiment._id || `experiment-${index}`,

    videoId: String(videoId),
    videoTitle,

    mode: experiment.mode || "unknown",
    networkProfile: experiment.networkProfile || "Unknown",

    fixedQuality: experiment.fixedQuality,
    durationSeconds: readNumber(experiment.durationSeconds),

    status: experiment.status || "unknown",
    createdAt: experiment.createdAt || null,

    ttffSeconds: getStartupTime(experiment),

    rebufferCount: readNumber(metrics.rebufferCount),

    totalRebufferDuration: readNumber(
      metrics.totalRebufferDuration
    ),

    bufferLength: readNumber(metrics.bufferLength),

    currentBitrate: readNumber(metrics.currentBitrate),

    averageBitrate: readNumber(metrics.averageBitrate),

    estimatedThroughput: readNumber(
      metrics.estimatedThroughput
    ),

    resolution: metrics.resolution || "—",

    qualitySwitches: readNumber(metrics.qualitySwitches),
  };
}

// Summary card component.
function MetricCard({ title, value, description }) {
  return (
    <div className="col-12 col-sm-6 col-xl-3">
      <div className="card border-0 shadow-sm rounded-4 h-100">
        <div className="card-body p-4">
          <p className="text-secondary mb-2">{title}</p>

          <h3 className="fw-bold mb-2">{value}</h3>

          <small className="text-secondary">
            {description}
          </small>
        </div>
      </div>
    </div>
  );
}

// Custom tooltip for the rebuffer graph.
function RebufferTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      className="bg-white shadow rounded-3 p-3 border"
      style={{ minWidth: "190px" }}
    >
      <p className="fw-bold mb-2">{label}</p>

      {payload.map((item) => (
        <div
          key={item.dataKey}
          className="d-flex justify-content-between gap-4 mb-1"
        >
          <span style={{ color: item.color }}>
            {item.name}
          </span>

          <strong>
            {item.value === null || item.value === undefined
              ? "No data"
              : `${Number(item.value).toFixed(2)} sec`}
          </strong>
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const [experiments, setExperiments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [retryKey, setRetryKey] = useState(0);

  // Dashboard filters.
  const [selectedVideo, setSelectedVideo] = useState("all");
  const [selectedNetwork, setSelectedNetwork] = useState("all");
  const [selectedMode, setSelectedMode] = useState("all");

  // Fetch all experiment records from MongoDB.
  useEffect(() => {
    const controller = new AbortController();

    async function fetchExperiments() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/experiments`,
          {
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to fetch experiment analytics."
          );
        }

        // Supports different common backend response formats.
        const records = Array.isArray(data)
          ? data
          : data.experiments ??
            data.data?.experiments ??
            data.data ??
            [];

        if (!Array.isArray(records)) {
          throw new Error(
            "Invalid experiment data received from server."
          );
        }

        setExperiments(records);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Analytics fetch error:", err);

          setError(
            err.message || "Something went wrong."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchExperiments();

    return () => controller.abort();
  }, [retryKey]);

  // Normalize all database records.
  const normalizedExperiments = useMemo(() => {
    return experiments.map(normalizeExperiment);
  }, [experiments]);

  // Prepare unique video options for the video filter.
  const videoOptions = useMemo(() => {
    const uniqueVideos = new Map();

    normalizedExperiments.forEach((experiment) => {
      uniqueVideos.set(
        experiment.videoId,
        experiment.videoTitle
      );
    });

    return Array.from(
      uniqueVideos,
      ([id, title]) => ({ id, title })
    );
  }, [normalizedExperiments]);

  // Apply selected dashboard filters.
  const filteredExperiments = useMemo(() => {
    return normalizedExperiments.filter((experiment) => {
      const matchesVideo =
        selectedVideo === "all" ||
        experiment.videoId === selectedVideo;

      const matchesNetwork =
        selectedNetwork === "all" ||
        experiment.networkProfile === selectedNetwork;

      const matchesMode =
        selectedMode === "all" ||
        experiment.mode === selectedMode;

      return (
        matchesVideo &&
        matchesNetwork &&
        matchesMode
      );
    });
  }, [
    normalizedExperiments,
    selectedVideo,
    selectedNetwork,
    selectedMode,
  ]);

  // Calculate summary values.
  const summary = useMemo(() => {
    const uniqueVideoIds = new Set(
      filteredExperiments.map((item) => item.videoId)
    );

    return {
      videoCount: uniqueVideoIds.size,

      sessionCount: filteredExperiments.length,

      averageStartup: average(
        filteredExperiments.map(
          (item) => item.ttffSeconds
        )
      ),

      averageRebuffer: average(
        filteredExperiments.map(
          (item) => item.totalRebufferDuration
        )
      ),

      averageThroughput: average(
        filteredExperiments.map(
          (item) => item.estimatedThroughput
        )
      ),
    };
  }, [filteredExperiments]);

  // Group experiments by video.
  // Each video gets separate Baseline and Optimized records.
  const videoGroups = useMemo(() => {
    const groups = new Map();

    filteredExperiments.forEach((experiment) => {
      if (!groups.has(experiment.videoId)) {
        groups.set(experiment.videoId, {
          videoId: experiment.videoId,
          videoTitle: experiment.videoTitle,

          baseline: [],
          optimized: [],
        });
      }

      const group = groups.get(experiment.videoId);

      if (experiment.mode === "baseline") {
        group.baseline.push(experiment);
      }

      if (experiment.mode === "optimized") {
        group.optimized.push(experiment);
      }
    });

    return Array.from(groups.values()).map((group) => {
      const baselineRebuffer = average(
        group.baseline.map(
          (item) => item.totalRebufferDuration
        )
      );

      const optimizedRebuffer = average(
        group.optimized.map(
          (item) => item.totalRebufferDuration
        )
      );

      const baselineBitrate = average(
        group.baseline.map(
          (item) => item.averageBitrate
        )
      );

      const optimizedBitrate = average(
        group.optimized.map(
          (item) => item.averageBitrate
        )
      );

      let rebufferChange = null;

      if (
        baselineRebuffer !== null &&
        optimizedRebuffer !== null &&
        baselineRebuffer > 0
      ) {
        rebufferChange =
          ((baselineRebuffer - optimizedRebuffer) /
            baselineRebuffer) *
          100;
      }

      return {
        ...group,

        baselineRebuffer,
        optimizedRebuffer,

        baselineBitrate,
        optimizedBitrate,

        rebufferChange,
      };
    });
  }, [filteredExperiments]);

  // Prepare rebuffer comparison chart data.
  const rebufferChartData = useMemo(() => {
    return videoGroups.map((group) => ({
      video: group.videoTitle,

      Baseline: group.baselineRebuffer,
      Optimized: group.optimizedRebuffer,
    }));
  }, [videoGroups]);

  // Prepare bitrate comparison chart data.
  const bitrateChartData = useMemo(() => {
    return videoGroups.map((group) => ({
      video: group.videoTitle,

      Baseline:
        group.baselineBitrate === null
          ? null
          : group.baselineBitrate / 1000000,

      Optimized:
        group.optimizedBitrate === null
          ? null
          : group.optimizedBitrate / 1000000,
    }));
  }, [videoGroups]);

  // Check whether the selected records actually contain rebuffer data.
  const hasRebufferData = rebufferChartData.some(
    (item) =>
      item.Baseline !== null ||
      item.Optimized !== null
  );

  const hasBitrateData = bitrateChartData.some(
    (item) =>
      item.Baseline !== null ||
      item.Optimized !== null
  );

  return (
    <div className="container-fluid py-4 px-3 px-lg-4">

      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            Performance Analytics
          </h2>

          <p className="text-secondary mb-0">
            Analyze streaming performance across your tested videos.
          </p>
        </div>

        <button
          className="btn btn-outline-primary"
          onClick={() =>
            setRetryKey((previous) => previous + 1)
          }
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh Analytics"}
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-5 text-center">
            <div
              className="spinner-border text-primary mb-3"
              role="status"
            />

            <p className="text-secondary mb-0">
              Loading analytics from database...
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="alert alert-danger rounded-4">
          <h5 className="alert-heading">
            Unable to load analytics
          </h5>

          <p className="mb-3">{error}</p>

          <button
            className="btn btn-danger btn-sm"
            onClick={() =>
              setRetryKey((previous) => previous + 1)
            }
          >
            Try Again
          </button>
        </div>
      )}

      {/* Main Dashboard */}
      {!loading && !error && (
        <>
          {/* Filters */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-body p-3 p-lg-4">

              <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
                <h5 className="fw-bold mb-0">
                  Filter Analytics
                </h5>

                <button
                  className="btn btn-sm btn-light"
                  onClick={() => {
                    setSelectedVideo("all");
                    setSelectedNetwork("all");
                    setSelectedMode("all");
                  }}
                >
                  Clear Filters
                </button>
              </div>

              <div className="row g-3">

                {/* Video Filter */}
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold">
                    Select Video
                  </label>

                  <select
                    className="form-select"
                    value={selectedVideo}
                    onChange={(event) =>
                      setSelectedVideo(event.target.value)
                    }
                  >
                    <option value="all">
                      All Videos
                    </option>

                    {videoOptions.map((video) => (
                      <option
                        key={video.id}
                        value={video.id}
                      >
                        {video.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Network Filter */}
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold">
                    Network Profile
                  </label>

                  <select
                    className="form-select"
                    value={selectedNetwork}
                    onChange={(event) =>
                      setSelectedNetwork(event.target.value)
                    }
                  >
                    <option value="all">
                      All Networks
                    </option>

                    {NETWORK_PROFILES.map((network) => (
                      <option
                        key={network}
                        value={network}
                      >
                        {network}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mode Filter */}
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold">
                    Experiment Mode
                  </label>

                  <select
                    className="form-select"
                    value={selectedMode}
                    onChange={(event) =>
                      setSelectedMode(event.target.value)
                    }
                  >
                    <option value="all">
                      Baseline + Optimized
                    </option>

                    <option value="baseline">
                      Baseline
                    </option>

                    <option value="optimized">
                      Optimized
                    </option>
                  </select>
                </div>

              </div>
            </div>
          </div>

          {/* No Data State */}
          {filteredExperiments.length === 0 ? (
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body text-center py-5">
                <h5 className="fw-bold">
                  No Experiment Data Found
                </h5>

                <p className="text-secondary mb-0">
                  Run an experiment or change your selected filters.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="row g-3 mb-4">

                <MetricCard
                  title="Videos Tested"
                  value={summary.videoCount}
                  description="Unique videos in selected results"
                />

                <MetricCard
                  title="Total Test Sessions"
                  value={summary.sessionCount}
                  description="Experiment records from MongoDB"
                />

                <MetricCard
                  title="Average Startup Time"
                  value={
                    summary.averageStartup === null
                      ? "—"
                      : `${formatNumber(summary.averageStartup)} s`
                  }
                  description="Time to first frame, where recorded"
                />

                <MetricCard
                  title="Average Rebuffer Duration"
                  value={
                    summary.averageRebuffer === null
                      ? "—"
                      : `${formatNumber(summary.averageRebuffer)} s`
                  }
                  description="Average per experiment session"
                />

              </div>

              {/* Average Throughput */}
              <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-body p-4">
                  <p className="text-secondary mb-1">
                    Average Estimated Throughput
                  </p>

                  <h4 className="fw-bold mb-1">
                    {formatMbps(summary.averageThroughput)}
                  </h4>

                  <small className="text-secondary">
                    Based on the currently filtered experiment records.
                  </small>
                </div>
              </div>

              {/* Rebuffer Duration Comparison */}
              <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
                <div className="card-body p-3 p-lg-4">

                  {/* Graph Heading */}
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">

                    <div>
                      <h5 className="fw-bold mb-1">
                        Rebuffer Duration Comparison
                      </h5>

                      <p className="text-secondary small mb-0">
                        Compare buffering time for each video across both streaming modes.
                      </p>
                    </div>

                    {/* Graph Legend */}
                    <div className="d-flex gap-3 flex-wrap">

                      <span className="small d-flex align-items-center gap-2">
                        <span
                          className="rounded-circle"
                          style={{
                            width: 10,
                            height: 10,
                            backgroundColor: "#94a3b8",
                          }}
                        />
                        Baseline
                      </span>

                      <span className="small d-flex align-items-center gap-2">
                        <span
                          className="rounded-circle"
                          style={{
                            width: 10,
                            height: 10,
                            backgroundColor: "#16a34a",
                          }}
                        />
                        Optimized
                      </span>

                    </div>
                  </div>

                  {/* Horizontal Bar Chart */}
                  {!hasRebufferData ? (
                    <div className="text-center py-5">
                      <p className="fw-semibold mb-1">
                        No Rebuffer Data Available
                      </p>

                      <p className="text-secondary small mb-0">
                        Rebuffer duration has not been recorded for these experiments.
                      </p>
                    </div>
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: Math.max(
                          300,
                          rebufferChartData.length * 75 + 100
                        ),
                      }}
                    >
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <BarChart
                          data={rebufferChartData}
                          layout="vertical"
                          margin={{
                            top: 10,
                            right: 35,
                            left: 15,
                            bottom: 10,
                          }}
                          barGap={7}
                          barCategoryGap="28%"
                        >
                          <CartesianGrid
                            horizontal={false}
                            stroke="#e5e7eb"
                            strokeDasharray="4 4"
                          />

                          <XAxis
                            type="number"
                            tickLine={false}
                            axisLine={false}
                            tick={{
                              fill: "#64748b",
                              fontSize: 12,
                            }}
                            tickFormatter={(value) =>
                              `${value}s`
                            }
                            domain={[0, "auto"]}
                          />

                          <YAxis
                            type="category"
                            dataKey="video"
                            width={150}
                            tickLine={false}
                            axisLine={false}
                            tick={{
                              fill: "#334155",
                              fontSize: 12,
                              fontWeight: 500,
                            }}
                          />

                          <Tooltip
                            content={<RebufferTooltip />}
                            cursor={{
                              fill: "#f1f5f9",
                            }}
                          />

                          <Legend />

                          <Bar
                            dataKey="Baseline"
                            name="Baseline"
                            fill="#94a3b8"
                            radius={[0, 6, 6, 0]}
                            maxBarSize={22}
                          />

                          <Bar
                            dataKey="Optimized"
                            name="Optimized"
                            fill="#16a34a"
                            radius={[0, 6, 6, 0]}
                            maxBarSize={22}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div className="border-top pt-3 mt-3">
                    <small className="text-secondary">
                      <strong>How to read:</strong> Shorter bars mean less
                      time spent buffering. Compare videos with both
                      Baseline and Optimized data available for a fair comparison.
                    </small>
                  </div>

                </div>
              </div>

              {/* Average Bitrate Comparison */}
              <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-body p-3 p-lg-4">

                  <h5 className="fw-bold mb-1">
                    Average Bitrate Comparison
                  </h5>

                  <p className="text-secondary small mb-4">
                    Compare average streaming bitrate for each video.
                  </p>

                  {!hasBitrateData ? (
                    <div className="text-center py-5">
                      <p className="fw-semibold mb-1">
                        No Bitrate Data Available
                      </p>

                      <p className="text-secondary small mb-0">
                        Bitrate has not been recorded for these experiments.
                      </p>
                    </div>
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: Math.max(
                          300,
                          bitrateChartData.length * 75 + 100
                        ),
                      }}
                    >
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <BarChart
                          data={bitrateChartData}
                          layout="vertical"
                          margin={{
                            top: 10,
                            right: 35,
                            left: 15,
                            bottom: 10,
                          }}
                          barGap={7}
                          barCategoryGap="28%"
                        >
                          <CartesianGrid
                            horizontal={false}
                            stroke="#e5e7eb"
                            strokeDasharray="4 4"
                          />

                          <XAxis
                            type="number"
                            tickLine={false}
                            axisLine={false}
                            tick={{
                              fill: "#64748b",
                              fontSize: 12,
                            }}
                            tickFormatter={(value) =>
                              `${value} Mbps`
                            }
                          />

                          <YAxis
                            type="category"
                            dataKey="video"
                            width={150}
                            tickLine={false}
                            axisLine={false}
                            tick={{
                              fill: "#334155",
                              fontSize: 12,
                              fontWeight: 500,
                            }}
                          />

                          <Tooltip
                            formatter={(value) =>
                              value === null || value === undefined
                                ? "No data"
                                : `${Number(value).toFixed(2)} Mbps`
                            }
                          />

                          <Legend />

                          <Bar
                            dataKey="Baseline"
                            name="Baseline"
                            fill="#94a3b8"
                            radius={[0, 6, 6, 0]}
                            maxBarSize={22}
                          />

                          <Bar
                            dataKey="Optimized"
                            name="Optimized"
                            fill="#0d6efd"
                            radius={[0, 6, 6, 0]}
                            maxBarSize={22}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                </div>
              </div>

              {/* Video-wise Performance Table */}
              <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-body p-3 p-lg-4">

                  <h5 className="fw-bold mb-1">
                    Video-wise Performance
                  </h5>

                  <p className="text-secondary small mb-3">
                    Results grouped separately for every tested video.
                  </p>

                  <div className="table-responsive">
                    <table className="table table-hover align-middle">

                      <thead className="table-light">
                        <tr>
                          <th>Video</th>
                          <th>Baseline Runs</th>
                          <th>Optimized Runs</th>
                          <th>Baseline Rebuffer</th>
                          <th>Optimized Rebuffer</th>
                          <th>Change</th>
                        </tr>
                      </thead>

                      <tbody>
                        {videoGroups.map((group) => (
                          <tr key={group.videoId}>

                            <td className="fw-semibold">
                              {group.videoTitle}
                            </td>

                            <td>
                              {group.baseline.length}
                            </td>

                            <td>
                              {group.optimized.length}
                            </td>

                            <td>
                              {group.baselineRebuffer === null
                                ? "—"
                                : `${formatNumber(group.baselineRebuffer)} s`}
                            </td>

                            <td>
                              {group.optimizedRebuffer === null
                                ? "—"
                                : `${formatNumber(group.optimizedRebuffer)} s`}
                            </td>

                            <td>
                              {group.rebufferChange === null ? (
                                <span className="text-secondary">
                                  —
                                </span>
                              ) : (
                                <span
                                  className={
                                    group.rebufferChange >= 0
                                      ? "text-success fw-semibold"
                                      : "text-danger fw-semibold"
                                  }
                                >
                                  {group.rebufferChange >= 0
                                    ? "+"
                                    : ""}
                                  {formatNumber(group.rebufferChange)}%
                                </span>
                              )}
                            </td>

                          </tr>
                        ))}
                      </tbody>

                    </table>
                  </div>

                  <small className="text-secondary">
                    Change represents the percentage reduction in average
                    rebuffer duration. A positive value means Optimized
                    runs had less buffering than Baseline runs.
                  </small>

                </div>
              </div>

              {/* Experiment Records */}
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body p-3 p-lg-4">

                  <h5 className="fw-bold mb-3">
                    Experiment Records
                  </h5>

                  <div className="table-responsive">
                    <table className="table table-hover align-middle">

                      <thead className="table-light">
                        <tr>
                          <th>Video</th>
                          <th>Mode</th>
                          <th>Network</th>
                          <th>Resolution</th>
                          <th>Average Bitrate</th>
                          <th>Rebuffers</th>
                          <th>Quality Switches</th>
                          <th>Date</th>
                        </tr>
                      </thead>

                      <tbody>
                        {[...filteredExperiments]
                          .sort(
                            (a, b) =>
                              new Date(b.createdAt || 0) -
                              new Date(a.createdAt || 0)
                          )
                          .map((experiment) => (
                            <tr key={experiment.id}>

                              <td className="fw-semibold">
                                {experiment.videoTitle}
                              </td>

                              <td>
                                <span
                                  className={`badge ${
                                    experiment.mode === "optimized"
                                      ? "bg-success"
                                      : "bg-secondary"
                                  }`}
                                >
                                  {experiment.mode}
                                </span>
                              </td>

                              <td>
                                {experiment.networkProfile}
                              </td>

                              <td>
                                {experiment.resolution}
                              </td>

                              <td>
                                {formatMbps(
                                  experiment.averageBitrate
                                )}
                              </td>

                              <td>
                                {experiment.rebufferCount ?? "—"}
                              </td>

                              <td>
                                {experiment.qualitySwitches ?? "—"}
                              </td>

                              <td>
                                {formatDate(experiment.createdAt)}
                              </td>

                            </tr>
                          ))}
                      </tbody>

                    </table>
                  </div>

                </div>
              </div>

            </>
          )}
        </>
      )}
    </div>
  );
}
