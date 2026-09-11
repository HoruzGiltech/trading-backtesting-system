import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Layout({ children }: { children: ReactNode }) {
  const { logout, isAuthenticated } = useAuth();

  return (
    <>
      <div className="navbar">
        <Link to="/backtests" className="navbar-brand">
          trading<span>.</span>backtest
        </Link>
        {isAuthenticated && (
          <button className="btn" onClick={logout}>
            Cerrar sesión
          </button>
        )}
      </div>
      <div className="page">{children}</div>
    </>
  );
}