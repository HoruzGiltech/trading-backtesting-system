import type { BacktestImportRow } from "../types/backtest";

// Nombres de columna aceptados. Cubre el export de la app, el export antiguo
// (activo/pips_ticks sin precios) y el CSV del registro de TradingView
// (direccion/precio_entrada/precio_salida/pips/observacion).
const COLUMN_ALIASES: Record<string, string[]> = {
  date: ["fecha", "date", "entry_date", "dia"],
  asset: ["simbolo", "activo", "symbol", "asset", "par"],
  timeframe: ["temporalidad", "timeframe", "tf"],
  side: ["lado", "direccion", "side", "direction", "tipo"],
  open: ["precio_apertura", "precio_entrada", "open_price", "apertura", "entrada"],
  close: ["precio_cierre", "precio_salida", "close_price", "cierre", "salida"],
  result: ["resultado", "result"],
  percentage: ["porcentaje", "percentage", "%", "pct"],
  amount: ["monto", "amount", "pnl", "beneficio"],
  pips: ["pips_ticks", "pips", "ticks"],
  observations: ["observaciones", "observacion", "observations", "notas", "notes", "motivo"],
};

export interface CsvImportPreview {
  entries: BacktestImportRow[];
  errors: string[];
  // Datos de cabecera deducidos del archivo, para rellenar el formulario de nuevo backtest
  asset?: string;
  timeframe?: string;
  month?: number;
  year?: number;
}

function normalize(text: string): string {
  return text.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "_");
}

// Parser CSV con soporte de comillas (campos con comas, comillas dobles y saltos de línea)
function parseRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length > 0) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function parseNumber(raw: string | undefined, decimalComma: boolean): number | undefined {
  if (raw == null) return undefined;
  let text = raw.trim().replace(/[%$\s]/g, "");
  if (text === "") return undefined;
  if (decimalComma) text = text.replace(/\./g, "").replace(",", ".");
  const n = Number(text);
  return Number.isFinite(n) ? n : NaN;
}

function parseDate(raw: string): string | null {
  const text = raw.trim();
  let m = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);   // DD/MM/YYYY
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

function parseSide(raw: string | undefined): "BUY" | "SELL" | null | undefined {
  const value = normalize(raw ?? "");
  if (value === "") return undefined;
  if (["buy", "compra", "long", "largo", "c"].includes(value)) return "BUY";
  if (["sell", "venta", "short", "corto", "v"].includes(value)) return "SELL";
  return null;
}

function parseResult(raw: string | undefined): BacktestImportRow["result"] | null {
  const value = normalize(raw ?? "");
  if (["tp", "win", "ganada", "ganancia", "w"].includes(value)) return "TP";
  if (["sl", "loss", "lost", "perdida", "l"].includes(value)) return "SL";
  if (["no_trade", "no_operado", "sin_operar", "no_opere", "nt"].includes(value)) return "NO_TRADE";
  return null;
}

export function parseBacktestCsv(text: string): CsvImportPreview {
  const clean = text.replace(/^﻿/, "");
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? "";
  // Excel en español guarda con ";" y coma decimal
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const decimalComma = delimiter === ";";
  const rows = parseRows(clean, delimiter);
  const errors: string[] = [];
  const entries: BacktestImportRow[] = [];

  if (rows.length < 2) return { entries, errors: ["El archivo no tiene filas de datos."] };

  const headers = rows[0].map(normalize);
  const col: Record<string, number> = {};
  for (const [key, aliases] of Object.entries(COLUMN_ALIASES)) {
    const index = headers.findIndex((h) => aliases.includes(h));
    if (index >= 0) col[key] = index;
  }
  if (col.date == null || col.result == null) {
    return { entries, errors: ["El CSV necesita al menos las columnas 'fecha' y 'resultado'."] };
  }

  const get = (row: string[], key: string) => (col[key] != null ? row[col[key]]?.trim() : undefined);
  let asset: string | undefined;
  let timeframe: string | undefined;

  rows.slice(1).forEach((row, i) => {
    const line = i + 2;
    const rowErrors: string[] = [];
    const entryDate = parseDate(get(row, "date") ?? "");
    if (!entryDate) rowErrors.push(`fecha inválida "${get(row, "date") ?? ""}"`);
    const result = parseResult(get(row, "result"));
    if (!result) rowErrors.push(`resultado "${get(row, "result") ?? ""}" no reconocido (usa TP, SL o NO_TRADE)`);
    const side = parseSide(get(row, "side"));
    if (side === null) rowErrors.push(`lado "${get(row, "side")}" no reconocido (usa compra/venta)`);

    const numbers = {
      open_price: parseNumber(get(row, "open"), decimalComma),
      close_price: parseNumber(get(row, "close"), decimalComma),
      percentage: parseNumber(get(row, "percentage"), decimalComma),
      amount: parseNumber(get(row, "amount"), decimalComma),
      pips_ticks: parseNumber(get(row, "pips"), decimalComma),
    };
    for (const [name, value] of Object.entries(numbers)) {
      if (Number.isNaN(value)) rowErrors.push(`${name} no es un número`);
    }
    const observations = get(row, "observations") || undefined;
    if (result === "NO_TRADE" && !observations) rowErrors.push("un día sin operar necesita el motivo en observaciones");

    if (rowErrors.length > 0) {
      errors.push(`Fila ${line}: ${rowErrors.join("; ")}`);
      return;
    }
    asset ??= get(row, "asset") || undefined;
    timeframe ??= get(row, "timeframe") || undefined;
    entries.push({
      entry_date: entryDate!,
      result: result!,
      side: side ?? undefined,
      open_price: numbers.open_price,
      close_price: numbers.close_price,
      percentage: numbers.percentage ?? 0,
      amount: numbers.amount ?? 0,
      pips_ticks: numbers.pips_ticks ?? 0,
      observations,
    });
  });

  const firstDate = entries.map((e) => e.entry_date).sort()[0];
  return {
    entries,
    errors,
    asset,
    timeframe,
    year: firstDate ? Number(firstDate.slice(0, 4)) : undefined,
    month: firstDate ? Number(firstDate.slice(5, 7)) : undefined,
  };
}

export async function readBacktestCsv(file: File): Promise<CsvImportPreview> {
  return parseBacktestCsv(await file.text());
}
