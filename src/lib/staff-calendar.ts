/**
 * Staff workshop calendar rules.
 * Arrival uses workshop-schedule (Europe/Warsaw, DST).
 * A mechanic can be busy while another mechanic takes the same clock time.
 * Unassigned visits share one implicit resource and do not block a named mechanic.
 */

import type { Appointment, AppointmentStatus } from "@/lib/store";
import { planArrivalReminder } from "@/lib/arrival-reminder";
import { evaluateArrivalTime, type ArrivalError } from "@/lib/arrival-window";
import {
  clockToMinutes,
  minutesToClock,
  openingWindowForDateKey,
  resolveBookingDurationMinutes,
  warsawCivilToUtc,
  warsawParts,
  type WorkshopHours,
} from "@/lib/workshop-schedule";

export type StaffCalendarRole = "owner" | "admin" | "mechanic";

export type StaffAction = "view_all" | "create" | "update" | "cancel" | "reschedule";

export type BusyChunk = {
  dateKey: string;
  startMs: number;
  endMs: number;
};

export type LunchWindow = {
  start: string;
  end: string;
};

const ACTIVE: ReadonlySet<AppointmentStatus> = new Set([
  "scheduled",
  "confirmed",
  "in_progress",
]);

export function addDateKeyDays(dateKey: string, days: number): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !Number.isInteger(days)) return null;
  const [year, month, day] = dateKey.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  if (Number.isNaN(utc.getTime())) return null;
  return utc.toISOString().slice(0, 10);
}

export function clampStaffDuration(value: number | undefined, serviceIds?: string[]): number {
  const fromServices = resolveBookingDurationMinutes({ serviceIds, durationMinutes: undefined });
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return fromServices;
  const requested = Math.min(7 * 9 * 60, Math.round(value));
  return Math.max(fromServices, requested);
}

export function canStaff(
  role: StaffCalendarRole,
  action: StaffAction,
  options?: { mechanicCanEdit?: boolean }
): boolean {
  if (role === "owner") return true;
  if (role === "admin") return true;
  return Boolean(options?.mechanicCanEdit) && action !== "view_all";
}

function lunchBounds(lunch: LunchWindow): { start: number; end: number } | null {
  const start = clockToMinutes(lunch.start);
  const end = clockToMinutes(lunch.end);
  if (start == null || end == null || end <= start) return null;
  return { start, end };
}

function civilMs(dateKey: string, minutes: number): number | null {
  const instant = warsawCivilToUtc(dateKey, minutesToClock(minutes));
  return instant ? instant.getTime() : null;
}

function pushRange(
  chunks: BusyChunk[],
  dateKey: string,
  fromMin: number,
  toMin: number
): void {
  if (toMin <= fromMin) return;
  const startMs = civilMs(dateKey, fromMin);
  const endMs = civilMs(dateKey, toMin);
  if (startMs == null || endMs == null || endMs <= startMs) return;
  chunks.push({ dateKey, startMs, endMs });
}

function openSegments(dateKey: string, hours: WorkshopHours, lunch: LunchWindow): Array<[number, number]> {
  const window = openingWindowForDateKey(dateKey, hours);
  if (!window) return [];
  const lunchSpan = lunchBounds(lunch);
  if (!lunchSpan) return [[window.openMin, window.closeMin]];
  const segments: Array<[number, number]> = [];
  if (lunchSpan.start > window.openMin) {
    segments.push([window.openMin, Math.min(lunchSpan.start, window.closeMin)]);
  }
  if (lunchSpan.end < window.closeMin) {
    segments.push([Math.max(lunchSpan.end, window.openMin), window.closeMin]);
  }
  return segments.filter(([from, to]) => to > from);
}

export function occupationChunks(input: {
  date: string;
  time: string;
  durationMinutes: number;
  holdUntil?: string;
  hours: WorkshopHours;
  lunch: LunchWindow;
}): BusyChunk[] {
  const startMin = clockToMinutes(input.time);
  const startMs = warsawCivilToUtc(input.date, input.time)?.getTime();
  if (startMin == null || startMs == null) return [];

  const chunks: BusyChunk[] = [];
  let remaining = Math.max(0, Math.round(input.durationMinutes));
  let cursor = startMs;
  const limit = startMs + 21 * 24 * 60 * 60 * 1000;

  while (remaining > 0 && cursor < limit) {
    const parts = warsawParts(new Date(cursor));
    const segments = openSegments(parts.dateKey, input.hours, input.lunch);
    const segment = segments.find(([from, to]) => parts.minutes >= from && parts.minutes < to);
    if (!segment) {
      const next = nextOpenInstant(cursor, input.hours, input.lunch);
      if (next == null || next <= cursor) break;
      cursor = next;
      continue;
    }
    const take = Math.min(remaining, segment[1] - parts.minutes);
    pushRange(chunks, parts.dateKey, parts.minutes, parts.minutes + take);
    remaining -= take;
    const nextMs = civilMs(parts.dateKey, parts.minutes + take);
    if (nextMs == null || nextMs <= cursor) break;
    cursor = nextMs;
  }

  const holdUntil = input.holdUntil;
  if (holdUntil && /^\d{4}-\d{2}-\d{2}$/.test(holdUntil) && holdUntil >= input.date) {
    let day: string | null = input.date;
    let guard = 0;
    while (day && day <= holdUntil && guard < 22) {
      for (const [from, to] of openSegments(day, input.hours, input.lunch)) {
        const fromMin = day === input.date ? Math.max(from, startMin) : from;
        pushRange(chunks, day, fromMin, to);
      }
      day = addDateKeyDays(day, 1);
      guard += 1;
    }
  }

  return chunks;
}

