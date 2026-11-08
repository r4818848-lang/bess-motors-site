import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";
import type { Operation } from "@/lib/smart-scheduler/catalog";
import { bookingFingerprint, mayChangeExistingReservation, selectRequiredResources, type BookingActor } from "@/lib/smart-scheduler/booking-rules";
import { schedulerCrmWritesEnabled } from "@/lib/smart-scheduler/flag";
import type { CrmOccupancyBlock } from "@/lib/smart-scheduler/occupancy";
import { canAutoBook } from "@/lib/smart-scheduler/policy";
import { splitWorkBlocks, type PartsStatus } from "@/lib/smart-scheduler/schedule";
import type { ResourceSetting, ResourceStatus } from "@/lib/smart-scheduler/settings";
import type { WorkshopHours } from "@/lib/workshop-schedule";

export type BookResult = {
  status: 200 | 403 | 409;
  error?: string;
  id?: string;
  replayed?: boolean;
  persisted: boolean;
  crmWritten: false;
  createdClient: false;
  createdOrder: false;
  workOrderId: string | null;
  version?: number;
};

const ownerActor: BookingActor = { role: "owner", canEdit: true, id: "owner" };

export function schedulerDatabaseUrl(): string | null {
  const url = process.env.SCHEDULER_DATABASE_URL?.trim() ?? "";
  if (!url) return null;
  if (process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview") return null;
  if (/supabase\.co/i.test(url)) return null;
  const supabase = process.env.SUPABASE_URL;
  if (supabase) {
    try {
      if (url.includes(new URL(supabase).host)) return null;
    } catch {
      return null;
    }
  }
  const local = /localhost|127\.0\.0\.1|\/var\/run\/postgresql|bess_scheduler_test/.test(url);
  return local ? url : null;
}

export async function connectSchedulerDatabase(): Promise<Client> {
  const url = schedulerDatabaseUrl();
  if (!url) throw new Error("database_required");
  const client = new Client({ connectionString: url });
  await client.connect();
  const current = await client.query<{ name: string }>("select current_database() as name");
  if (current.rows[0]?.name !== "bess_scheduler_test") {
    await client.end();
    throw new Error("refusing database");
  }
  return client;
}

export async function applySchedulerSchema(client: Client): Promise<void> {
  const current = await client.query<{ name: string }>("select current_database() as name");
  if (current.rows[0]?.name !== "bess_scheduler_test") throw new Error("refusing database");
  const sql = readFileSync(join(process.cwd(), "supabase/drafts/smart-scheduler.sql"), "utf8");
  await client.query(sql);
}

function empty(result: { error: string; status?: 403 | 409 }): BookResult {
  return { status: result.status ?? 409, error: result.error, persisted: false, crmWritten: false, createdClient: false, createdOrder: false, workOrderId: null };
}

async function lockWorkshop(client: Client, actor: BookingActor): Promise<void> {
  await client.query("select public.scheduler_lock_workshop()");
  await client.query("select set_config('app.actor_role', $1, true)", [actor.role]);
  await client.query("select set_config('app.actor_mechanic', $1, true)", [actor.mechanicId ?? ""]);
}

async function replaceCrmOccupancy(client: Client, blocks: CrmOccupancyBlock[]): Promise<void> {
  await client.query("delete from scheduler_crm_occupancy");
  for (const block of blocks) {
    await client.query(
      "insert into scheduler_crm_occupancy (id, appointment_id, mechanic_id, resource_id, start_at, end_at) values ($1,$2,$3,$4,to_timestamp($5/1000.0),to_timestamp($6/1000.0))",
      [block.id, block.appointmentId, block.mechanicId, block.resourceId, block.startMs, block.endMs]
    );
  }
}

function dbError(error: unknown): { code: string; constraint: string; message: string } {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  const constraint = typeof error === "object" && error && "constraint" in error ? String(error.constraint) : "";
  const message = error instanceof Error ? error.message : "";
  return { code, constraint, message };
}

async function blockedBySchedule(client: Client, mechanicId: string, date: string, start: string, end: string): Promise<string | null> {
  const off = await client.query("select 1 from scheduler_time_off where mechanic_id = $1 and starts_on <= $2::date and ends_on >= $2::date", [mechanicId, date]);
  if (off.rowCount) return "absent";
  const shift = await client.query<{ shift_start: string | null; shift_end: string | null }>(
    "select to_char(shift_start, 'HH24:MI') as shift_start, to_char(shift_end, 'HH24:MI') as shift_end from scheduler_shifts where mechanic_id = $1",
    [mechanicId]
  );
  const row = shift.rows[0];
  if (row?.shift_start && start < row.shift_start) return "before_shift";
  if (row?.shift_end && end > row.shift_end) return "after_shift";
  const pause = await client.query(
    "select 1 from scheduler_breaks where mechanic_id = $1 and starts_at < $3::time and ends_at > $2::time",
    [mechanicId, start, end]
  );
  if (pause.rowCount) return "break";
  return null;
}

async function loadResources(client: Client): Promise<ResourceSetting[]> {
  const result = await client.query<ResourceSetting>("select id, kind, label, status, confirmed from scheduler_resources");
  return result.rows;
}

async function consumeApproval(client: Client, input: { operationCode: string; mechanicId: string; date: string; start: string; minutes: number }, reservationId: string): Promise<{ by: string; at: string; minutes: number } | null> {
  const found = await client.query<{ id: string; confirmed_by: string; confirmed_at: string; minutes: number }>(
    `select id, confirmed_by, confirmed_at::text, minutes from scheduler_approvals
     where operation_code = $1 and mechanic_id = $2 and work_date = $3::date and start_clock = $4 and minutes = $5 and consumed_by is null
     order by confirmed_at for update limit 1`,
    [input.operationCode, input.mechanicId, input.date, input.start, input.minutes]
  );
  const row = found.rows[0];
  if (!row) return null;
  await client.query("update scheduler_approvals set consumed_by = $2 where id = $1", [row.id, reservationId]);
  return { by: row.confirmed_by, at: row.confirmed_at, minutes: row.minutes };
}

export async function bookInDatabase(client: Client, input: {
  idempotencyKey: string;
  date: string;
  start: string;
  minutes: number;
  mechanicId: string;
  resourceIds: string[];
  operation: Operation;
  parts: PartsStatus;
  hours: WorkshopHours;
  appointmentId?: string | null;
  workOrderId?: string | null;
  actor?: BookingActor;
  crmSnapshot?: CrmOccupancyBlock[];
}): Promise<BookResult> {
  const actor = input.actor ?? ownerActor;
  const fingerprint = bookingFingerprint({
    operationCode: input.operation.operationCode,
    mechanicId: input.mechanicId,
    date: input.date,
    start: input.start,
    minutes: input.minutes,
    resourceIds: input.resourceIds,
    parts: input.parts,
  });
  await client.query("begin");
  try {
    await lockWorkshop(client, actor);
    if (input.crmSnapshot) await replaceCrmOccupancy(client, input.crmSnapshot);
    const replay = await client.query<{ id: string; work_order_id: string | null; request_fingerprint: string; version: number }>(
      "select id, work_order_id, request_fingerprint, version from scheduler_reservations where idempotency_key = $1 for update",
      [input.idempotencyKey]
    );
    if (replay.rowCount) {
      if (replay.rows[0].request_fingerprint !== fingerprint) {
        await client.query("rollback");
        return empty({ error: "idempotency_mismatch" });
      }
      await client.query("commit");
      return { status: 200, id: replay.rows[0].id, replayed: true, persisted: true, crmWritten: false, createdClient: false, createdOrder: false, workOrderId: replay.rows[0].work_order_id, version: replay.rows[0].version };
    }
    if (!mayChangeExistingReservation(actor, actor.mechanicId ?? input.mechanicId, input.mechanicId)) {
      await client.query("rollback");
      return empty({ status: 403, error: "forbidden" });
    }
    const resources = await loadResources(client);
    const selected = selectRequiredResources(input.operation, input.resourceIds, resources);
    if (!selected.ok) {
      await client.query("rollback");
      return empty({ error: selected.error });
    }
    const permission = canAutoBook({ operation: input.operation, parts: input.parts, resources, resourceIds: selected.resourceIds });
    if (input.operation.bookingMode === "MANUAL" || permission.reason === "manual") {
      await client.query("rollback");
      return empty({ error: "manual" });
    }
    if (!permission.auto && permission.reason !== "approval") {
      await client.query("rollback");
      return empty({ error: permission.reason });
    }
    const id = `res-${input.idempotencyKey}`;
    const approval = input.operation.bookingMode === "APPROVAL"
      ? await consumeApproval(client, { operationCode: input.operation.operationCode, mechanicId: input.mechanicId, date: input.date, start: input.start, minutes: input.minutes }, id)
      : null;
    if (input.operation.bookingMode === "APPROVAL" && !approval) {
      await client.query("rollback");
      return empty({ error: "approval_required" });
    }
    const split = splitWorkBlocks({
      id: input.idempotencyKey,
      date: input.date,
      start: input.start,
      minutes: input.minutes,
      hours: input.hours,
      mechanicId: input.mechanicId,
      resourceIds: selected.resourceIds,
      operationCode: input.operation.operationCode,
    });
    if (!split.ok) {
      await client.query("rollback");
      return empty({ error: split.error });
    }
    for (const block of split.blocks) {
      const reason = await blockedBySchedule(client, input.mechanicId, block.date, block.start, block.end);
      if (reason) {
        await client.query("rollback");
        return empty({ error: reason });
      }
    }
    await client.query(
      `insert into scheduler_reservations
        (id, idempotency_key, request_fingerprint, appointment_id, work_order_id, operation_code, mechanic_id, parts_status, confirmed_by, confirmed_at, confirmed_minutes)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [id, input.idempotencyKey, fingerprint, input.appointmentId ?? null, input.workOrderId ?? null, input.operation.operationCode, input.mechanicId, input.parts, approval?.by ?? null, approval?.at ?? null, approval?.minutes ?? null]
    );
    for (const block of split.blocks) {
      await client.query(
        "insert into scheduler_holds (id, reservation_id, mechanic_id, operation_code, start_at, end_at) values ($1,$2,$3,$4,to_timestamp($5/1000.0),to_timestamp($6/1000.0))",
        [block.id, id, block.mechanicId, block.operationCode, block.startMs, block.endMs]
      );
      for (const resourceId of block.resourceIds) {
        await client.query(
          "insert into scheduler_resource_holds (hold_id, resource_id, start_at, end_at) values ($1,$2,to_timestamp($3/1000.0),to_timestamp($4/1000.0))",
          [block.id, resourceId, block.startMs, block.endMs]
        );
      }
    }
    if (schedulerCrmWritesEnabled()) throw new Error("crm_writes_are_disabled");
    await client.query("commit");
    return { status: 200, id, persisted: true, crmWritten: false, createdClient: false, createdOrder: false, workOrderId: input.workOrderId ?? null, version: 1 };
  } catch (error) {
    await client.query("rollback");
    const parsed = dbError(error);
    if (parsed.constraint === "scheduler_reservations_idempotency_key_key") {
      const replay = await client.query<{ id: string; request_fingerprint: string; work_order_id: string | null; version: number }>(
        "select id, request_fingerprint, work_order_id, version from scheduler_reservations where idempotency_key = $1",
        [input.idempotencyKey]
      );
      if (replay.rowCount && replay.rows[0].request_fingerprint === fingerprint) {
        return { status: 200, id: replay.rows[0].id, replayed: true, persisted: true, crmWritten: false, createdClient: false, createdOrder: false, workOrderId: replay.rows[0].work_order_id, version: replay.rows[0].version };
      }
      if (replay.rowCount) return empty({ error: "idempotency_mismatch" });
    }
    if (parsed.code === "42501") return empty({ status: 403, error: "forbidden" });
    if (parsed.message.includes("crm_overlap")) return empty({ error: "crm_conflict" });
    if (parsed.code === "23P01" || parsed.code === "23505" || parsed.code === "23503") return empty({ error: parsed.code === "23503" ? "equipment" : "conflict" });
    throw error;
  }
}

export async function moveInDatabase(client: Client, input: {
  reservationId: string;
  expectedVersion: number;
  date: string;
  start: string;
  minutes: number;
  mechanicId: string;
  resourceIds: string[];
  operation: Operation;
  parts: PartsStatus;
  hours: WorkshopHours;
  actor?: BookingActor;
  crmSnapshot?: CrmOccupancyBlock[];
}): Promise<BookResult> {
  const actor = input.actor ?? ownerActor;
  await client.query("begin");
  try {
    await lockWorkshop(client, actor);
    if (input.crmSnapshot) await replaceCrmOccupancy(client, input.crmSnapshot);
    const current = await client.query<{ work_order_id: string | null; mechanic_id: string; version: number }>(
      "select work_order_id, mechanic_id, version from scheduler_reservations where id = $1 and active for update",
      [input.reservationId]
    );
    if (!current.rowCount) {
      await client.query("rollback");
      return empty({ error: "missing" });
    }
    if (current.rows[0].version !== input.expectedVersion) {
      await client.query("rollback");
      return empty({ error: "version_conflict" });
    }
    if (!mayChangeExistingReservation(actor, current.rows[0].mechanic_id, input.mechanicId)) {
      await client.query("rollback");
      return empty({ status: 403, error: "forbidden" });
    }
    const resources = await loadResources(client);
    const selected = selectRequiredResources(input.operation, input.resourceIds, resources);
    if (!selected.ok) {
      await client.query("rollback");
      return empty({ error: selected.error });
    }
    const permission = canAutoBook({ operation: input.operation, parts: input.parts, resources, resourceIds: selected.resourceIds });
    if (input.operation.bookingMode === "MANUAL" || permission.reason === "manual") {
      await client.query("rollback");
      return empty({ error: "manual" });
    }
    if (!permission.auto && permission.reason !== "approval") {
      await client.query("rollback");
      return empty({ error: permission.reason });
    }
    const approval = input.operation.bookingMode === "APPROVAL"
      ? await consumeApproval(client, { operationCode: input.operation.operationCode, mechanicId: input.mechanicId, date: input.date, start: input.start, minutes: input.minutes }, input.reservationId)
      : null;
    if (input.operation.bookingMode === "APPROVAL" && !approval) {
      await client.query("rollback");
      return empty({ error: "approval_required" });
    }
    const split = splitWorkBlocks({
      id: `${input.reservationId}-${crypto.randomUUID()}`,
      date: input.date,
      start: input.start,
      minutes: input.minutes,
      hours: input.hours,
      mechanicId: input.mechanicId,
      resourceIds: selected.resourceIds,
      operationCode: input.operation.operationCode,
    });
    if (!split.ok) {
      await client.query("rollback");
      return empty({ error: split.error });
    }
    for (const block of split.blocks) {
      const reason = await blockedBySchedule(client, input.mechanicId, block.date, block.start, block.end);
      if (reason) {
        await client.query("rollback");
        return empty({ error: reason });
      }
    }
    await client.query("update scheduler_resource_holds set active = false where hold_id in (select id from scheduler_holds where reservation_id = $1)", [input.reservationId]);
    await client.query("update scheduler_holds set active = false where reservation_id = $1", [input.reservationId]);
    const updated = await client.query(
      `update scheduler_reservations
       set mechanic_id = $2, operation_code = $3, parts_status = $4, version = version + 1, confirmed_by = $5, confirmed_at = $6, confirmed_minutes = $7
       where id = $1 and version = $8`,
      [input.reservationId, input.mechanicId, input.operation.operationCode, input.parts, approval?.by ?? null, approval?.at ?? null, approval?.minutes ?? null, input.expectedVersion]
    );
    if (updated.rowCount !== 1) {
      await client.query("rollback");
      return empty({ error: "version_conflict" });
    }
    for (const block of split.blocks) {
      await client.query(
        "insert into scheduler_holds (id, reservation_id, mechanic_id, operation_code, start_at, end_at) values ($1,$2,$3,$4,to_timestamp($5/1000.0),to_timestamp($6/1000.0))",
        [block.id, input.reservationId, block.mechanicId, block.operationCode, block.startMs, block.endMs]
      );
      for (const resourceId of block.resourceIds) {
        await client.query(
          "insert into scheduler_resource_holds (hold_id, resource_id, start_at, end_at) values ($1,$2,to_timestamp($3/1000.0),to_timestamp($4/1000.0))",
          [block.id, resourceId, block.startMs, block.endMs]
        );
      }
    }
    if (schedulerCrmWritesEnabled()) throw new Error("crm_writes_are_disabled");
    await client.query("commit");
    return { status: 200, id: input.reservationId, persisted: true, crmWritten: false, createdClient: false, createdOrder: false, workOrderId: current.rows[0].work_order_id, version: input.expectedVersion + 1 };
  } catch (error) {
    await client.query("rollback");
    const parsed = dbError(error);
    if (parsed.code === "42501") return empty({ status: 403, error: "forbidden" });
    if (parsed.message.includes("crm_overlap")) return empty({ error: "crm_conflict" });
    if (parsed.code === "23P01" || parsed.code === "23505" || parsed.code === "23503") return empty({ error: parsed.code === "23503" ? "equipment" : "conflict" });
    throw error;
  }
}

export async function cancelInDatabase(client: Client, reservationId: string, expectedVersion: number, actor: BookingActor = ownerActor): Promise<BookResult> {
  await client.query("begin");
  try {
    await lockWorkshop(client, actor);
    const current = await client.query<{ work_order_id: string | null; mechanic_id: string; version: number }>(
      "select work_order_id, mechanic_id, version from scheduler_reservations where id = $1 and active for update",
      [reservationId]
    );
    if (!current.rowCount) {
      await client.query("rollback");
      return empty({ error: "missing" });
    }
    if (current.rows[0].version !== expectedVersion) {
      await client.query("rollback");
      return empty({ error: "version_conflict" });
    }
    if (!mayChangeExistingReservation(actor, current.rows[0].mechanic_id, current.rows[0].mechanic_id)) {
      await client.query("rollback");
      return empty({ status: 403, error: "forbidden" });
    }
    await client.query("update scheduler_resource_holds set active = false where hold_id in (select id from scheduler_holds where reservation_id = $1)", [reservationId]);
    await client.query("update scheduler_holds set active = false where reservation_id = $1", [reservationId]);
    const updated = await client.query("update scheduler_reservations set active = false, version = version + 1 where id = $1 and version = $2", [reservationId, expectedVersion]);
    if (updated.rowCount !== 1) {
      await client.query("rollback");
      return empty({ error: "version_conflict" });
    }
    if (schedulerCrmWritesEnabled()) throw new Error("crm_writes_are_disabled");
    await client.query("commit");
    return { status: 200, id: reservationId, persisted: true, crmWritten: false, createdClient: false, createdOrder: false, workOrderId: current.rows[0].work_order_id, version: expectedVersion + 1 };
  } catch (error) {
    await client.query("rollback");
    const parsed = dbError(error);
    if (parsed.code === "42501") return empty({ status: 403, error: "forbidden" });
    throw error;
  }
}

export async function recordApproval(client: Client, actor: BookingActor, input: {
  operationCode: string;
  mechanicId: string;
  date: string;
  start: string;
  minutes: number;
}): Promise<BookResult> {
  if (actor.role !== "owner" && actor.role !== "admin") return empty({ status: 403, error: "forbidden" });
  await client.query("begin");
  try {
    await lockWorkshop(client, actor);
    const id = `apr-${crypto.randomUUID()}`;
    await client.query(
      `insert into scheduler_approvals (id, operation_code, mechanic_id, work_date, start_clock, minutes, confirmed_by, confirmed_role)
       values ($1,$2,$3,$4::date,$5,$6,$7,$8)`,
      [id, input.operationCode, input.mechanicId, input.date, input.start, input.minutes, actor.id, actor.role]
    );
    await client.query("commit");
    return { status: 200, id, persisted: true, crmWritten: false, createdClient: false, createdOrder: false, workOrderId: null };
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

/**
 * The only booking entry. Holds and a future CRM appointment row share this transaction
 * and scheduler_lock_workshop(). The CRM statement stays absent while the switch is off.
 */
export async function commitUnifiedWorkshopWrite(client: Client, input: Parameters<typeof bookInDatabase>[1]): Promise<BookResult> {
  const booked = await bookInDatabase(client, input);
  return { ...booked, crmWritten: false };
}

export async function loadResourceSettings(client: Client): Promise<ResourceSetting[]> {
  const result = await client.query<ResourceSetting>("select id, kind, label, status, confirmed from scheduler_resources");
  const order = ["lift-1", "lift-2", "tyre-1", "balancer-1", "ac-1", "diag-1"];
  return order.flatMap((id) => result.rows.filter((row) => row.id === id));
}

export async function saveResourceSetting(client: Client, id: string, status: ResourceStatus, confirmed: boolean): Promise<void> {
  await client.query("update scheduler_resources set status = $2, confirmed = $3 where id = $1", [id, status, confirmed]);
}

export async function saveDisplayName(client: Client, mechanicId: string, displayName: string): Promise<void> {
  await client.query(
    "insert into scheduler_display_names (mechanic_id, display_name) values ($1, $2) on conflict (mechanic_id) do update set display_name = excluded.display_name",
    [mechanicId, displayName]
  );
}

export async function loadSchedulerSettings(client: Client): Promise<import("@/lib/smart-scheduler/settings").SchedulerSettings> {
  const { defaultSchedulerSettings } = await import("@/lib/smart-scheduler/settings");
  const resources = await loadResourceSettings(client);
  const names = await client.query<{ mechanic_id: string; display_name: string }>("select mechanic_id, display_name from scheduler_display_names");
  const shifts = await client.query<{ mechanic_id: string; shift_start: string | null; shift_end: string | null }>(
    "select mechanic_id, to_char(shift_start, 'HH24:MI') as shift_start, to_char(shift_end, 'HH24:MI') as shift_end from scheduler_shifts"
  );
  const pauses = await client.query<{ mechanic_id: string; starts_at: string; ends_at: string }>(
    "select mechanic_id, to_char(starts_at, 'HH24:MI') as starts_at, to_char(ends_at, 'HH24:MI') as ends_at from scheduler_breaks order by starts_at"
  );
  const off = await client.query<{ mechanic_id: string; starts_on: string; ends_on: string; kind: string }>(
    "select mechanic_id, to_char(starts_on, 'YYYY-MM-DD') as starts_on, to_char(ends_on, 'YYYY-MM-DD') as ends_on, kind from scheduler_time_off"
  );
  const ids = new Set<string>(["mech-1", "mech-2"]);
  for (const row of [...shifts.rows, ...pauses.rows, ...off.rows]) ids.add(row.mechanic_id);
  return {
    ...defaultSchedulerSettings,
    resources: resources.length > 0 ? resources : defaultSchedulerSettings.resources,
    displayNames: Object.fromEntries(names.rows.map((row) => [row.mechanic_id, row.display_name])),
    schedules: [...ids].map((mechanicId) => {
      const shift = shifts.rows.find((row) => row.mechanic_id === mechanicId);
      return {
        mechanicId,
        shiftStart: shift?.shift_start ?? null,
        shiftEnd: shift?.shift_end ?? null,
        breaks: pauses.rows.filter((row) => row.mechanic_id === mechanicId).map((row) => ({ start: row.starts_at, end: row.ends_at })),
        vacation: off.rows.filter((row) => row.mechanic_id === mechanicId && row.kind === "vacation").map((row) => ({ from: row.starts_on, to: row.ends_on })),
        absent: off.rows.filter((row) => row.mechanic_id === mechanicId && row.kind === "absent").flatMap((row) => [row.starts_on]),
      };
    }),
  };
}

export async function saveOwnerSettings(client: Client, settings: import("@/lib/smart-scheduler/settings").SchedulerSettings): Promise<void> {
  const known = new Set(["lift-1", "lift-2", "tyre-1", "balancer-1", "ac-1", "diag-1"]);
  const statuses = new Set(["available", "broken", "maintenance"]);
  await client.query("begin");
  try {
    for (const resource of settings.resources) {
      if (!known.has(resource.id) || !statuses.has(resource.status)) throw new Error("invalid_resource");
      await client.query("update scheduler_resources set status = $2, confirmed = $3 where id = $1", [resource.id, resource.status, resource.confirmed]);
    }
    await client.query("delete from scheduler_display_names");
    for (const [mechanicId, displayName] of Object.entries(settings.displayNames)) {
      const name = displayName.trim();
      if (!name) continue;
      if (name.length > 80) throw new Error("invalid_name");
      if (mechanicId !== "mech-1" && mechanicId !== "mech-2") throw new Error("invalid_mechanic");
      await saveDisplayName(client, mechanicId, name);
    }
    await client.query("delete from scheduler_shifts");
    await client.query("delete from scheduler_breaks");
    await client.query("delete from scheduler_time_off");
    for (const schedule of settings.schedules) {
      if (schedule.mechanicId !== "mech-1" && schedule.mechanicId !== "mech-2") throw new Error("invalid_mechanic");
      if (schedule.shiftStart || schedule.shiftEnd) {
        await client.query("insert into scheduler_shifts (mechanic_id, shift_start, shift_end) values ($1, $2::time, $3::time)", [
          schedule.mechanicId,
          schedule.shiftStart,
          schedule.shiftEnd,
        ]);
      }
      for (const pause of schedule.breaks) {
        await client.query("insert into scheduler_breaks (mechanic_id, starts_at, ends_at) values ($1, $2::time, $3::time)", [schedule.mechanicId, pause.start, pause.end]);
      }
      for (const vacation of schedule.vacation) {
        await client.query("insert into scheduler_time_off (id, mechanic_id, starts_on, ends_on, kind) values ($1,$2,$3::date,$4::date,'vacation')", [
          `${schedule.mechanicId}-vacation-${vacation.from}`,
          schedule.mechanicId,
          vacation.from,
          vacation.to,
        ]);
      }
      for (const day of schedule.absent) {
        await client.query("insert into scheduler_time_off (id, mechanic_id, starts_on, ends_on, kind) values ($1,$2,$3::date,$3::date,'absent')", [
          `${schedule.mechanicId}-absent-${day}`,
          schedule.mechanicId,
          day,
        ]);
      }
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}
