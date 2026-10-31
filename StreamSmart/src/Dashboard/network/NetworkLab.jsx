import { useState } from "react";

import {
  getNetworkSimulation,
  applyNetworkSimulation,
  clearNetworkSimulation,
} from "../../utils/networkSimulation";

import VideoPlayer from "../../videos/VideoPlayer";

import {
  Wifi,
  Activity,
  Gauge,
  Clock,
  Signal,
  RotateCcw,
  Play,
  CheckCircle,
  Video,
} from "lucide-react";

import "./NetworkLab.css";

const profiles = {
  Excellent: {
    bandwidth: 50,
    latency: 20,
    packetLoss: 0,
    description: "Excellent network conditions",
  },
  Good: {
    bandwidth: 20,
    latency: 50,
    packetLoss: 1,
    description: "Good broadband connection",
  },
  Moderate: {
    bandwidth: 5,
    latency: 100,
    packetLoss: 2,
    description: "Limited network bandwidth",
  },
  Poor: {
    bandwidth: 1,
    latency: 250,
    packetLoss: 5,
    description: "Slow and unstable connection",
  },
  Custom: {
    bandwidth: 10,
    latency: 100,
    packetLoss: 1,
    description: "Customize your own network",
  },
};

// Read previously applied configuration.
const getInitialSettings = () => {
  const saved = getNetworkSimulation();

  if (saved.enabled) {
    return {
      ...profiles.Custom,
      bandwidth: saved.bandwidth,
      latency: saved.latency,
      packetLoss: saved.packetLoss,
    };
  }

  return { ...profiles.Good };
};

const getInitialProfile = () => {
  const saved = getNetworkSimulation();

  if (!saved.enabled) return "Good";

  const matchingProfile = Object.keys(profiles).find((name) => {
    const item = profiles[name];

    return (
      item.bandwidth === saved.bandwidth &&
      item.latency === saved.latency &&
      item.packetLoss === saved.packetLoss
    );
  });

  return matchingProfile || "Custom";
};

export default function NetworkLab() {
  const [profile, setProfile] = useState(getInitialProfile);

  const [settings, setSettings] = useState(getInitialSettings);

  const [appliedSettings, setAppliedSettings] = useState(() => {
    const savedSettings = getNetworkSimulation();

    return savedSettings.enabled ? savedSettings : null;
  });

  // Select a predefined network profile.
  const selectProfile = (name) => {
    clearNetworkSimulation();

    setProfile(name);
    setSettings({ ...profiles[name] });
    setAppliedSettings(null);
  };

  // Update custom network parameters.
  const updateSetting = (key, value) => {
    clearNetworkSimulation();

    setProfile("Custom");

    setSettings((prev) => ({
      ...prev,
      [key]: Number(value),
    }));

    setAppliedSettings(null);
  };

  // Apply network configuration.
  const applySettings = () => {
    const applied = applyNetworkSimulation(settings);

    setAppliedSettings(applied);
  };

  // Reset network configuration.
  const resetSettings = () => {
    clearNetworkSimulation();

    setProfile("Good");
    setSettings({ ...profiles.Good });
    setAppliedSettings(null);
  };

  return (
    <div className="network-lab">

      {/* Header */}
      <div className="network-header">
        <div>
          <span className="network-eyebrow">
            STREAMSMART / TESTING
          </span>

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

      {/* Network Profiles */}
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
              <span className="profile-name">
                {name}
              </span>

              <span className="profile-description">
                {profiles[name].description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Configure Network */}
      <div className="network-section">
        <div className="section-heading">
          <div>
            <h3>Configure Network</h3>
            <p>Adjust the network parameters for your test.</p>
          </div>

          <Gauge size={21} />
        </div>

        <div className="network-controls">

          {/* Bandwidth */}
          <div className="network-control">
            <div className="control-top">
              <label htmlFor="bandwidth">
                Bandwidth
              </label>

              <strong>
                {settings.bandwidth} Mbps
              </strong>
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

          {/* Latency */}
          <div className="network-control">
            <div className="control-top">
              <label htmlFor="latency">
                Latency
              </label>

              <strong>
                {settings.latency} ms
              </strong>
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

          {/* Packet Loss */}
          <div className="network-control">
            <div className="control-top">
              <label htmlFor="packetLoss">
                Packet Loss
              </label>

              <strong>
                {settings.packetLoss}%
              </strong>
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

      {/* Network Summary */}
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

        {/* Configuration Actions */}
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

            Configuration applied successfully.
            Ready for simulation.
          </div>
        )}
      </div>

      {/* Sample Video Player */}
      <section className="network-video-section">

        <div className="network-video-heading">
          <div>
            <span className="network-eyebrow">
              STREAMSMART / LIVE PREVIEW
            </span>

            <h3>
              <Video size={21} />
              Sample Video Testing
            </h3>

            <p>
              Play the sample HLS video and observe how the
              applied network conditions affect streaming.
            </p>
          </div>

          <span
            className={`network-status ${
              appliedSettings ? "applied" : "not-applied"
            }`}
          >
            {appliedSettings
              ? "Simulation Applied"
              : "Simulation Not Applied"}
          </span>
        </div>

        {appliedSettings && (
          <div className="network-active-config">
            <span>
              Bandwidth: <strong>{appliedSettings.bandwidth} Mbps</strong>
            </span>

            <span>
              Latency: <strong>{appliedSettings.latency} ms</strong>
            </span>

            <span>
              Packet Loss: <strong>{appliedSettings.packetLoss}%</strong>
            </span>
          </div>
        )}

        <div className="network-video-player">
          <VideoPlayer />
        </div>

        <div className="network-video-tip">
          <Activity size={17} />

          <p>
            Change the network settings, apply the configuration,
            and observe throughput, resolution and buffering
            in the playback telemetry.
          </p>
        </div>

      </section>

      {/* Simulation Notice */}
      <div className="network-note">
        <strong>Simulation Notice</strong>

        <p>
          These settings simulate network conditions inside
          StreamSmart. They do not change your actual internet
          connection.
        </p>
      </div>

    </div>
  );
}