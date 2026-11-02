import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Video,
  Network,
  Database,
  History,
  FlaskConical,
  Server,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import "./DashboardSidebar.css";

const mainItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, end: true },
  { name: "Video Player", path: "/dashboard/player", icon: Video },
  { name: "Network Simulator", path: "/dashboard/network-lab", icon: Network },
  { name: "Edge Server", path: "/dashboard/edge", icon: Server },
  { name: "Cache Analytics", path: "/dashboard/cache-analytics", icon: Database },
  { name: "Session History", path: "/dashboard/history", icon: History },
];

const testItems = [
  { name: "Experiments", path: "/dashboard/experiment", icon: FlaskConical },
];

/* Must match .ssb-link height + .ssb-rail gap in the CSS */
const STEP = 48;
const HALF_LINK = 22;
const MOBILE_QUERY = "(max-width: 768px)";

const isMobileNow = () =>
  typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches;

export default function DashboardSidebar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(() => !isMobileNow());

  // Desktop starts expanded, mobile starts with the drawer closed.
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setOpen(!mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const closeOnMobile = () => {
    if (isMobileNow()) setOpen(false);
  };

  return (
    <>
      {open && <div className="ssb-backdrop" onClick={() => setOpen(false)} />}

      {/* Mobile menu button */}
      {!open && (
        <button
          type="button"
          className="ssb-fab"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={21} />
        </button>
      )}

      <div className={`ssb-shell ${open ? "is-open" : "is-collapsed"}`}>
        <aside className="ssb" aria-label="Dashboard navigation">
          <div className="ssb-brand">
            <Logo />
            <span className="ssb-brand-name">StreamSmart</span>
            <button
              type="button"
              className="ssb-close"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          <Rail
            label="Workspace"
            items={mainItems}
            pathname={pathname}
            onNavigate={closeOnMobile}
          />

          <Rail
            label="Testing"
            items={testItems}
            pathname={pathname}
            onNavigate={closeOnMobile}
            tone="amber"
          />

          <div className="ssb-foot">
            <div className="ssb-card">
              <span className="ssb-ladder" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <div className="ssb-card-text">
                <strong>StreamSmart</strong>
                <span>Streaming workspace</span>
              </div>
            </div>

            <button
              type="button"
              className="ssb-toggle"
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
              title={open ? "Collapse sidebar" : "Expand sidebar"}
            >
              {open ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
              <span>Collapse</span>
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}

/* A group of links on a vertical "segment track".
   The filled part of the track runs down to the active page, like a playhead. */
function Rail({ label, items, pathname, onNavigate, tone = "mint" }) {
  const clean = pathname.replace(/\/+$/, "") || "/";

  const activeIndex = items.findIndex((item) =>
    item.end ? clean === item.path : clean === item.path || clean.startsWith(item.path + "/")
  );

  const progress = activeIndex >= 0 ? activeIndex * STEP + HALF_LINK : 0;

  return (
    <div className="ssb-group">
      <p className="ssb-label">{label}</p>

      <nav
        className={`ssb-rail tone-${tone}`}
        style={{ "--progress": `${progress}px` }}
      >
        {items.map((item, index) => {
          const Icon = item.icon;
          const passed = activeIndex >= 0 && index < activeIndex;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end || false}
              onClick={onNavigate}
              title={item.name}
              className={({ isActive }) =>
                `ssb-link${isActive ? " is-active" : ""}${passed ? " is-passed" : ""}`
              }
            >
              <Icon size={19} strokeWidth={1.9} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

/* Same mark as the signup page: play button + 360p / 720p / 1080p bars */
function Logo() {
  return (
    <svg className="ssb-logo" width="38" height="38" viewBox="0 0 48 48" aria-hidden="true">
      <rect x="1" y="1" width="46" height="46" rx="13" fill="#143330" stroke="#2A5550" />
      <path className="ssb-logo-play" d="M19 14.5v19l15-9.5-15-9.5z" fill="#fff" />
      <rect className="ssb-bar b1" x="7" y="30" width="3" height="8" rx="1.5" fill="#FFB547" />
      <rect className="ssb-bar b2" x="7" y="22" width="3" height="16" rx="1.5" fill="#4C9DFF" />
      <rect className="ssb-bar b3" x="7" y="12" width="3" height="26" rx="1.5" fill="#35E0B0" />
    </svg>
  );
}