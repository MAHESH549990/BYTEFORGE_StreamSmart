
import { showSuccess } from "./FlashMessage";
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => Boolean(localStorage.getItem("token"))
  );

  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const updateAuth = () => {
      setIsLoggedIn(Boolean(localStorage.getItem("token")));
    };

    window.addEventListener("authChanged", updateAuth);

    return () => {
      window.removeEventListener("authChanged", updateAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setIsLoggedIn(false);
    setMenuOpen(false);

    window.dispatchEvent(new Event("authChanged"));

    showSuccess("You have logged out successfully!");

    navigate("/");
  };

  const closeMenu = () => setMenuOpen(false);

  const navLinkClass = ({ isActive }) =>
    `stream-nav-link ${isActive ? "active" : ""}`;

  return (
    <header className="stream-navbar">
      <nav className="stream-nav-content container">

        {/* Brand */}
        <Link to="/" className="stream-brand" onClick={closeMenu}>
          <span className="brand-icon">
            <i className="fa-solid fa-satellite-dish"></i>
          </span>

          <span>
            Stream<span className="brand-highlight">Smart</span>
          </span>
        </Link>

        {/* Mobile Toggle */}
        <button
          className="mobile-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          <i
            className={`fa-solid ${
              menuOpen ? "fa-xmark" : "fa-bars"
            }`}
          ></i>
        </button>

        {/* Navigation */}
        <div className={`stream-nav-menu ${menuOpen ? "show" : ""}`}>
          <div className="stream-nav-links">
            {isLoggedIn ? (
              <>
                <NavLink
                  to="/dashboard"
                  end
                  className={navLinkClass}
                  onClick={closeMenu}
                >
                  <i className="fa-solid fa-house me-2"></i>
                  Dashboard
                </NavLink>

                <NavLink
                  to="/dashboard/player"
                  className={navLinkClass}
                  onClick={closeMenu}
                >
                  <i className="fa-solid fa-circle-play me-2"></i>
                  Video Player
                </NavLink>

                <NavLink
                  to="/dashboard/analytics"
                  className={navLinkClass}
                  onClick={closeMenu}
                >
                  <i className="fa-solid fa-chart-line me-2"></i>
                  Analytics
                </NavLink>

                <NavLink
                  to="/dashboard/history"
                  className={navLinkClass}
                  onClick={closeMenu}
                >
                  <i className="fa-solid fa-clock-rotate-left me-2"></i>
                  History
                </NavLink>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  end
                  className={navLinkClass}
                  onClick={closeMenu}
                >
                  <i className="fa-solid fa-right-to-bracket me-2"></i>
                  Login
                </NavLink>

                <NavLink
                  to="/register"
                  className={navLinkClass}
                  onClick={closeMenu}
                >
                  <i className="fa-solid fa-user-plus me-2"></i>
                  Register
                </NavLink>
              </>
            )}
          </div>

          {/* Authentication Actions */}
          <div className="stream-auth">
            {!isLoggedIn ? (
              <Link
                to="/register"
                className="signup-btn"
                onClick={closeMenu}
              >
                Get Started
                <i className="fa-solid fa-arrow-right ms-2"></i>
              </Link>
            ) : (
              <>
                <button
                  className="profile-btn"
                  onClick={() => {
                    closeMenu();
                    navigate("/profile");
                  }}
                  title="My Profile"
                  aria-label="My Profile"
                >
                  <i className="fa-solid fa-user"></i>
                </button>

                <button
                  className="logout-btn"
                  onClick={handleLogout}
                >
                  <i className="fa-solid fa-right-from-bracket me-2"></i>
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