function nextOpenInstant(cursor: number, hours: WorkshopHours, lunch: LunchWindow): number | null {
  const parts = warsawParts(new Date(cursor));
  for (let offset = 0; offset <= 21; offset++) {
    const dateKey = offset === 0 ? parts.dateKey : addDateKeyDays(parts.dateKey, offset);
    if (!dateKey) return null;
    const segments = openSegments(dateKey, hours, lunch);
    for (const [from, to] of segments) {
      if (offset === 0 && to <= parts.minutes) continue;
      const minutes = offset === 0 ? Math.max(from, parts.minutes) : from;
      if (minutes >= to) continue;
      const ms = civilMs(dateKey, minutes);
      if (ms != null && ms > cursor) return ms;
    }
  }
  return null;
}

type SlotShape = Pick<
  Appointment,
  | "id"
  | "date"
  | "time"
  | "mechanicId"
  | "durationMinutes"
  | "holdUntil"
  | "serviceIds"
  | "appointmentStatus"
  | "multiDay"
> & {
  workStart?: string;
  workMinutes?: number;
  leavesCar?: boolean;
  calendarHidden?: boolean;
};

function durationOf(apt: SlotShape): number {
  return clampStaffDuration(apt.durationMinutes, apt.serviceIds);
}

function workWindow(apt: SlotShape): { date: string; start: number; end: number } | null {
  if (!apt.workStart || !apt.workMinutes || apt.workMinutes <= 0) return null;
  const start = clockToMinutes(apt.workStart);
  if (start == null) return null;
  return { date: apt.date, start, end: start + apt.workMinutes };
}

/** A drop-off does not occupy the mechanic. Only an explicit work window does. */
export function findMechanicConflict(
  existing: SlotShape[],
  candidate: SlotShape,
  _hours: WorkshopHours,
  _lunch: LunchWindow
): string | null {
  if (!ACTIVE.has(candidate.appointmentStatus) || candidate.calendarHidden) return null;
  const left = workWindow(candidate);
  if (!left) return null;
  const mechanicId = candidate.mechanicId || "";
  for (const other of existing) {
    if (other.id === candidate.id || other.calendarHidden) continue;
    if (!ACTIVE.has(other.appointmentStatus)) continue;
    if ((other.mechanicId || "") !== mechanicId) continue;
    const right = workWindow(other);
    if (!right || right.date !== left.date) continue;
    if (left.start < right.end && right.start < left.end) return other.id;
  }
  return null;
}

export function evaluateStaffArrival(input: {
  date: string;
  time: string;
  durationMinutes: number;
  allowMultiDay?: boolean;
  hours: WorkshopHours;
  lunch: LunchWindow;
  now?: Date;
}): { ok: true } | { ok: false; error: ArrivalError } {
  void input.durationMinutes;
  void input.allowMultiDay;
  void input.hours;
  void input.lunch;
  return evaluateArrivalTime({ date: input.date, time: input.time, now: input.now });
}

export function slotSignature(apt: SlotShape): string {
  return [
    apt.date,
    apt.time,
    apt.mechanicId || "",
    apt.durationMinutes ?? "",
    apt.holdUntil ?? "",
    apt.multiDay ? "1" : "0",
  ].join("|");
}

export function invalidAppointmentChange(
  before: SlotShape[],
  after: SlotShape[],
  hours: WorkshopHours,
  lunch: LunchWindow,
  now = new Date()
): { id: string; error: string } | null {
  const previous = new Map(before.map((apt) => [apt.id, apt]));
  for (const apt of after) {
    if (!ACTIVE.has(apt.appointmentStatus)) continue;
    const prior = previous.get(apt.id);
    if (prior && slotSignature(prior) === slotSignature(apt) && ACTIVE.has(prior.appointmentStatus)) {
      continue;
    }
    const durationMinutes = durationOf(apt);
    const arrival = evaluateStaffArrival({
      date: apt.date,
      time: apt.time,
      durationMinutes,
      allowMultiDay: Boolean(apt.multiDay || apt.holdUntil),
      hours,
      lunch,
      now,
    });
    if (!arrival.ok) return { id: apt.id, error: arrival.error };
    const conflict = findMechanicConflict(after, { ...apt, durationMinutes }, hours, lunch);
    if (conflict) return { id: apt.id, error: "mechanic_conflict" };
  }
  return null;
}

export function planAdminReminder(
  apt: {
    id?: string;
    date: string;
    time: string;
    appointmentStatus: string;
    visitState?: string;
    repairStatus?: string;
    createdAt?: string;
    calendarHidden?: boolean;
  },
  now: Date
): { action: "skip"; reason: string } | { action: "send"; kind: "two_hour"; dueAt: string } {
  const plan = planArrivalReminder(
    {
      id: apt.id ?? "",
      date: apt.date,
      time: apt.time,
      appointmentStatus: apt.appointmentStatus,
      visitState: apt.visitState,
      repairStatus: apt.repairStatus,
      calendarHidden: apt.calendarHidden,
      createdAt: apt.createdAt,
    },
    now
  );
  if (plan.reason || !plan.dueAt) return { action: "skip", reason: plan.reason ?? "invalid_time" };
  return { action: "send", kind: "two_hour", dueAt: plan.dueAt };
}

export function weekdayWindowLabel(dateKey: string, hours: WorkshopHours): string | null {
  const window = openingWindowForDateKey(dateKey, hours);
  if (!window) return null;
  return `${minutesToClock(window.openMin)}–${minutesToClock(window.closeMin)}`;
}
