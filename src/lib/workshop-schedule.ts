/**
 * Workshop booking clock in Europe/Warsaw.
 * Opening hours come from the caller so this module stays free of config cycles.
 * A visit must start at or after opening and finish at or before closing.
 */

export const WORKSHOP_TIME_ZONE = "Europe/Warsaw";

/** Public booking grid step. One slot is one hour unless a longer job is requested. */
export const BOOKING_SLOT_STEP_MINUTES = 60;

/** Used when the request does not name a longer published job. */
export const DEFAULT_VISIT_MINUTES = 60;

export type WorkshopHours = {
  opens: string;
  closes: string;
  saturdayOpens: string;
  saturdayCloses: string;
};

export type DayWindow = {
  openMin: number;
  closeMin: number;
};

export type ScheduleError =
  | "invalid_date"
  | "invalid_time"
  | "closed_sunday"
  | "before_open"
  | "after_close"
  | "duration_exceeds_hours"
  | "slot_in_past";

/**
 * Upper bounds already stated on the public site (minutes).
 * Unknown services stay on the one-hour slot. The longer of the selected jobs wins.
 */
const PUBLISHED_DURATION_MINUTES: Record<string, number> = {
  oil: 60,
  oil_filter: 60,
  diagnostic: 60,
  computer_diag: 60,
  premium_diag: 60,
  acRefill: 60,
  acRepair: 60,
  ac_hookup: 60,
  suspension_diag: 40,
  brakePads: 120,
  brake_pads_front: 120,
  brake_pads_rear: 120,
  brakesFull: 180,
  brake_disc_front: 180,
  brake_disc_rear: 180,
  tires: 90,
  tire_change_r13: 90,
  tire_change_r14: 90,
  tire_change_r15: 90,
  tire_change_r16: 90,
  tire_change_r17: 90,
  tire_change_r18: 90,
  tire_change_r19: 90,
  tire_change_r20: 90,
};

export function weekdayIndexFromDateKey(dateKey: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return null;
  const utc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    return null;
  }
  return utc.getUTCDay();
}

export function clockToMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function minutesToClock(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function warsawParts(instant: Date): {
  dateKey: string;
  minutes: number;
  weekday: number;
} {
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: WORKSHOP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: WORKSHOP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(instant);
  const [rawHour, rawMinute] = time.split(":");
  const hour = Number(rawHour) % 24;
  const minute = Number(rawMinute);
  const weekday = weekdayIndexFromDateKey(dateKey) ?? instant.getUTCDay();
  return { dateKey, minutes: hour * 60 + minute, weekday };
}

export function windowForWeekday(weekday: number, hours: WorkshopHours): DayWindow | null {
  if (weekday === 0) return null;
  const opens = weekday === 6 ? hours.saturdayOpens : hours.opens;
  const closes = weekday === 6 ? hours.saturdayCloses : hours.closes;
  const openMin = clockToMinutes(opens);
  const closeMin = clockToMinutes(closes);
  if (openMin == null || closeMin == null || closeMin <= openMin) return null;
  return { openMin, closeMin };
}

export function openingWindowForDateKey(dateKey: string, hours: WorkshopHours): DayWindow | null {
  const weekday = weekdayIndexFromDateKey(dateKey);
  if (weekday == null) return null;
  return windowForWeekday(weekday, hours);
}

export function normalizeVisitMinutes(value: number | undefined, fallback = DEFAULT_VISIT_MINUTES): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return fallback;
  return Math.min(24 * 60, Math.round(value));
}

export function resolveBookingDurationMinutes(input?: {
  durationMinutes?: number;
  serviceIds?: string[];
}): number {
  const known = (input?.serviceIds ?? [])
    .map((id) => PUBLISHED_DURATION_MINUTES[id])
    .filter((minutes): minutes is number => typeof minutes === "number");
  const fromServices = known.length ? Math.max(...known) : DEFAULT_VISIT_MINUTES;
  const requested = normalizeVisitMinutes(input?.durationMinutes, 0);
  if (requested > 0) return Math.max(fromServices, requested);
  return fromServices;
}

export function isOpenAt(instant: Date, hours: WorkshopHours): boolean {
  const parts = warsawParts(instant);
  const window = windowForWeekday(parts.weekday, hours);
  if (!window) return false;
  return parts.minutes >= window.openMin && parts.minutes < window.closeMin;
}

export function evaluateBookingStart(input: {
  date: string;
  time: string;
  durationMinutes?: number;
  now?: Date;
  hours: WorkshopHours;
}): { ok: true; durationMinutes: number } | { ok: false; error: ScheduleError } {
  const weekday = weekdayIndexFromDateKey(input.date);
  if (weekday == null) return { ok: false, error: "invalid_date" };
  if (weekday === 0) return { ok: false, error: "closed_sunday" };

  const start = clockToMinutes(input.time);
  if (start == null) return { ok: false, error: "invalid_time" };

  const window = windowForWeekday(weekday, input.hours);
  if (!window) return { ok: false, error: "closed_sunday" };

  const durationMinutes = normalizeVisitMinutes(input.durationMinutes);
  if (durationMinutes > window.closeMin - window.openMin) {
    return { ok: false, error: "duration_exceeds_hours" };
  }
  if (start < window.openMin) return { ok: false, error: "before_open" };
  if (start + durationMinutes > window.closeMin) return { ok: false, error: "after_close" };

  const now = input.now ?? new Date();
  const today = warsawParts(now);
  if (input.date < today.dateKey || (input.date === today.dateKey && start < today.minutes)) {
    return { ok: false, error: "slot_in_past" };
  }

  return { ok: true, durationMinutes };
}

export function bookingStartTimes(
  dateKey: string,
  hours: WorkshopHours,
  durationMinutes = DEFAULT_VISIT_MINUTES,
  now: Date = new Date()
): string[] {
  const window = openingWindowForDateKey(dateKey, hours);
  if (!window) return [];
  const duration = normalizeVisitMinutes(durationMinutes);
  if (duration > window.closeMin - window.openMin) return [];

  const today = warsawParts(now);
  const times: string[] = [];
  for (let start = window.openMin; start + duration <= window.closeMin; start += BOOKING_SLOT_STEP_MINUTES) {
    if (dateKey === today.dateKey && start < today.minutes) continue;
    if (dateKey < today.dateKey) continue;
    times.push(minutesToClock(start));
  }
  return times;
}

/**
 * Convert a Warsaw wall-clock time to a UTC instant.
 * Returns null for dates that do not exist (the spring-forward gap).
 * An ambiguous winter hour resolves to the later, standard-time occurrence.
 */
export function warsawCivilToUtc(dateKey: string, time: string): Date | null {
  if (weekdayIndexFromDateKey(dateKey) == null) return null;
  const minutes = clockToMinutes(time);
  if (minutes == null) return null;
  const [year, month, day] = dateKey.split("-").map(Number);
  let utcMs = Date.UTC(year, month - 1, day, Math.floor(minutes / 60), minutes % 60, 0, 0);

  for (let i = 0; i < 4; i++) {
    const parts = warsawParts(new Date(utcMs));
    let dayDelta = 0;
    if (parts.dateKey !== dateKey) dayDelta = parts.dateKey < dateKey ? 1 : -1;
    const shift = dayDelta * 24 * 60 + (minutes - parts.minutes);
    if (shift === 0) return new Date(utcMs);
    utcMs += shift * 60_000;
  }

  const parts = warsawParts(new Date(utcMs));
  if (parts.dateKey === dateKey && parts.minutes === minutes) return new Date(utcMs);
  return null;
}
