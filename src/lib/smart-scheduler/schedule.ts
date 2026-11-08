import type { Operation } from "@/lib/smart-scheduler/catalog";
import { evaluateArrivalTime } from "@/lib/arrival-window";
import {
  clockToMinutes,
  minutesToClock,
  openingWindowForDateKey,
  warsawCivilToUtc,
  warsawParts,
  weekdayIndexFromDateKey,
  type WorkshopHours,
} from "@/lib/workshop-schedule";
import { addDateKeyDays } from "@/lib/staff-calendar";

export const VEHICLE_COEFFICIENTS = {
  city: 0.9,
  medium: 1,
  business: 1.15,
  premium: 1.25,
  suv: 1.1,
  large_suv: 1.3,
  lcv: 1.35,
} as const;

export type VehicleClass = keyof typeof VEHICLE_COEFFICIENTS;
export type NormSource = "BASE" | "VIN" | "MEDIAN";
export type PartsStatus = "unknown" | "checking" | "ordered" | "available" | "delayed";

export type Hold = {
  id: string;
  mechanicId: string;
  resourceIds: string[];
  startMs: number;
  endMs: number;
  operationCode: string;
  active: boolean;
};

export type WorkBlock = Hold & {
  date: string;
  start: string;
  end: string;
};

export type PlannedOperation = {
  operationCode: string;
  minutes: number | null;
  formulaMinutes: number | null;
  referenceMinutes: number | null;
  source: "reference" | "formula" | "unconfirmed";
  discrepancy: boolean;
  explanation: string;
  bookingMode: Operation["bookingMode"];
};

const DEFAULT_RESERVE_PCT = 15;

export function reserveMinutes(workingMinutes: number, reservePct = DEFAULT_RESERVE_PCT): number {
  if (!(workingMinutes > 0)) return 0;
  return Math.ceil((workingMinutes * (1 + reservePct / 100)) / 15) * 15;
}

export function formulaMinutes(input: {
  laborHours: number;
  normSource: NormSource;
  vehicleClass?: VehicleClass;
  reservePct?: number;
  overlapSavingsMinutes?: number;
  savingsApproved?: boolean;
}): number {
  const baseMinutes = input.laborHours * 60;
  const coefficient = input.normSource === "BASE" ? VEHICLE_COEFFICIENTS[input.vehicleClass ?? "medium"] : 1;
  const savings = input.savingsApproved ? Math.max(0, input.overlapSavingsMinutes ?? 0) : 0;
  return reserveMinutes(Math.max(0, baseMinutes * coefficient - savings), input.reservePct);
}

export function planOperationMinutes(
  operation: Operation,
  input: { normSource?: NormSource; vehicleClass?: VehicleClass; priority?: "reference" | "formula"; reservePct?: number } = {}
): PlannedOperation {
  const normSource = input.normSource ?? "BASE";
  const formula = operation.baseLaborHours == null
    ? null
    : formulaMinutes({ laborHours: operation.baseLaborHours, normSource, vehicleClass: input.vehicleClass, reservePct: input.reservePct });
  const reference = operation.referenceCalendarMinutes;
  const hasReference = reference != null;
  const priority = input.priority ?? (hasReference ? "reference" : "formula");
  if (operation.baseLaborHours == null && !hasReference) {
    return {
      operationCode: operation.operationCode,
      minutes: null,
      formulaMinutes: null,
      referenceMinutes: null,
      source: "unconfirmed",
      discrepancy: false,
      explanation: "Норма не подтверждена. Время задаёт владелец вручную.",
      bookingMode: "MANUAL",
    };
  }
  if (priority === "reference" && hasReference) {
    const discrepancy = formula != null && formula !== reference;
    return {
      operationCode: operation.operationCode,
      minutes: reference,
      formulaMinutes: formula,
      referenceMinutes: reference,
      source: "reference",
      discrepancy,
      explanation: discrepancy
        ? `В справочнике ${reference} мин. Формула с резервом 15% даёт ${formula} мин. Резерв повторно не добавляется.`
        : "Используется эталонное время справочника.",
      bookingMode: operation.baseLaborHours == null ? "MANUAL" : operation.bookingMode,
    };
  }
  return {
    operationCode: operation.operationCode,
    minutes: formula,
    formulaMinutes: formula,
    referenceMinutes: reference,
    source: formula == null ? "unconfirmed" : "formula",
    discrepancy: formula != null && reference != null && formula !== reference,
    explanation: formula == null ? "Норма не подтверждена." : "Время по формуле: базовые минуты, один коэффициент класса и резерв.",
    bookingMode: operation.bookingMode,
  };
}

export function rangesOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && startB < endA;
}

