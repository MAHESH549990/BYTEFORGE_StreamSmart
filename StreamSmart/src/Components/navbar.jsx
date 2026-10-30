
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = useNavigate();

  const handleLogout = () => {
    // Later connect this with your logout API
    setIsLoggedIn(false);
    navigate("/login");
  };

  const navLinkClass = ({ isActive }) =>
    `nav-link fw-medium px-3 ${
      isActive ? "active text-primary" : "text-dark"
    }`;

  return (
    <nav className="navbar navbar-expand-lg bg-white shadow-sm sticky-top">
      <div className="container">

        {/* Brand */}
        <Link
          to="/"
          className="navbar-brand fw-bold fs-4 text-primary"
        >
          <i className="fa-solid fa-satellite-dish me-2"></i>
          StreamSmart
        </Link>

        {/* Mobile Toggle */}
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navigation Links */}
        <div
          className={`collapse navbar-collapse ${
            menuOpen ? "show" : ""
          }`}
        >
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0">

            <li className="nav-item">
              <NavLink
                to="/"
                className={navLinkClass}
                onClick={() => setMenuOpen(false)}
              >
                Home
              </NavLink>
            </li>

            {isLoggedIn && (
              <>
                <li className="nav-item">
                  <NavLink
                    to="/dashboard"
                    className={navLinkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    Dashboard
                  </NavLink>
                </li>

                <li className="nav-item">
                  <NavLink
                    to="/player"
                    className={navLinkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    Video Player
                  </NavLink>
                </li>

                <li className="nav-item">
                  <NavLink
                    to="/analytics"
                    className={navLinkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    Analytics
                  </NavLink>
                </li>

                <li className="nav-item">
                  <NavLink
                    to="/history"
                    className={navLinkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    History
                  </NavLink>
                </li>
              </>
            )}

          </ul>

          {/* Authentication */}
          <div className="d-flex align-items-center gap-2">

            {!isLoggedIn ? (
              <>
                <Link
                  to="/login"
                  className="btn btn-outline-primary px-3"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="btn btn-primary px-3"
                >
                  Get Started
                </Link>
              </>
            ) : (
              <>
                <button className="btn btn-light rounded-circle">
                  <i className="fa-solid fa-user"></i>
                </button>

                <button
                  className="btn btn-outline-danger"
                  onClick={handleLogout}
                >
                  <i className="fa-solid fa-right-from-bracket me-2"></i>
                  Logout
                </button>
              </>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
}
