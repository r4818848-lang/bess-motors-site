/**
 * Staff workshop calendar rules.
 * Arrival uses workshop-schedule (Europe/Warsaw, DST).
 * A mechanic can be busy while another mechanic takes the same clock time.
 * Unassigned visits share one implicit resource and do not block a named mechanic.
 */

import type { AdminReminderState, Appointment, AppointmentStatus } from "@/lib/store";
import {
  clockToMinutes,
  evaluateBookingStart,
  minutesToClock,
  openingWindowForDateKey,
  resolveBookingDurationMinutes,
  warsawCivilToUtc,
  warsawParts,
  weekdayIndexFromDateKey,
  type ScheduleError,
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

function rangesOverlap(a: BusyChunk, b: BusyChunk): boolean {
  return a.startMs < b.endMs && b.startMs < a.endMs;
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
>;

function durationOf(apt: SlotShape): number {
  return clampStaffDuration(apt.durationMinutes, apt.serviceIds);
}

export function findMechanicConflict(
  existing: SlotShape[],
  candidate: SlotShape,
  hours: WorkshopHours,
  lunch: LunchWindow
): string | null {
  if (!ACTIVE.has(candidate.appointmentStatus)) return null;
  const mechanicId = candidate.mechanicId || "";
  const left = occupationChunks({
    date: candidate.date,
    time: candidate.time,
    durationMinutes: durationOf(candidate),
    holdUntil: candidate.holdUntil,
    hours,
    lunch,
  });
  if (!left.length) return null;

  for (const other of existing) {
    if (other.id === candidate.id) continue;
    if (!ACTIVE.has(other.appointmentStatus)) continue;
    if ((other.mechanicId || "") !== mechanicId) continue;
    const right = occupationChunks({
      date: other.date,
      time: other.time,
      durationMinutes: durationOf(other),
      holdUntil: other.holdUntil,
      hours,
      lunch,
    });
    if (left.some((chunk) => right.some((item) => rangesOverlap(chunk, item)))) {
      return other.id;
    }
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
}): { ok: true } | { ok: false; error: ScheduleError | "slot_blocked" } {
  const start = clockToMinutes(input.time);
  const weekday = weekdayIndexFromDateKey(input.date);
  const window = openingWindowForDateKey(input.date, input.hours);
  if (weekday == null) return { ok: false, error: "invalid_date" };
  if (start == null) return { ok: false, error: "invalid_time" };
  if (!window) return { ok: false, error: "closed_sunday" };
  const lunch = lunchBounds(input.lunch);
  if (lunch && start >= lunch.start && start < lunch.end) {
    return { ok: false, error: "slot_blocked" };
  }

  const strict = evaluateBookingStart({
    date: input.date,
    time: input.time,
    durationMinutes: input.durationMinutes,
    now: input.now,
    hours: input.hours,
  });
  if (strict.ok || !input.allowMultiDay) return strict.ok ? { ok: true } : strict;

  const probe = Math.max(1, Math.min(30, window.closeMin - start));
  const arrival = evaluateBookingStart({
    date: input.date,
    time: input.time,
    durationMinutes: probe,
    now: input.now,
    hours: input.hours,
  });
  return arrival.ok ? { ok: true } : arrival;
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
    date: string;
    time: string;
    appointmentStatus: string;
    createdAt?: string;
    adminReminder?: AdminReminderState;
  },
  now: Date
):
  | { action: "skip" }
  | { action: "cancel" }
  | { action: "send"; kind: "two_hour" | "soon"; dueAt: string } {
  const state = apt.adminReminder;
  if (apt.appointmentStatus === "cancelled" || apt.appointmentStatus === "completed") {
    if (state?.status === "sent" || state?.status === "cancelled") return { action: "skip" };
    return { action: "cancel" };
  }
  if (state?.status === "sent" || state?.status === "cancelled") return { action: "skip" };
  if ((state?.attempts ?? 0) >= 5) return { action: "skip" };
  if (state?.status === "sending" && state.sendingAt) {
    const age = now.getTime() - Date.parse(state.sendingAt);
    if (Number.isFinite(age) && age >= 0 && age < 2 * 60 * 1000) return { action: "skip" };
  }

  const arrival = warsawCivilToUtc(apt.date, apt.time);
  if (!arrival) return { action: "skip" };
  if (now.getTime() >= arrival.getTime()) return { action: "skip" };

  const due = new Date(arrival.getTime() - 2 * 60 * 60 * 1000);
  const createdMs = apt.createdAt ? Date.parse(apt.createdAt) : Number.NaN;
  const remaining = arrival.getTime() - now.getTime();
  const bookedInsideWindow = Number.isFinite(createdMs) && createdMs > due.getTime();
  const soon = bookedInsideWindow || remaining < 100 * 60 * 1000;
  if (!soon && now.getTime() < due.getTime()) return { action: "skip" };

  return {
    action: "send",
    kind: soon ? "soon" : "two_hour",
    dueAt: due.toISOString(),
  };
}

export function weekdayWindowLabel(dateKey: string, hours: WorkshopHours): string | null {
  const window = openingWindowForDateKey(dateKey, hours);
  if (!window) return null;
  return `${minutesToClock(window.openMin)}–${minutesToClock(window.closeMin)}`;
}