export function splitWorkBlocks(input: {
  id: string;
  date: string;
  start: string;
  minutes: number;
  hours: WorkshopHours;
  mechanicId: string;
  resourceIds: string[];
  operationCode: string;
}): { ok: true; blocks: WorkBlock[] } | { ok: false; error: "invalid_time" | "closed" | "nonexistent_time" | "outside_shift" } {
  const startMin = clockToMinutes(input.start);
  if (startMin == null || startMin % 5 !== 0 || input.minutes <= 0 || input.minutes % 15 !== 0) {
    return { ok: false, error: "invalid_time" };
  }
  if (!warsawCivilToUtc(input.date, input.start)) return { ok: false, error: "nonexistent_time" };
  const firstWindow = openingWindowForDateKey(input.date, input.hours);
  if (!firstWindow) return { ok: false, error: "closed" };
  if (startMin < firstWindow.openMin || startMin >= firstWindow.closeMin) return { ok: false, error: "outside_shift" };

  const blocks: WorkBlock[] = [];
  let remaining = input.minutes;
  let date = input.date;
  let cursor = startMin;
  for (let guard = 0; remaining > 0 && guard < 14; guard++) {
    const window = openingWindowForDateKey(date, input.hours);
    if (!window || cursor >= window.closeMin) {
      const next = addDateKeyDays(date, 1);
      if (!next) return { ok: false, error: "closed" };
      date = next;
      const nextWindow = openingWindowForDateKey(date, input.hours);
      cursor = nextWindow?.openMin ?? 0;
      continue;
    }
    if (cursor < window.openMin) cursor = window.openMin;
    const take = Math.min(remaining, window.closeMin - cursor);
    const end = cursor + take;
    const startClock = minutesToClock(cursor);
    const endClock = minutesToClock(end);
    const startAt = warsawCivilToUtc(date, startClock);
    const endAt = warsawCivilToUtc(date, endClock);
    if (!startAt || !endAt) return { ok: false, error: "nonexistent_time" };
    blocks.push({
      id: `${input.id}:${blocks.length}`,
      mechanicId: input.mechanicId,
      resourceIds: input.resourceIds,
      startMs: startAt.getTime(),
      endMs: endAt.getTime(),
      operationCode: input.operationCode,
      active: true,
      date,
      start: startClock,
      end: endClock,
    });
    remaining -= take;
    const next = addDateKeyDays(date, 1);
    if (!next) return { ok: false, error: "closed" };
    date = next;
    cursor = openingWindowForDateKey(date, input.hours)?.openMin ?? 0;
  }
  if (remaining > 0) return { ok: false, error: "closed" };
  return { ok: true, blocks };
}

export function findHoldConflict(existing: Hold[], candidate: Hold): { code: "mechanic" | "resource"; otherId: string; resourceId?: string } | null {
  if (!candidate.active) return null;
  for (const other of existing) {
    if (!other.active || other.id === candidate.id) continue;
    if (!rangesOverlap(candidate.startMs, candidate.endMs, other.startMs, other.endMs)) continue;
    if (candidate.mechanicId && other.mechanicId && candidate.mechanicId === other.mechanicId) {
      return { code: "mechanic", otherId: other.id };
    }
    const shared = candidate.resourceIds.find((resourceId) => other.resourceIds.includes(resourceId));
    if (shared) return { code: "resource", otherId: other.id, resourceId: shared };
  }
  return null;
}

export function applyAdjustmentsOnce(adjustments: { id: string; coefficient?: number }[]): { coefficient: number; applied: string[] } {
  const applied: string[] = [];
  let coefficient = 1;
  for (const adjustment of adjustments) {
    if (applied.includes(adjustment.id)) continue;
    applied.push(adjustment.id);
    if (typeof adjustment.coefficient === "number" && adjustment.coefficient > 0) coefficient *= adjustment.coefficient;
  }
  return { coefficient, applied };
}

export type OverlapRule = {
  ruleId: string;
  primaryOperations: string[];
  secondaryOperations: string[];
  minSecondary: number;
  resultOperation: string | null;
  sharedDisassemblyMinutes: number | null;
  approved: boolean;
  active: boolean;
};

export type OverlapAdvice = {
  ruleId: string;
  resultOperation: string | null;
  minutes: number | null;
  savingsMinutes: number;
  replacesSum: number | null;
  explanation: string;
};

