import { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import { getHighImpactNews } from "../services/newsService";
import type { NewsEvent } from "../types/news";

export default function NewsPage() {
  const [events, setEvents] = useState<NewsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const data = await getHighImpactNews();
      setEvents(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  // Agrupar eventos por día (en la hora local del navegador)
  const grouped = events.reduce<Record<string, NewsEvent[]>>((acc, event) => {
    const day = new Date(event.date).toLocaleDateString(undefined, {
      weekday: "long", day: "numeric", month: "long",
    });
    if (!acc[day]) acc[day] = [];
    acc[day].push(event);
    return acc;
  }, {});

  return (
    <Layout>
      <h1>Noticias de alto impacto</h1>
      <p>Eventos económicos de impacto alto (3 estrellas) de esta semana, en tu hora local.</p>

      {loading ? (
        <p>Cargando...</p>
      ) : error ? (
        <p className="error-text">No se pudo cargar el calendario de noticias. Intenta más tarde.</p>
      ) : events.length === 0 ? (
        <p>No hay eventos de alto impacto esta semana.</p>
      ) : (
        Object.entries(grouped).map(([day, dayEvents]) => (
          <div key={day}>
            <h2 style={{ textTransform: "capitalize" }}>{day}</h2>
            <div className="panel" style={{ padding: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Moneda</th>
                    <th>Evento</th>
                    <th>Pronóstico</th>
                    <th>Anterior</th>
                  </tr>
                </thead>
                <tbody>
                  {dayEvents.map((event, i) => (
                    <tr key={i}>
                      <td>{new Date(event.date).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</td>
                      <td><span className="result-badge" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>{event.country}</span></td>
                      <td style={{ fontFamily: "var(--font-ui)" }}>{event.title}</td>
                      <td>{event.forecast || "—"}</td>
                      <td>{event.previous || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </Layout>
  );
}