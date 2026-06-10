import { addDays, isAfter, isBefore, startOfDay } from "date-fns";
import { formatLocalDateKey } from "./date-key";

/** How far ahead clients can book online (days including today). */
export const BOOKING_HORIZON_DAYS = 60;

export function isSundayDate(d: Date): boolean {
  return d.getDay() === 0;
}

export function getBookingHorizonEnd(from: Date = new Date()): Date {
  return addDays(startOfDay(from), BOOKING_HORIZON_DAYS - 1);
}

export function isDateBookable(day: Date, from: Date = new Date()): boolean {
  const today = startOfDay(from);
  const end = getBookingHorizonEnd(from);
  const d = startOfDay(day);
  if (isBefore(d, today) || isAfter(d, end) || isSundayDate(d)) return false;
  return true;
}

export function listBookableDateKeys(from: Date = new Date()): string[] {
  const keys: string[] = [];
  const today = startOfDay(from);
  for (let i = 0; i < BOOKING_HORIZON_DAYS; i++) {
    const day = addDays(today, i);
    if (!isSundayDate(day)) keys.push(formatLocalDateKey(day));
  }
  return keys;
}
