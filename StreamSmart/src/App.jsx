import EdgeAnalytics from "./Dashboard/edge/EdgeAnalytics";
import { Routes, Route } from "react-router-dom";

import UserDashboard from "./Dashboard/UserDashboard.jsx";
import DashboardHome from "./Dashboard/DashboardHome.jsx";
import VideoLibrary from "./Dashboard/videos/VideoLibrary.jsx";
import NetworkLab from "./Dashboard/network/NetworkLab.jsx";
import Analytics from "./Dashboard/analytics/Analytics.jsx";
import ComparisonChart from "./Dashboard/analytics/ComparisonChart.jsx";
import TestHistory from "./Dashboard/history/TestHistory.jsx";
import ExperimentPage from "./experiments/ExperimentPage.jsx";
import ExperimentRunner from "./experiments/ExperimentRunner.jsx";

import Navbar from "./Components/navbar";
import Footer from "./Components/footer";
import FlashMessage from "./Components/FlashMessage";

import LandingPage from "./landing/LandingPage";
import Login from "./form/login";
import Register from "./form/register";
import UserProfile from "./form/userprofile";

import Dashboard from "./Dashboard/index.jsx";
import VideoPlayer from "./videos/VideoPlayer.jsx";

import "./App.css";

function App() {
  return (
    <div className="app-layout">
      <FlashMessage />

      <Navbar />

      <div className="route-content">
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<UserProfile />} />

          {/* User Dashboard */}
          <Route path="/dashboard" element={<UserDashboard />}>
            <Route index element={<DashboardHome />} />

            <Route path="videos" element={<VideoLibrary />} />

            <Route path="player" element={<VideoPlayer />} />

            <Route path="video-quality" element={<VideoPlayer />} />
            {/* NEW EDGE SERVER ROUTE */}
             <Route path="edge" element={<EdgeAnalytics />} />

            <Route path="network-lab" element={<NetworkLab />} />

            <Route path="analytics" element={<Analytics />} />

            <Route
              path="cache-analytics"
              element={<Analytics />}
            />

            <Route
              path="comparison"
              element={<ComparisonChart />}
            />

            <Route path="history" element={<TestHistory />} />

            {/* Experiment configuration */}
            <Route
              path="experiment"
              element={<ExperimentPage />}
            />

            {/* Experiment execution */}
            <Route
              path="experiment/run"
              element={<ExperimentRunner />}
            />

            <Route
              path="settings"
              element={
                <div className="p-4">
                  <h2>Settings</h2>
                  <p>Settings page is coming soon.</p>
                </div>
              }
            />
          </Route>

          {/* Admin Dashboard */}
          <Route path="/admin" element={<Dashboard />} />

          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="text-center py-5">
                <h1>404</h1>
                <h4>Page Not Found</h4>
              </div>
            }
          />
        </Routes>
      </div>

      <Footer />
    </div>
  );
}

export default App;
