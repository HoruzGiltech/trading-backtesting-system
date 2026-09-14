import { Link } from "react-router-dom";
import { LogoLockup } from "../components/Logo";

export default function LandingPage() {
  return (
    <div>
      <div className="navbar">
        <Link to="/" style={{ textDecoration: "none" }}>
  <LogoLockup />
</Link>
        <div style={{ display: "flex", gap: 10 }}>
          <Link to="/login" className="btn">Iniciar sesión</Link>
          <Link to="/register" className="btn btn-primary">Crear cuenta gratis</Link>
        </div>
      </div>

      <div className="page" style={{ maxWidth: 880 }}>
        {/* --- Hero --- */}
        <div style={{ padding: "48px 0 32px" }}>
          <h1 style={{ fontSize: 38, maxWidth: 620, lineHeight: 1.2 }}>
            Registra y compara tu backtesting de trading con disciplina de datos.
          </h1>
          <p style={{ fontSize: 16, maxWidth: 560, marginTop: 12 }}>
            Deja de anotar tus resultados en hojas de cálculo dispersas. Registra cada día operado,
            obtén tu win rate, profit factor y margen de consistencia al instante, y compara
            backtests futuros contra los mismos parámetros para saber si tu edge realmente mejora.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <Link to="/register" className="btn btn-primary">Empezar gratis</Link>
            <Link to="/login" className="btn">Ya tengo cuenta</Link>
          </div>
        </div>

        {/* --- Features --- */}
        <h2 style={{ marginTop: 48 }}>Qué incluye</h2>
        <div className="summary-grid">
          <div className="summary-cell">
            <div className="label">Registro diario</div>
            <p style={{ margin: "6px 0 0", fontSize: 13 }}>
              Carga cada día operado: resultado, % ganado/perdido, monto, pips/ticks y observaciones.
            </p>
          </div>
          <div className="summary-cell">
            <div className="label">Métricas en vivo</div>
            <p style={{ margin: "6px 0 0", fontSize: 13 }}>
              Win rate, profit factor y margen de consistencia calculados automáticamente.
            </p>
          </div>
          <div className="summary-cell">
            <div className="label">Comparativa</div>
            <p style={{ margin: "6px 0 0", fontSize: 13 }}>
              Enfrenta backtests con los mismos parámetros para ver si tu sistema mejora.
            </p>
          </div>
          <div className="summary-cell">
            <div className="label">Plan de trading</div>
            <p style={{ margin: "6px 0 0", fontSize: 13 }}>
              Define tu plan, tus kill zones y consulta noticias de alto impacto.
            </p>
          </div>
        </div>

        {/* --- Premium CTA (placeholder) --- */}
        <h2 style={{ marginTop: 48 }}>Plan Premium</h2>
        <div className="panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 600 }}>Desbloquea comparativas ilimitadas, plan de trading y calculadora de riesgo</div>
            <p style={{ margin: "4px 0 0", fontSize: 13 }}>El registro gratuito incluye backtesting y consulta básica.</p>
          </div>
          <button className="btn" disabled title="Próximamente">
            Próximamente
          </button>
        </div>

       <p style={{ marginTop: 48, fontSize: 12, textAlign: "center" }}>
  © {new Date().getFullYear()} GM Ledger
</p>
      </div>
    </div>
  );
}