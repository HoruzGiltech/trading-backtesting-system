import type { CsvImportPreview } from "../services/csvImport";

// Resumen de lo leído del CSV: cuántas filas entran y qué filas fallan
export function CsvPreviewNote({ preview }: { preview: CsvImportPreview }) {
  const count = (result: string) => preview.entries.filter((e) => e.result === result).length;
  return (
    <div style={{ marginTop: 8, fontSize: 14 }}>
      <p style={{ margin: 0 }}>
        {preview.entries.length} filas listas para importar
        {preview.entries.length > 0 && ` (${count("TP")} TP, ${count("SL")} SL, ${count("NO_TRADE")} sin operar)`}
      </p>
      {preview.errors.length > 0 && (
        <ul style={{ color: "var(--loss)", margin: "4px 0 0", paddingLeft: 18 }}>
          {preview.errors.slice(0, 10).map((err) => <li key={err}>{err}</li>)}
          {preview.errors.length > 10 && <li>… y {preview.errors.length - 10} errores más</li>}
        </ul>
      )}
    </div>
  );
}
