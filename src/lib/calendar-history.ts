import type { Appointment } from "@/lib/store";

function activeVisit(apt: Appointment): boolean {
  return apt.appointmentStatus !== "cancelled" && apt.appointmentStatus !== "completed" && !apt.calendarHidden;
}

/** Past, cancelled, and completed visits leave the calendar. Future and today's active visits stay. */
export function shouldArchiveCalendarVisit(apt: Appointment, todayKey: string): boolean {
  if (apt.calendarHidden) return false;
  if (apt.appointmentStatus === "cancelled" || apt.appointmentStatus === "completed") return true;
  return Boolean(apt.date) && apt.date < todayKey;
}

export function planCalendarArchive(appointments: Appointment[], todayKey: string): {
  hide: number;
  keepFuture: number;
  keepToday: number;
} {
  let hide = 0;
  let keepFuture = 0;
  let keepToday = 0;
  for (const apt of appointments) {
    if (apt.calendarHidden) continue;
    if (shouldArchiveCalendarVisit(apt, todayKey)) {
      hide += 1;
      continue;
    }
    if (!activeVisit(apt)) continue;
    if (apt.date > todayKey) keepFuture += 1;
    else if (apt.date === todayKey) keepToday += 1;
  }
  return { hide, keepFuture, keepToday };
}

/** Hide rows in memory. Does not delete clients, orders, money, or repair history. */
export function archiveCalendarHistory(
  appointments: Appointment[],
  todayKey: string,
  nowIso: string
): { appointments: Appointment[]; hidden: number } {
  let hidden = 0;
  const next = appointments.map((apt) => {
    if (!shouldArchiveCalendarVisit(apt, todayKey)) return apt;
    hidden += 1;
    return {
      ...apt,
      calendarHidden: true,
      updatedAt: nowIso,
      adminReminder:
        apt.adminReminder && apt.adminReminder.status !== "sent"
          ? { ...apt.adminReminder, status: "cancelled" as const }
          : apt.adminReminder,
    };
  });
  return { appointments: next, hidden };
}
