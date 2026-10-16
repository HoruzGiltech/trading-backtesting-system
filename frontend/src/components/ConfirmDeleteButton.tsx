import { useState } from "react";
import { isAxiosError } from "axios";

interface Props {
  label: string;
  question: string;
  onConfirm: () => Promise<void>;
}

// Botón de borrado en dos pasos: primero pide confirmación en línea, sin diálogos del navegador
export function ConfirmDeleteButton({ label, question, onConfirm }: Props) {
  const [asking, setAsking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      // El código HTTP ayuda a distinguir backend sin desplegar (404/405), sesión (401) o fallo del servidor (500)
      const status = isAxiosError(err) ? err.response?.status : undefined;
      setError(status ? `No se pudo eliminar (error ${status}). ¿Reintentar?` : "No se pudo eliminar (sin respuesta del servidor). ¿Reintentar?");
      setDeleting(false);
    }
  }

  if (!asking) {
    return <button type="button" className="btn btn-danger" onClick={() => setAsking(true)}>{label}</button>;
  }

  return (
    <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <span style={{ fontSize: 13, color: error ? "var(--loss)" : "var(--text-muted)" }}>
        {error ?? question}
      </span>
      <button type="button" className="btn btn-danger-solid" onClick={handleConfirm} disabled={deleting}>
        {deleting ? "Eliminando..." : "Sí, eliminar"}
      </button>
      <button type="button" className="btn" onClick={() => { setAsking(false); setError(null); }} disabled={deleting}>
        Cancelar
      </button>
    </span>
  );
}
