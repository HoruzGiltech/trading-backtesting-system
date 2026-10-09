import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { Layout } from "../components/Layout";
import { addBacktestEntry, addNoTradeDay, getBacktestDetail } from "../services/backtestService";
import { downloadCsv } from "../services/csvExport";
import type { BacktestDetail, ResultType } from "../types/backtest";

export default function BacktestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<BacktestDetail | null>(null);
  const [loading, setLoading] = useState(true);

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

  async function handleAddEntry(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      const sign = result === "SL" ? -1 : 1;
      await addBacktestEntry(id, {
        entry_date: entryDate,
        side,
        open_price: parseFloat(openPrice),
        close_price: parseFloat(closePrice),
        result,
        percentage: Math.abs(parseFloat(percentage)) * sign,
        amount: Math.abs(parseFloat(amount)) * sign,
        pips_ticks: Math.abs(parseFloat(pipsTicks)) * sign,
        observations: observations || undefined,
      });
      setEntryDate(""); setOpenPrice(""); setClosePrice(""); setPercentage(""); setAmount(""); setPipsTicks(""); setObservations("");
      await loadDetail(id);
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
      await addNoTradeDay(id, noTradeDate, noTradeReason.trim());
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

  function handleExportCsv() {
    if (!detail) return;
    const month = String(detail.month).padStart(2, "0");
    const asset = detail.asset.replace(/[^A-Za-z0-9]+/g, "");
    downloadCsv(
      `backtest_${asset}_${detail.year}-${month}_${detail.timeframe}.csv`,
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

  return (
    <Layout>
      <Link to="/backtests">← Volver</Link>
      <h1>{detail.asset} — {detail.month}/{detail.year} ({detail.timeframe})</h1>
      <p>Lotaje: {detail.lot_size} · Cuenta: {detail.account_size}</p>

      <h2>Agregar día</h2>
      <form className="panel" onSubmit={handleAddEntry}>
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
        <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 8 }}>
          {saving ? "Guardando..." : "Agregar"}
        </button>
      </form>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <h2>Días registrados</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => { setShowNoTrade(!showNoTrade); setNoTradeError(null); }}>
            {showNoTrade ? "Cancelar" : "+ Día sin operar"}
          </button>
          <button className="btn" onClick={handleExportCsv} disabled={detail.entries.length === 0}>
            Descargar CSV
          </button>
        </div>
      </div>

      {showNoTrade && (
        <form className="panel" onSubmit={handleAddNoTrade}>
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
          <button type="submit" className="btn btn-primary" disabled={savingNoTrade || !noTradeReason.trim()}>
            {savingNoTrade ? "Guardando..." : "Registrar día sin operar"}
          </button>
        </form>
      )}

      <div className="panel" style={{ padding: 0, overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Fecha</th><th>Símbolo</th><th>Lado</th><th>Apertura</th><th>Cierre</th>
              <th>Resultado</th><th>%</th><th>Monto</th><th>Pips/Ticks</th><th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {detail.entries.map((entry) =>
              entry.result === "NO_TRADE" ? (
                <tr key={entry.id}>
                  <td>{entry.entry_date}</td>
                  <td>{detail.asset}</td>
                  <td>—</td><td>—</td><td>—</td>
                  <td><span className="result-badge result-none">No operado</span></td>
                  <td>—</td><td>—</td><td>—</td>
                  <td style={{ color: "var(--text-muted)" }}>{entry.observations}</td>
                </tr>
              ) : (
                <tr key={entry.id}>
                  <td>{entry.entry_date}</td>
                  <td>{detail.asset}</td>
                  <td>{entry.side === "BUY" ? "Compra" : entry.side === "SELL" ? "Venta" : "—"}</td>
                  <td>{entry.open_price ?? "—"}</td>
                  <td>{entry.close_price ?? "—"}</td>
                  <td><span className={`result-badge ${entry.result === "TP" ? "result-tp" : "result-sl"}`}>{entry.result}</span></td>
                  <td className={fmt(entry.percentage)}>{entry.percentage}%</td>
                  <td className={fmt(entry.amount)}>{entry.amount}</td>
                  <td className={fmt(entry.pips_ticks)}>{entry.pips_ticks}</td>
                  <td style={{ color: "var(--text-muted)" }}>{entry.observations}</td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      <h2>Resumen</h2>
      <div className="summary-grid">
        <div className="summary-cell"><div className="label">Días operados</div><div className="value">{summary.total_days}</div></div>
        <div className="summary-cell"><div className="label">Días sin operar</div><div className="value">{summary.no_trade_count}</div></div>
        <div className="summary-cell"><div className="label">Trades TP</div><div className="value" style={{ color: "var(--win)" }}>{summary.tp_count}</div></div>
        <div className="summary-cell"><div className="label">Trades SL</div><div className="value" style={{ color: "var(--loss)" }}>{summary.sl_count}</div></div>
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