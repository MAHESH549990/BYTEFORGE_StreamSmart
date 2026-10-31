
import { useState } from "react";
import {
  Wifi,
  Activity,
  Gauge,
  Clock,
  Signal,
  RotateCcw,
  Play,
  CheckCircle
} from "lucide-react";
import "./NetworkLab.css";

const profiles = {
  Excellent: {
    bandwidth: 50,
    latency: 20,
    packetLoss: 0,
    description: "Excellent network conditions"
  },
  Good: {
    bandwidth: 20,
    latency: 50,
    packetLoss: 1,
    description: "Good broadband connection"
  },
  Moderate: {
    bandwidth: 5,
    latency: 100,
    packetLoss: 2,
    description: "Limited network bandwidth"
  },
  Poor: {
    bandwidth: 1,
    latency: 250,
    packetLoss: 5,
    description: "Slow and unstable connection"
  },
  Custom: {
    bandwidth: 10,
    latency: 100,
    packetLoss: 1,
    description: "Customize your own network"
  }
};

export default function NetworkLab() {
  const [profile, setProfile] = useState("Good");
  const [settings, setSettings] = useState(profiles.Good);
  const [appliedSettings, setAppliedSettings] = useState(null);

  const selectProfile = (name) => {
    setProfile(name);
    setSettings({ ...profiles[name] });
    setAppliedSettings(null);
  };

  const updateSetting = (key, value) => {
    setProfile("Custom");
    setSettings((prev) => ({
      ...prev,
      [key]: Number(value)
    }));
    setAppliedSettings(null);
  };

  const applySettings = () => {
    setAppliedSettings({ ...settings });
  };

  const resetSettings = () => {
    setProfile("Good");
    setSettings({ ...profiles.Good });
    setAppliedSettings(null);
  };

  return (
    <div className="network-lab">
      <div className="network-header">
        <div>
          <span className="network-eyebrow">STREAMSMART / TESTING</span>
          <h2>Network Lab</h2>
          <p>
            Configure network conditions and study their impact
            on video streaming performance.
          </p>
        </div>

        <div className="network-header-icon">
          <Wifi size={30} />
        </div>
      </div>

      <div className="network-section">
        <div className="section-heading">
          <div>
            <h3>Network Profiles</h3>
            <p>Select a predefined network condition.</p>
          </div>
          <Signal size={21} />
        </div>

        <div className="network-profiles">
          {Object.keys(profiles).map((name) => (
            <button
              key={name}
              className={`profile-card ${
                profile === name ? "active" : ""
              }`}
              onClick={() => selectProfile(name)}
            >
              <span className="profile-name">{name}</span>
              <span className="profile-description">
                {profiles[name].description}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="network-section">
        <div className="section-heading">
          <div>
            <h3>Configure Network</h3>
            <p>Adjust the network parameters for your test.</p>
          </div>
          <Gauge size={21} />
        </div>

        <div className="network-controls">
          <div className="network-control">
            <div className="control-top">
              <label htmlFor="bandwidth">Bandwidth</label>
              <strong>{settings.bandwidth} Mbps</strong>
            </div>
            <input
              id="bandwidth"
              type="range"
              min="0.5"
              max="50"
              step="0.5"
              value={settings.bandwidth}
              onChange={(e) =>
                updateSetting("bandwidth", e.target.value)
              }
            />
            <div className="range-labels">
              <span>0.5 Mbps</span>
              <span>50 Mbps</span>
            </div>
          </div>

          <div className="network-control">
            <div className="control-top">
              <label htmlFor="latency">Latency</label>
              <strong>{settings.latency} ms</strong>
            </div>
            <input
              id="latency"
              type="range"
              min="0"
              max="500"
              step="10"
              value={settings.latency}
              onChange={(e) =>
                updateSetting("latency", e.target.value)
              }
            />
            <div className="range-labels">
              <span>0 ms</span>
              <span>500 ms</span>
            </div>
          </div>

          <div className="network-control">
            <div className="control-top">
              <label htmlFor="packetLoss">Packet Loss</label>
              <strong>{settings.packetLoss}%</strong>
            </div>
            <input
              id="packetLoss"
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={settings.packetLoss}
              onChange={(e) =>
                updateSetting("packetLoss", e.target.value)
              }
            />
            <div className="range-labels">
              <span>0%</span>
              <span>20%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="network-summary">
        <div className="section-heading">
          <div>
            <h3>Network Configuration</h3>
            <p>Review your selected test conditions.</p>
          </div>
          <Activity size={21} />
        </div>

        <div className="network-summary-grid">
          <div className="summary-card">
            <Gauge />
            <span>Bandwidth</span>
            <strong>{settings.bandwidth} Mbps</strong>
          </div>

          <div className="summary-card">
            <Clock />
            <span>Latency</span>
            <strong>{settings.latency} ms</strong>
          </div>

          <div className="summary-card">
            <Activity />
            <span>Packet Loss</span>
            <strong>{settings.packetLoss}%</strong>
          </div>
        </div>

        <div className="network-actions">
          <button
            className="apply-network-btn"
            onClick={applySettings}
          >
            <Play size={17} />
            Apply Configuration
          </button>

          <button
            className="reset-network-btn"
            onClick={resetSettings}
          >
            <RotateCcw size={17} />
            Reset
          </button>
        </div>

        {appliedSettings && (
          <div className="network-success">
            <CheckCircle size={18} />
            Configuration applied successfully. Ready for simulation.
          </div>
        )}
      </div>

      <div className="network-note">
        <strong>Simulation Notice</strong>
        <p>
          These settings represent simulated network conditions.
          They do not change your actual internet connection.
        </p>
      </div>
    </div>
  );
}
