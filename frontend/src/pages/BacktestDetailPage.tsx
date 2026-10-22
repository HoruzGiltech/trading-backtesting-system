import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { CsvFilePicker } from "../components/CsvFilePicker";
import { ConfirmDeleteButton } from "../components/ConfirmDeleteButton";
import { CsvPreviewNote } from "../components/CsvPreviewNote";
import { Layout } from "../components/Layout";
import { TradeCalendar, type TradeCalendarEntry } from "../components/TradeCalendar";
import {
  addBacktestEntry, addNoTradeDay, deleteBacktest, deleteBacktestEntry, getBacktestDetail, importBacktestEntries,
  updateBacktest, updateBacktestEntry, updateNoTradeDay,
} from "../services/backtestService";
import { downloadCsv } from "../services/csvExport";
import type { CsvImportPreview } from "../services/csvImport";
import { readBacktestCsv } from "../services/csvImport";
import { apiErrorMessage } from "../services/api";
import type { BacktestDetail, BacktestEntry, ResultType } from "../types/backtest";

export default function BacktestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<BacktestDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);

  // Si se creó desde la lista con un CSV y la importación falló, se avisa aquí
  const [showImport, setShowImport] = useState(Boolean(location.state?.importFailed));
  const [importPreview, setImportPreview] = useState<CsvImportPreview | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(
    location.state?.importFailed ? "El backtest se creó, pero no se pudieron importar los días del CSV. Vuelve a subirlo." : null
  );
  const [importing, setImporting] = useState(false);

  const [entryDate, setEntryDate] = useState("");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [openPrice, setOpenPrice] = useState("");
  const [closePrice, setClosePrice] = useState("");
  const [result, setResult] = useState<ResultType>("TP");
  const [percentage, setPercentage] = useState("");
  const [amount, setAmount] = useState("");
  const [pipsTicks, setPipsTicks] = useState("");
  const [observations, setObservations] = useState("");
  const [saving, setSaving] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);

  // Día que se está corrigiendo: se carga en el formulario de "Agregar día" o en el de "Día sin operar"
  const [editingEntry, setEditingEntry] = useState<BacktestEntry | null>(null);
  const entryFormRef = useRef<HTMLFormElement>(null);
  const noTradeFormRef = useRef<HTMLFormElement>(null);
  const editingTrade = editingEntry && editingEntry.result !== "NO_TRADE" ? editingEntry : null;
  const editingNoTrade = editingEntry?.result === "NO_TRADE" ? editingEntry : null;

  const [showNoTrade, setShowNoTrade] = useState(false);
  const [noTradeDate, setNoTradeDate] = useState("");
  const [noTradeReason, setNoTradeReason] = useState("");
  const [noTradeError, setNoTradeError] = useState<string | null>(null);
  const [savingNoTrade, setSavingNoTrade] = useState(false);

  useEffect(() => {
    if (id) loadDetail(id);
  }, [id]);

  async function loadDetail(backtestId: string) {
    setLoading(true);
    try {
      setDetail(await getBacktestDetail(backtestId));
    } finally {
      setLoading(false);
    }
  }

  function resetEntryForm() {
    setEntryDate(""); setSide("BUY"); setOpenPrice(""); setClosePrice(""); setResult("TP");
    setPercentage(""); setAmount(""); setPipsTicks(""); setObservations("");
  }

  function startEditEntry(entry: BacktestEntry) {
    setEditingEntry(entry);
    setEntryError(null);
    setNoTradeError(null);
    // Si se estaba corrigiendo otro tipo de día, su formulario vuelve a quedar vacío
    if (entry.result === "NO_TRADE") {
      if (editingTrade) resetEntryForm();
      setNoTradeDate(entry.entry_date);
      setNoTradeReason(entry.observations ?? "");
      setShowNoTrade(true);
      requestAnimationFrame(() => noTradeFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return;
    }
    if (editingNoTrade) { setNoTradeDate(""); setNoTradeReason(""); }
    setShowNoTrade(false);
    setEntryDate(entry.entry_date);
    setSide(entry.side ?? "BUY");
    setOpenPrice(entry.open_price != null ? String(entry.open_price) : "");
    setClosePrice(entry.close_price != null ? String(entry.close_price) : "");
    setResult(entry.result);
    setPercentage(String(entry.percentage));
    setAmount(String(entry.amount));
    setPipsTicks(String(entry.pips_ticks));
    setObservations(entry.observations ?? "");
    entryFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelEdit() {
    if (editingNoTrade) {
      setNoTradeDate(""); setNoTradeReason(""); setShowNoTrade(false);
    } else {
      resetEntryForm();
    }
    setEditingEntry(null);
    setEntryError(null);
    setNoTradeError(null);
  }

  async function handleDeleteEntry() {
    if (!id || !editingEntry) return;
    await deleteBacktestEntry(id, editingEntry.id);
    cancelEdit();
    await loadDetail(id);
  }

  async function handleAddEntry(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setEntryError(null);
    try {
      // En TP/SL el signo lo pone el resultado; en BE se respeta lo escrito (+/- por spread o comisión)
      // Se redondea a los decimales que guarda la base (2 en montos, 6 en precios) para que el backend no la rechace
      const round = (value: number, decimals: number) => Number(value.toFixed(decimals));
      const signed = (raw: string) => {
        const value = round(parseFloat(raw), 2);
        if (result === "BE") return value;
        return Math.abs(value) * (result === "SL" ? -1 : 1);
      };
      const data = {
        entry_date: entryDate,
        side,
        open_price: round(parseFloat(openPrice), 6),
        close_price: round(parseFloat(closePrice), 6),
        result,
        percentage: signed(percentage),
        amount: signed(amount),
        pips_ticks: signed(pipsTicks),
        observations: observations || undefined,
      };
      if (editingTrade) {
        await updateBacktestEntry(id, editingTrade.id, data);
        setEditingEntry(null);
        resetEntryForm();
      } else {
        await addBacktestEntry(id, data);
        setEntryDate(""); setOpenPrice(""); setClosePrice(""); setPercentage(""); setAmount(""); setPipsTicks(""); setObservations("");
      }
      await loadDetail(id);
    } catch (err) {
      setEntryError(apiErrorMessage(err, editingTrade ? "No se pudieron guardar los cambios." : "No se pudo agregar el día."));
    } finally {
      setSaving(false);
    }
  }

  async function handleAddNoTrade(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSavingNoTrade(true);
    setNoTradeError(null);
    try {
      if (editingNoTrade) {
        await updateNoTradeDay(id, editingNoTrade.id, noTradeDate, noTradeReason.trim());
        setEditingEntry(null);
      } else {
        await addNoTradeDay(id, noTradeDate, noTradeReason.trim());
      }
      setNoTradeDate(""); setNoTradeReason("");
      setShowNoTrade(false);
      await loadDetail(id);
    } catch (err) {
      setNoTradeError(
        isAxiosError(err) && err.response?.status === 409
          ? "Ese día ya está registrado como no operado."
          : "No se pudo registrar el día. Inténtalo de nuevo."
      );
    } finally {
      setSavingNoTrade(false);
    }
  }

  async function handleImportFile(file: File) {
    setImportMessage(null);
    setImportPreview(await readBacktestCsv(file));
  }

  function startEditName() {
    if (!detail) return;
    setNameDraft(detail.name);
    setNameError(null);
    setEditingName(true);
  }

  async function handleSaveName(e: FormEvent) {
    e.preventDefault();
    if (!id || !detail) return;
    setSavingName(true);
    setNameError(null);
    try {
      const updated = await updateBacktest(id, { name: nameDraft.trim() });
      setDetail({ ...detail, name: updated.name });
      setEditingName(false);
    } catch {
      setNameError("No se pudo guardar el nombre. Inténtalo de nuevo.");
    } finally {
      setSavingName(false);
    }
  }

  async function handleImport() {
    if (!id || !importPreview || importPreview.entries.length === 0) return;
    setImporting(true);
    setImportMessage(null);
    try {
      const { imported, skipped } = await importBacktestEntries(id, importPreview.entries);
      setImportMessage(
        `Importados ${imported} días` + (skipped > 0 ? ` (${skipped} días sin operar ya estaban registrados y se omitieron).` : ".")
      );
      setImportPreview(null);
      await loadDetail(id);
    } catch {
      setImportMessage("No se pudo importar el CSV. No se guardó ninguna fila; revisa el archivo e inténtalo de nuevo.");
    } finally {
      setImporting(false);
    }
  }

  function handleExportCsv() {
    if (!detail) return;
    const month = String(detail.month).padStart(2, "0");
    const slug = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
    downloadCsv(
      `backtest_${slug(detail.name)}_${slug(detail.asset)}_${detail.year}-${month}_${detail.timeframe}.csv`,
      ["fecha", "simbolo", "temporalidad", "lado", "precio_apertura", "precio_cierre", "resultado",
        "porcentaje", "monto", "pips_ticks", "observaciones"],
      detail.entries.map((entry) => [
        entry.entry_date, detail.asset, detail.timeframe, entry.side, entry.open_price, entry.close_price,
        entry.result, entry.percentage, entry.amount, entry.pips_ticks, entry.observations,
      ])
    );
  }

  if (loading) return <Layout><p>Cargando...</p></Layout>;
  if (!detail) return <Layout><p>Backtest no encontrado</p></Layout>;

  const { summary } = detail;
  const fmt = (n: number) => (n > 0 ? "num-positive" : n < 0 ? "num-negative" : "");
  const calendarEntries: TradeCalendarEntry[] = detail.entries.map((entry) => {
    const noTrade = entry.result === "NO_TRADE";
    return {
      id: entry.id,
      date: entry.entry_date,
      title: noTrade ? "Día sin operar" : `${detail.asset} · ${entry.side === "BUY" ? "Compra" : entry.side === "SELL" ? "Venta" : "Operación"}`,
      result: noTrade ? "No operado" : entry.result,
      resultClass: noTrade ? "neutral" : entry.result === "TP" ? "positive" : entry.result === "SL" ? "negative" : "breakeven",
      profit: entry.amount,
      noTrade,
      details: [
        { label: "Símbolo", value: detail.asset },
        { label: "Temporalidad", value: detail.timeframe },
        { label: "Lotaje", value: String(detail.lot_size) },
        { label: "Lado", value: entry.side === "BUY" ? "Compra" : entry.side === "SELL" ? "Venta" : "—" },
        { label: "Precio apertura", value: entry.open_price != null ? String(entry.open_price) : "—" },
        { label: "Precio cierre", value: entry.close_price != null ? String(entry.close_price) : "—" },
        { label: "Resultado", value: noTrade ? "No operado" : entry.result },
        { label: "Porcentaje", value: noTrade ? "—" : `${entry.percentage}%` },
        { label: "Monto", value: noTrade ? "—" : `$${entry.amount}` },
        { label: "Pips/Ticks", value: noTrade ? "—" : String(entry.pips_ticks) },
        { label: "Observaciones", value: entry.observations ?? "—" },
      ],
    };
  });

  return (
    <Layout>
      <Link to="/backtests">← Volver</Link>
      {editingName ? (
        <form onSubmit={handleSaveName} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", margin: "16px 0 8px" }}>
          <div className="field" style={{ flex: "1 1 280px", marginBottom: 0 }}>
            <input
              type="text" value={nameDraft} maxLength={120} required autoFocus aria-label="Nombre del backtest"
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") setEditingName(false); }}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={savingName || !nameDraft.trim()}>
            {savingName ? "Guardando..." : "Guardar"}
          </button>
          <button type="button" className="btn" onClick={() => setEditingName(false)}>Cancelar</button>
        </form>
      ) : (
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <h1>{detail.name}</h1>
          <button className="btn" onClick={startEditName}>Editar nombre</button>
          <ConfirmDeleteButton
            label="Eliminar backtest"
            question={`¿Eliminar este backtest y sus ${detail.entries.length} días registrados?`}
            onConfirm={async () => {
              await deleteBacktest(detail.id);
              navigate("/backtests");
            }}
          />
        </div>
      )}
      {nameError && <p className="error-text">{nameError}</p>}
      <p>{detail.asset} · {detail.month}/{detail.year} · {detail.timeframe} · Lotaje: {detail.lot_size} · Cuenta: {detail.account_size}</p>

      <h2>{editingTrade ? `Editar día ${editingTrade.entry_date}` : "Agregar día"}</h2>
      <form className="panel" onSubmit={handleAddEntry} ref={entryFormRef}>
        <div className="form-row">
          <div className="field">
            <label>Fecha</label>
            <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} required />
          </div>
          <div className="field">
            <label>Símbolo</label>
            <input type="text" value={detail.asset} readOnly disabled />
          </div>
          <div className="field">
            <label>Lado</label>
            <select value={side} onChange={(e) => setSide(e.target.value as "BUY" | "SELL")}>
              <option value="BUY">Compra</option>
              <option value="SELL">Venta</option>
            </select>
          </div>
          <div className="field">
            <label>Precio apertura</label>
            <input type="number" step="any" min="0" value={openPrice} onChange={(e) => setOpenPrice(e.target.value)} required />
          </div>
          <div className="field">
            <label>Precio cierre</label>
            <input type="number" step="any" min="0" value={closePrice} onChange={(e) => setClosePrice(e.target.value)} required />
          </div>
          <div className="field">
            <label>Resultado</label>
            <select value={result} onChange={(e) => setResult(e.target.value as ResultType)}>
              <option value="TP">TP (Win)</option>
              <option value="SL">SL (Lost)</option>
              <option value="BE">BE (Breakeven)</option>
            </select>
          </div>
          <div className="field">
            <label>% ganado/perdido</label>
            <input type="number" step="0.01" value={percentage} onChange={(e) => setPercentage(e.target.value)} required />
          </div>
          <div className="field">
            <label>Monto $</label>
            <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div className="field">
            <label>Pips/Ticks</label>
            <input type="number" step="0.01" value={pipsTicks} onChange={(e) => setPipsTicks(e.target.value)} required />
          </div>
          <div className="field">
            <label>Observaciones</label>
            <input type="text" value={observations} onChange={(e) => setObservations(e.target.value)} />
          </div>
        </div>
        {entryError && <p className="error-text">{entryError}</p>}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Guardando..." : editingTrade ? "Guardar cambios" : "Agregar"}
          </button>
          {editingTrade && (
            <>
              <button type="button" className="btn" onClick={cancelEdit} disabled={saving}>Cancelar</button>
              <ConfirmDeleteButton
                key={editingTrade.id} label="Eliminar día"
                question={`¿Eliminar el día ${editingTrade.entry_date}?`} onConfirm={handleDeleteEntry}
              />
            </>
          )}
        </div>
      </form>

      <div className="calendar-page-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <h2>Días registrados</h2>
        <div className="calendar-page-action-buttons" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className="btn"
            onClick={() => {
              if (editingNoTrade) { cancelEdit(); return; }
              setShowNoTrade(!showNoTrade); setNoTradeError(null);
            }}
          >
            {showNoTrade ? "Cancelar" : "+ Día sin operar"}
          </button>
          <button className="btn" onClick={() => { setShowImport(!showImport); setImportPreview(null); setImportMessage(null); }}>
            {showImport ? "Cerrar importación" : "Importar CSV"}
          </button>
          <button className="btn" onClick={handleExportCsv} disabled={detail.entries.length === 0}>
            Descargar CSV
          </button>
        </div>
      </div>

      {showImport && (
        <div className="panel">
          <div className="form-row backtest-import-row" style={{ gridTemplateColumns: "minmax(0, 1fr) auto" }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Archivo CSV</label>
              <CsvFilePicker
                fileName={importPreview?.fileName}
                onFile={handleImportFile}
                onClear={() => { setImportPreview(null); setImportMessage(null); }}
              />
            </div>
            <button
              className="btn btn-primary" onClick={handleImport}
              disabled={importing || !importPreview || importPreview.entries.length === 0}
            >
              {importing ? "Importando..." : `Importar ${importPreview?.entries.length ?? 0} días`}
            </button>
          </div>
          {importPreview && <CsvPreviewNote preview={importPreview} />}
          {importPreview && importPreview.errors.length > 0 && importPreview.entries.length > 0 && (
            <p style={{ fontSize: 14, margin: "4px 0 0" }}>Las filas con error no se importarán.</p>
          )}
          {importMessage && <p style={{ margin: "8px 0 0" }}>{importMessage}</p>}
          <p style={{ margin: "12px 0 0", fontSize: 12 }}>
            Columnas mínimas: <code>fecha</code> y <code>resultado</code> (TP, SL, BE o NO_TRADE). Opcionales: lado/direccion,
            precio_apertura/precio_entrada, precio_cierre/precio_salida, porcentaje, monto, pips, observaciones.
            Acepta el CSV que descarga esta misma página.
          </p>
        </div>
      )}

      {showNoTrade && (
        <form className="panel" onSubmit={handleAddNoTrade} ref={noTradeFormRef}>
          {editingNoTrade && <h3 style={{ marginTop: 0 }}>Editar día sin operar {editingNoTrade.entry_date}</h3>}
          <div className="form-row">
            <div className="field">
              <label>Fecha</label>
              <input type="date" value={noTradeDate} onChange={(e) => setNoTradeDate(e.target.value)} required />
            </div>
            <div className="field">
              <label>Motivo por el que no se operó</label>
              <input
                type="text" value={noTradeReason} maxLength={500} required
                placeholder="Ej: noticia de alto impacto, sin setup válido..."
                onChange={(e) => setNoTradeReason(e.target.value)}
              />
            </div>
          </div>
          {noTradeError && <p style={{ color: "var(--loss)", margin: "0 0 8px" }}>{noTradeError}</p>}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button type="submit" className="btn btn-primary" disabled={savingNoTrade || !noTradeReason.trim()}>
              {savingNoTrade ? "Guardando..." : editingNoTrade ? "Guardar cambios" : "Registrar día sin operar"}
            </button>
            {editingNoTrade && (
              <ConfirmDeleteButton
                key={editingNoTrade.id} label="Eliminar día"
                question={`¿Eliminar el día ${editingNoTrade.entry_date}?`} onConfirm={handleDeleteEntry}
              />
            )}
          </div>
        </form>
      )}

      <TradeCalendar
        key={`${detail.year}-${detail.month}`}
        entries={calendarEntries}
        initialMonth={new Date(detail.year, detail.month - 1, 1)}
        getDayMetrics={(date, dayEntries) => {
          const balance = detail.account_size + detail.entries
            .filter((entry) => entry.entry_date <= date && entry.result !== "NO_TRADE")
            .reduce((total, entry) => total + entry.amount, 0);
          const profit = dayEntries
            .filter((entry) => !entry.noTrade)
            .reduce((total, entry) => total + entry.profit, 0);
          return [
            { label: "Balance", value: `$${balance.toFixed(2)}` },
            { label: "Lotaje", value: String(detail.lot_size) },
            { label: "Profit", value: `$${profit.toFixed(2)}`, tone: profit > 0 ? "positive" : profit < 0 ? "negative" : undefined },
            { label: "Trades", value: String(dayEntries.filter((entry) => !entry.noTrade).length) },
          ];
        }}
        onEditEntry={(entryId) => {
          const entry = detail.entries.find((item) => item.id === entryId);
          if (entry) startEditEntry(entry);
        }}
      />

      {/* El listado tabular se conserva como alternativa al calendario. */}
      <details className="panel calendar-table-disclosure">
        <summary>Ver listado de días</summary>
        <div className="calendar-table-content">
      <div className="panel" style={{ padding: 0 }}>
        <table className="entries-table">
          <thead>
            <tr>
              <th>Fecha</th><th>Operación</th><th>Resultado</th><th className="num">Monto</th><th>Observaciones</th><th></th>
            </tr>
          </thead>
          <tbody>
            {detail.entries.map((entry) => {
              const noTrade = entry.result === "NO_TRADE";
              const sideLabel = entry.side === "BUY" ? "Compra" : entry.side === "SELL" ? "Venta" : "—";
              const badgeClass = noTrade ? "result-none" : entry.result === "TP" ? "result-tp" : entry.result === "BE" ? "result-be" : "result-sl";
              return (
                <tr key={entry.id}>
                  <td className="cell-date">{entry.entry_date}</td>
                  <td className="cell-op">
                    {noTrade ? "—" : (
                      <>
                        {sideLabel}
                        {entry.open_price != null && entry.close_price != null && (
                          <div className="cell-sub">{entry.open_price} → {entry.close_price}</div>
                        )}
                      </>
                    )}
                  </td>
                  <td className="cell-result">
                    <span className={`result-badge ${badgeClass}`}>{noTrade ? "No operado" : entry.result}</span>
                  </td>
                  <td className="cell-amount num">
                    {noTrade ? "—" : (
                      <>
                        <span className={fmt(entry.amount)}>{entry.amount}</span>
                        <div className="cell-sub">
                          <span className={fmt(entry.percentage)}>{entry.percentage}%</span> · {entry.pips_ticks} pips
                        </div>
                      </>
                    )}
                  </td>
                  <td className="cell-obs">{entry.observations}</td>
                  <td className="cell-edit">
                    <button className="btn btn-sm" onClick={() => startEditEntry(entry)}>Editar</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
        </div>
      </details>

      <h2>Resumen</h2>
      <div className="summary-grid">
        <div className="summary-cell"><div className="label">Días operados</div><div className="value">{summary.total_days}</div></div>
        <div className="summary-cell"><div className="label">Días sin operar</div><div className="value">{summary.no_trade_count}</div></div>
        <div className="summary-cell"><div className="label">Trades TP</div><div className="value" style={{ color: "var(--win)" }}>{summary.tp_count}</div></div>
        <div className="summary-cell"><div className="label">Trades SL</div><div className="value" style={{ color: "var(--loss)" }}>{summary.sl_count}</div></div>
        <div className="summary-cell"><div className="label">Trades BE</div><div className="value" style={{ color: "var(--accent)" }}>{summary.be_count}</div></div>
        <div className="summary-cell"><div className="label">Beneficio</div><div className="value num-positive">{summary.profit_amount}</div></div>
        <div className="summary-cell"><div className="label">Pérdidas</div><div className="value num-negative">{summary.loss_amount}</div></div>
        <div className="summary-cell"><div className="label">Ganancia neta</div><div className={`value ${fmt(summary.net_profit)}`}>{summary.net_profit}</div></div>
      </div>

      <h3>En porcentajes</h3>
      <div className="summary-grid">
        <div className="summary-cell"><div className="label">Beneficio %</div><div className="value num-positive">{summary.profit_amount_pct}%</div></div>
        <div className="summary-cell"><div className="label">Pérdidas %</div><div className="value num-negative">{summary.loss_amount_pct}%</div></div>
        <div className="summary-cell"><div className="label">Ganancia neta %</div><div className={`value ${fmt(summary.net_profit_pct)}`}>{summary.net_profit_pct}%</div></div>
      </div>

      <h3>Métricas</h3>
      <div className="summary-grid">
        <div className="summary-cell"><div className="label">Win rate</div><div className="value">{summary.win_rate}%</div></div>
        <div className="summary-cell"><div className="label">Profit factor</div><div className="value">{summary.profit_factor ?? "N/A"}</div></div>
        <div className="summary-cell"><div className="label">Margen de consistencia</div><div className="value">{summary.consistency_margin}%</div></div>
      </div>
    </Layout>
  );
}