export function explainOverlap(codes: string[], catalog: Operation[], rules: OverlapRule[] = []): OverlapAdvice[] {
  const advice: OverlapAdvice[] = [];
  const selected = new Set(codes);
  for (const rule of rules) {
    if (!rule.active) continue;
    const primary = rule.primaryOperations.every((code) => selected.has(code));
    const secondary = rule.secondaryOperations.filter((code) => selected.has(code)).length;
    if (!primary || secondary < rule.minSecondary) continue;
    const sum = codes.reduce((total, code) => total + (catalog.find((operation) => operation.operationCode === code)?.referenceCalendarMinutes ?? 0), 0);
    const savings = rule.approved ? Math.max(0, rule.sharedDisassemblyMinutes ?? 0) : 0;
    advice.push({
      ruleId: rule.ruleId,
      resultOperation: rule.resultOperation,
      minutes: rule.approved ? rule.sharedDisassemblyMinutes : null,
      savingsMinutes: savings,
      replacesSum: sum,
      explanation: rule.approved
        ? "Утверждённое правило уменьшает время один раз."
        : "Правило есть в справочнике, но не подтверждено. Время не сокращается.",
    });
  }
  const grouped = catalog.filter((operation) => selected.has(operation.operationCode) && operation.overlapGroup);
  const groups = new Set(grouped.map((operation) => operation.overlapGroup));
  if (advice.length === 0 && groups.size === 1 && grouped.length > 1) {
    advice.push({
      ruleId: "group-hint",
      resultOperation: null,
      minutes: null,
      savingsMinutes: 0,
      replacesSum: null,
      explanation: "Совпадение группы только подсказывает искать правило. Скидка по времени не применяется.",
    });
  }
  return advice;
}

export function roundDurationUp(minutes: number): number {
  if (!(minutes > 0)) return 0;
  return Math.ceil(minutes / 15) * 15;
}

export function resolveDuration(planned: number, override?: { minutes: number; reason: string }): { ok: true; minutes: number } | { ok: false; error: "reason_required" } {
  if (!override || override.minutes === planned) return { ok: true, minutes: planned };
  if (!override.reason.trim()) return { ok: false, error: "reason_required" };
  return { ok: true, minutes: roundDurationUp(override.minutes) };
}

export function applyRunflatOnce(baseMinutes: number, enabled: boolean, coefficient: number): number {
  if (!enabled) return baseMinutes;
  const factor = coefficient > 0 ? coefficient : 1;
  return baseMinutes * factor;
}

export function holdsFromLegacy(input: {
  id: string;
  date: string;
  mechanicId?: string;
  workStart?: string;
  workMinutes?: number;
  leavesCar?: boolean;
  pickupDate?: string;
  appointmentStatus?: string;
  visitState?: string;
  hours: WorkshopHours;
}): Hold[] {
  void input.leavesCar;
  void input.pickupDate;
  if (input.visitState === "no_show" || input.appointmentStatus === "cancelled" || input.appointmentStatus === "completed") return [];
  if (!input.workStart || !input.workMinutes || !input.mechanicId) return [];
  const split = splitWorkBlocks({
    id: input.id,
    date: input.date,
    start: input.workStart,
    minutes: input.workMinutes,
    hours: input.hours,
    mechanicId: input.mechanicId,
    resourceIds: [],
    operationCode: "legacy",
  });
  return split.ok ? split.blocks : [];
}

export type Reservation = {
  id: string;
  idempotencyKey: string;
  holds: Hold[];
};

export type SchedulerStore = {
  version: number;
  reservations: Reservation[];
};

export function commitReservation(
  store: SchedulerStore,
  input: { expectedVersion: number; idempotencyKey: string; holds: Hold[] }
): { store: SchedulerStore; status: 200 | 409; error?: "version_conflict" | "conflict"; replayed?: boolean } {
  const existing = store.reservations.find((reservation) => reservation.idempotencyKey === input.idempotencyKey);
  if (existing) return { store, status: 200, replayed: true };
  if (store.version !== input.expectedVersion) return { store, status: 409, error: "version_conflict" };
  const holds = store.reservations.flatMap((reservation) => reservation.holds);
  for (const hold of input.holds) {
    if (findHoldConflict(holds, hold) || findHoldConflict(input.holds.filter((item) => item.id !== hold.id), hold)) {
      return { store, status: 409, error: "conflict" };
    }
  }
  return {
    status: 200,
    store: {
      version: store.version + 1,
      reservations: [...store.reservations, { id: `res-${store.version + 1}`, idempotencyKey: input.idempotencyKey, holds: input.holds }],
    },
  };
}

export function commitTransaction(
  store: SchedulerStore,
  steps: { idempotencyKey: string; holds: Hold[]; fail?: boolean }[]
): { store: SchedulerStore; status: 200 | 409; error?: "rolled_back" | "version_conflict" | "conflict" } {
  let draft = store;
  for (const step of steps) {
    if (step.fail) return { store, status: 409, error: "rolled_back" };
    const result = commitReservation(draft, { expectedVersion: draft.version, idempotencyKey: step.idempotencyKey, holds: step.holds });
    if (result.status !== 200 || !result.store) return { store, status: 409, error: result.error ?? "conflict" };
    draft = result.store;
  }
  return { store: draft, status: 200 };
}

