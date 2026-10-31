import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  LockKeyhole,
  KeyRound,
  UserCheck,
  Fingerprint,
  Database,
  Server,
  Eye,
  EyeOff,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Shield,
  FileKey,
  UserRound,
  Network,
  Code2,
  Lock,
  RefreshCw
} from "lucide-react";
import "./Security.css";

const securityFeatures = [
  {
    icon: LockKeyhole,
    title: "Password Hashing",
    tag: "BCRYPTJS",
    description:
      "Passwords are hashed using bcryptjs before being stored in the database. The implementation generates a salt with 10 rounds."
  },
  {
    icon: KeyRound,
    title: "JWT Authentication",
    tag: "JSON WEB TOKEN",
    description:
      "The backend generates signed JSON Web Tokens after successful registration or login. Tokens are configured to expire after one day."
  },
  {
    icon: UserCheck,
    title: "Token Verification",
    tag: "AUTH MIDDLEWARE",
    description:
      "The requireAuth middleware verifies Bearer tokens and identifies the associated user before allowing protected operations."
  },
  {
    icon: EyeOff,
    title: "Password Protection",
    tag: "DATA PRIVACY",
    description:
      "The user profile endpoint excludes the password field when retrieving the authenticated user's database record."
  },
  {
    icon: Fingerprint,
    title: "Role Management",
    tag: "ACCESS CONTROL",
    description:
      "User records support viewer and admin roles, providing a foundation for role-based access management."
  },
  {
    icon: Network,
    title: "CORS Configuration",
    tag: "API SECURITY",
    description:
      "The Express backend configures CORS using the CLIENT_URL environment variable, with localhost as the development default."
  }
];

const authSteps = [
  {
    number: "01",
    title: "User Registration",
    description:
      "The user submits a name, email and password. The backend validates required fields, checks for an existing email and creates a user record."
  },
  {
    number: "02",
    title: "Password Hashing",
    description:
      "The User model hashes the password with bcryptjs using a generated salt before saving the record."
  },
  {
    number: "03",
    title: "Login Verification",
    description:
      "The backend finds the account using the normalized email and compares the submitted password against the stored hash."
  },
  {
    number: "04",
    title: "Token Generation",
    description:
      "After successful authentication, the backend signs a JWT containing the user ID and role with a one-day expiration."
  },
  {
    number: "05",
    title: "Protected API Access",
    description:
      "Protected routes can use requireAuth to verify the Bearer token, load the user and attach the authenticated user to the request."
  }
];

const securityPractices = [
  "Passwords are not stored as plain text in the database.",
  "bcryptjs is used for password hashing and comparison.",
  "JWT tokens are signed using a server-side secret.",
  "JWT tokens have a configured one-day expiration.",
  "Authentication middleware verifies token validity.",
  "The profile endpoint excludes the password field.",
  "MongoDB connection details are configured through environment variables.",
  "Frontend and backend origins are configurable through CLIENT_URL."
];

