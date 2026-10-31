import React from "react";
import { Link } from "react-router-dom";
import HeroGlobe from "./HeroGlobe";
import "./LandingPage.css";

const features = [
  {
    icon: "◈",
    title: "Adaptive Bitrate",
    text: "Automatically adjusts video quality according to changing network conditions for uninterrupted playback."
  },
  {
    icon: "⌁",
    title: "Network Simulation",
    text: "Simulate bandwidth, latency, jitter, and packet loss to understand different network environments."
  },
  {
    icon: "▥",
    title: "Live Analytics",
    text: "Monitor bandwidth, buffer health, quality changes, and playback performance in real time."
  },
  {
    icon: "◉",
    title: "Buffer Monitoring",
    text: "Track playback interruptions and buffer conditions to understand the streaming experience."
  },
  {
    icon: "⇄",
    title: "Performance Comparison",
    text: "Compare fixed-quality streaming with adaptive streaming to evaluate optimization results."
  },
  {
    icon: "▤",
    title: "Session History",
    text: "Review previous playback sessions and understand how network conditions affected performance."
  }
];

function LandingPage() {
  return (
    <div className="site-shell">

      {/* Navbar */}
      <nav className="navbar container">

        <Link className="brand" to="/">
          <span className="brand-mark">
            <i className="fa-solid fa-satellite-dish"></i>
          </span>
          Stream<span>Smart</span>
        </Link>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#dashboard">Dashboard</a>
        </div>

        <Link className="nav-cta" to="/register">
          Get started <span>↗</span>
        </Link>

      </nav>

      <main>

        {/* Hero Section */}
        <section className="hero container ss-hero">

          <div className="hero-copy">

            <div className="eyebrow">
              <span className="pulse"></span>
              INTELLIGENT VIDEO DELIVERY
            </div>

            <h1>
              Streaming that
              <br />
              moves at <em>your speed.</em>
            </h1>

            <p className="hero-text">
              Meet StreamSmart — a smart video streaming optimization
              platform that monitors network conditions and adapts
              video quality to deliver a smoother playback experience.
            </p>

            <div className="hero-actions">

              <Link className="button primary" to="/register">
                Explore StreamSmart <span>→</span>
              </Link>

              <a className="text-link" href="#how-it-works">
                See how it works <span>↗</span>
              </a>

            </div>

            <div className="trust-row">
              <div className="avatar-stack">
                <i>S</i>
                <i>M</i>
                <i>A</i>
              </div>

              <span>
                Smarter streaming through network intelligence
              </span>
            </div>

          </div>

          {/* Animated Globe */}
          <div className="visual-wrap ss-globe-wrap" id="dashboard">
            <HeroGlobe />
          </div>

        </section>

        {/* Metrics */}
        <section className="metrics container">

          <div>
            <strong>4K</strong>
            <span>Quality support goal</span>
          </div>

          <div>
            <strong>Real-time</strong>
            <span>Network monitoring</span>
          </div>

          <div>
            <strong>Adaptive</strong>
            <span>Quality selection</span>
          </div>

          <div>
            <strong>360°</strong>
            <span>Playback insights</span>
          </div>

          <p>
            *Illustrative project capabilities and interface values.
          </p>

        </section>

        {/* Features */}
        <section className="section container" id="features">

          <div className="section-heading">

            <div className="eyebrow">
              WHY STREAMSMART
            </div>

            <h2>
              Great streaming should
              <br />
              feel <em>effortless.</em>
            </h2>

            <p>
              StreamSmart combines network monitoring, adaptive
              streaming, and playback analytics to help understand
              and optimize video delivery.
            </p>

          </div>

          <div className="feature-grid">

            {features.map((feature) => (

              <article className="feature-card" key={feature.title}>

                <div className="feature-icon">
                  {feature.icon}
                </div>

                <h3>{feature.title}</h3>

                <p>{feature.text}</p>

                <a href="#how-it-works">
                  Learn more <span>↗</span>
                </a>

              </article>

            ))}

          </div>

        </section>

        {/* Workflow */}
        <section className="workflow" id="how-it-works">

          <div className="container workflow-inner">

            <div>

              <div className="eyebrow">
                HOW IT WORKS
              </div>

              <h2>
                Smart from network
                <br />
                to <em>playback.</em>
              </h2>

              <p>
                StreamSmart brings network simulation, adaptive
                bitrate selection, video playback, and performance
                analytics together in one platform.
              </p>

            </div>

            <div className="steps">

              <div className="step">
                <b>01</b>

                <div>
                  <h3>Monitor Network Conditions</h3>
                  <p>
                    Measure bandwidth, latency, jitter, and packet loss
                    to understand the available network conditions.
                  </p>
                </div>
              </div>

              <div className="step">
                <b>02</b>

                <div>
                  <h3>Analyze Playback</h3>
                  <p>
                    Monitor video buffer health, playback status,
                    and available quality levels.
                  </p>
                </div>
              </div>

              <div className="step">
                <b>03</b>

                <div>
                  <h3>Adapt Video Quality</h3>
                  <p>
                    Select a suitable video quality according to
                    changing network conditions.
                  </p>
                </div>
              </div>

            </div>

          </div>

        </section>

        {/* Final CTA */}
        <section className="final-cta container" id="get-started">

          <div>

            <div className="eyebrow">
              READY TO STREAM SMARTER?
            </div>

            <h2>
              Make every second
              <br />
              of streaming <em>count.</em>
            </h2>

            <p>
              Experience smarter video streaming with StreamSmart.
            </p>

          </div>

          <Link className="button primary" to="/register">
            Get Started <span>↗</span>
          </Link>

        </section>

      </main>

      {/* Footer */}
      <footer className="container footer">

        <Link className="brand" to="/">
          <span className="brand-mark">
            <i className="fa-solid fa-satellite-dish"></i>
          </span>
          Stream<span>Smart</span>
        </Link>

        <span>
          © 2026 StreamSmart · Smart Video Streaming Optimization
        </span>

        <a href="#">
          Back to top ↑
        </a>

      </footer>

    </div>
  );
}

export default LandingPage;
