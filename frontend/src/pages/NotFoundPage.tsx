import { Link, useNavigate } from "react-router-dom";
import { LogoLockup } from "../components/Logo";
import { useAuth } from "../context/AuthContext";

export default function NotFoundPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const home = isAuthenticated ? "/backtests" : "/";

  return (
    <div className="not-found">
      <Link to={home} style={{ textDecoration: "none" }}>
        <LogoLockup iconSize={28} />
      </Link>
      <div className="not-found-code">404</div>
      <h1>Esta página no existe</h1>
      <p>La dirección que abriste no corresponde a ninguna sección de GM Ledger. Puede que el enlace esté mal escrito o que la página se haya movido.</p>
      <div className="not-found-actions">
        <Link to={home} className="btn btn-primary" style={{ textDecoration: "none" }}>
          {isAuthenticated ? "Ir a mis backtests" : "Ir al inicio"}
        </Link>
        <button className="btn" onClick={() => navigate(-1)}>Volver atrás</button>
      </div>
    </div>
  );
}
