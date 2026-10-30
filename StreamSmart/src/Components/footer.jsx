
import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="stream-footer">
      <div className="container-fluid px-lg-5">

        <div className="footer-main">

          {/* Brand Section */}
          <div className="footer-brand-section">
            <Link to="/" className="footer-brand">
              <span className="footer-brand-icon">
                <i className="fa-solid fa-satellite-dish"></i>
              </span>
              Stream<span>Smart</span>
            </Link>

            <p className="footer-description">
              Smarter streaming through intelligent network optimization.
              Experience adaptive video quality and better playback performance.
            </p>
          </div>

          {/* Platform Links */}
          <div className="footer-column">
            <h6>Platform</h6>
            <Link to="/">Home</Link>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/player">Video Player</Link>
            <Link to="/analytics">Analytics</Link>
          </div>

          {/* Information */}
          <div className="footer-column">
            <h6>Information</h6>
            <Link to="/about">About Us</Link>
            <Link to="/security">Security</Link>
            <Link to="/contact">Contact Us</Link>
            <Link to="/session">Session History</Link>
          </div>

          {/* Technology */}
          <div className="footer-column">
            <h6>Technology</h6>
            <span>Adaptive Bitrate Streaming</span>
            <span>Network Monitoring</span>
            <span>Buffering Optimization</span>
            <span>Performance Analytics</span>
          </div>

        </div>

        {/* Bottom Section */}
        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} StreamSmart. All rights reserved.
          </p>

          <div className="footer-bottom-links">
            <Link to="/security">Privacy & Security</Link>
            <Link to="/contact">Support</Link>
          </div>

          <div className="footer-status">
            <span className="status-dot"></span>
            Platform Active
          </div>
        </div>

      </div>
    </footer>
  );
}
