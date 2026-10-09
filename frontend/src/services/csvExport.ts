type CsvValue = string | number | null | undefined;

function escapeCell(value: CsvValue): string {
  if (value == null) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// Genera el CSV en el navegador y dispara la descarga
export function downloadCsv(filename: string, headers: string[], rows: CsvValue[][]): void {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(","));
  // BOM para que Excel reconozca UTF-8 (tildes y ñ)
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
