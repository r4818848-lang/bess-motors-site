// In-process helper for unit tests only. Booking, move and cancel use PostgreSQL.
import {
  breakHolds,
  findHoldConflict,
  splitWorkBlocks,
  type Hold,
} from "@/lib/smart-scheduler/schedule";
import type { MechanicBreak } from "@/lib/smart-scheduler/settings";
import type { WorkshopHours } from "@/lib/workshop-schedule";

export type LedgerHold = Hold & {
  reservationId: string;
  idempotencyKey: string;
  appointmentId: string | null;
  workOrderId: string | null;
};

type LedgerState = { version: number; holds: LedgerHold[] };

let state: LedgerState = { version: 1, holds: [] };
let chain: Promise<void> = Promise.resolve();

export function resetSchedulerLedger(): void {
  state = { version: 1, holds: [] };
  chain = Promise.resolve();
}

export function schedulerLedgerSnapshot(): LedgerState {
  return { version: state.version, holds: state.holds.map((hold) => ({ ...hold, resourceIds: [...hold.resourceIds] })) };
}

function lock<T>(fn: () => T): Promise<T> {
  const run = chain.then(() => fn());
  chain = run.then(() => undefined, () => undefined);
  return run;
}

export type ReserveRequest = {
  idempotencyKey: string;
  date: string;
  start: string;
  minutes: number;
  mechanicId: string;
  resourceIds: string[];
  operationCode: string;
  appointmentId?: string | null;
  workOrderId?: string | null;
  crmHolds: Hold[];
  breaks: MechanicBreak[];
  hours: WorkshopHours;
  failBeforeCommit?: boolean;
};

export type ReserveResult = {
  status: 200 | 409;
  error?: string;
  id?: string;
  version: number;
  replayed?: boolean;
  persisted: false;
  createdClient: false;
  createdOrder: false;
  workOrderId: string | null;
};

function occupied(crmHolds: Hold[], breaks: MechanicBreak[], date: string, ignoreReservationId?: string): Hold[] {
  return [
    ...state.holds.filter((hold) => hold.active && hold.reservationId !== ignoreReservationId),
    ...crmHolds.filter((hold) => hold.active),
    ...breakHolds({ date, breaks }),
  ];
}

export function reserveOnLedger(input: ReserveRequest): Promise<ReserveResult> {
  return lock(() => {
    const replay = state.holds.find((hold) => hold.idempotencyKey === input.idempotencyKey);
    if (replay) {
      return { status: 200, id: replay.reservationId, version: state.version, replayed: true, persisted: false, createdClient: false, createdOrder: false, workOrderId: replay.workOrderId };
    }
    const split = splitWorkBlocks({
      id: input.idempotencyKey,
      date: input.date,
      start: input.start,
      minutes: input.minutes,
      hours: input.hours,
      mechanicId: input.mechanicId,
      resourceIds: input.resourceIds,
      operationCode: input.operationCode,
    });
    if (!split.ok) {
      return { status: 409, error: split.error, version: state.version, persisted: false, createdClient: false, createdOrder: false, workOrderId: null };
    }
    const busy = occupied(input.crmHolds, input.breaks, input.date);
    for (const block of split.blocks) {
      const conflict = findHoldConflict(busy, block) || findHoldConflict(split.blocks.filter((item) => item.id !== block.id), block);
      if (conflict) {
        return { status: 409, error: conflict.code, version: state.version, persisted: false, createdClient: false, createdOrder: false, workOrderId: null };
      }
    }
    if (input.failBeforeCommit) {
      return { status: 409, error: "rolled_back", version: state.version, persisted: false, createdClient: false, createdOrder: false, workOrderId: null };
    }
    const id = `res-${state.version + 1}`;
    const workOrderId = input.workOrderId ?? null;
    state = {
      version: state.version + 1,
      holds: [
        ...state.holds,
        ...split.blocks.map((block) => ({
          ...block,
          reservationId: id,
          idempotencyKey: input.idempotencyKey,
          appointmentId: input.appointmentId ?? null,
          workOrderId,
        })),
      ],
    };
    return { status: 200, id, version: state.version, persisted: false, createdClient: false, createdOrder: false, workOrderId };
  });
}

export function moveOnLedger(input: ReserveRequest & { reservationId: string }): Promise<ReserveResult> {
  return lock(() => {
    const current = state.holds.filter((hold) => hold.reservationId === input.reservationId && hold.active);
    if (current.length === 0) {
      return { status: 409, error: "missing", version: state.version, persisted: false, createdClient: false, createdOrder: false, workOrderId: null };
    }
    const split = splitWorkBlocks({
      id: input.reservationId,
      date: input.date,
      start: input.start,
      minutes: input.minutes,
      hours: input.hours,
      mechanicId: input.mechanicId,
      resourceIds: input.resourceIds,
      operationCode: input.operationCode,
    });
    if (!split.ok) {
      return { status: 409, error: split.error, version: state.version, persisted: false, createdClient: false, createdOrder: false, workOrderId: current[0].workOrderId };
    }
    const busy = occupied(input.crmHolds, input.breaks, input.date, input.reservationId);
    for (const block of split.blocks) {
      if (findHoldConflict(busy, block)) {
        return { status: 409, error: "conflict", version: state.version, persisted: false, createdClient: false, createdOrder: false, workOrderId: current[0].workOrderId };
      }
    }
    if (input.failBeforeCommit) {
      return { status: 409, error: "rolled_back", version: state.version, persisted: false, createdClient: false, createdOrder: false, workOrderId: current[0].workOrderId };
    }
    const next = state.holds.map((hold) => hold.reservationId === input.reservationId ? { ...hold, active: false } : hold);
    state = {
      version: state.version + 1,
      holds: [
        ...next,
        ...split.blocks.map((block) => ({
          ...block,
          reservationId: input.reservationId,
          idempotencyKey: input.idempotencyKey,
          appointmentId: current[0].appointmentId,
          workOrderId: current[0].workOrderId,
        })),
      ],
    };
    return { status: 200, id: input.reservationId, version: state.version, persisted: false, createdClient: false, createdOrder: false, workOrderId: current[0].workOrderId };
  });
}

export function cancelOnLedger(reservationId: string): Promise<ReserveResult> {
  return lock(() => {
    const current = state.holds.find((hold) => hold.reservationId === reservationId);
    if (!current) {
      return { status: 409, error: "missing", version: state.version, persisted: false, createdClient: false, createdOrder: false, workOrderId: null };
    }
    state = {
      version: state.version + 1,
      holds: state.holds.map((hold) => hold.reservationId === reservationId ? { ...hold, active: false } : hold),
    };
    return { status: 200, id: reservationId, version: state.version, persisted: false, createdClient: false, createdOrder: false, workOrderId: current.workOrderId };
  });
}

export function linkExistingWorkOrder(input: {
  appointmentId?: string | null;
  appointments: { id: string; workOrderId?: string | null; clientId?: string | null }[];
}): { workOrderId: string | null; createdClient: false; createdOrder: false } {
  const appointment = input.appointments.find((item) => item.id === input.appointmentId);
  return { workOrderId: appointment?.workOrderId ?? null, createdClient: false, createdOrder: false };
}
