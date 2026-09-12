import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Layout({ children }: { children: ReactNode }) {
  const { logout, isAuthenticated } = useAuth();
  const location = useLocation();

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className="btn"
      style={location.pathname.startsWith(to) ? { borderColor: "var(--accent)", color: "var(--accent)" } : {}}
    >
      {label}
    </Link>
  );

  return (
    <>
      <div className="navbar">
        <Link to="/backtests" className="navbar-brand">trading<span>.</span>backtest</Link>
        {isAuthenticated && (
          <div style={{ display: "flex", gap: 8 }}>
            {navLink("/backtests", "Backtests")}
            {navLink("/risk-calculator", "Calculadora")}
            {navLink("/kill-zones", "Kill Zones")}
            {navLink("/trading-plan", "Plan de trading")}
            <button className="btn" onClick={logout}>Cerrar sesión</button>
          </div>
        )}
      </div>
      <div className="page">{children}</div>
    </>
  );
}