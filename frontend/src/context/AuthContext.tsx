import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

interface Trader {
  id: string;
  email: string;
  full_name: string;
}

interface AuthContextType {
  trader: Trader | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, full_name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("access_token")
  );
  const [trader, setTrader] = useState<Trader | null>(null);

  async function login(email: string, password: string) {
    const response = await api.post("/auth/login", { email, password });
    const newToken = response.data.access_token;
    localStorage.setItem("access_token", newToken);
    setToken(newToken);
  }

  async function register(email: string, password: string, full_name: string) {
    await api.post("/auth/register", { email, password, full_name });
    await login(email, password);
  }

  function logout() {
    localStorage.removeItem("access_token");
    setToken(null);
    setTrader(null);
  }

  useEffect(() => {
    // Placeholder: cuando creemos GET /auth/me en el backend,
    // aquí cargaremos los datos reales del trader autenticado.
  }, [token]);

  return (
    <AuthContext.Provider
      value={{ trader, token, login, register, logout, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}