export function evaluatePlannerArrival(input: { date: string; time: string; manual?: boolean; now?: Date }): { ok: true } | { ok: false; error: string } {
  if (!input.manual) return evaluateArrivalTime(input);
  const weekday = weekdayIndexFromDateKey(input.date);
  if (weekday == null) return { ok: false, error: "invalid_date" };
  if (weekday === 0) return { ok: false, error: "closed_sunday" };
  const start = clockToMinutes(input.time);
  if (start == null || start % 5 !== 0) return { ok: false, error: "invalid_time" };
  if (start < 9 * 60) return { ok: false, error: "before_open" };
  if (start > 13 * 60 + 30) return { ok: false, error: "after_close" };
  const today = warsawParts(input.now ?? new Date());
  if (input.date < today.dateKey || (input.date === today.dateKey && start < today.minutes)) {
    return { ok: false, error: "slot_in_past" };
  }
  return { ok: true };
}

export type ResourceDef = { id: string; kind: string; confirmed: boolean };

export function sharedResourceKinds(required: string[]): string[] {
  return required.filter((kind) => kind !== "mechanic");
}

export function assignResources(input: {
  required: string[];
  confirmed: ResourceDef[];
  holds: Hold[];
  startMs: number;
  endMs: number;
}): { ok: true; resourceIds: string[] } | { ok: false; error: "unconfirmed" | "busy"; kind?: string } {
  const ids: string[] = [];
  for (const kind of sharedResourceKinds(input.required)) {
    const pool = input.confirmed.filter((resource) => resource.kind === kind && resource.confirmed);
    if (pool.length === 0) return { ok: false, error: "unconfirmed", kind };
    const free = pool.find((resource) => !input.holds.some((hold) => hold.active && hold.resourceIds.includes(resource.id) && rangesOverlap(input.startMs, input.endMs, hold.startMs, hold.endMs)));
    if (!free) return { ok: false, error: "busy", kind };
    ids.push(free.id);
  }
  return { ok: true, resourceIds: ids };
}

export function effectiveMode(operation: Operation, parts: PartsStatus | undefined, resourcesConfirmed: boolean): Operation["bookingMode"] {
  if (operation.bookingMode === "MANUAL" || operation.baseLaborHours == null) return "MANUAL";
  if (!resourcesConfirmed || parts !== "available") return operation.bookingMode === "AUTO" ? "APPROVAL" : operation.bookingMode;
  return operation.bookingMode;
}

export function breakHolds(input: {
  date: string;
  breaks: { mechanicId: string; start: string; end: string }[];
}): Hold[] {
  const holds: Hold[] = [];
  for (const item of input.breaks) {
    const start = clockToMinutes(item.start);
    const end = clockToMinutes(item.end);
    if (start == null || end == null || end <= start) continue;
    const startAt = warsawCivilToUtc(input.date, item.start);
    const endAt = warsawCivilToUtc(input.date, item.end);
    if (!startAt || !endAt) continue;
    holds.push({
      id: `break:${item.mechanicId}:${item.start}`,
      mechanicId: item.mechanicId,
      resourceIds: [],
      startMs: startAt.getTime(),
      endMs: endAt.getTime(),
      operationCode: "break",
      active: true,
    });
  }
  return holds;
}

export function suggestSlots(input: {
  date: string;
  start: string;
  minutes: number;
  mechanicId: string;
  mechanicIds: string[];
  resourceIds: string[];
  hours: WorkshopHours;
  occupied: Hold[];
}): { mechanicId: string; start: string }[] {
  const window = openingWindowForDateKey(input.date, input.hours);
  const startMin = clockToMinutes(input.start);
  if (!window || startMin == null) return [];
  const ideas: { mechanicId: string; start: string }[] = [];
  const candidates = [...input.mechanicIds.filter((id) => id !== input.mechanicId), input.mechanicId];
  for (const mechanicId of candidates) {
    for (let cursor = mechanicId === input.mechanicId ? startMin + 5 : startMin; cursor + input.minutes <= window.closeMin && ideas.length < 4; cursor += 5) {
      const blocks = splitWorkBlocks({
        id: "idea",
        date: input.date,
        start: minutesToClock(cursor),
        minutes: input.minutes,
        hours: input.hours,
        mechanicId,
        resourceIds: input.resourceIds,
        operationCode: "idea",
      });
      if (!blocks.ok) continue;
      if (blocks.blocks.some((block) => findHoldConflict(input.occupied, block))) continue;
      ideas.push({ mechanicId, start: minutesToClock(cursor) });
      if (mechanicId !== input.mechanicId) break;
    }
  }
  return ideas;
}
