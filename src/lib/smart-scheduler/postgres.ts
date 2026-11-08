import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";
import type { Operation } from "@/lib/smart-scheduler/catalog";
import { canAutoBook } from "@/lib/smart-scheduler/policy";
import { splitWorkBlocks, type PartsStatus } from "@/lib/smart-scheduler/schedule";
import type { ResourceSetting, ResourceStatus } from "@/lib/smart-scheduler/settings";
import type { WorkshopHours } from "@/lib/workshop-schedule";

export type BookResult = {
  status: 200 | 409;
  error?: string;
  id?: string;
  replayed?: boolean;
  persisted: boolean;
  crmWritten: false;
  createdClient: false;
  createdOrder: false;
  workOrderId: string | null;
};

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

function empty(result: { error: string }): BookResult {
  return { status: 409, error: result.error, persisted: false, crmWritten: false, createdClient: false, createdOrder: false, workOrderId: null };
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
}): Promise<BookResult> {
  await client.query("begin");
  try {
    const replay = await client.query<{ id: string; work_order_id: string | null }>("select id, work_order_id from scheduler_reservations where idempotency_key = $1", [input.idempotencyKey]);
    if (replay.rowCount) {
      await client.query("commit");
      return { status: 200, id: replay.rows[0].id, replayed: true, persisted: true, crmWritten: false, createdClient: false, createdOrder: false, workOrderId: replay.rows[0].work_order_id };
    }
    const resources = await client.query<ResourceSetting>("select id, kind, label, status, confirmed from scheduler_resources where id = any($1::text[])", [input.resourceIds]);
    const known = new Map(resources.rows.map((row) => [row.id, row]));
    if (input.resourceIds.some((id) => !known.has(id))) {
      await client.query("rollback");
      return empty({ error: "equipment" });
    }
    const permission = canAutoBook({ operation: input.operation, parts: input.parts, resources: resources.rows, resourceIds: input.resourceIds });
    if (!permission.auto && permission.reason !== "approval") {
      await client.query("rollback");
      return empty({ error: permission.reason });
    }
    const split = splitWorkBlocks({
      id: input.idempotencyKey,
      date: input.date,
      start: input.start,
      minutes: input.minutes,
      hours: input.hours,
      mechanicId: input.mechanicId,
      resourceIds: input.resourceIds,
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
    const id = `res-${input.idempotencyKey}`;
    await client.query(
      "insert into scheduler_reservations (id, idempotency_key, appointment_id, work_order_id, operation_code, mechanic_id, parts_status) values ($1,$2,$3,$4,$5,$6,$7)",
      [id, input.idempotencyKey, input.appointmentId ?? null, input.workOrderId ?? null, input.operation.operationCode, input.mechanicId, input.parts]
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
    await client.query("commit");
    return { status: 200, id, persisted: true, crmWritten: false, createdClient: false, createdOrder: false, workOrderId: input.workOrderId ?? null };
  } catch (error) {
    await client.query("rollback");
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    const constraint = typeof error === "object" && error && "constraint" in error ? String(error.constraint) : "";
    if (constraint === "scheduler_reservations_idempotency_key_key") {
      const replay = await client.query<{ id: string; work_order_id: string | null }>("select id, work_order_id from scheduler_reservations where idempotency_key = $1", [input.idempotencyKey]);
      if (replay.rowCount) {
        return { status: 200, id: replay.rows[0].id, replayed: true, persisted: true, crmWritten: false, createdClient: false, createdOrder: false, workOrderId: replay.rows[0].work_order_id };
      }
    }
    if (code === "23P01" || code === "23505" || code === "23503") return empty({ error: code === "23503" ? "equipment" : "conflict" });
    throw error;
  }
}

export async function moveInDatabase(client: Client, input: {
  reservationId: string;
  date: string;
  start: string;
  minutes: number;
  mechanicId: string;
  resourceIds: string[];
  operation: Operation;
  parts: PartsStatus;
  hours: WorkshopHours;
}): Promise<BookResult> {
  await client.query("begin");
  try {
    const current = await client.query<{ work_order_id: string | null; operation_code: string }>("select work_order_id, operation_code from scheduler_reservations where id = $1 and active", [input.reservationId]);
    if (!current.rowCount) {
      await client.query("rollback");
      return empty({ error: "missing" });
    }
    const resources = await client.query<ResourceSetting>("select id, kind, label, status, confirmed from scheduler_resources where id = any($1::text[])", [input.resourceIds]);
    if (input.resourceIds.some((id) => !resources.rows.some((row) => row.id === id))) {
      await client.query("rollback");
      return empty({ error: "equipment" });
    }
    const permission = canAutoBook({ operation: input.operation, parts: input.parts, resources: resources.rows, resourceIds: input.resourceIds });
    if (!permission.auto && permission.reason !== "approval") {
      await client.query("rollback");
      return empty({ error: permission.reason });
    }
    const split = splitWorkBlocks({
      id: `${input.reservationId}-${crypto.randomUUID()}`,
      date: input.date,
      start: input.start,
      minutes: input.minutes,
      hours: input.hours,
      mechanicId: input.mechanicId,
      resourceIds: input.resourceIds,
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
    await client.query("update scheduler_reservations set mechanic_id = $2, operation_code = $3, parts_status = $4 where id = $1", [input.reservationId, input.mechanicId, input.operation.operationCode, input.parts]);
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
    await client.query("commit");
    return { status: 200, id: input.reservationId, persisted: true, crmWritten: false, createdClient: false, createdOrder: false, workOrderId: current.rows[0].work_order_id };
  } catch (error) {
    await client.query("rollback");
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code === "23P01" || code === "23505" || code === "23503") return empty({ error: code === "23503" ? "equipment" : "conflict" });
    throw error;
  }
}

export async function cancelInDatabase(client: Client, reservationId: string): Promise<BookResult> {
  await client.query("begin");
  try {
    const current = await client.query<{ work_order_id: string | null }>("select work_order_id from scheduler_reservations where id = $1", [reservationId]);
    if (!current.rowCount) {
      await client.query("rollback");
      return empty({ error: "missing" });
    }
    await client.query("update scheduler_resource_holds set active = false where hold_id in (select id from scheduler_holds where reservation_id = $1)", [reservationId]);
    await client.query("update scheduler_holds set active = false where reservation_id = $1", [reservationId]);
    await client.query("update scheduler_reservations set active = false where id = $1", [reservationId]);
    await client.query("commit");
    return { status: 200, id: reservationId, persisted: true, crmWritten: false, createdClient: false, createdOrder: false, workOrderId: current.rows[0].work_order_id };
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
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
