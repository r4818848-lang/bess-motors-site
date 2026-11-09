import { workshopHours } from "@/lib/businessConfig";
import {
  clockToMinutes,
  minutesToClock,
  openingWindowForDateKey,
  warsawParts,
  weekdayIndexFromDateKey,
  type WorkshopHours,
} from "@/lib/workshop-schedule";

/** Client arrival grid. The last slot is one step before the workshop closes. */
export const ARRIVAL_STEP_MINUTES = 30;

export type ArrivalError = "invalid_date" | "invalid_time" | "closed_sunday" | "before_open" | "after_close" | "slot_in_past";

export type ArrivalBounds = {
  first: number;
  last: number;
  close: number;
};

export function arrivalBounds(dateKey: string, hours: WorkshopHours = workshopHours()): ArrivalBounds | null {
  const window = openingWindowForDateKey(dateKey, hours);
  if (!window) return null;
  const last = window.closeMin - ARRIVAL_STEP_MINUTES;
  if (last < window.openMin) return null;
  return { first: window.openMin, last, close: window.closeMin };
}

export function isArrivalStep(time: string, step = ARRIVAL_STEP_MINUTES): boolean {
  const minutes = clockToMinutes(time);
  if (minutes == null) return false;
  return minutes % step === 0;
}

export function evaluateArrivalTime(input: {
  date: string;
  time: string;
  now?: Date;
  hours?: WorkshopHours;
}): { ok: true } | { ok: false; error: ArrivalError } {
  const weekday = weekdayIndexFromDateKey(input.date);
  if (weekday == null) return { ok: false, error: "invalid_date" };
  if (weekday === 0) return { ok: false, error: "closed_sunday" };
  const bounds = arrivalBounds(input.date, input.hours);
  if (!bounds) return { ok: false, error: "invalid_date" };
  const start = clockToMinutes(input.time);
  if (start == null || !isArrivalStep(input.time)) return { ok: false, error: "invalid_time" };
  if (start < bounds.first) return { ok: false, error: "before_open" };
  if (start > bounds.last) return { ok: false, error: "after_close" };

  const now = input.now ?? new Date();
  const today = warsawParts(now);
  if (input.date < today.dateKey || (input.date === today.dateKey && start < today.minutes)) {
    return { ok: false, error: "slot_in_past" };
  }
  return { ok: true };
}

/** Every client arrival on that date, including times that have already passed. */
export function arrivalTimesForDate(dateKey: string, hours: WorkshopHours = workshopHours()): string[] {
  const bounds = arrivalBounds(dateKey, hours);
  if (!bounds) return [];
  const times: string[] = [];
  let start = bounds.first;
  const remainder = start % ARRIVAL_STEP_MINUTES;
  if (remainder !== 0) start += ARRIVAL_STEP_MINUTES - remainder;
  for (; start <= bounds.last; start += ARRIVAL_STEP_MINUTES) {
    times.push(minutesToClock(start));
  }
  return times;
}

export function arrivalTimes(dateKey: string, now: Date = new Date(), hours: WorkshopHours = workshopHours()): string[] {
  const today = warsawParts(now);
  if (dateKey < today.dateKey) return [];
  return arrivalTimesForDate(dateKey, hours).filter((time) => {
    if (dateKey !== today.dateKey) return true;
    const start = clockToMinutes(time);
    return start != null && start >= today.minutes;
  });
}

/** Weekday and Saturday arrival windows derived from the workshop clock. */
export function arrivalSchedule(hours: WorkshopHours = workshopHours()) {
  const weekday = arrivalBounds("2026-11-09", hours);
  const saturday = arrivalBounds("2026-11-14", hours);
  return {
    step: ARRIVAL_STEP_MINUTES,
    sundayClosed: true,
    weekday: weekday
      ? { from: minutesToClock(weekday.first), to: minutesToClock(weekday.last), closes: minutesToClock(weekday.close) }
      : null,
    saturday: saturday
      ? { from: minutesToClock(saturday.first), to: minutesToClock(saturday.last), closes: minutesToClock(saturday.close) }
      : null,
  };
}
