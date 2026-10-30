
import { useRef, useState } from "react";
import {
  Activity,
  BarChart3,
  Clapperboard,
  LayoutDashboard,
  Network,
  Settings,
  Play,
  Wifi,
  Zap,
  Clock,
  Gauge,
  ChevronRight,
  Bell,
  Search,
} from "lucide-react";

import VideoPlayer from "./VideoPlayer";
import "./App.css";

function App() {
  const [activePage, setActivePage] = useState("Overview");

  // Latest telemetry received from Video Lab
  const [experimentMetrics, setExperimentMetrics] = useState(null);

  // Number of test sessions during this page visit
  const [sessionCount, setSessionCount] = useState(0);

  const lastSessionIdRef = useRef(null);

  const navigation = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "Video Lab", icon: Clapperboard },
    { name: "Network Lab", icon: Network },
    { name: "Analytics", icon: BarChart3 },
  ];

  // Receive telemetry updates from VideoPlayer
  const handleMetricsUpdate = (summary) => {
    setExperimentMetrics(summary);

    const isTestSession = summary.events?.some(
      (event) => event.type === "test_started"
    );

    if (
      isTestSession &&
      summary.sessionId &&
      lastSessionIdRef.current !== summary.sessionId
    ) {
      lastSessionIdRef.current = summary.sessionId;
      setSessionCount((count) => count + 1);
    }
  };

  const formatMetric = (value, suffix = "") => {
    if (
      value === null ||
      value === undefined ||
      !Number.isFinite(value)
    ) {
      return "--";
    }

    return `${value}${suffix}`;
  };

  const stats = [
    {
      title: "Playback Sessions",
      value: String(sessionCount),
      detail: "Sessions in this page visit",
      icon: Play,
    },
    {
      title: "Latest TTFF",
      value: formatMetric(
        experimentMetrics?.ttffSeconds !== null &&
          experimentMetrics?.ttffSeconds !== undefined
          ? experimentMetrics.ttffSeconds.toFixed(2)
          : null,
        "s"
      ),
      detail: "Time to first frame",
      icon: Clock,
    },
    {
      title: "Total Rebuffering",
      value: formatMetric(
        experimentMetrics?.totalRebufferDuration?.toFixed(2),
        "s"
      ),
      detail: "Latest experiment",
      icon: Wifi,
    },
    {
      title: "Quality Switches",
      value: formatMetric(
        experimentMetrics?.qualitySwitches ?? null
      ),
      detail: "Latest experiment",
      icon: Gauge,
    },
  ];

  const recentEvents = experimentMetrics?.events
    ?.slice(-5)
    .reverse() ?? [];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Activity size={23} />
          </div>

          <div>
            <h2>StreamSmart</h2>
            <span>STREAMING INTELLIGENCE</span>
          </div>
        </div>

        <div className="nav-section">
          <p className="nav-label">WORKSPACE</p>

          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`nav-item ${
                  activePage === item.name ? "active" : ""
                }`}
                onClick={() => setActivePage(item.name)}
              >
                <Icon size={19} />
                <span>{item.name}</span>

                {activePage === item.name && (
                  <ChevronRight
                    size={16}
                    className="nav-arrow"
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="sidebar-bottom">
          <button className="nav-item">
            <Settings size={19} />
            <span>Settings</span>
          </button>

          <div className="profile">
            <div className="avatar">SS</div>

            <div>
              <strong>StreamSmart User</strong>
              <span>Evaluator Account</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> {activePage}
          </div>

          <div className="topbar-actions">
            <button className="icon-button">
              <Search size={19} />
            </button>

            <button className="icon-button">
              <Bell size={19} />
            </button>

            <div className="status-indicator">
              <span className="status-dot"></span>
              System Ready
            </div>
          </div>
        </header>

        <section className="page-content">
          {/* Page Heading */}
          <div className="welcome-section">
            <div>
              <p className="eyebrow">
                STREAMING PERFORMANCE PLATFORM
              </p>

              <h1>{activePage}</h1>

              <p className="subtitle">
                Monitor, test and optimize your video streaming experience.
              </p>
            </div>

            <button
              className="primary-button"
              onClick={() => setActivePage("Video Lab")}
            >
              <Play size={17} fill="currentColor" />
              Start New Test
            </button>
          </div>

          {/* Overview Dashboard */}
          {activePage === "Overview" ? (
            <>
              {/* Statistics */}
              <div className="stats-grid">
                {stats.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <div className="stat-card" key={stat.title}>
                      <div className="stat-top">
                        <span>{stat.title}</span>

                        <div className="stat-icon">
                          <Icon size={20} />
                        </div>
                      </div>

                      <h2>{stat.value}</h2>
                      <p>{stat.detail}</p>
                    </div>
                  );
                })}
              </div>

              {/* Dashboard Panels */}
              <div className="dashboard-grid">
                {/* Video Lab Panel */}
                <div className="panel video-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Video Playback Lab</h3>
                      <p>
                        Run a streaming performance experiment
                      </p>
                    </div>

                    <Clapperboard size={21} />
                  </div>

                  <div className="video-placeholder">
                    <div className="play-circle">
                      <Play size={27} fill="currentColor" />
                    </div>

                    <h3>Ready to stream?</h3>

                    <p>
                      Select a video and start your first test.
                    </p>
                  </div>

                  <button
                    className="secondary-button"
                    onClick={() => setActivePage("Video Lab")}
                  >
                    Open Video Lab
                    <ChevronRight size={17} />
                  </button>
                </div>

                {/* Network Panel */}
                <div className="panel network-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Network Monitor</h3>
                      <p>Network simulation status</p>
                    </div>

                    <Network size={21} />
                  </div>

                  <div className="network-status">
                    <div className="network-visual">
                      <Wifi size={34} />
                    </div>

                    <h2>Not Connected</h2>

                    <p>
                      Network simulation is not configured yet.
                    </p>
                  </div>

                  <div className="network-footer">
                    <span>Simulation</span>
                    <strong>Inactive</strong>
                  </div>

                  <button
                    className="secondary-button"
                    onClick={() => setActivePage("Network Lab")}
                  >
                    Configure Network
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>

              {/* Recent Experiment Events */}
              <div className="panel activity-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Recent Experiment Events</h3>
                    <p>
                      Latest events from your streaming experiment
                    </p>
                  </div>

                  <Activity size={21} />
                </div>

                {recentEvents.length === 0 ? (
                  <div className="empty-state">
                    <Zap size={27} />
                    <p>No experiment events recorded yet.</p>
                    <span>
                      Start a test in Video Lab to see events here.
                    </span>
                  </div>
                ) : (
                  <div className="empty-state">
                    {recentEvents.map((event, index) => (
                      <div
                        key={`${event.type}-${index}`}
                        style={{
                          width: "100%",
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "12px",
                          padding: "10px 0",
                          borderBottom: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <strong>
                          {event.type.replaceAll("_", " ")}
                        </strong>

                        <span>
                          {(event.elapsedMs / 1000).toFixed(2)}s
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Latest Experiment Summary */}
              <div className="panel activity-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Latest Experiment Summary</h3>
                    <p>Live metrics from the latest test</p>
                  </div>

                  <Gauge size={21} />
                </div>

                {experimentMetrics ? (
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-top">
                        <span>Buffer Health</span>
                        <Activity size={19} />
                      </div>

                      <h2>
                        {formatMetric(
                          experimentMetrics.bufferLength?.toFixed(2),
                          "s"
                        )}
                      </h2>
                    </div>

                    <div className="stat-card">
                      <div className="stat-top">
                        <span>Estimated Throughput</span>
                        <Wifi size={19} />
                      </div>

                      <h2>
                        {formatMetric(
                          experimentMetrics.estimatedThroughput > 0
                            ? (
                                experimentMetrics.estimatedThroughput /
                                1_000_000
                              ).toFixed(2)
                            : null,
                          " Mbps"
                        )}
                      </h2>
                    </div>

                    <div className="stat-card">
                      <div className="stat-top">
                        <span>Current Resolution</span>
                        <Clapperboard size={19} />
                      </div>

                      <h2>
                        {experimentMetrics.resolution || "--"}
                      </h2>
                    </div>

                    <div className="stat-card">
                      <div className="stat-top">
                        <span>Rebuffer Count</span>
                        <Clock size={19} />
                      </div>

                      <h2>
                        {experimentMetrics.rebufferCount ?? 0}
                      </h2>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <Activity size={27} />
                    <p>No experiment summary available.</p>
                    <span>
                      Run a video test to populate these metrics.
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : activePage === "Video Lab" ? (
            <VideoPlayer
              onMetricsUpdate={handleMetricsUpdate}
            />
          ) : (
            <div className="panel placeholder-page">
              <div className="placeholder-icon">
                <Activity size={34} />
              </div>

              <h2>{activePage}</h2>

              <p>
                This workspace is ready for development.
                We will build this module step by step.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
