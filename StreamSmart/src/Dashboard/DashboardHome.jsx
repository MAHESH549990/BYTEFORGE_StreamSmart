import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  Play,
  ArrowRight,
  Video,
  Network,
  SlidersHorizontal,
  Activity,
  GitCompareArrows,
  History,
  Zap,
  Clock3,
  Database,
  RefreshCw,
} from "lucide-react";

import "./DashboardHome.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

// Safely convert database values into numbers.
function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

// Get the first available numeric value.
function firstNumber(values) {
  for (const value of values) {
    const number = toNumber(value);

    if (number !== null) {
      return number;
    }
  }

  return null;
}

// Calculate average while ignoring missing metrics.
function calculateAverage(values) {
  const validValues = values.filter(
    (value) => value !== null && value !== undefined
  );

  if (!validValues.length) {
    return null;
  }

  return (
    validValues.reduce((total, value) => total + value, 0) /
    validValues.length
  );
}

// Get startup time from TTFF or startup event.
function getStartupTime(experiment) {
  const metrics = experiment.metrics || {};

  const directValue = toNumber(metrics.ttffSeconds);

  if (directValue !== null) {
    return directValue;
  }

  const events = Array.isArray(metrics.events)
    ? metrics.events
    : [];

  const startupEvent = events.find(
    (event) => event.type === "startup_waiting_ended"
  );

  return toNumber(startupEvent?.durationSeconds);
}

// Get average bitrate from saved experiment metrics.
function getAverageBitrate(experiment) {
  const metrics = experiment.metrics || {};

  return firstNumber([
    metrics.averageBitrate,
  ]);
}

// Get cache information from possible stored metric structures.
// Returns null when cache results were not recorded.
function getCacheData(experiment) {
  const metrics = experiment.metrics || {};

  const cache =
    metrics.cache ||
    metrics.cacheMetrics ||
    metrics.cacheStats ||
    {};

  const hits = firstNumber([
    metrics.cacheHits,
    metrics.cacheHitCount,
    cache.hits,
    cache.cacheHits,
  ]);

  const misses = firstNumber([
    metrics.cacheMisses,
    metrics.cacheMissCount,
    cache.misses,
    cache.cacheMisses,
  ]);

  // Prefer actual hit/miss counts when available.
  if (hits !== null && misses !== null && hits + misses > 0) {
    return {
      hits,
      misses,
      rate: (hits / (hits + misses)) * 100,
    };
  }

  // Otherwise use a stored hit rate.
  const directRate = firstNumber([
    metrics.cacheHitRate,
    cache.hitRate,
    cache.cacheHitRate,
  ]);

  if (directRate !== null) {
    return {
      hits: null,
      misses: null,
      rate:
        directRate >= 0 && directRate <= 1
          ? directRate * 100
          : directRate,
    };
  }

  return null;
}

// Calculate all dashboard metrics from completed experiment records.
function calculateDashboardStats(records) {
  const completedRecords = records.filter(
    (record) =>
      String(record.status || "").toLowerCase() === "completed"
  );

  const startupTimes = completedRecords.map(getStartupTime);

  const bufferingTimes = completedRecords.map((record) =>
    toNumber(record.metrics?.totalRebufferDuration)
  );

  // Collect average bitrate from completed experiments.
  const bitrateValues = completedRecords
    .map(getAverageBitrate)
    .filter((value) => value !== null && value > 0);

  // Aggregate cache hits and misses where both counts are recorded.
  const cacheRecords = completedRecords
    .map(getCacheData)
    .filter(Boolean);

  const countRecords = cacheRecords.filter(
    (item) => item.hits !== null && item.misses !== null
  );

  let cacheHitRate = null;

  if (countRecords.length > 0) {
    const totalHits = countRecords.reduce(
      (sum, item) => sum + item.hits,
      0
    );

    const totalRequests = countRecords.reduce(
      (sum, item) => sum + item.hits + item.misses,
      0
    );

    if (totalRequests > 0) {
      cacheHitRate = (totalHits / totalRequests) * 100;
    }
  } else {
    cacheHitRate = calculateAverage(
      cacheRecords.map((item) => item.rate)
    );
  }

  return {
    totalTests: completedRecords.length,

    averageStartupTime: calculateAverage(startupTimes),

    averageBufferingDuration:
      calculateAverage(bufferingTimes),

    // Average bitrate in bits per second.
    averageBitrate: calculateAverage(bitrateValues),

    cacheHitRate,
  };
}

function formatSeconds(value) {
  return value === null
    ? "--"
    : `${value.toFixed(2)}s`;
}

