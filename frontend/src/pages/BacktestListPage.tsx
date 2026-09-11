import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { createBacktest, listBacktests } from "../services/backtestService";
import type { Backtest } from "../types/backtest";

export default function BacktestListPage() {
  const [backtests, setBacktests] = useState<Backtest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const [month, setMonth] = useState(1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [asset, setAsset] = useState("");
  const [lotSize, setLotSize] = useState("");
  const [accountSize, setAccountSize] = useState("");
  const [timeframe, setTimeframe] = useState("");
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

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const newBacktest = await createBacktest({
        month, year, asset,
        lot_size: parseFloat(lotSize),
        account_size: parseFloat(accountSize),
        timeframe,
      });
      setShowForm(false);
      navigate(`/backtests/${newBacktest.id}`);
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
          </div>
          <button type="submit" className="btn btn-primary" disabled={creating} style={{ marginTop: 8 }}>
            {creating ? "Creando..." : "Crear backtest"}
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