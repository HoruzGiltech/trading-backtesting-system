import axios, { isAxiosError } from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Interceptor: agrega automáticamente el token guardado a cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: si el backend responde 401, el token expiró o es inválido -> logout.
// En /auth/* un 401 significa credenciales incorrectas: lo maneja el formulario, sin redirigir.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = error.config?.url?.startsWith("/auth/");
    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

const FIELD_LABELS: Record<string, string> = {
  entry_date: "Fecha", side: "Lado", open_price: "Precio apertura", close_price: "Precio cierre",
  result: "Resultado", percentage: "%", amount: "Monto", pips_ticks: "Pips/Ticks", observations: "Observaciones",
  symbol: "Símbolo", volume: "Lotes", closed_at: "Fecha de cierre", profit: "Monto", date: "Fecha", reason: "Motivo",
};

// Mensaje legible a partir del error del backend. En un 422 de FastAPI indica qué campo falló y por qué.
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (!isAxiosError(err)) return fallback;
  if (!err.response) return `${fallback} (sin respuesta del servidor)`;
  const detail = err.response.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const issues = detail.map((d: { loc?: (string | number)[]; msg?: string }) => {
      const field = String(d.loc?.[d.loc.length - 1] ?? "");
      return `${FIELD_LABELS[field] ?? field}: ${d.msg ?? "valor no válido"}`;
    });
    return `${fallback} ${issues.join("; ")}`;
  }
  return `${fallback} (error ${err.response.status})`;
}
