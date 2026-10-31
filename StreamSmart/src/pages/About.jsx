import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Activity,
  MonitorPlay,
  Network,
  BarChart3,
  ShieldCheck,
  Database,
  Cpu,
  Layers,
  Code2,
  GitBranch,
  Gauge,
  Radio,
  Workflow,
  Users,
  Target,
  PlayCircle,
  Server,
  Zap
} from "lucide-react";
import "./About.css";

const technologies = [
  { name: "React 19", category: "Frontend", icon: Code2 },
  { name: "Vite", category: "Build Tool", icon: Zap },
  { name: "React Router", category: "Navigation", icon: Workflow },
  { name: "Bootstrap 5", category: "UI Framework", icon: Layers },
  { name: "Node.js", category: "Runtime", icon: Server },
  { name: "Express.js", category: "Backend", icon: Network },
  { name: "MongoDB", category: "Database", icon: Database },
  { name: "Mongoose", category: "ODM", icon: Database },
  { name: "HLS.js", category: "Video Streaming", icon: MonitorPlay },
  { name: "Recharts", category: "Visualization", icon: BarChart3 },
  { name: "JWT", category: "Authentication", icon: ShieldCheck },
  { name: "Git & GitHub", category: "Version Control", icon: GitBranch }
];

const modules = [
  {
    number: "01",
    icon: MonitorPlay,
    title: "Video Streaming",
    description:
      "Provides video library and playback interfaces with HLS.js support for HLS-compatible streaming sources."
  },
  {
    number: "02",
    icon: Network,
    title: "Network Simulation",
    description:
      "Provides an experimentation interface for studying network conditions such as bandwidth, latency, jitter and packet loss."
  },
  {
    number: "03",
    icon: Activity,
    title: "Adaptive Streaming",
    description:
      "Explores adaptive bitrate streaming and video quality selection according to changing network conditions."
  },
  {
    number: "04",
    icon: BarChart3,
    title: "Performance Analytics",
    description:
      "Presents streaming-related analytics, performance comparisons, history and visualization interfaces."
  },
  {
    number: "05",
    icon: Gauge,
    title: "Buffer Monitoring",
    description:
      "Helps evaluate buffering conditions and playback performance during streaming experiments."
  },
  {
    number: "06",
    icon: Users,
    title: "User Management",
    description:
      "Provides registration, login, profile and role-related user management functionality."
  }
];

const workflow = [
  {
    number: "01",
    title: "Network Conditions",
    description:
      "The platform studies network parameters such as available bandwidth, latency, jitter and packet loss."
  },
  {
    number: "02",
    title: "Video Playback",
    description:
      "Video playback and streaming interfaces provide the environment for observing playback behaviour."
  },
  {
    number: "03",
    title: "Performance Analysis",
    description:
      "Streaming-related information can be explored through dashboard, analytics and comparison interfaces."
  },
  {
    number: "04",
    title: "Optimization Insights",
    description:
      "The platform helps understand how network conditions and video quality choices influence the streaming experience."
  }
];

const contributors = [
  { name: "svg185", url: "https://github.com/svg185" },
  { name: "MAHESH549990", url: "https://github.com/MAHESH549990" },
  { name: "Ashi-engf", url: "https://github.com/Ashi-engf" },
  { name: "gayatripadalia", url: "https://github.com/gayatripadalia" },
  { name: "yjoshioo07", url: "https://github.com/yjoshioo07" }
];

