import { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import { createTradingPlan, listTradingPlans } from "../services/tradingPlanService";
import type { TradingPlan } from "../types/tradingPlan";

export default function TradingPlanPage() {
  const [plans, setPlans] = useState<TradingPlan[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await listTradingPlans();
      setPlans(data);
      if (data.length > 0) setContent(data[0].content); // parte de la última versión guardada
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await createTradingPlan(content);
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <h1>Plan de trading</h1>
      <p>Escribe o actualiza tu plan. Cada vez que guardes queda una nueva versión en tu historial.</p>

      <div className="panel">
        <div className="field">
          <label>Contenido del plan</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            style={{
              width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
              borderRadius: "var(--radius)", padding: 10, color: "var(--text)",
              fontFamily: "var(--font-ui)", fontSize: 14, resize: "vertical",
            }}
          />
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : "Guardar nueva versión"}
        </button>
      </div>

      <h2>Historial de versiones</h2>
      {loading ? (
        <p>Cargando...</p>
      ) : plans.length === 0 ? (
        <p>Aún no tienes versiones guardadas.</p>
      ) : (
        plans.map((plan) => (
          <div key={plan.id} className="panel">
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8, fontFamily: "var(--font-mono)" }}>
              {new Date(plan.created_at).toLocaleString()}
            </div>
            <p style={{ whiteSpace: "pre-wrap", color: "var(--text)", margin: 0 }}>{plan.content}</p>
          </div>
        ))
      )}
    </Layout>
  );
}