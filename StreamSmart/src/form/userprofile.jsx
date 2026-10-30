
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UserProfile.css";

export default function UserProfile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/");
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load profile");
        }

        setUser(data.user);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner-border text-primary"></div>
        <p>Preparing your profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-error">
        <div className="profile-error-icon">
          <i className="fa-solid fa-triangle-exclamation"></i>
        </div>
        <h4>Unable to load profile</h4>
        <p>{error}</p>
        <button onClick={() => navigate("/")}>
          Back to Home
        </button>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
      })
    : "Not available";

  return (
    <div className="stream-profile-page">
      <div className="stream-profile-container">

        {/* Page Heading */}
        <div className="profile-page-heading">
          <div>
            <span className="profile-eyebrow">ACCOUNT CENTER</span>
            <h2>My Profile</h2>
            <p>Manage and view your StreamSmart account information.</p>
          </div>

          <button
            className="profile-back-btn"
            onClick={() => navigate(-1)}
          >
            <i className="fa-solid fa-arrow-left"></i>
            Back
          </button>
        </div>

        {/* Profile Banner */}
        <section className="profile-hero">

          <div className="profile-hero-pattern"></div>

          <div className="profile-hero-content">
            <div className="profile-avatar">
              {initials || "U"}
            </div>

            <div className="profile-hero-info">
              <span className="profile-member-label">
                <i className="fa-solid fa-circle-check"></i>
                StreamSmart Member
              </span>

              <h2>{user.name}</h2>
              <p>{user.email}</p>

              <div className="profile-badges">
                <span className="profile-role-badge">
                  <i className="fa-solid fa-shield-halved"></i>
                  {user.role}
                </span>

                <span className="profile-active-badge">
                  <span></span>
                  Account Active
                </span>
              </div>
            </div>
          </div>

          <div className="profile-hero-icon">
            <i className="fa-solid fa-satellite-dish"></i>
          </div>

        </section>

        {/* Account Overview */}
        <div className="profile-section-title">
          <div>
            <h4>Account Overview</h4>
            <p>Your personal account details at a glance.</p>
          </div>
        </div>

        <div className="profile-overview-grid">

          <div className="profile-info-card">
            <div className="profile-info-icon blue">
              <i className="fa-solid fa-user"></i>
            </div>
            <div>
              <span>Full Name</span>
              <h5>{user.name}</h5>
            </div>
          </div>

          <div className="profile-info-card">
            <div className="profile-info-icon purple">
              <i className="fa-solid fa-envelope"></i>
            </div>
            <div>
              <span>Email Address</span>
              <h5>{user.email}</h5>
            </div>
          </div>

          <div className="profile-info-card">
            <div className="profile-info-icon green">
              <i className="fa-solid fa-user-shield"></i>
            </div>
            <div>
              <span>Account Role</span>
              <h5 className="text-capitalize">{user.role}</h5>
            </div>
          </div>

          <div className="profile-info-card">
            <div className="profile-info-icon orange">
              <i className="fa-solid fa-calendar-days"></i>
            </div>
            <div>
              <span>Member Since</span>
              <h5>{joinedDate}</h5>
            </div>
          </div>

        </div>

        {/* Account Information */}
        <section className="profile-account-card">
          <div className="profile-account-heading">
            <div className="profile-account-heading-icon">
              <i className="fa-solid fa-id-card"></i>
            </div>
            <div>
              <h4>Account Information</h4>
              <p>Basic information associated with your account.</p>
            </div>
          </div>

          <div className="profile-account-row">
            <span>Account Name</span>
            <strong>{user.name}</strong>
          </div>

          <div className="profile-account-row">
            <span>Registered Email</span>
            <strong>{user.email}</strong>
          </div>

          <div className="profile-account-row">
            <span>Account Type</span>
            <strong className="text-capitalize">{user.role}</strong>
          </div>

          <div className="profile-account-row">
            <span>Registration Date</span>
            <strong>{joinedDate}</strong>
          </div>
        </section>

        {/* Footer Note */}
        <div className="profile-security-note">
          <i className="fa-solid fa-lock"></i>
          <span>
            Your account information is securely managed by StreamSmart.
          </span>
        </div>

      </div>
    </div>
  );
}
