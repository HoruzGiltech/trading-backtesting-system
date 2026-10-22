import { useEffect, useState } from "react";

export interface TradeCalendarEntry {
  id: string;
  date: string;
  title: string;
  result: string;
  resultClass: "positive" | "negative" | "neutral" | "breakeven";
  profit: number;
  noTrade?: boolean;
  details: { label: string; value: string }[];
}

export interface CalendarMetric {
  label: string;
  value: string;
  tone?: "positive" | "negative";
}

interface TradeCalendarProps {
  entries: TradeCalendarEntry[];
  initialMonth: Date;
  navigable?: boolean;
  getDayMetrics?: (date: string, entries: TradeCalendarEntry[]) => CalendarMetric[];
  onEditEntry?: (id: string) => void;
}

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD" }).format(value);
}

export function TradeCalendar({
  entries,
  initialMonth,
  navigable = false,
  getDayMetrics,
  onEditEntry,
}: TradeCalendarProps) {
  const [month, setMonth] = useState(() => new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leadingDays = new Date(year, monthIndex, 1).getDay();
  const cellCount = Math.ceil((leadingDays + daysInMonth) / 7) * 7;

  const entriesByDate = new Map<string, TradeCalendarEntry[]>();
  for (const entry of entries) {
    const dayEntries = entriesByDate.get(entry.date) ?? [];
    dayEntries.push(entry);
    entriesByDate.set(entry.date, dayEntries);
  }

  const weeks = Array.from({ length: cellCount / 7 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, weekdayIndex) => {
      const day = weekIndex * 7 + weekdayIndex - leadingDays + 1;
      const date = new Date(year, monthIndex, day);
      return {
        date: dateKey(date.getFullYear(), date.getMonth(), date.getDate()),
        day: date.getDate(),
        inMonth: date.getMonth() === monthIndex,
      };
    })
  );
  const selectedEntries = selectedDate ? entriesByDate.get(selectedDate) ?? [] : [];
  const selectedMetrics = selectedDate
    ? getDayMetrics?.(selectedDate, selectedEntries) ?? [
        { label: "PnL", value: formatMoney(selectedEntries.reduce((sum, entry) => sum + (entry.noTrade ? 0 : entry.profit), 0)) },
        { label: "Operaciones", value: String(selectedEntries.filter((entry) => !entry.noTrade).length) },
      ]
    : [];

  useEffect(() => {
    if (!selectedDate) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedDate(null);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedDate]);

  function changeMonth(offset: number) {
    setMonth(new Date(year, monthIndex + offset, 1));
  }

  return (
    <>
      <section className="trade-calendar">
        <div className="calendar-main">
          <div className="calendar-toolbar">
            {navigable && (
              <button className="btn" onClick={() => changeMonth(-1)} aria-label="Mes anterior">‹</button>
            )}
            <h3>{MONTHS[monthIndex]} {year}</h3>
            {navigable && (
              <button className="btn" onClick={() => changeMonth(1)} aria-label="Mes siguiente">›</button>
            )}
            {navigable && (
              <button className="btn calendar-today" onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>
                Hoy
              </button>
            )}
          </div>
          <div className="calendar-grid">
            {WEEKDAYS.map((weekday) => <div className="calendar-weekday" key={weekday}>{weekday}</div>)}
            {weeks.flatMap((week) => week.map((cell) => {
              const dayEntries = entriesByDate.get(cell.date) ?? [];
              const trades = dayEntries.filter((entry) => !entry.noTrade);
              const profit = trades.reduce((sum, entry) => sum + entry.profit, 0);
              const tone = profit > 0 ? "positive" : profit < 0 ? "negative" : "";
              return (
                <button
                  type="button"
                  key={cell.date}
                  className={`calendar-day${cell.inMonth ? "" : " outside-month"}${dayEntries.length ? " has-entries" : ""}`}
                  disabled={dayEntries.length === 0}
                  onClick={() => setSelectedDate(cell.date)}
                  aria-label={`${cell.date}${dayEntries.length ? `, ${trades.length} operaciones, ${formatMoney(profit)}` : ""}`}
                >
                  <span className="calendar-day-number">{cell.day}</span>
                  {dayEntries.length > 0 && (
                    <span className="calendar-day-summary">
                      {trades.length > 0 ? <span>{trades.length} op.</span> : <span>Sin operar</span>}
                      <span className={tone}>{formatMoney(profit)}</span>
                    </span>
                  )}
                </button>
              );
            }))}
          </div>
        </div>

        <aside className="calendar-weeks">
          <h3>Resumen semanal</h3>
          {weeks.map((week, index) => {
            const weekEntries = week.flatMap((cell) => entriesByDate.get(cell.date) ?? []);
            const trades = weekEntries.filter((entry) => !entry.noTrade);
            const profit = trades.reduce((sum, entry) => sum + entry.profit, 0);
            const first = week[0];
            const last = week[6];
            return (
              <div className="calendar-week-summary" key={first.date}>
                <div className="calendar-week-heading">
                  <strong>Semana {index + 1}</strong>
                  <span>{first.date.slice(5)} – {last.date.slice(5)}</span>
                </div>
                <div className="calendar-week-values">
                  <span>PnL: <strong className={profit > 0 ? "positive" : profit < 0 ? "negative" : ""}>{formatMoney(profit)}</strong></span>
                  <span>Días: <strong>{new Set(trades.map((entry) => entry.date)).size}</strong></span>
                </div>
              </div>
            );
          })}
        </aside>
      </section>

      {selectedDate && (
        <div className="calendar-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedDate(null);
        }}>
          <section className="calendar-modal" role="dialog" aria-modal="true" aria-labelledby="calendar-modal-title">
            <div className="calendar-modal-header">
              <h2 id="calendar-modal-title">
                {new Date(`${selectedDate}T12:00:00`).toLocaleDateString("es-ES", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric",
                })}
              </h2>
              <button className="btn" onClick={() => setSelectedDate(null)} aria-label="Cerrar detalle">×</button>
            </div>
            <div className="calendar-metrics">
              {selectedMetrics.map((metric) => (
                <div className="calendar-metric" key={metric.label}>
                  <span>{metric.label}</span>
                  <strong className={metric.tone ?? ""}>{metric.value}</strong>
                </div>
              ))}
            </div>
            <div className="calendar-entry-list">
              {selectedEntries.map((entry) => (
                <article className="calendar-entry-detail" key={entry.id}>
                  <div className="calendar-entry-heading">
                    <strong>{entry.title}</strong>
                      <span className={`result-badge ${entry.resultClass === "positive" ? "result-tp" : entry.resultClass === "negative" ? "result-sl" : entry.resultClass === "breakeven" ? "result-be" : "result-none"}`}>
                      {entry.result}
                    </span>
                  </div>
                  <dl>
                    {entry.details.map((detail) => (
                      <div key={detail.label}><dt>{detail.label}</dt><dd>{detail.value || "—"}</dd></div>
                    ))}
                  </dl>
                  {onEditEntry && (
                    <button className="btn btn-sm" onClick={() => {
                      setSelectedDate(null);
                      onEditEntry(entry.id);
                    }}>Editar</button>
                  )}
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
