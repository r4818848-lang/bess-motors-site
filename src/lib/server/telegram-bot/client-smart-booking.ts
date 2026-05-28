import type { ServiceId } from "@/lib/services-catalog";
import { bookingGridServiceIds } from "@/lib/services-catalog";
import { nextBookableDates } from "./client-services";

export type ParsedSmartBooking = {
  serviceId: string;
  date: string;
  time: string;
  comment?: string;
};

const SERVICE_KEYWORDS: { id: ServiceId; patterns: RegExp[] }[] = [
  { id: "oil", patterns: [/масл|olej|oil change|wymian[ae].*olej/i] },
  { id: "diagnostic", patterns: [/диагност|diagnost|check engine|komputer/i] },
  { id: "brakePads", patterns: [/колодк|hamulc|brake pad|тормоз/i] },
  { id: "tires", patterns: [/шин|opon|tire|колес/i] },
  { id: "acRefill", patterns: [/кондицион|klimat|ac refill|nabij/i] },
  { id: "suspension", patterns: [/подвеск|zawieszen|suspension|стук/i] },
  { id: "filters", patterns: [/фильтр|filtr/i] },
  { id: "electric", patterns: [/электр|elektr|electrical/i] },
  { id: "timingBelt", patterns: [/грм|rozrząd|timing belt|ремень/i] },
];

function parseTime(text: string): string | null {
  const m = text.match(/(?:в|o|at)?\s*(\d{1,2})[:.](\d{2})/i) ?? text.match(/\b(\d{1,2})[:.](\d{2})\b/);
  if (!m) {
    const h = text.match(/\b(\d{1,2})\s*(?:час|godz|h)\b/i);
    if (h) {
      const hour = Math.min(23, Math.max(8, Number(h[1])));
      return `${String(hour).padStart(2, "0")}:00`;
    }
    return null;
  }
  const hh = Math.min(19, Math.max(8, Number(m[1])));
  const mm = Number(m[2]);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function parseDate(text: string, bookable: string[]): string | null {
  const lower = text.toLowerCase();
  const today = bookable[0];
  if (/сегодня|dzisiaj|today|dziś/i.test(lower)) return today;
  if (/завтра|jutro|tomorrow/i.test(lower)) return bookable[1] ?? today;
  if (/послезавтра|pojutrze/i.test(lower)) return bookable[2] ?? bookable[1] ?? today;

  const dmy = lower.match(/\b(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?\b/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = dmy[3] ? Number(dmy[3]) : new Date().getFullYear();
    const y = year < 100 ? 2000 + year : year;
    const key = `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (bookable.includes(key)) return key;
    const d = new Date(`${key}T12:00:00`);
    if (!Number.isNaN(d.getTime()) && d.getDay() !== 0) return key;
  }
  return null;
}

function parseService(text: string): string {
  for (const row of SERVICE_KEYWORDS) {
    if (row.patterns.some((p) => p.test(text))) return row.id;
  }
  return "diagnostic";
}

/** Heuristic: free-text booking like "завтра 17:30 замена масла" */
export function tryParseSmartBooking(text: string): ParsedSmartBooking | null {
  const trimmed = text.trim();
  if (trimmed.length < 8 || trimmed.startsWith("/")) return null;
  if (!/\d/.test(trimmed)) return null;

  const bookable = nextBookableDates(21);
  const time = parseTime(trimmed);
  const date = parseDate(trimmed, bookable);
  if (!time && !date) return null;

  const serviceId = parseService(trimmed);
  const hasBookKeyword =
    /запис|umów|book|wizyt|приех|приед|termin|время|godzin/i.test(trimmed) ||
    (time && date);

  if (!hasBookKeyword && !time) return null;

  return {
    serviceId,
    date: date ?? bookable[1] ?? bookable[0],
    time: time ?? "10:00",
    comment: trimmed.slice(0, 300),
  };
}

export function looksLikeSmartBookingAttempt(text: string): boolean {
  return tryParseSmartBooking(text) !== null;
}

export function isBookableServiceId(id: string): boolean {
  return (bookingGridServiceIds as readonly string[]).includes(id);
}
