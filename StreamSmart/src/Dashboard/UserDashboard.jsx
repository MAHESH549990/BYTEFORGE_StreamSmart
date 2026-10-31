
import { Outlet } from "react-router-dom";
import DashboardSidebar from "./DashboardSidebar";
import "./Dashboard.css";

export default function UserDashboard() {
  return (
    <div className="user-dashboard">
      <DashboardSidebar />

      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}
