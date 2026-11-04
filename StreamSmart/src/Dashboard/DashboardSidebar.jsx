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

const MOBILE_QUERY = "(max-width: 768px)";
const isMobileNow = () => typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches;

export default function DashboardSidebar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(() => !isMobileNow());

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
      {!open && (
        <button type="button" className="ssb-fab" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu size={20} />
        </button>
      )}
      <div className={`ssb-shell ${open ? "is-open" : "is-collapsed"}`}>
        <aside className="ssb" aria-label="Dashboard navigation">
          <div className="ssb-brand">
            <Logo />
            <span className="ssb-brand-name">StreamSmart</span>
            <button type="button" className="ssb-close" onClick={() => setOpen(false)} aria-label="Close menu"><X size={19} /></button>
          </div>
          <Rail label="Workspace" items={mainItems} pathname={pathname} onNavigate={closeOnMobile} />
          <Rail label="Testing" items={testItems} pathname={pathname} onNavigate={closeOnMobile} />
          <div className="ssb-foot">
            <div className="ssb-card">
              <span className="ssb-ladder" aria-hidden="true"><i /><i /><i /></span>
              <div className="ssb-card-text"><strong>StreamSmart</strong><span>Streaming workspace</span></div>
            </div>
            <button type="button" className="ssb-toggle" onClick={() => setOpen((value) => !value)} aria-label={open ? "Collapse sidebar" : "Expand sidebar"} title={open ? "Collapse sidebar" : "Expand sidebar"}>
              {open ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
              <span>{open ? "Collapse menu" : "Expand menu"}</span>
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}

function Rail({ label, items, pathname, onNavigate }) {
  const clean = pathname.replace(/\/+$/, "") || "/";
  return (
    <div className="ssb-group">
      <p className="ssb-label">{label}</p>
      <nav className="ssb-rail" aria-label={label}>
        {items.map(({ name, path, icon: Icon, end }) => (
          <NavLink key={path} to={path} end={end || false} onClick={onNavigate} title={name} className={({ isActive }) => `ssb-link${isActive || (!end && clean.startsWith(path + "/")) ? " is-active" : ""}`}>
            <Icon size={18} strokeWidth={1.8} />
            <span>{name}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function Logo() {
  return (
    <svg className="ssb-logo" viewBox="0 0 40 40" aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="8" fill="#e9f500" />
      <path d="M16 11v18l14-9-14-9z" fill="#171717" />
    </svg>
  );
}
