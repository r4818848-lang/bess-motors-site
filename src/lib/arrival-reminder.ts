import type { Appointment, ArrivalReminderClaim, Database } from "@/lib/store";
import { warsawCivilToUtc } from "@/lib/workshop-schedule";

/**
 * Owner Telegram notice "Скоро приедет клиент".
 *
 * One notice per visit and clock time, at the moment two real hours before
 * arrival in Europe/Warsaw. A cron may start a few minutes late. It must not
 * send again on the next 5-minute tick, and it must not backfill a window
 * that has already passed.
 *
 * After the process calls Telegram, the row is terminal even when the
 * response is a timeout or is lost. Telegram may already have delivered the
 * message. A second call would be a duplicate, so a missed notice is preferred.
 */
export const ADMIN_ARRIVAL_REMINDER_TYPE = "admin_two_hour" as const;

/** One late cron tick. The schedule itself is every 5 minutes. */
export const ARRIVAL_REMINDER_SLACK_MS = 10 * 60 * 1000;

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

const WORK_STARTED = new Set(["diagnostic", "repair", "waitingParts", "ready", "delivered"]);

export type ArrivalVisit = {
  id: string;
  date: string;
  time: string;
  appointmentStatus?: string;
  visitState?: string;
  repairStatus?: string;
  calendarHidden?: boolean;
  createdAt?: string;
};

export type ArrivalReminderPlan = {
  key: string;
  scheduledAt: string;
  dueAt: string;
  elapsedMs: number | null;
  /** Null means the visit may be claimed and sent. */
  reason: string | null;
};

export function arrivalReminderKey(appointmentId: string, date: string, time: string): string {
  return `${appointmentId}|${ADMIN_ARRIVAL_REMINDER_TYPE}|${date}|${time}`;
}

/**
 * Real visit states in this CRM are visitState expected|arrived|no_show and
 * appointmentStatus scheduled|confirmed|in_progress|completed|cancelled.
 * There is no checked_in status. repairStatus leaves "received" once work
 * has started on the car.
 */
export function planArrivalReminder(apt: ArrivalVisit, now: Date): ArrivalReminderPlan {
  const key = arrivalReminderKey(apt.id, apt.date, apt.time);
  const arrival = warsawCivilToUtc(apt.date, apt.time);
  if (!arrival) {
    return { key, scheduledAt: "", dueAt: "", elapsedMs: null, reason: "invalid_time" };
  }
  const dueMs = arrival.getTime() - TWO_HOURS_MS;
  const elapsedMs = now.getTime() - dueMs;
  const base = {
    key,
    scheduledAt: arrival.toISOString(),
    dueAt: new Date(dueMs).toISOString(),
    elapsedMs,
  };
  if (apt.calendarHidden) return { ...base, reason: "hidden" };
  if (apt.appointmentStatus === "cancelled") return { ...base, reason: "cancelled" };
  if (apt.appointmentStatus === "completed") return { ...base, reason: "completed" };
  if (apt.appointmentStatus === "in_progress") return { ...base, reason: "in_progress" };
  if (apt.visitState === "arrived") return { ...base, reason: "arrived" };
  if (apt.visitState === "no_show") return { ...base, reason: "no_show" };
  if (apt.repairStatus && WORK_STARTED.has(apt.repairStatus)) return { ...base, reason: "work_started" };

  const createdMs = apt.createdAt ? Date.parse(apt.createdAt) : Number.NaN;
  if (Number.isFinite(createdMs) && createdMs > dueMs) {
    return { ...base, reason: "created_inside_two_hours" };
  }
  if (elapsedMs < 0) return { ...base, reason: "too_early" };
  if (elapsedMs >= ARRIVAL_REMINDER_SLACK_MS) return { ...base, reason: "window_passed" };
  return { ...base, reason: null };
}

export function logArrivalReminder(entry: {
  appointmentId: string;
  scheduledAt: string;
  status: string;
  dedupeReason?: string;
  sentAt?: string;
  attemptCount: number;
}): void {
  console.info(
    JSON.stringify({
      event: "arrival_reminder",
      appointmentId: entry.appointmentId,
      reminderType: ADMIN_ARRIVAL_REMINDER_TYPE,
      scheduledAt: entry.scheduledAt,
      status: entry.status,
      dedupeReason: entry.dedupeReason ?? null,
      sentAt: entry.sentAt ?? null,
      attemptCount: entry.attemptCount,
    })
  );
}

export function shouldLogArrivalSkip(plan: ArrivalReminderPlan): boolean {
  if (plan.elapsedMs == null) return plan.reason === "invalid_time";
  if (plan.reason === "too_early") return plan.elapsedMs >= -15 * 60 * 1000;
  return plan.elapsedMs <= 3 * 60 * 60 * 1000;
}

export function readArrivalClaim(db: Database, key: string): ArrivalReminderClaim | undefined {
  return db.settings?.arrivalReminderClaims?.[key];
}

export function sameClock(apt: Pick<Appointment, "date" | "time">, date: string, time: string): boolean {
  return apt.date === date && apt.time === time;
}
