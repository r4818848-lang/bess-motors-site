import { formatWarsawDateKey } from "@/lib/date-key";

function isValidCalendarDate(y: number, m: number, d: number): boolean {
  const dt = new Date(y, m - 1, d, 12, 0, 0, 0);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

/** yyyy-MM-dd or ISO → DD.MM.YYYY */
export function formatDisplayDateKey(dateKey: string): string {
  const raw = dateKey.trim().slice(0, 10);
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[3]}.${iso[2]}.${iso[1]}`;
  const eu = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (eu) return `${eu[1]}.${eu[2]}.${eu[3]}`;
  return dateKey;
}

/** ISO timestamp → DD.MM.YYYY, HH:MM (local time) */
export function formatDisplayDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return formatDisplayDateKey(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy}, ${hh}:${min}`;
}

/** Today's date in DD.MM.YYYY (Warsaw) — for input hints */
export function formatDisplayDateExample(d: Date = new Date()): string {
  return formatDisplayDateKey(formatWarsawDateKey(d));
}

/** Parse DD.MM.YYYY or YYYY-MM-DD → canonical yyyy-MM-dd */
export function parseFlexibleDateKey(text: string): string | null {
  const t = text.trim();
  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso && isValidCalendarDate(+iso[1], +iso[2], +iso[3])) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }
  const eu = t.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (eu && isValidCalendarDate(+eu[3], +eu[2], +eu[1])) {
    const dd = eu[1].padStart(2, "0");
    const mm = eu[2].padStart(2, "0");
    return `${eu[3]}-${mm}-${dd}`;
  }
  return null;
}

export function isValidFlexibleDateKey(s: string): boolean {
  return parseFlexibleDateKey(s) !== null;
}
