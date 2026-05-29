import type { AppSettings } from "./store";

export function isSlotBlocked(
  settings: AppSettings,
  date: string,
  time: string
): boolean {
  const key = `${date}|${time}`;
  if (settings.blockedBookingSlots?.includes(key)) return true;

  const lunchStart = settings.lunchBreakStart ?? "13:00";
  const lunchEnd = settings.lunchBreakEnd ?? "14:00";
  if (time >= lunchStart && time < lunchEnd) return true;

  return false;
}
