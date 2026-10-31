import { useCallback, useEffect, useState } from "react";

import {
  Server,
  Database,
  Activity,
  Zap,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  HardDrive,
  Layers3,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

import "./EdgeAnalytics.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const INITIAL_STATS = {
  requests: 0,
  hits: 0,
  misses: 0,
  originBytesFetched: 0,
  cacheBytesServed: 0,
  evictions: 0,
  cacheEntries: 0,
  cacheSizeMB: 0,
  hitRate: 0,
  maxCacheSizeMB: 128,
};

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const formatBytes = (bytes) => {
  const value = Number(bytes) || 0;

  if (value === 0) return "0 Bytes";

  const units = ["Bytes", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1
  );

  return `${(value / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
};

export default function EdgeAnalytics() {
  const [stats, setStats] = useState(INITIAL_STATS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch actual edge cache statistics.
  const fetchStats = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
        setRefreshing(true);
      }

      setError("");

      const response = await fetch(
        `${API_URL}/api/edge/stats`,
        {
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to fetch edge statistics"
        );
      }

      setStats({
        ...INITIAL_STATS,
        ...data.edge,
      });

      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Clear all cached resources.
  const handleClearCache = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear all cached video resources?"
    );

    if (!confirmed) return;

    try {
      setClearing(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/edge/cache`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to clear edge cache"
        );
      }

      setMessage("Edge cache cleared successfully.");

      await fetchStats(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setClearing(false);
    }
  };

  const hitRate = Math.min(
    100,
    Math.max(0, Number(stats.hitRate) || 0)
  );

  const missRate =
    stats.requests > 0
      ? Math.max(0, 100 - hitRate)
      : 0;

  const storagePercentage =
    stats.maxCacheSizeMB > 0
      ? Math.min(
          100,
          (stats.cacheSizeMB / stats.maxCacheSizeMB) * 100
        )
      : 0;

  return (
    <div className="edge-dashboard">

      {/* Header */}
      <header className="edge-header">

        <div className="edge-header-content">
          <span className="edge-eyebrow">
            STREAMSMART / INFRASTRUCTURE
          </span>

          <h2>Edge Server</h2>

          <p>
            Monitor video caching, resource delivery and
            edge server performance.
          </p>

          <div className="edge-server-status">
            <span className="edge-status-dot"></span>
            Edge API Connected
          </div>
        </div>

        <div className="edge-header-icon">
          <Server size={35} />
        </div>

      </header>

      {/* Alerts */}
      {error && (
        <div className="edge-alert edge-alert-error">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {message && (
        <div className="edge-alert edge-alert-success">
          <CheckCircle size={18} />
          {message}
        </div>
      )}

      {/* Statistics Heading */}
      <div className="edge-section-heading">
        <div>
          <h3>Cache Performance</h3>
          <p>Live statistics from your backend edge cache.</p>
        </div>

        <button
          className="edge-refresh-btn"
          onClick={() => fetchStats()}
          disabled={loading || refreshing}
        >
          <RefreshCw
            size={16}
            className={refreshing ? "edge-spinning" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Main Statistics */}
      <div className="edge-stats-grid">

        <div className="edge-stat-card">
          <div className="edge-stat-icon blue">
            <Activity size={21} />
          </div>

          <div>
            <span>Total Requests</span>
            <strong>
              {loading ? "..." : stats.requests.toLocaleString()}
            </strong>
            <small>Edge resource requests counted</small>
          </div>
        </div>

        <div className="edge-stat-card">
          <div className="edge-stat-icon green">
            <CheckCircle size={21} />
          </div>

          <div>
            <span>Cache Hits</span>
            <strong>
              {loading ? "..." : stats.hits.toLocaleString()}
            </strong>
            <small>Resources served from cache</small>
          </div>
        </div>

        <div className="edge-stat-card">
          <div className="edge-stat-icon orange">
            <Upload size={21} />
          </div>

          <div>
            <span>Cache Misses</span>
            <strong>
              {loading ? "..." : stats.misses.toLocaleString()}
            </strong>
            <small>Requests requiring origin fetching</small>
          </div>
        </div>

        <div className="edge-stat-card">
          <div className="edge-stat-icon purple">
            <Zap size={21} />
          </div>

          <div>
            <span>Cache Hit Rate</span>
            <strong>
              {loading ? "..." : `${hitRate.toFixed(2)}%`}
            </strong>
            <small>Cache request success ratio</small>
          </div>
        </div>

      </div>

      {/* Cache Overview */}
      <div className="edge-content-grid">

        <section className="edge-panel cache-overview">

          <div className="edge-panel-heading">
            <div>
              <h3>Cache Overview</h3>
              <p>Current memory utilization.</p>
            </div>

            <Database size={22} />
          </div>

          <div className="cache-storage-main">

            <div className="cache-storage-icon">
              <HardDrive size={27} />
            </div>

            <div>
              <strong>
                {loading
                  ? "..."
                  : `${stats.cacheSizeMB.toFixed(2)} MB`}
              </strong>

              <span>Currently Used</span>
            </div>

          </div>

          <div className="cache-progress-heading">
            <span>Storage Usage</span>

            <strong>
              {loading ? "--" : `${storagePercentage.toFixed(1)}%`}
            </strong>
          </div>

          <div className="edge-progress-track">
            <div
              className="edge-progress-fill"
              style={{
                width: `${storagePercentage}%`,
              }}
            ></div>
          </div>

          <div className="cache-storage-footer">
            <span>
              Maximum Capacity
            </span>

            <strong>
              {stats.maxCacheSizeMB} MB
            </strong>
          </div>

          <div className="cache-extra-stats">

            <div>
              <Layers3 size={17} />
              <span>Cached Entries</span>
              <strong>{stats.cacheEntries}</strong>
            </div>

            <div>
              <RefreshCw size={17} />
              <span>Cache Evictions</span>
              <strong>{stats.evictions}</strong>
            </div>

          </div>

        </section>

        {/* Cache Distribution */}
        <section className="edge-panel cache-distribution">

          <div className="edge-panel-heading">
            <div>
              <h3>Cache Distribution</h3>
              <p>Request delivery breakdown.</p>
            </div>

            <Activity size={22} />
          </div>

          <div className="distribution-main">
            <div
              className="distribution-circle"
              style={{
                background: `conic-gradient(
                  #16a34a ${hitRate}%,
                  #f97316 ${hitRate}% 100%
                )`,
              }}
            >
              <div className="distribution-inner">
                <strong>{loading ? "--" : `${hitRate.toFixed(1)}%`}</strong>
                <span>Hit Rate</span>
              </div>
            </div>
          </div>

          <div className="distribution-legend">

            <div>
              <span className="legend-dot green"></span>
              <span>Cache Hits</span>
              <strong>
                {stats.hits}
              </strong>
            </div>

            <div>
              <span className="legend-dot orange"></span>
              <span>Cache Misses</span>
              <strong>
                {stats.misses}
              </strong>
            </div>

          </div>

          <div className="distribution-note">
            {stats.requests === 0
              ? "Play an HLS video through the Edge Server to collect cache statistics."
              : `${missRate.toFixed(1)}% of counted cache requests were misses.`}
          </div>

        </section>

      </div>

      {/* Data Transfer Statistics */}
      <section className="edge-panel transfer-panel">

        <div className="edge-panel-heading">
          <div>
            <h3>Data Transfer Analytics</h3>
            <p>Origin and cached resource delivery.</p>
          </div>

          <Download size={22} />
        </div>

        <div className="transfer-grid">

          <div className="transfer-card">
            <div className="transfer-card-icon orange">
              <Download size={20} />
            </div>

            <div>
              <span>Origin Data Fetched</span>
              <strong>
                {loading
                  ? "..."
                  : formatBytes(stats.originBytesFetched)}
              </strong>
              <small>Data retrieved from origin</small>
            </div>
          </div>

          <div className="transfer-card">
            <div className="transfer-card-icon green">
              <Upload size={20} />
            </div>

            <div>
              <span>Cached Data Served</span>
              <strong>
                {loading
                  ? "..."
                  : formatBytes(stats.cacheBytesServed)}
              </strong>
              <small>Data delivered from cache</small>
            </div>
          </div>

        </div>

      </section>

      {/* Edge Actions */}
      <section className="edge-panel edge-actions-panel">

        <div>
          <h3>Edge Server Management</h3>
          <p>
            Manage cached video resources on your edge server.
          </p>
        </div>

        <button
          className="edge-clear-btn"
          onClick={handleClearCache}
          disabled={
            clearing ||
            loading ||
            stats.cacheEntries === 0
          }
        >
          <Trash2 size={17} />

          {clearing ? "Clearing..." : "Clear Edge Cache"}
        </button>

      </section>

      {/* Footer */}
      <div className="edge-footer">
        <span>
          <span className="edge-footer-dot"></span>
          StreamSmart Edge Monitoring
        </span>

        <span>
          Last updated:{" "}
          {lastUpdated
            ? lastUpdated.toLocaleTimeString("en-IN")
            : "--"}
        </span>
      </div>

    </div>
  );
}