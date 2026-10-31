
import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Video,
  Network,
  SlidersHorizontal,
  Database,
  GitCompareArrows,
  History,
  Settings,
  FlaskConical,
  Radio,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    end: true,
  },
  {
    name: "Video Player",
    path: "/dashboard/player",
    icon: Video,
  },
  {
    name: "Network Simulator",
    path: "/dashboard/network-lab",
    icon: Network,
  },
  {
    name: "Adaptive Quality",
    path: "/dashboard/video-quality",
    icon: SlidersHorizontal,
  },
  {
    name: "Cache Analytics",
    path: "/dashboard/cache-analytics",
    icon: Database,
  },
  {
    name: "Performance Comparison",
    path: "/dashboard/comparison",
    icon: GitCompareArrows,
  },
  {
    name: "Session History",
    path: "/dashboard/history",
    icon: History,
  },
  {
    name: "Settings",
    path: "/dashboard/settings",
    icon: Settings,
  },
];

export default function DashboardSidebar() {
  const [isOpen, setIsOpen] = useState(true);

  const closeMobileSidebar = () => {
    if (window.innerWidth <= 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`dashboard-sidebar-shell ${
          isOpen ? "sidebar-expanded" : "sidebar-collapsed"
        }`}
      >
        {/* Toggle button */}
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Hide sidebar" : "Show sidebar"}
          title={isOpen ? "Hide sidebar" : "Show sidebar"}
        >
          {isOpen ? (
            <>
              <PanelLeftClose className="desktop-toggle-icon" size={19} />
              <X className="mobile-toggle-icon" size={21} />
            </>
          ) : (
            <>
              <PanelLeftOpen className="desktop-toggle-icon" size={19} />
              <Menu className="mobile-toggle-icon" size={21} />
            </>
          )}
        </button>

        <aside className="dashboard-sidebar">
          <LinkBrand />

          <div className="sidebar-section">
            <p className="sidebar-heading">MAIN MENU</p>

            <nav className="sidebar-menu">
              {menuItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end || false}
                    onClick={closeMobileSidebar}
                    title={item.name}
                    className={({ isActive }) =>
                      isActive
                        ? "sidebar-link active"
                        : "sidebar-link"
                    }
                  >
                    <Icon size={19} strokeWidth={1.9} />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="sidebar-section experiment-section">
            <p className="sidebar-heading">TESTING</p>

            <NavLink
              to="/dashboard/experiment"
              onClick={closeMobileSidebar}
              title="Experiments"
              className={({ isActive }) =>
                isActive
                  ? "sidebar-link active"
                  : "sidebar-link"
              }
            >
              <FlaskConical size={19} strokeWidth={1.9} />
              <span>Experiments</span>
            </NavLink>
          </div>

          <div className="sidebar-status">
            <div className="status-icon">
              <Radio size={17} />
            </div>

            <div>
              <strong>StreamSmart</strong>
              <span>Streaming Workspace</span>
            </div>

            <span className="status-dot"></span>
          </div>
        </aside>
      </div>
    </>
  );
}

function LinkBrand() {
  return (
    <div className="sidebar-brand">
      <div className="sidebar-brand-icon">
        <Video size={22} />
      </div>

      <span>
        Stream<span className="sidebar-brand-highlight">Smart</span>
      </span>
    </div>
  );
}
