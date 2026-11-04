import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CsvFilePicker } from "../components/CsvFilePicker";
import { CsvPreviewNote } from "../components/CsvPreviewNote";
import { Layout } from "../components/Layout";
import { ConfirmDeleteButton } from "../components/ConfirmDeleteButton";
import { createBacktest, deleteBacktest, importBacktestEntries, listBacktests } from "../services/backtestService";
import type { CsvImportPreview } from "../services/csvImport";
import { readBacktestCsv } from "../services/csvImport";
import type { BacktestListItem } from "../types/backtest";

export default function BacktestListPage() {
  const [backtests, setBacktests] = useState<BacktestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterMonthYear, setFilterMonthYear] = useState("");
  const [filterAsset, setFilterAsset] = useState("");
  const [filterTimeframe, setFilterTimeframe] = useState("");
  const [filterLotSize, setFilterLotSize] = useState("");
  const [filterAccountSize, setFilterAccountSize] = useState("");

  const [name, setName] = useState("");
  const [month, setMonth] = useState(1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [asset, setAsset] = useState("");
  const [lotSize, setLotSize] = useState("");
  const [accountSize, setAccountSize] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [csv, setCsv] = useState<CsvImportPreview | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let active = true;
    listBacktests()
      .then((items) => {
        if (active) setBacktests(items);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const monthYearOptions = [...new Set(backtests.map((bt) => `${bt.year}-${bt.month}`))]
    .map((value) => {
      const [optionYear, optionMonth] = value.split("-").map(Number);
      return { value, year: optionYear, month: optionMonth };
    })
    .sort((a, b) => b.year - a.year || b.month - a.month);
  const assetOptions = [...new Set(backtests.map((bt) => bt.asset))].sort((a, b) => a.localeCompare(b, "es"));
  const timeframeOptions = [...new Set(backtests.map((bt) => bt.timeframe))].sort((a, b) => a.localeCompare(b, "es"));
  const lotSizeOptions = [...new Set(backtests.map((bt) => bt.lot_size))].sort((a, b) => a - b);
  const accountSizeOptions = [...new Set(backtests.map((bt) => bt.account_size))].sort((a, b) => a - b);
  const searchTerm = search.trim().toLocaleLowerCase("es");
  const filteredBacktests = backtests.filter((bt) => {
    const monthYear = `${bt.year}-${bt.month}`;
    const matchesSearch = !searchTerm || [
      bt.name, bt.asset, bt.timeframe, String(bt.month), String(bt.year),
      String(bt.lot_size), String(bt.account_size),
    ].some((value) => value.toLocaleLowerCase("es").includes(searchTerm));
    return matchesSearch
      && (!filterMonthYear || monthYear === filterMonthYear)
      && (!filterAsset || bt.asset === filterAsset)
      && (!filterTimeframe || bt.timeframe === filterTimeframe)
      && (!filterLotSize || String(bt.lot_size) === filterLotSize)
      && (!filterAccountSize || String(bt.account_size) === filterAccountSize);
  });
  const hasActiveFilters = Boolean(
    search || filterMonthYear || filterAsset || filterTimeframe || filterLotSize || filterAccountSize
  );
  const formatMoney = (value: number) => new Intl.NumberFormat("es-ES", {
    style: "currency", currency: "USD",
  }).format(value);

  async function handleCsvFile(file: File) {
    setFormError(null);
    const preview = await readBacktestCsv(file);
    setCsv(preview);
    // Rellena la cabecera con lo que trae el archivo, sin pisar lo ya escrito
    if (preview.month) setMonth(preview.month);
    if (preview.year) setYear(preview.year);
    if (preview.asset && !asset) setAsset(preview.asset);
    if (preview.timeframe && !timeframe) setTimeframe(preview.timeframe);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (csv && csv.errors.length > 0) {
      setFormError("Corrige los errores del CSV o quítalo antes de crear el backtest.");
      return;
    }
    setCreating(true);
    setFormError(null);
    try {
      const newBacktest = await createBacktest({
        name: name.trim(), month, year, asset,
        lot_size: parseFloat(lotSize),
        account_size: parseFloat(accountSize),
        timeframe,
      });
      if (csv && csv.entries.length > 0) {
        try {
          await importBacktestEntries(newBacktest.id, csv.entries);
        } catch {
          // El backtest ya existe: se abre igualmente y desde el detalle se puede reintentar la importación
          navigate(`/backtests/${newBacktest.id}`, { state: { importFailed: true } });
          return;
        }
      }
      setShowForm(false);
      navigate(`/backtests/${newBacktest.id}`);
    } catch {
      setFormError("No se pudo crear el backtest. Revisa los datos e inténtalo de nuevo.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Layout>
      <div className="backtest-list-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Mis backtests</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "+ Nuevo backtest"}
        </button>
      </div>

      {showForm && (
        <form className="panel backtest-create-form" onSubmit={handleCreate}>
          <div className="form-row">
            <div className="field field-wide">
              <label>Nombre</label>
              <input
                type="text" maxLength={120} required value={name}
                placeholder="Ej: EURUSD julio — CRT + FVG v2"
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Mes</label>
              <input type="number" min={1} max={12} value={month} onChange={(e) => setMonth(Number(e.target.value))} required />
            </div>
            <div className="field">
              <label>Año</label>
              <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} required />
            </div>
            <div className="field">
              <label>Activo</label>
              <input type="text" placeholder="EUR/USD" value={asset} onChange={(e) => setAsset(e.target.value)} required />
            </div>
            <div className="field">
              <label>Temporalidad</label>
              <input type="text" placeholder="H1, H4, D1" value={timeframe} onChange={(e) => setTimeframe(e.target.value)} required />
            </div>
            <div className="field">
              <label>Lotaje</label>
              <input type="number" step="0.01" value={lotSize} onChange={(e) => setLotSize(e.target.value)} required />
            </div>
            <div className="field">
              <label>Tamaño de cuenta</label>
              <input type="number" step="0.01" value={accountSize} onChange={(e) => setAccountSize(e.target.value)} required />
            </div>
            <div className="field field-wide">
              <label>Importar CSV (opcional)</label>
              <CsvFilePicker
                fileName={csv?.fileName}
                onFile={handleCsvFile}
                onClear={() => { setCsv(null); setFormError(null); }}
              />
            </div>
          </div>
          {csv && <CsvPreviewNote preview={csv} />}
          {formError && <p style={{ color: "var(--loss)", margin: "8px 0 0" }}>{formError}</p>}
          <button type="submit" className="btn btn-primary" disabled={creating} style={{ marginTop: 8 }}>
            {creating ? "Creando..." : csv?.entries.length ? `Crear e importar ${csv.entries.length} días` : "Crear backtest"}
          </button>
        </form>
      )}

      {!loading && backtests.length > 0 && (
        <section className="panel backtest-filters" aria-label="Filtros de backtests">
          <div className="field backtest-search">
            <label htmlFor="backtest-search">Buscar</label>
            <input
              id="backtest-search"
              type="search"
              value={search}
              placeholder="Buscar por nombre, activo, temporalidad..."
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="filter-month-year">Mes/Año</label>
            <select id="filter-month-year" value={filterMonthYear} onChange={(e) => setFilterMonthYear(e.target.value)}>
              <option value="">Todos</option>
              {monthYearOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.month}/{option.year}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="filter-asset">Activo</label>
            <select id="filter-asset" value={filterAsset} onChange={(e) => setFilterAsset(e.target.value)}>
              <option value="">Todos</option>
              {assetOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="filter-timeframe">Temporalidad</label>
            <select id="filter-timeframe" value={filterTimeframe} onChange={(e) => setFilterTimeframe(e.target.value)}>
              <option value="">Todas</option>
              {timeframeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="filter-lot-size">Lotaje</label>
            <select id="filter-lot-size" value={filterLotSize} onChange={(e) => setFilterLotSize(e.target.value)}>
              <option value="">Todos</option>
              {lotSizeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="filter-account-size">Cuenta</label>
            <select id="filter-account-size" value={filterAccountSize} onChange={(e) => setFilterAccountSize(e.target.value)}>
              <option value="">Todas</option>
              {accountSizeOptions.map((option) => <option key={option} value={option}>{formatMoney(option)}</option>)}
            </select>
          </div>
          <div className="backtest-filter-footer">
            <span>{filteredBacktests.length} de {backtests.length} backtests</span>
            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  setSearch("");
                  setFilterMonthYear("");
                  setFilterAsset("");
                  setFilterTimeframe("");
                  setFilterLotSize("");
                  setFilterAccountSize("");
                }}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </section>
      )}

      {loading ? (
        <p>Cargando...</p>
      ) : backtests.length === 0 ? (
        <p>Aún no tienes backtests registrados. Crea el primero arriba.</p>
      ) : filteredBacktests.length === 0 ? (
        <p>No se encontraron backtests con esos filtros.</p>
      ) : (
        <div className="backtest-card-list">
          {filteredBacktests.map((bt) => (
            <article className="panel backtest-card" key={bt.id}>
              <div className="backtest-card-heading">
                <div>
                  <h2>{bt.name}</h2>
                  <span>{bt.month}/{bt.year} · {bt.asset}</span>
                </div>
                <div className="backtest-card-actions">
                  <button className="btn" onClick={() => navigate(`/backtests/${bt.id}`)}>
                    Ver detalle
                  </button>
                  <ConfirmDeleteButton
                    label="Eliminar"
                    question={`¿Eliminar "${bt.name}" y todos sus días?`}
                    onConfirm={async () => {
                      await deleteBacktest(bt.id);
                      setBacktests((list) => list.filter((backtest) => backtest.id !== bt.id));
                    }}
                  />
                </div>
              </div>
              <div className="backtest-card-meta">
                <span><strong>Temporalidad</strong>{bt.timeframe}</span>
                <span><strong>Lotaje</strong>{bt.lot_size}</span>
                <span><strong>Cuenta</strong>{formatMoney(bt.account_size)}</span>
              </div>
              <div className="backtest-card-metrics">
                <div><span>Win rate</span><strong>{bt.summary.win_rate.toFixed(2)}%</strong></div>
                <div>
                  <span>Profit factor</span>
                  <strong>
                    {bt.summary.profit_factor?.toFixed(2) ?? (bt.summary.profit_amount > 0 ? "∞" : "N/D")}
                  </strong>
                </div>
                <div><span>Margen de consistencia neta</span><strong>{bt.summary.consistency_margin.toFixed(2)}%</strong></div>
                <div>
                  <span>Ganancia neta</span>
                  <strong className={bt.summary.net_profit > 0 ? "num-positive" : bt.summary.net_profit < 0 ? "num-negative" : ""}>
                    {formatMoney(bt.summary.net_profit)}
                  </strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </Layout>
  );
}
