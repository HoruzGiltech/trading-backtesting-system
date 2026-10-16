import { useState } from "react";

interface Props {
  label: string;
  question: string;
  onConfirm: () => Promise<void>;
}

// Botón de borrado en dos pasos: primero pide confirmación en línea, sin diálogos del navegador
export function ConfirmDeleteButton({ label, question, onConfirm }: Props) {
  const [asking, setAsking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(false);

  async function handleConfirm() {
    setDeleting(true);
    setError(false);
    try {
      await onConfirm();
    } catch {
      setError(true);
      setDeleting(false);
    }
  }

  if (!asking) {
    return <button type="button" className="btn btn-danger" onClick={() => setAsking(true)}>{label}</button>;
  }

  return (
    <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <span style={{ fontSize: 13, color: error ? "var(--loss)" : "var(--text-muted)" }}>
        {error ? "No se pudo eliminar. ¿Reintentar?" : question}
      </span>
      <button type="button" className="btn btn-danger-solid" onClick={handleConfirm} disabled={deleting}>
        {deleting ? "Eliminando..." : "Sí, eliminar"}
      </button>
      <button type="button" className="btn" onClick={() => { setAsking(false); setError(false); }} disabled={deleting}>
        Cancelar
      </button>
    </span>
  );
}
