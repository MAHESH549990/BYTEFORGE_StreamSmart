
import { Link } from "react-router-dom";
import { Play, ArrowRight } from "lucide-react";
import DashboardStats from "./DashboardStats";

export default function DashboardHome() {
  return (
    <div className="dashboard-home">
      <div className="dashboard-heading">
        <div>
          <p className="page-label">OVERVIEW</p>
          <h1>Dashboard</h1>
          <p>
            Monitor your streaming performance and run new tests.
          </p>
        </div>

        <Link to="/dashboard/videos" className="start-test-btn">
          <Play size={17} />
          Start New Test
        </Link>
      </div>

      <DashboardStats />

      <div className="dashboard-content-grid">
        <section className="dashboard-panel">
          <h3>Streaming Test</h3>
          <p>
            Select a video and test how different network
            conditions affect playback quality.
          </p>

          <Link to="/dashboard/videos" className="panel-link">
            Explore Videos <ArrowRight size={16} />
          </Link>
        </section>

        <section className="dashboard-panel">
          <h3>Network Lab</h3>
          <p>
            Configure bandwidth, latency, packet loss and
            network variation for your next test.
          </p>

          <Link to="/dashboard/network-lab" className="panel-link">
            Configure Network <ArrowRight size={16} />
          </Link>
        </section>
      </div>

      <section className="dashboard-panel recent-tests">
        <h3>Recent Test Sessions</h3>
        <p>
          Your completed streaming tests will appear here.
        </p>

        <Link to="/dashboard/history" className="panel-link">
          View Test History <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
