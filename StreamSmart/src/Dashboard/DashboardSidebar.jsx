
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Video,
  Network,
  ChartNoAxesCombined,
  GitCompareArrows,
  History,
  UserRound,
} from "lucide-react";

const menuItems = [
  {
    name: "Overview",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Video Library",
    path: "/dashboard/videos",
    icon: Video,
  },
  {
    name: "Network Lab",
    path: "/dashboard/network-lab",
    icon: Network,
  },
  {
    name: "Analytics",
    path: "/dashboard/analytics",
    icon: ChartNoAxesCombined,
  },
  {
    name: "Comparison",
    path: "/dashboard/comparison",
    icon: GitCompareArrows,
  },
  {
    name: "Test History",
    path: "/dashboard/history",
    icon: History,
  },
];

export default function DashboardSidebar() {
  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-brand">
        <Video size={25} />
        <span>StreamSmart</span>
      </div>

      <p className="sidebar-heading">WORKSPACE</p>

      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) =>
                isActive ? "sidebar-link active" : "sidebar-link"
              }
            >
              <Icon size={19} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <NavLink to="/profile" className="sidebar-link">
          <UserRound size={19} />
          <span>My Profile</span>

          <NavLink to="/dashboard/experiment">
               Experiments
         </NavLink>
        </NavLink>
      </div>
    </aside>
  );
}
