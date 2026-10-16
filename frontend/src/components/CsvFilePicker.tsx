import type { ChangeEvent } from "react";

interface Props {
  fileName?: string | null;
  onFile: (file: File) => void;
  onClear?: () => void;
}

// Selector de CSV con el estilo de la app en lugar del input nativo del navegador
export function CsvFilePicker({ fileName, onFile, onClear }: Props) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Vaciar el valor permite volver a elegir el mismo archivo tras corregirlo
    e.target.value = "";
    if (file) onFile(file);
  }

  return (
    <label className="file-picker">
      <input type="file" accept=".csv,text/csv" onChange={handleChange} />
      <span className={`file-picker-name${fileName ? " has-file" : ""}`}>
        {fileName ?? "Ningún archivo .csv"}
      </span>
      {fileName && onClear && (
        <button
          type="button" className="btn-icon" title="Quitar archivo"
          onClick={(e) => { e.preventDefault(); onClear(); }}
        >
          ×
        </button>
      )}
      <span className="btn">{fileName ? "Cambiar" : "Elegir CSV"}</span>
    </label>
  );
}
