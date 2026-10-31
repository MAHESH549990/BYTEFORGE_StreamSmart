
import {
  showSuccess,
  showError
} from "../Components/FlashMessage";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must contain at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      window.dispatchEvent(new Event("authChanged"));

      showSuccess(data.message || "Registration successful!");

      navigate(
        data.user.role === "admin"
          ? "/admin"
          : "/dashboard"
      );

    } catch (error) {
      setError(error.message);
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">

        <div className="register-header">
          <Link to="/" className="register-brand">
            <span className="register-brand-icon">
              <i className="fa-solid fa-satellite-dish"></i>
            </span>
            Stream<span>Smart</span>
          </Link>

          <div className="register-heading">
            <div className="register-icon">
              <i className="fa-solid fa-user-plus"></i>
            </div>

            <h2>Create your account</h2>

            <p>
              Start experiencing smarter video streaming.
            </p>
          </div>
        </div>

        {error && (
          <div className="register-error">
            <i className="fa-solid fa-circle-exclamation"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="register-field">
            <label htmlFor="name">Full Name</label>

            <div className="register-input">
              <i className="fa-regular fa-user"></i>

              <input
                id="name"
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                autoComplete="name"
                required
              />
            </div>
          </div>

          <div className="register-field">
            <label htmlFor="email">Email Address</label>

            <div className="register-input">
              <i className="fa-regular fa-envelope"></i>

              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="register-field">
            <label htmlFor="password">Password</label>

            <div className="register-input">
              <i className="fa-solid fa-lock"></i>

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                minLength={6}
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <i className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
              </button>
            </div>
          </div>

          <div className="register-field">
            <label htmlFor="confirmPassword">Confirm Password</label>

            <div className="register-input">
              <i className="fa-solid fa-shield-halved"></i>

              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                minLength={6}
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                <i className={`fa-regular ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="register-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm"></span>
                Creating Account...
              </>
            ) : (
              <>
                Create Account
                <i className="fa-solid fa-arrow-right"></i>
              </>
            )}
          </button>

        </form>

        <div className="register-divider">
          <span>Already have an account?</span>
        </div>

        <Link to="/login" className="register-login">
          Login to your account
        </Link>

        <p className="register-footer">
          <i className="fa-solid fa-shield-halved"></i>
          Your account information is securely protected.
        </p>

      </div>
    </div>
  );
}
