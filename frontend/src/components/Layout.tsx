import type { ReactNode } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sidebar, SidebarToggleButton } from "./Sidebar";

export function Layout({ children }: { children: ReactNode }) {
  const { logout, isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell">
      {isAuthenticated && (
        <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      )}
      <div className="main-content">
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isAuthenticated && (
              <SidebarToggleButton onClick={() => setMobileOpen(true)} />
            )}
            <Link to="/backtests" className="navbar-brand">trading<span>.</span>backtest</Link>
          </div>
          {isAuthenticated && (
            <button className="btn" onClick={logout}>Cerrar sesión</button>
          )}
        </div>
        <div className="page">{children}</div>
      </div>
    </div>
  );
}