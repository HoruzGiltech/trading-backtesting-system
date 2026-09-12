import { useMemo, useState } from "react";
import { Layout } from "../components/Layout";

export default function RiskCalculatorPage() {
  const [accountSize, setAccountSize] = useState("1000");
  const [riskPercent, setRiskPercent] = useState("1");
  const [stopLossPips, setStopLossPips] = useState("");
  const [pipValue, setPipValue] = useState("");
  const [riskReward, setRiskReward] = useState("2");

  const result = useMemo(() => {
    const account = parseFloat(accountSize);
    const risk = parseFloat(riskPercent);
    const sl = parseFloat(stopLossPips);
    const pip = parseFloat(pipValue);
    const rr = parseFloat(riskReward);

    if (!account || !risk || !sl || !pip || sl <= 0 || pip <= 0) return null;

    const riskAmount = account * (risk / 100);
    const lotSize = riskAmount / (sl * pip);
    const takeProfitPips = rr ? sl * rr : null;
    const potentialProfit = rr ? riskAmount * rr : null;

    return { riskAmount, lotSize, takeProfitPips, potentialProfit };
  }, [accountSize, riskPercent, stopLossPips, pipValue, riskReward]);

  return (
    <Layout>
      <h1>Calculadora de riesgo</h1>
      <p>Calcula el lotaje recomendado según tu tolerancia al riesgo y tu stop loss.</p>

      <form className="panel">
        <div className="form-row">
          <div className="field">
            <label>Tamaño de cuenta ($)</label>
            <input type="number" step="0.01" value={accountSize} onChange={(e) => setAccountSize(e.target.value)} />
          </div>
          <div className="field">
            <label>% de riesgo por operación</label>
            <input type="number" step="0.1" value={riskPercent} onChange={(e) => setRiskPercent(e.target.value)} />
          </div>
          <div className="field">
            <label>Stop loss (pips/ticks)</label>
            <input type="number" step="0.1" value={stopLossPips} onChange={(e) => setStopLossPips(e.target.value)} placeholder="ej: 25" />
          </div>
          <div className="field">
            <label>Valor del pip por lote ($)</label>
            <input type="number" step="0.01" value={pipValue} onChange={(e) => setPipValue(e.target.value)} placeholder="ej: 10" />
          </div>
          <div className="field">
            <label>Relación riesgo/beneficio (1:X)</label>
            <input type="number" step="0.1" value={riskReward} onChange={(e) => setRiskReward(e.target.value)} placeholder="ej: 2" />
          </div>
        </div>
      </form>

      <h2>Resultado</h2>
      {result ? (
        <div className="summary-grid">
          <div className="summary-cell">
            <div className="label">Monto en riesgo</div>
            <div className="value num-negative">${result.riskAmount.toFixed(2)}</div>
          </div>
          <div className="summary-cell">
            <div className="label">Lotaje recomendado</div>
            <div className="value" style={{ color: "var(--accent)" }}>{result.lotSize.toFixed(2)}</div>
          </div>
          {result.takeProfitPips !== null && (
            <div className="summary-cell">
              <div className="label">Take profit sugerido</div>
              <div className="value">{result.takeProfitPips.toFixed(1)} pips</div>
            </div>
          )}
          {result.potentialProfit !== null && (
            <div className="summary-cell">
              <div className="label">Beneficio potencial</div>
              <div className="value num-positive">${result.potentialProfit.toFixed(2)}</div>
            </div>
          )}
        </div>
      ) : (
        <p>Completa el stop loss y el valor del pip para ver el resultado.</p>
      )}
    </Layout>
  );
}