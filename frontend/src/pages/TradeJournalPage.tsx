import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { Layout } from "../components/Layout";
import { apiErrorMessage } from "../services/api";
import { downloadCsv } from "../services/csvExport";
import {
  addNoTradeDay, createApiToken, deleteTrade, getTradeJournal, listApiTokens,
  revokeApiToken, updateNoTradeDay, updateTrade, updateTradeObservations,
} from "../services/tradeService";
import type { ApiToken, Trade, TradeJournal } from "../types/trade";

// Campos del formulario de corrección, como texto para los <input>
interface TradeForm {
  symbol: string;
  side: "BUY" | "SELL";
  volume: string;
  open_price: string;
  close_price: string;
  closed_at: string;
  profit: string;
  percentage: string;
  observations: string;
}

// ISO (UTC) → valor para <input type="datetime-local"> en hora local
function toLocalInput(iso: string) {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19);
}

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

  // Fila que se está corrigiendo (operación o día sin operar)
  const [editTarget, setEditTarget] = useState<Trade | null>(null);
  const [form, setForm] = useState<TradeForm | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editReason, setEditReason] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const editPanelRef = useRef<HTMLFormElement>(null);

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
    if (editTarget?.id === id) cancelEdit();
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

  function startEdit(t: Trade) {
    setEditTarget(t);
    setEditError(null);
    if (t.result === "NO_TRADE") {
      setEditDate(t.closed_at.slice(0, 10));
      setEditReason(t.observations ?? "");
      setForm(null);
    } else {
      setForm({
        symbol: t.symbol ?? "",
        side: t.side ?? "BUY",
        volume: t.volume != null ? String(t.volume) : "",
        open_price: t.open_price != null ? String(t.open_price) : "",
        close_price: t.close_price != null ? String(t.close_price) : "",
        closed_at: toLocalInput(t.closed_at),
        profit: String(t.profit),
        percentage: t.percentage != null ? String(t.percentage) : "",
        observations: t.observations ?? "",
      });
    }
    requestAnimationFrame(() => editPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  function cancelEdit() {
    setEditTarget(null);
    setForm(null);
    setEditError(null);
  }

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setSavingEdit(true);
    setEditError(null);
    try {
      if (form) {
        await updateTrade(editTarget.id, {
          symbol: form.symbol.trim(),
          side: form.side,
          volume: parseFloat(form.volume),
          open_price: parseFloat(form.open_price),
          close_price: parseFloat(form.close_price),
          closed_at: new Date(form.closed_at).toISOString(),
          profit: parseFloat(form.profit),
          percentage: form.percentage.trim() === "" ? null : parseFloat(form.percentage),
          observations: form.observations,
        });
      } else {
        await updateNoTradeDay(editTarget.id, editDate, editReason.trim());
      }
      cancelEdit();
      setJournal(await getTradeJournal());
    } catch (err) {
      setEditError(
        isAxiosError(err) && err.response?.status === 409
          ? "Ese día ya está registrado como no operado."
          : apiErrorMessage(err, "No se pudieron guardar los cambios.")
      );
    } finally {
      setSavingEdit(false);
    }
  }

  const setField = (field: keyof TradeForm) => (e: { target: { value: string } }) =>
    setForm((f) => (f ? { ...f, [field]: e.target.value } : f));

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

      {editTarget && (
        <form className="panel" onSubmit={handleSaveEdit} ref={editPanelRef}>
          <h3 style={{ marginTop: 0 }}>
            {form ? `Editar operación ${editTarget.symbol ?? ""}` : "Editar día sin operar"}
          </h3>
          {form ? (
            <>
              <div className="form-row">
                <div className="field">
                  <label>Símbolo</label>
                  <input type="text" value={form.symbol} maxLength={20} onChange={setField("symbol")} required />
                </div>
                <div className="field">
                  <label>Lado</label>
                  <select value={form.side} onChange={setField("side")}>
                    <option value="BUY">Compra</option>
                    <option value="SELL">Venta</option>
                  </select>
                </div>
                <div className="field">
                  <label>Lotes</label>
                  <input type="number" step="0.01" min="0.01" value={form.volume} onChange={setField("volume")} required />
                </div>
                <div className="field">
                  <label>Precio apertura</label>
                  <input type="number" step="any" min="0" value={form.open_price} onChange={setField("open_price")} required />
                </div>
                <div className="field">
                  <label>Precio cierre</label>
                  <input type="number" step="any" min="0" value={form.close_price} onChange={setField("close_price")} required />
                </div>
                <div className="field">
                  <label>Fecha y hora de cierre</label>
                  <input type="datetime-local" step="1" value={form.closed_at} onChange={setField("closed_at")} required />
                </div>
                <div className="field">
                  <label>Monto $ (con signo)</label>
                  <input type="number" step="0.01" value={form.profit} onChange={setField("profit")} required />
                </div>
                <div className="field">
                  <label>% (opcional)</label>
                  <input type="number" step="0.01" value={form.percentage} onChange={setField("percentage")} />
                </div>
                <div className="field">
                  <label>Observaciones</label>
                  <input type="text" value={form.observations} onChange={setField("observations")} />
                </div>
              </div>
              <p style={{ fontSize: 12, margin: "0 0 8px" }}>
                Los pips y el resultado (WIN/LOSS/BE) se recalculan a partir de los precios y el monto.
              </p>
            </>
          ) : (
            <div className="form-row">
              <div className="field">
                <label>Fecha</label>
                <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} required />
              </div>
              <div className="field">
                <label>Motivo por el que no se operó</label>
                <input
                  type="text" value={editReason} maxLength={500} required
                  onChange={(e) => setEditReason(e.target.value)}
                />
              </div>
            </div>
          )}
          {editError && <p style={{ color: "var(--loss)", margin: "0 0 8px" }}>{editError}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={savingEdit || (!form && !editReason.trim())}>
              {savingEdit ? "Guardando..." : "Guardar cambios"}
            </button>
            <button type="button" className="btn" onClick={cancelEdit} disabled={savingEdit}>Cancelar</button>
          </div>
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
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="btn" onClick={() => startEdit(t)} style={{ marginRight: 6 }}>Editar</button>
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