function About() {
  return (
    <main className="about-page">

      {/* Hero */}
      <section className="about-hero">
        <div className="about-container">

          <div className="about-eyebrow">
            <span className="about-live-dot"></span>
            GET TO KNOW OUR PLATFORM
          </div>

          <h1>
            About <span>StreamSmart.</span>
          </h1>

          <p className="about-hero-description">
            Making video streaming smarter through network intelligence,
            adaptive quality and performance insights.
          </p>

          <div className="about-hero-actions">
            <Link to="/" className="about-primary-button">
              Explore Platform <ArrowRight size={17} />
            </Link>

            <Link to="/security" className="about-secondary-button">
              Our Security <ShieldCheck size={17} />
            </Link>
          </div>

          <div className="about-hero-visual">
            <div className="about-visual-orbit orbit-a"></div>
            <div className="about-visual-orbit orbit-b"></div>

            <div className="about-visual-core">
              <MonitorPlay size={55} strokeWidth={1.3} />
              <span>STREAMSMART</span>
            </div>

            <div className="about-floating-icon about-float-one">
              <Network size={21} />
            </div>

            <div className="about-floating-icon about-float-two">
              <Activity size={21} />
            </div>

            <div className="about-floating-icon about-float-three">
              <BarChart3 size={21} />
            </div>
          </div>

        </div>
      </section>

      {/* Overview */}
      <section className="about-section">
        <div className="about-container">

          <div className="about-section-heading">
            <span className="about-label">PROJECT OVERVIEW</span>
            <h2>
              What is <span>StreamSmart?</span>
            </h2>
          </div>

          <div className="about-overview-grid">

            <div className="about-overview-main">
              <div className="about-icon-box">
                <Radio size={25} />
              </div>

              <h3>Intelligent Video Streaming Optimization</h3>

              <p>
                StreamSmart is a video streaming optimization platform
                designed to help understand and evaluate how network
                conditions influence video playback quality.
              </p>

              <p>
                It brings together video playback, network experimentation,
                adaptive streaming concepts and performance analytics
                in one integrated application.
              </p>

              <p>
                The platform is designed to make streaming behaviour
                easier to observe, experiment with and analyze.
              </p>
            </div>

            <div className="about-objective-card">
              <Target size={30} />

              <h3>Our Mission</h3>

              <p>
                To explore smarter video delivery by connecting network
                intelligence, playback analysis and adaptive streaming
                into a unified platform.
              </p>

              <div className="about-objective-line"></div>

              <h4>Core Focus Areas</h4>

              <ul>
                <li>Streaming performance</li>
                <li>Network intelligence</li>
                <li>Adaptive video quality</li>
                <li>Playback experience</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="about-section about-alt-section">
        <div className="about-container">

          <div className="about-section-heading">
            <span className="about-label">SYSTEM ARCHITECTURE</span>
            <h2>
              How the platform is <span>structured.</span>
            </h2>
            <p>
              StreamSmart uses a frontend and backend architecture
              supported by a MongoDB database.
            </p>
          </div>

          <div className="about-architecture">

            <div className="about-architecture-card">
              <div className="about-architecture-icon">
                <MonitorPlay size={30} />
              </div>
              <span className="about-architecture-tag">CLIENT SIDE</span>
              <h3>React Frontend</h3>
              <p>
                User interface, navigation, video playback,
                dashboards and analytics.
              </p>
              <div className="about-architecture-tech">
                React · Vite · Bootstrap · HLS.js
              </div>
            </div>

            <div className="about-architecture-connector">
              <ArrowRight size={23} />
              <span>HTTP API</span>
            </div>

            <div className="about-architecture-card">
              <div className="about-architecture-icon">
                <Server size={30} />
              </div>
              <span className="about-architecture-tag">SERVER SIDE</span>
              <h3>Express Backend</h3>
              <p>
                Handles application routes, authentication,
                video operations and experiment APIs.
              </p>
              <div className="about-architecture-tech">
                Node.js · Express · JWT
              </div>
            </div>

            <div className="about-architecture-connector">
              <ArrowRight size={23} />
              <span>DATABASE</span>
            </div>

            <div className="about-architecture-card">
              <div className="about-architecture-icon">
                <Database size={30} />
              </div>
              <span className="about-architecture-tag">DATA LAYER</span>
              <h3>MongoDB</h3>
              <p>
                Stores application data through MongoDB
                and Mongoose models.
              </p>
              <div className="about-architecture-tech">
                MongoDB · Mongoose
              </div>
            </div>

          </div>

          <div className="about-architecture-note">
            <Activity size={18} />
            <span>
              The frontend communicates with backend API endpoints.
              The backend connects to MongoDB for persistent data storage.
            </span>
          </div>

        </div>
      </section>

      {/* Modules */}
      <section className="about-section">
        <div className="about-container">

          <div className="about-section-heading">
            <span className="about-label">CORE IMPLEMENTATIONS</span>
            <h2>
              Inside the <span>platform.</span>
            </h2>
            <p>
              Explore the major modules and capabilities included
              in the StreamSmart application.
            </p>
          </div>

          <div className="about-modules-grid">
            {modules.map((module) => {
              const Icon = module.icon;

              return (
                <article className="about-module-card" key={module.number}>
                  <div className="about-module-top">
                    <div className="about-icon-box">
                      <Icon size={23} />
                    </div>
                    <span>{module.number}</span>
                  </div>

                  <h3>{module.title}</h3>
                  <p>{module.description}</p>
                </article>
              );
            })}
          </div>

        </div>
      </section>

      {/* Working */}
      <section className="about-section about-alt-section">
        <div className="about-container">

          <div className="about-section-heading">
            <span className="about-label">PLATFORM WORKFLOW</span>
            <h2>
              Understanding the <span>working.</span>
            </h2>
          </div>

          <div className="about-workflow">
            {workflow.map((item) => (
              <div className="about-workflow-item" key={item.number}>
                <div className="about-workflow-number">
                  {item.number}
                </div>

                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Technology Stack */}
      <section className="about-section">
        <div className="about-container">

          <div className="about-section-heading">
            <span className="about-label">TECHNOLOGY STACK</span>
            <h2>
              Built with modern <span>technologies.</span>
            </h2>
          </div>

          <div className="about-tech-grid">
            {technologies.map((technology) => {
              const Icon = technology.icon;

              return (
                <div className="about-tech-card" key={technology.name}>
                  <Icon size={23} />

                  <div>
                    <h4>{technology.name}</h4>
                    <span>{technology.category}</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Project Structure */}
      <section className="about-section about-alt-section">
        <div className="about-container">

          <div className="about-section-heading">
            <span className="about-label">CODE ORGANIZATION</span>
            <h2>
              Project <span>structure.</span>
            </h2>
            <p>
              A simplified overview of the main application directories.
            </p>
          </div>

          <div className="about-code-window">

            <div className="about-code-header">
              <div>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <small>StreamSmart / Project Structure</small>
            </div>

            <pre>
{`StreamSmart/
│
├── src/
│   ├── Components/
│   │   ├── navbar.jsx
│   │   └── footer.jsx
│   │
│   ├── Dashboard/
│   │   ├── analytics/
│   │   ├── network/
│   │   └── videos/
│   │
│   ├── landing/
│   │   ├── LandingPage.jsx
│   │   └── LandingPage.css
│   │
│   ├── experiments/
│   ├── form/
│   ├── videos/
│   ├── App.jsx
│   └── main.jsx
│
├── backend/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   ├── app.js
│   └── server.js
│
├── public/
├── package.json
├── vite.config.js
└── README.md`}
            </pre>

          </div>

        </div>
      </section>

      {/* Contributors */}
      <section className="about-section">
        <div className="about-container">

          <div className="about-section-heading">
            <span className="about-label">THE DEVELOPMENT TEAM</span>
            <h2>
              Built through <span>teamwork.</span>
            </h2>
            <p>
              Meet the contributors working together on StreamSmart.
            </p>
          </div>

          <div className="about-team-grid">
            {contributors.map((person, index) => (
              <a
                className="about-team-card"
                href={person.url}
                target="_blank"
                rel="noreferrer"
                key={person.name}
              >
                <div className="about-team-avatar">
                  {person.name.charAt(0).toUpperCase()}
                </div>

                <div>
                  <h3>{person.name}</h3>
                  <span>GitHub Contributor</span>
                </div>

                <GitBranch size={18} />
              </a>
            ))}
          </div>

          <div className="about-github-link">
            <a
              href="https://github.com/MAHESH549990/BYTEFORGE_StreamSmart"
              target="_blank"
              rel="noreferrer"
            >
              <GitBranch size={18} />
              Explore GitHub Repository
              <ArrowRight size={17} />
            </a>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="about-final-cta">
        <div className="about-container">
          <div className="about-cta-icon">
            <PlayCircle size={30} />
          </div>

          <h2>Experience StreamSmart.</h2>

          <p>
            Explore the platform and discover intelligent video
            streaming optimization.
          </p>

          <a
            href="https://byteforge-streamsmart-1.onrender.com/"
            target="_blank"
            rel="noreferrer"
            className="about-primary-button"
          >
            Open Live Demo <ArrowRight size={17} />
          </a>
        </div>
      </section>

    </main>
  );
}

export default About;
