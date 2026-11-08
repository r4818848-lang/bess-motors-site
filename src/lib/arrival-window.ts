import { clockToMinutes, minutesToClock, warsawParts, weekdayIndexFromDateKey } from "@/lib/workshop-schedule";

/** Client arrival grid. Workshop opening hours stay separate. */
export const ARRIVAL_FIRST_MINUTES = 9 * 60;
export const ARRIVAL_LAST_MINUTES = 13 * 60 + 30;
export const ARRIVAL_STEP_MINUTES = 30;

export type ArrivalError = "invalid_date" | "invalid_time" | "closed_sunday" | "before_open" | "after_close" | "slot_in_past";

export function isArrivalStep(time: string): boolean {
  const minutes = clockToMinutes(time);
  if (minutes == null) return false;
  return minutes % ARRIVAL_STEP_MINUTES === 0;
}

export function evaluateArrivalTime(input: {
  date: string;
  time: string;
  now?: Date;
}): { ok: true } | { ok: false; error: ArrivalError } {
  const weekday = weekdayIndexFromDateKey(input.date);
  if (weekday == null) return { ok: false, error: "invalid_date" };
  if (weekday === 0) return { ok: false, error: "closed_sunday" };
  const start = clockToMinutes(input.time);
  if (start == null || !isArrivalStep(input.time)) return { ok: false, error: "invalid_time" };
  if (start < ARRIVAL_FIRST_MINUTES) return { ok: false, error: "before_open" };
  if (start > ARRIVAL_LAST_MINUTES) return { ok: false, error: "after_close" };

  const now = input.now ?? new Date();
  const today = warsawParts(now);
  if (input.date < today.dateKey || (input.date === today.dateKey && start < today.minutes)) {
    return { ok: false, error: "slot_in_past" };
  }
  return { ok: true };
}

export function arrivalTimes(dateKey: string, now: Date = new Date()): string[] {
  const weekday = weekdayIndexFromDateKey(dateKey);
  if (weekday == null || weekday === 0) return [];
  const today = warsawParts(now);
  if (dateKey < today.dateKey) return [];
  const times: string[] = [];
  for (let start = ARRIVAL_FIRST_MINUTES; start <= ARRIVAL_LAST_MINUTES; start += ARRIVAL_STEP_MINUTES) {
    if (dateKey === today.dateKey && start < today.minutes) continue;
    times.push(minutesToClock(start));
  }
  return times;
}
