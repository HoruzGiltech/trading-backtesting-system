import { useMemo, useState } from "react";
import { Layout } from "../components/Layout";
import {
    KILL_ZONES, TIMEZONE_OPTIONS,
    convertHourToTimezone, formatHour,
} from "../services/killZoneUtils";

export default function KillZonesPage() {
  const [timezone, setTimezone] = useState("America/Santiago");

  const converted = useMemo(() => {
    return KILL_ZONES.map((kz) => ({
      ...kz,
      startConverted: convertHourToTimezone(kz.startHour, timezone),
      endConverted: convertHourToTimezone(kz.endHour, timezone),
    }));
  }, [timezone]);

  return (
    <Layout>
      <h1>Kill zones</h1>
      <p>Horarios de referencia en hora de Nueva York, convertidos a tu zona horaria.</p>

      <div className="panel" style={{ maxWidth: 320 }}>
        <div className="field">
          <label>Tu zona horaria</label>
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
            {TIMEZONE_OPTIONS.map((tz) => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Sesión</th>
              <th>Horario (Nueva York)</th>
              <th>Horario (tu zona)</th>
            </tr>
          </thead>
          <tbody>
            {converted.map((kz) => (
              <tr key={kz.name}>
                <td style={{ fontFamily: "var(--font-ui)" }}>{kz.name}</td>
                <td>{formatHour(kz.startHour)} – {formatHour(kz.endHour)}</td>
                <td style={{ color: "var(--accent)", fontWeight: 600 }}>
                  {formatHour(kz.startConverted)} – {formatHour(kz.endConverted)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}