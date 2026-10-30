
import { useState } from "react";
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

import "./App.css";

function App() {
  const [activePage, setActivePage] = useState("Overview");

  const navigation = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "Video Lab", icon: Clapperboard },
    { name: "Network Lab", icon: Network },
    { name: "Analytics", icon: BarChart3 },
  ];

  const stats = [
    {
      title: "Playback Sessions",
      value: "0",
      detail: "Total test sessions",
      icon: Play,
    },
    {
      title: "Average Buffering",
      value: "0.0s",
      detail: "Buffering duration",
      icon: Clock,
    },
    {
      title: "Network Speed",
      value: "-- Mbps",
      detail: "Current bandwidth",
      icon: Wifi,
    },
    {
      title: "Optimization Score",
      value: "--",
      detail: "Performance score",
      icon: Gauge,
    },
  ];

  return (
    <div className="app-container">
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
                  <ChevronRight size={16} className="nav-arrow" />
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
          <div className="welcome-section">
            <div>
              <p className="eyebrow">STREAMING PERFORMANCE PLATFORM</p>
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

          {activePage === "Overview" ? (
            <>
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

              <div className="dashboard-grid">
                <div className="panel video-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Video Playback Lab</h3>
                      <p>Run a streaming performance experiment</p>
                    </div>
                    <Clapperboard size={21} />
                  </div>

                  <div className="video-placeholder">
                    <div className="play-circle">
                      <Play size={27} fill="currentColor" />
                    </div>
                    <h3>Ready to stream?</h3>
                    <p>Select a video and start your first test.</p>
                  </div>

                  <button
                    className="secondary-button"
                    onClick={() => setActivePage("Video Lab")}
                  >
                    Open Video Lab <ChevronRight size={17} />
                  </button>
                </div>

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
                    <p>Start a test to monitor network conditions.</p>
                  </div>

                  <div className="network-footer">
                    <span>Simulation</span>
                    <strong>Inactive</strong>
                  </div>

                  <button
                    className="secondary-button"
                    onClick={() => setActivePage("Network Lab")}
                  >
                    Configure Network <ChevronRight size={17} />
                  </button>
                </div>
              </div>

              <div className="panel activity-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Recent Test Sessions</h3>
                    <p>Your latest streaming experiments</p>
                  </div>
                  <Activity size={21} />
                </div>

                <div className="empty-state">
                  <Zap size={27} />
                  <p>No test sessions recorded yet.</p>
                  <span>Your experiment history will appear here.</span>
                </div>
              </div>
            </>
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
