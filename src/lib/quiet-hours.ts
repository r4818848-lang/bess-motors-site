/** Warsaw local hour 0–23 */
export function warsawHour(now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Warsaw",
    hour: "numeric",
    hour12: false,
  }).formatToParts(now);
  const h = parts.find((p) => p.type === "hour")?.value ?? "12";
  return Number(h);
}

/** Default quiet: 22:00–08:00 */
export function isQuietHours(now = new Date(), enabled = true): boolean {
  if (!enabled) return false;
  const h = warsawHour(now);
  return h >= 22 || h < 8;
}

export function tomorrowDateKey(now = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function todayDateKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}
