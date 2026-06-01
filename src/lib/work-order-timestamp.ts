/** ISO timestamp for work-order merge / conflict resolution */
export function nowIsoTimestamp(): string {
  return new Date().toISOString();
}

/** Normalize legacy date-only stamps to comparable ISO */
export function normalizeIsoTimestamp(raw: string | undefined): string {
  if (!raw?.trim()) return "";
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return `${s}T12:00:00.000Z`;
  }
  const ms = Date.parse(s);
  if (Number.isNaN(ms)) return s;
  return new Date(ms).toISOString();
}

export function mergeTimestampMs(raw: string | undefined): number {
  const iso = normalizeIsoTimestamp(raw);
  if (!iso) return 0;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? 0 : ms;
}