// Format bitrate into a readable unit.
function formatBitrate(value) {
  if (value === null || value === undefined || value <= 0) {
    return "--";
  }

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)} Mbps`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} Kbps`;
  }

  return `${value.toFixed(0)} bps`;
}

// Dynamic dashboard statistic card.
function DashboardStatCard({
  title,
  value,
  description,
  icon: Icon,
  color,
}) {
  return (
    <article className="dynamic-stat-card">
      <div className="dynamic-stat-top">
        <div className={`dynamic-stat-icon ${color}`}>
          <Icon size={21} />
        </div>

        <span className="dynamic-stat-indicator">
          LIVE DATA
        </span>
      </div>

      <p className="dynamic-stat-title">{title}</p>

      <h2 className="dynamic-stat-value">{value}</h2>

      <p className="dynamic-stat-description">
        {description}
      </p>
    </article>
  );
}

export default function DashboardHome() {
  const [experiments, setExperiments] = useState([]);

  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch experiment records from the backend.
  useEffect(() => {
    const controller = new AbortController();

    async function fetchDashboardData() {
      try {
        setLoadingStats(true);
        setStatsError("");

        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Please log in to view dashboard statistics.");
        }

        const response = await fetch(
          `${API_URL}/api/experiments`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load dashboard statistics."
          );
        }

        // Supports common backend response structures.
        const records = Array.isArray(data)
          ? data
          : data.experiments ??
            data.data?.experiments ??
            data.data ??
            [];

        if (!Array.isArray(records)) {
          throw new Error("Invalid experiment records received.");
        }

        setExperiments(records);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Dashboard statistics error:", error);
          setStatsError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingStats(false);
        }
      }
    }

    fetchDashboardData();

    return () => controller.abort();
  }, [refreshKey]);

  // Recalculate whenever experiment data changes.
  const stats = useMemo(
    () => calculateDashboardStats(experiments),
    [experiments]
  );

  const refreshDashboard = () => {
    setRefreshKey((previous) => previous + 1);
  };

  return (
    <div className="dashboard-home">

      {/* Page Heading */}
      <header className="dashboard-heading">
        <div>
          <p className="page-label">
            STREAMING WORKSPACE
          </p>

          <h1>Dashboard</h1>

          <p className="dashboard-intro">
            Monitor streaming performance, test network conditions
            and understand how StreamSmart optimizes playback.
          </p>
        </div>

        <div className="dashboard-heading-actions">
          <button
            type="button"
            className="dashboard-refresh-btn"
            onClick={refreshDashboard}
            disabled={loadingStats}
          >
            <RefreshCw
              size={16}
              className={loadingStats ? "refresh-spinning" : ""}
            />
            Refresh
          </button>

          <Link
            to="/dashboard/videos"
            className="start-test-btn"
          >
            <Play size={16} fill="currentColor" />
            Start New Test
          </Link>
        </div>
      </header>

      {/* Dynamic Summary Statistics */}
      <section className="dashboard-stats-section">

        {statsError && (
          <div className="dashboard-stats-error">
            <span>{statsError}</span>

            <button onClick={refreshDashboard}>
              Try Again
            </button>
          </div>
        )}

        <div className="dynamic-stat-grid">

          <DashboardStatCard
            title="Total Tests"
            value={
              loadingStats
                ? "..."
                : stats.totalTests
            }
            description="Completed test sessions"
            icon={Video}
            color="stat-blue"
          />

          <DashboardStatCard
            title="Avg. Startup Time"
            value={
              loadingStats
                ? "..."
                : formatSeconds(stats.averageStartupTime)
            }
            description="Average time to first frame"
            icon={Clock3}
            color="stat-purple"
          />

          <DashboardStatCard
            title="Buffering Duration"
            value={
              loadingStats
                ? "..."
                : formatSeconds(stats.averageBufferingDuration)
            }
            description="Average per completed test"
            icon={Activity}
            color="stat-orange"
          />

          {/* Average Bitrate */}
          <DashboardStatCard
            title="Average Bitrate"
            value={
              loadingStats
                ? "..."
                : formatBitrate(stats.averageBitrate)
            }
            description="Average streaming bitrate"
            icon={Zap}
            color="stat-blue"
          />

          <DashboardStatCard
            title="Cache Hit Rate"
            value={
              loadingStats
                ? "..."
                : stats.cacheHitRate === null
                  ? "Not recorded"
                  : `${stats.cacheHitRate.toFixed(1)}%`
            }
            description="Simulated cache results"
            icon={Database}
            color="stat-green"
          />

        </div>
      </section>

      {/* Streaming Workspace */}
      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div>
            <h2>Streaming Workspace</h2>
            <p>Manage video playback and network conditions.</p>
          </div>
        </div>

        <div className="dashboard-content-grid">

          <article className="dashboard-panel feature-panel">
            <div className="panel-top">
              <div className="panel-icon video-icon">
                <Video size={21} />
              </div>

              <span className="panel-category">
                PLAYBACK
              </span>
            </div>

            <h3>Video Player</h3>

            <p>
              Select a video and monitor playback, resolution,
              bitrate, buffering and quality changes.
            </p>

            <Link
              to="/dashboard/player"
              className="panel-link"
            >
              Open Video Player <ArrowRight size={16} />
            </Link>
          </article>

          <article className="dashboard-panel feature-panel">
            <div className="panel-top">
              <div className="panel-icon network-icon">
                <Network size={21} />
              </div>

              <span className="panel-category">
                NETWORK
              </span>
            </div>

            <h3>Network Controls</h3>

            <p>
              Configure bandwidth, latency, packet loss and
              network scenarios for your next streaming test.
            </p>

            <Link
              to="/dashboard/network-lab"
              className="panel-link"
            >
              Configure Network <ArrowRight size={16} />
            </Link>
          </article>

        </div>
      </section>

      {/* Streaming Intelligence */}
      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div>
            <h2>Streaming Intelligence</h2>

            <p>
              Explore the systems responsible for playback optimization.
            </p>
          </div>
        </div>

        <div className="dashboard-content-grid">

          <article className="dashboard-panel">
            <div className="panel-top">
              <div className="panel-icon quality-icon">
                <Zap size={21} />
              </div>

              <span className="panel-category">
                OPTIMIZATION
              </span>
            </div>

            <h3>Adaptive Quality</h3>

            <p>
              See how the custom Adaptive Bitrate algorithm
              selects video quality based on network conditions.
            </p>

            <Link
              to="/dashboard/video-quality"
              className="panel-link"
            >
              View Quality Analytics <ArrowRight size={16} />
            </Link>
          </article>

          <article className="dashboard-panel">
            <div className="panel-top">
              <div className="panel-icon analytics-icon">
                <Activity size={21} />
              </div>

              <span className="panel-category">
                PERFORMANCE
              </span>
            </div>

            <h3>Buffering Analytics</h3>

            <p>
              Analyze startup time, rebuffer events, buffer length
              and total buffering duration.
            </p>

            <Link
              to="/dashboard/analytics"
              className="panel-link"
            >
              View Analytics <ArrowRight size={16} />
            </Link>
          </article>

        </div>
      </section>

      {/* Test Results */}
      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div>
            <h2>Test Results</h2>

            <p>
              Compare streaming approaches and review previous tests.
            </p>
          </div>
        </div>

        <div className="dashboard-content-grid">

          <article className="dashboard-panel">
            <div className="panel-top">
              <div className="panel-icon comparison-icon">
                <GitCompareArrows size={21} />
              </div>

              <span className="panel-category">
                COMPARISON
              </span>
            </div>

            <h3>Fixed vs Optimized</h3>

            <p>
              Compare baseline fixed-quality playback against
              StreamSmart's adaptive quality strategy.
            </p>

            <Link
              to="/dashboard/comparison"
              className="panel-link"
            >
              Compare Performance <ArrowRight size={16} />
            </Link>
          </article>

          <article className="dashboard-panel">
            <div className="panel-top">
              <div className="panel-icon history-icon">
                <History size={21} />
              </div>

              <span className="panel-category">
                RECORDS
              </span>
            </div>

            <h3>Session History</h3>

            <p>
              Review completed tests and their recorded playback
              performance metrics.
            </p>

            <Link
              to="/dashboard/history"
              className="panel-link"
            >
              View Test History <ArrowRight size={16} />
            </Link>
          </article>

        </div>
      </section>

      {/* Experiment Banner */}
      <section className="experiment-banner">
        <div className="experiment-banner-icon">
          <SlidersHorizontal size={23} />
        </div>

        <div className="experiment-banner-content">
          <h3>Run a controlled experiment</h3>

          <p>
            Compare baseline and optimized playback using
            the same video and network conditions.
          </p>
        </div>

        <Link
          to="/dashboard/experiment"
          className="experiment-link"
        >
          Open Experiments <ArrowRight size={16} />
        </Link>
      </section>

    </div>
  );
}