function Security() {
  return (
    <main className="security-page">

      {/* Hero */}
      <section className="security-hero">
        <div className="security-container">

          <div className="security-eyebrow">
            <span className="security-status-dot"></span>
            SECURITY & AUTHENTICATION
          </div>

          <div className="security-hero-icon">
            <ShieldCheck size={55} strokeWidth={1.4} />
            <span></span>
          </div>

          <h1>
            Your Security.
            <br />
            <span>Our Priority.</span>
          </h1>

          <p>
            Explore how StreamSmart handles user authentication,
            password protection, token verification and API security.
          </p>

          <div className="security-hero-actions">
            <a href="#authentication" className="security-primary-button">
              Explore Authentication <ArrowRight size={17} />
            </a>

            <Link to="/about" className="security-secondary-button">
              About StreamSmart
            </Link>
          </div>

          <div className="security-hero-bottom">
            <div>
              <Lock size={16} />
              Password Hashing
            </div>
            <div>
              <KeyRound size={16} />
              JWT Authentication
            </div>
            <div>
              <UserCheck size={16} />
              Token Verification
            </div>
          </div>

        </div>
      </section>

      {/* Introduction */}
      <section className="security-section">
        <div className="security-container">

          <div className="security-section-heading">
            <span className="security-label">SECURITY OVERVIEW</span>
            <h2>
              Security built into the <span>authentication flow.</span>
            </h2>
            <p>
              StreamSmart uses backend authentication mechanisms to
              protect account credentials and verify authenticated
              API requests.
            </p>
          </div>

          <div className="security-intro-grid">

            <div className="security-intro-card">
              <ShieldCheck size={32} />

              <h3>Account Protection</h3>

              <p>
                Password hashing and password comparison help protect
                account credentials during registration and login.
              </p>
            </div>

            <div className="security-intro-card">
              <FileKey size={32} />

              <h3>Token-Based Access</h3>

              <p>
                JSON Web Tokens provide a signed authentication
                mechanism for identifying users across API requests.
              </p>
            </div>

            <div className="security-intro-card">
              <Database size={32} />

              <h3>Protected User Data</h3>

              <p>
                User records are retrieved through Mongoose, with
                password fields excluded from the profile endpoint.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Authentication Flow */}
      <section className="security-section security-alt">
        <div className="security-container" id="authentication">

          <div className="security-section-heading">
            <span className="security-label">USER AUTHENTICATION</span>
            <h2>
              How authentication <span>works.</span>
            </h2>
            <p>
              An overview of the registration, login and token
              verification process implemented in the backend.
            </p>
          </div>

          <div className="security-auth-flow">

            <div className="security-auth-visual">

              <div className="security-flow-node">
                <UserRound size={25} />
                <div>
                  <strong>Frontend</strong>
                  <span>Login / Register</span>
                </div>
              </div>

              <div className="security-flow-line">
                <span>API REQUEST</span>
                <ArrowRight size={18} />
              </div>

              <div className="security-flow-node">
                <Server size={25} />
                <div>
                  <strong>Express Backend</strong>
                  <span>Auth Controllers</span>
                </div>
              </div>

              <div className="security-flow-line">
                <span>VERIFY CREDENTIALS</span>
                <ArrowRight size={18} />
              </div>

              <div className="security-flow-node">
                <Database size={25} />
                <div>
                  <strong>MongoDB</strong>
                  <span>User Records</span>
                </div>
              </div>

              <div className="security-flow-line">
                <span>SUCCESSFUL AUTHENTICATION</span>
                <ArrowRight size={18} />
              </div>

              <div className="security-flow-success">
                <CheckCircle2 size={24} />
                <div>
                  <strong>JWT Token Generated</strong>
                  <span>Signed authentication token · 1 day expiry</span>
                </div>
              </div>

            </div>

            <div className="security-auth-description">
              {authSteps.map((step) => (
                <article className="security-auth-step" key={step.number}>
                  <span>{step.number}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </article>
              ))}
            </div>

          </div>

        </div>
      </section>

      {/* Security Features */}
      <section className="security-section">
        <div className="security-container">

          <div className="security-section-heading">
            <span className="security-label">IMPLEMENTED SECURITY FEATURES</span>
            <h2>
              The mechanisms behind <span>protection.</span>
            </h2>
            <p>
              These are the security-related mechanisms found
              in the current StreamSmart backend implementation.
            </p>
          </div>

          <div className="security-features-grid">
            {securityFeatures.map((feature) => {
              const Icon = feature.icon;

              return (
                <article className="security-feature-card" key={feature.title}>
                  <div className="security-feature-top">
                    <div className="security-feature-icon">
                      <Icon size={24} />
                    </div>
                    <span>{feature.tag}</span>
                  </div>

                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              );
            })}
          </div>

        </div>
      </section>

      {/* Security Practices */}
      <section className="security-section security-alt">
        <div className="security-container">

          <div className="security-practices-grid">

            <div>
              <span className="security-label">SECURITY CHECKLIST</span>

              <h2>
                Security practices in <span>StreamSmart.</span>
              </h2>

              <p>
                The following practices correspond to the
                current authentication and backend configuration.
              </p>

              <Link to="/about" className="security-inline-link">
                Explore Project Architecture <ArrowRight size={17} />
              </Link>
            </div>

            <div className="security-checklist">
              {securityPractices.map((practice, index) => (
                <div className="security-check-item" key={index}>
                  <CheckCircle2 size={19} />
                  <span>{practice}</span>
                </div>
              ))}
            </div>

          </div>

        </div>
      </section>

      {/* Security Recommendations */}
      <section className="security-section">
        <div className="security-container">

          <div className="security-section-heading">
            <span className="security-label">SECURITY BEST PRACTICES</span>
            <h2>
              What we recommend for <span>production.</span>
            </h2>
            <p>
              Security is an ongoing process. The following measures
              should also be considered when operating the platform
              in a production environment.
            </p>
          </div>

          <div className="security-recommendations">

            <div className="security-recommendation">
              <LockKeyhole size={23} />
              <div>
                <h3>Secure Secret Management</h3>
                <p>
                  Use strong, private JWT secrets and keep credentials
                  in deployment environment variables. Never commit them
                  to source control.
                </p>
              </div>
            </div>

            <div className="security-recommendation">
              <RefreshCw size={23} />
              <div>
                <h3>Token Lifecycle Management</h3>
                <p>
                  Consider secure token storage, expiration handling,
                  revocation and refresh strategies appropriate
                  for the application.
                </p>
              </div>
            </div>

            <div className="security-recommendation">
              <Shield size={23} />
              <div>
                <h3>Request Protection</h3>
                <p>
                  Add rate limiting, input validation, security headers
                  and appropriate request-size restrictions.
                </p>
              </div>
            </div>

            <div className="security-recommendation">
              <Eye size={23} />
              <div>
                <h3>Monitoring and Auditing</h3>
                <p>
                  Monitor authentication failures, suspicious requests,
                  server errors and important account-related events.
                </p>
              </div>
            </div>

          </div>

          <div className="security-disclaimer">
            <AlertTriangle size={21} />

            <div>
              <strong>Security transparency</strong>
              <p>
                This page documents security mechanisms identified in
                the current project source code. It is not a formal
                security audit or a guarantee that the entire
                application is vulnerability-free. Recommended
                production safeguards are not represented as already
                implemented features.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="security-final-cta">
        <div className="security-container">

          <div className="security-final-icon">
            <ShieldCheck size={35} />
          </div>

          <h2>
            Security is part of a better experience.
          </h2>

          <p>
            Learn more about StreamSmart, its architecture
            and its development.
          </p>

          <Link to="/about" className="security-primary-button">
            Explore About Us <ArrowRight size={17} />
          </Link>

        </div>
      </section>

    </main>
  );
}

export default Security;
