import { NavLink } from "react-router-dom";
import { Activity, BrainCircuit, Fingerprint, LockKeyhole, Network, Shield } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Command Center", icon: Activity, end: true },
  { to: "/transaction-intelligence", label: "Transaction Intelligence", icon: Fingerprint },
  { to: "/risk-events", label: "Risk Events", icon: Network },
  { to: "/model-intelligence", label: "Model Intelligence", icon: BrainCircuit },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <Shield size={21} strokeWidth={2.5} />
        </div>
        <div>
          <strong>SENTINEL</strong>
          <span>AI RISK MANAGER</span>
        </div>
      </div>

      <div className="sidebar-status">
        <span className="status-dot" />
        <div>
          <strong>Risk engine operational</strong>
          <small>Core decision layers online</small>
        </div>
      </div>

      <nav>
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="security-card">
          <LockKeyhole size={17} />
          <div>
            <strong>Protected Environment</strong>
            <small>Decision layer secured</small>
          </div>
        </div>
        <div className="version">SENTINEL CORE · v1.1</div>
      </div>
    </aside>
  );
}
