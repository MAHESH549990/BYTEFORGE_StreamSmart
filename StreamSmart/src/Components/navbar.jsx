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
  // Remove authentication data
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  // Update navbar authentication state
  setIsLoggedIn(false);

  // Close mobile menu
  setMenuOpen(false);

  // Notify other components
  window.dispatchEvent(new Event("authChanged"));

  // Show flash message
  showSuccess("You have logged out successfully!");

  // Redirect to login page
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
          <i className={`fa-solid ${menuOpen ? "fa-xmark" : "fa-bars"}`}></i>
        </button>

        {/* Navigation */}
        <div className={`stream-nav-menu ${menuOpen ? "show" : ""}`}>

          <div className="stream-nav-links">
            {isLoggedIn ? (
              <>
                <NavLink
                  to="/dashboard"
                  className={navLinkClass}
                  onClick={closeMenu}
                >
                  Dashboard
                </NavLink>

                <NavLink
                  to="/player"
                  className={navLinkClass}
                  onClick={closeMenu}
                >
                  Video Player
                </NavLink>

                <NavLink
                  to="/analytics"
                  className={navLinkClass}
                  onClick={closeMenu}
                >
                  Analytics
                </NavLink>

                <NavLink
                  to="/history"
                  className={navLinkClass}
                  onClick={closeMenu}
                >
                  History
                </NavLink>
              </>
            ) : (
              <>
                <NavLink
                  to="/"
                  end
                  className={navLinkClass}
                  onClick={closeMenu}
                >
                  Login
                </NavLink>

                <NavLink
                  to="/register"
                  className={navLinkClass}
                  onClick={closeMenu}
                >
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
                    onClick={() => navigate("/profile")}
                    title="My Profile"
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
