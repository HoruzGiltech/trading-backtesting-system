import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { LogoLockup } from "../components/Logo";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/backtests");
    } catch (err) {
      setError(
        isAxiosError(err) && err.response?.status === 401
          ? "Usuario o contraseña inválidos, intenta de nuevo."
          : "No se pudo iniciar sesión. Revisa tu conexión e intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
<Link to="/" style={{ display: "inline-block", marginBottom: 32, textDecoration: "none" }}>
  <LogoLockup iconSize={28} />
</Link>

      <h1>Iniciar sesión</h1>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label>Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
      <p style={{ marginTop: 16 }}>
        ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
      </p>
    </div>
  );
}