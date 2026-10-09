import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { Layout } from "../components/Layout";
import { downloadCsv } from "../services/csvExport";
import {
  addNoTradeDay, createApiToken, deleteTrade, getTradeJournal, listApiTokens,
  revokeApiToken, updateTradeObservations,
} from "../services/tradeService";
import type { ApiToken, TradeJournal } from "../types/trade";

const RESULT_LABEL: Record<string, string> = { WIN: "WIN", LOSS: "LOSS", BE: "BE", NO_TRADE: "No operado" };
const RESULT_CLASS: Record<string, string> = { WIN: "result-tp", LOSS: "result-sl", BE: "", NO_TRADE: "result-none" };

// Fecha local de hoy en formato YYYY-MM-DD (para <input type="date">)
function todayIso() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export default function TradeJournalPage() {
  const [journal, setJournal] = useState<TradeJournal | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [showNoTrade, setShowNoTrade] = useState(false);
  const [noTradeDate, setNoTradeDate] = useState(todayIso());
  const [noTradeReason, setNoTradeReason] = useState("");
  const [noTradeError, setNoTradeError] = useState<string | null>(null);
  const [savingNoTrade, setSavingNoTrade] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [j, t] = await Promise.all([getTradeJournal(), listApiTokens()]);
      setJournal(j);
      setTokens(t);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateToken() {
    const created = await createApiToken("Extensión Chrome");
    setNewToken(created.token);
    setTokens(await listApiTokens());
  }

  async function handleRevoke(id: string) {
    if (!confirm("¿Revocar este token? La extensión dejará de sincronizar hasta que pegues uno nuevo.")) return;
    await revokeApiToken(id);
    setTokens(await listApiTokens());
  }

  async function handleSaveObs(id: string) {
    await updateTradeObservations(id, draft);
    setEditing(null);
    setJournal(await getTradeJournal());
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta fila del diario?")) return;
    await deleteTrade(id);
    setJournal(await getTradeJournal());
  }

  async function handleAddNoTrade(e: FormEvent) {
    e.preventDefault();
    setSavingNoTrade(true);
    setNoTradeError(null);
    try {
      await addNoTradeDay(noTradeDate, noTradeReason.trim());
      setNoTradeReason("");
      setShowNoTrade(false);
      setJournal(await getTradeJournal());
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
    if (!journal) return;
    downloadCsv(
      `diario_operaciones_${todayIso()}.csv`,
      ["fecha_cierre", "simbolo", "lado", "lotes", "precio_apertura", "precio_cierre", "resultado",
        "pips", "porcentaje", "monto", "observaciones", "cuenta", "fuente"],
      journal.trades.map((t) => [
        t.result === "NO_TRADE" ? t.closed_at.slice(0, 10) : t.closed_at,
        t.symbol, t.side, t.volume, t.open_price, t.close_price, t.result,
        t.pips, t.percentage, t.profit, t.observations, t.account_number, t.source,
      ])
    );
  }

  const fmt = (n: number) => (n > 0 ? "num-positive" : n < 0 ? "num-negative" : "");

  if (loading) return <Layout><p>Cargando...</p></Layout>;

  const s = journal?.summary;

  return (
    <Layout>
      <h1>Diario de operaciones</h1>
      <p>Operaciones reales sincronizadas automáticamente desde tu plataforma con la extensión de GM Ledger.</p>

      {s && (
        <>
          <div className="summary-grid">
            <div className="summary-cell"><div className="label">Operaciones</div><div className="value">{s.total_trades}</div></div>
            <div className="summary-cell"><div className="label">Ganadas</div><div className="value" style={{ color: "var(--win)" }}>{s.win_count}</div></div>
            <div className="summary-cell"><div className="label">Perdidas</div><div className="value" style={{ color: "var(--loss)" }}>{s.loss_count}</div></div>
            <div className="summary-cell"><div className="label">Break even</div><div className="value">{s.be_count}</div></div>
            <div className="summary-cell"><div className="label">Ganancia neta</div><div className={`value ${fmt(s.net_profit)}`}>{s.net_profit}</div></div>
            <div className="summary-cell"><div className="label">Ganancia neta %</div><div className={`value ${fmt(s.net_profit_pct)}`}>{s.net_profit_pct}%</div></div>
          </div>
          <div className="summary-grid">
            <div className="summary-cell"><div className="label">Pips netos</div><div className={`value ${fmt(s.net_pips)}`}>{s.net_pips}</div></div>
            <div className="summary-cell"><div className="label">Win rate</div><div className="value">{s.win_rate}%</div></div>
            <div className="summary-cell"><div className="label">Profit factor</div><div className="value">{s.profit_factor ?? "N/A"}</div></div>
            <div className="summary-cell"><div className="label">Días sin operar</div><div className="value">{s.no_trade_count}</div></div>
          </div>
        </>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <h2>Operaciones</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => { setShowNoTrade(!showNoTrade); setNoTradeError(null); }}>
            {showNoTrade ? "Cancelar" : "+ Día sin operar"}
          </button>
          <button className="btn" onClick={handleExportCsv} disabled={!journal || journal.trades.length === 0}>
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
                type="text" value={noTradeReason} maxLength={500} autoFocus required
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
        {journal && journal.trades.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Cierre</th><th>Símbolo</th><th>Lado</th><th>Lotes</th><th>Apertura</th><th>Cierre</th>
                <th>Resultado</th><th>Pips</th><th>%</th><th>Monto</th><th>Observaciones</th><th></th>
              </tr>
            </thead>
            <tbody>
              {journal.trades.map((t) => {
                const noTrade = t.result === "NO_TRADE";
                return (
                <tr key={t.id}>
                  <td>{noTrade ? new Date(t.closed_at).toLocaleDateString() : new Date(t.closed_at).toLocaleString()}</td>
                  <td>{t.symbol ?? "—"}</td>
                  <td>{noTrade ? "—" : t.side === "BUY" ? "Compra" : "Venta"}</td>
                  <td>{t.volume ?? "—"}</td>
                  <td>{t.open_price ?? "—"}</td>
                  <td>{t.close_price ?? "—"}</td>
                  <td><span className={`result-badge ${RESULT_CLASS[t.result]}`}>{RESULT_LABEL[t.result]}</span></td>
                  <td className={fmt(t.pips)}>{noTrade ? "—" : t.pips}</td>
                  <td className={fmt(t.percentage ?? 0)}>{t.percentage != null ? `${t.percentage}%` : "—"}</td>
                  <td className={fmt(t.profit)}>{noTrade ? "—" : t.profit}</td>
                  <td style={{ color: "var(--text-muted)", minWidth: 200 }}>
                    {editing === t.id ? (
                      <div className="field" style={{ margin: 0, display: "flex", gap: 6 }}>
                        <input value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
                        <button className="btn btn-primary" onClick={() => handleSaveObs(t.id)}>OK</button>
                      </div>
                    ) : (
                      <span
                        style={{ cursor: "pointer" }}
                        title="Clic para editar"
                        onClick={() => { setEditing(t.id); setDraft(t.observations ?? ""); }}
                      >
                        {t.observations || "＋ agregar nota"}
                      </span>
                    )}
                  </td>
                  <td>
                    <button className="btn" onClick={() => handleDelete(t.id)} aria-label="Eliminar">✕</button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p style={{ padding: 16, margin: 0 }}>
            Aún no hay operaciones. Instala la extensión, pega tu token y deja abierta la pestaña
            "Posiciones cerradas" en tu plataforma.
          </p>
        )}
      </div>

      <h2>Conexión con la extensión</h2>
      <div className="panel">
        <p style={{ marginTop: 0 }}>
          La extensión usa un token personal (no tu contraseña). Genera uno, cópialo y pégalo en las
          opciones de la extensión. Solo se muestra una vez.
        </p>

        {newToken && (
          <div className="field">
            <label>Tu nuevo token (cópialo ahora)</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input readOnly value={newToken} onFocus={(e) => e.target.select()} />
              <button className="btn" onClick={() => navigator.clipboard.writeText(newToken)}>Copiar</button>
            </div>
          </div>
        )}

        <button className="btn btn-primary" onClick={handleCreateToken}>Generar token</button>

        {tokens.length > 0 && (
          <table style={{ marginTop: 16 }}>
            <thead>
              <tr><th>Nombre</th><th>Prefijo</th><th>Creado</th><th>Último uso</th><th></th></tr>
            </thead>
            <tbody>
              {tokens.map((tk) => (
                <tr key={tk.id}>
                  <td>{tk.name}</td>
                  <td>{tk.prefix}…</td>
                  <td>{new Date(tk.created_at).toLocaleString()}</td>
                  <td>{tk.last_used_at ? new Date(tk.last_used_at).toLocaleString() : "Nunca"}</td>
                  <td><button className="btn" onClick={() => handleRevoke(tk.id)}>Revocar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
