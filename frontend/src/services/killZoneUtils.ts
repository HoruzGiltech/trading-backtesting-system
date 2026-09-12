export interface KillZone {
  name: string;
  startHour: number; // hora decimal en la zona de referencia (America/New_York)
  endHour: number;
}

export const REFERENCE_TIMEZONE = "America/New_York";

export const KILL_ZONES: KillZone[] = [
  { name: "Hong Kong", startHour: 20, endHour: 24 },
  { name: "Asia", startHour: 0, endHour: 3 },
  { name: "Londres", startHour: 3, endHour: 7 + 59 / 60 },
  { name: "Nueva York", startHour: 8, endHour: 15 },
];

export const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Nueva York (EST/EDT)" },
  { value: "America/Chicago", label: "Chicago (CST/CDT)" },
  { value: "America/Caracas", label: "Caracas (VET)" },
  { value: "America/Santiago", label: "Santiago (CLT/CLST)" },
  { value: "America/Bogota", label: "Bogotá (COT)" },
  { value: "America/Mexico_City", label: "Ciudad de México (CST)" },
  { value: "America/Lima", label: "Lima (PET)" },
  { value: "America/Buenos_Aires", label: "Buenos Aires (ART)" },
  { value: "Europe/Madrid", label: "Madrid (CET/CEST)" },
  { value: "Europe/London", label: "Londres (GMT/BST)" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)" },
  { value: "Asia/Tokyo", label: "Tokio (JST)" },
  { value: "UTC", label: "UTC" },
];

// Obtiene el offset UTC (en minutos) de una zona horaria en una fecha dada.
// Se recalcula "hoy" para que el horario de verano (DST) siempre esté correcto.
function getUtcOffsetMinutes(timeZone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" });
  const parts = dtf.formatToParts(date);
  const offsetPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+0";
  const match = offsetPart.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  const hours = parseInt(match[2], 10);
  const minutes = match[3] ? parseInt(match[3], 10) : 0;
  return sign * (hours * 60 + minutes);
}

export function convertHourToTimezone(hour: number, targetTimezone: string): number {
  const now = new Date();
  const refOffset = getUtcOffsetMinutes(REFERENCE_TIMEZONE, now);
  const targetOffset = getUtcOffsetMinutes(targetTimezone, now);
  const diffMinutes = targetOffset - refOffset;
  const converted = (((hour + diffMinutes / 60) % 24) + 24) % 24;
  return converted;
}

export function formatHour(hourDecimal: number): string {
  const totalMinutes = Math.round(hourDecimal * 60);
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}