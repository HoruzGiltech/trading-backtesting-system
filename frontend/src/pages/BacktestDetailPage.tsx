import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { addBacktestEntry, getBacktestDetail } from "../services/backtestService";
import type { BacktestDetail, ResultType } from "../types/backtest";

export default function BacktestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<BacktestDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [entryDate, setEntryDate] = useState("");
  const [result, setResult] = useState<ResultType>("TP");
  const [percentage, setPercentage] = useState("");
  const [amount, setAmount] = useState("");
  const [pipsTicks, setPipsTicks] = useState("");
  const [observations, setObservations] = useState("");
  const [saving, setSaving] = useState(false);

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
        result,
        percentage: Math.abs(parseFloat(percentage)) * sign,
        amount: Math.abs(parseFloat(amount)) * sign,
        pips_ticks: Math.abs(parseFloat(pipsTicks)) * sign,
        observations: observations || undefined,
      });
      setEntryDate(""); setPercentage(""); setAmount(""); setPipsTicks(""); setObservations("");
      await loadDetail(id);
    } finally {
      setSaving(false);
    }
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

      <h2>Días operados</h2>
      <div className="panel" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Fecha</th><th>Resultado</th><th>%</th><th>Monto</th><th>Pips/Ticks</th><th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {detail.entries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.entry_date}</td>
                <td><span className={`result-badge ${entry.result === "TP" ? "result-tp" : "result-sl"}`}>{entry.result}</span></td>
                <td className={fmt(entry.percentage)}>{entry.percentage}%</td>
                <td className={fmt(entry.amount)}>{entry.amount}</td>
                <td className={fmt(entry.pips_ticks)}>{entry.pips_ticks}</td>
                <td style={{ color: "var(--text-muted)" }}>{entry.observations}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Resumen</h2>
      <div className="summary-grid">
        <div className="summary-cell"><div className="label">Total días</div><div className="value">{summary.total_days}</div></div>
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