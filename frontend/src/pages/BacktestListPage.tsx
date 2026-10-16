import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CsvFilePicker } from "../components/CsvFilePicker";
import { CsvPreviewNote } from "../components/CsvPreviewNote";
import { Layout } from "../components/Layout";
import { createBacktest, importBacktestEntries, listBacktests } from "../services/backtestService";
import type { CsvImportPreview } from "../services/csvImport";
import { readBacktestCsv } from "../services/csvImport";
import type { Backtest } from "../types/backtest";

export default function BacktestListPage() {
  const [backtests, setBacktests] = useState<Backtest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

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
    loadBacktests();
  }, []);

  async function loadBacktests() {
    setLoading(true);
    try {
      setBacktests(await listBacktests());
    } finally {
      setLoading(false);
    }
  }

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Mis backtests</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "+ Nuevo backtest"}
        </button>
      </div>

      {showForm && (
        <form className="panel" onSubmit={handleCreate}>
          <div className="form-row">
            <div className="field" style={{ flex: "2 1 260px" }}>
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
            <div className="field">
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

      {loading ? (
        <p>Cargando...</p>
      ) : backtests.length === 0 ? (
        <p>Aún no tienes backtests registrados. Crea el primero arriba.</p>
      ) : (
        <div className="panel" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Mes/Año</th>
                <th>Activo</th>
                <th>Temporalidad</th>
                <th>Lotaje</th>
                <th>Cuenta</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {backtests.map((bt) => (
                <tr key={bt.id}>
                  <td><strong>{bt.name}</strong></td>
                  <td>{bt.month}/{bt.year}</td>
                  <td>{bt.asset}</td>
                  <td>{bt.timeframe}</td>
                  <td>{bt.lot_size}</td>
                  <td>{bt.account_size}</td>
                  <td>
                    <button className="btn" onClick={() => navigate(`/backtests/${bt.id}`)}>
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}

