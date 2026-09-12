import {
    Calculator,
    ChevronLeft, ChevronRight,
    Clock,
    LineChart,
    Menu,
    Newspaper,
    NotebookPen,
    X,
} from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";

const LINKS = [
  { to: "/backtests", label: "Backtests", icon: LineChart },
  { to: "/risk-calculator", label: "Calculadora", icon: Calculator },
  { to: "/kill-zones", label: "Kill Zones", icon: Clock },
  { to: "/trading-plan", label: "Plan de trading", icon: NotebookPen },
  { to: "/news", label: "Noticias", icon: Newspaper },
];

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(
    localStorage.getItem("sidebar_collapsed") === "true"
  );

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar_collapsed", String(next));
  }

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay active" onClick={onCloseMobile} />}
      <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-inner">
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 12px" }}>
            <button className="hamburger" onClick={onCloseMobile} aria-label="Cerrar menú">
              <X size={18} />
            </button>
          </div>

          {LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
              onClick={onCloseMobile}
            >
              <Icon size={18} />
              <span className="label">{label}</span>
            </NavLink>
          ))}

          <button className="sidebar-collapse-btn" onClick={toggleCollapsed} style={{ marginTop: "auto" }}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>
    </>
  );
}

export function SidebarToggleButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="hamburger btn" onClick={onClick} aria-label="Abrir menú">
      <Menu size={18} />
    </button>
  );
}