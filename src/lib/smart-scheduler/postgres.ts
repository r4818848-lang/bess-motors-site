import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";
import type { Operation } from "@/lib/smart-scheduler/catalog";
import { bookingFingerprint, mayChangeExistingReservation, selectRequiredResources, type BookingActor } from "@/lib/smart-scheduler/booking-rules";
import { schedulerCrmWritesEnabled } from "@/lib/smart-scheduler/flag";
import { canAutoBook } from "@/lib/smart-scheduler/policy";
import { splitWorkBlocks, type PartsStatus } from "@/lib/smart-scheduler/schedule";
import type { ResourceSetting, ResourceStatus } from "@/lib/smart-scheduler/settings";
import type { WorkshopHours } from "@/lib/workshop-schedule";

export type BookResult = {
  status: 200 | 403 | 409 | 503;
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

type SessionActor = { staffId: string; role: string; mechanicId?: string };

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

function empty(result: { error: string; status?: 403 | 409 | 503 }): BookResult {
  return { status: result.status ?? 409, error: result.error, persisted: false, crmWritten: false, createdClient: false, createdOrder: false, workOrderId: null };
}

function hoursReady(hours: WorkshopHours | undefined): boolean {
  return Boolean(hours?.opens && hours.closes && hours.saturdayOpens && hours.saturdayCloses);
}

function mapFailure(error: unknown): BookResult | null {
  const parsed = dbError(error);
  if (parsed.code === "42501" || parsed.message.includes("forbidden_reservation")) return empty({ status: 403, error: "forbidden" });
  if (parsed.message.includes("crm_unavailable")) return empty({ status: 503, error: "crm_unavailable" });
  if (parsed.message.includes("config_missing")) return empty({ status: 503, error: "config_missing" });
  if (parsed.message.includes("crm_stale")) return empty({ error: "crm_stale" });
  if (parsed.message.includes("crm_diverged")) return empty({ error: "crm_diverged" });
  if (parsed.message.includes("crm_overlap")) return empty({ error: "crm_conflict" });
  if (parsed.code === "23P01" || parsed.code === "23505" || parsed.code === "23503") return empty({ error: parsed.code === "23503" ? "equipment" : "conflict" });
  return null;
}

export async function openActorSession(client: Client, input: { role: "owner" | "admin" | "mechanic"; staffId: string; mechanicId?: string; canEdit: boolean }): Promise<BookingActor> {
  const result = await client.query<{ scheduler_open_session: string }>("select scheduler_open_session($1, $2, $3)", [input.staffId, input.role, input.mechanicId ?? null]);
  return { role: input.role, mechanicId: input.mechanicId, canEdit: input.canEdit, id: input.staffId, staffId: input.staffId, sessionId: result.rows[0].scheduler_open_session };
}

export async function issueCrmSnapshot(client: Client, available: boolean): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  await client.query("begin");
  try {
    const result = await client.query<{ scheduler_issue_snapshot: string }>("select scheduler_issue_snapshot($1)", [available]);
    await client.query("commit");
    return { ok: true, token: result.rows[0].scheduler_issue_snapshot };
  } catch (error) {
    await client.query("rollback");
    const mapped = mapFailure(error);
    if (mapped?.error) return { ok: false, error: mapped.error };
    throw error;
  }
}

async function loadSession(client: Client, sessionId: string | undefined): Promise<SessionActor> {
  const result = await client.query<{ staff_id: string; actor_role: string; mechanic_id: string | null }>(
    "select staff_id, actor_role, mechanic_id from scheduler_load_actor($1)",
    [sessionId ?? ""]
  );
  const row = result.rows[0];
  if (!row) throw Object.assign(new Error("forbidden_reservation"), { code: "42501" });
  return { staffId: row.staff_id, role: row.actor_role, mechanicId: row.mechanic_id ?? undefined };
}

function asActor(session: SessionActor): BookingActor {
  return { role: session.role, mechanicId: session.mechanicId, canEdit: true, id: session.staffId, staffId: session.staffId };
}

async function assertCrm(client: Client, token: string | undefined): Promise<void> {
  await client.query("select scheduler_assert_crm($1)", [token ?? ""]);
}

async function mirrorInterval(client: Client, id: string, mechanicId: string, resourceId: string, startMs: number, endMs: number): Promise<void> {
  await client.query("select scheduler_mirror_interval($1, $2, $3, to_timestamp($4/1000.0), to_timestamp($5/1000.0))", [id, mechanicId, resourceId, startMs, endMs]);
}

async function releaseInterval(client: Client, id: string): Promise<void> {
  await client.query("select scheduler_release_interval($1)", [id]);
}

async function writeMirrors(client: Client, reservationId: string, blocks: { mechanicId: string; resourceIds: string[]; startMs: number; endMs: number }[]): Promise<void> {
  for (const [index, block] of blocks.entries()) {
    const resources = block.resourceIds.length > 0 ? block.resourceIds : [""];
    for (const resourceId of resources) {
      await mirrorInterval(client, `${reservationId}:${index}:${resourceId || "none"}`, block.mechanicId, resourceId, block.startMs, block.endMs);
    }
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

async function consumeApproval(client: Client, input: { requestId: string; operationCode: string; mechanicId: string; date: string; start: string; minutes: number; resourceIds: string[] }, reservationId: string): Promise<{ by: string; at: string; minutes: number } | { error: "approval_required" | "approval_expired" | "approval_mismatch" }> {
  const resources = [...input.resourceIds].sort();
  const found = await client.query<{ id: string; confirmed_by: string; confirmed_at: string; minutes: number }>(
    `select id, confirmed_by, confirmed_at::text, minutes from scheduler_approvals
     where request_id = $1 and operation_code = $2 and mechanic_id = $3 and work_date = $4::date
       and start_clock = $5 and minutes = $6 and resource_ids = $7::text[]
       and consumed_by is null and expires_at > now()
     for update`,
    [input.requestId, input.operationCode, input.mechanicId, input.date, input.start, input.minutes, resources]
  );
  const row = found.rows[0];
  if (row) {
    await client.query("update scheduler_approvals set consumed_by = $2, consumed_request_id = $3 where id = $1", [row.id, reservationId, input.requestId]);
    return { by: row.confirmed_by, at: row.confirmed_at, minutes: row.minutes };
  }
  const expired = await client.query("select 1 from scheduler_approvals where request_id = $1 and consumed_by is null and expires_at <= now()", [input.requestId]);
  if (expired.rowCount) return { error: "approval_expired" };
  const other = await client.query(
    "select 1 from scheduler_approvals where consumed_by is null and request_id <> $1 and operation_code = $2 and mechanic_id = $3 and work_date = $4::date and start_clock = $5 and minutes = $6",
    [input.requestId, input.operationCode, input.mechanicId, input.date, input.start, input.minutes]
  );
  if (other.rowCount) return { error: "approval_mismatch" };
  return { error: "approval_required" };
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
  requestId?: string;
  actor?: BookingActor;
  crmToken?: string;
}): Promise<BookResult> {
  if (!hoursReady(input.hours)) return empty({ status: 503, error: "config_missing" });
  const fingerprint = bookingFingerprint({
    operationCode: input.operation.operationCode,
    mechanicId: input.mechanicId,
    date: input.date,
    start: input.start,
    minutes: input.minutes,
    resourceIds: input.resourceIds,
    parts: input.parts,
    requestId: input.requestId,
  });
  await client.query("begin");
  try {
    await client.query("select set_config('app.actor_session', $1, true)", [input.actor?.sessionId ?? ""]);
    const session = asActor(await loadSession(client, input.actor?.sessionId));
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
    await assertCrm(client, input.crmToken);
    if (!mayChangeExistingReservation(session, session.mechanicId ?? input.mechanicId, input.mechanicId)) {
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
      ? await consumeApproval(client, { requestId: input.requestId ?? "", operationCode: input.operation.operationCode, mechanicId: input.mechanicId, date: input.date, start: input.start, minutes: input.minutes, resourceIds: [...input.resourceIds].sort() }, id)
      : null;
    if (approval && "error" in approval) {
      await client.query("rollback");
      return empty({ error: approval.error });
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
      [id, input.idempotencyKey, fingerprint, input.appointmentId ?? null, input.workOrderId ?? null, input.operation.operationCode, input.mechanicId, input.parts, approval && "by" in approval ? approval.by : null, approval && "by" in approval ? approval.at : null, approval && "by" in approval ? approval.minutes : null]
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
    await writeMirrors(client, id, split.blocks);
    if (schedulerCrmWritesEnabled()) throw new Error("crm_writes_are_disabled");
    await client.query("commit");
    return { status: 200, id, persisted: true, crmWritten: false, createdClient: false, createdOrder: false, workOrderId: input.workOrderId ?? null, version: 1 };
  } catch (error) {
    await client.query("rollback");
    const parsed = dbError(error);
    const mapped = mapFailure(error);
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
    if (mapped) return mapped;
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
  requestId?: string;
  actor?: BookingActor;
  crmToken?: string;
}): Promise<BookResult> {
  if (!hoursReady(input.hours)) return empty({ status: 503, error: "config_missing" });
  await client.query("begin");
  try {
    await client.query("select set_config('app.actor_session', $1, true)", [input.actor?.sessionId ?? ""]);
    const session = asActor(await loadSession(client, input.actor?.sessionId));
    await assertCrm(client, input.crmToken);
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
    if (!mayChangeExistingReservation(session, current.rows[0].mechanic_id, input.mechanicId)) {
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
      ? await consumeApproval(client, { requestId: input.requestId ?? "", operationCode: input.operation.operationCode, mechanicId: input.mechanicId, date: input.date, start: input.start, minutes: input.minutes, resourceIds: [...input.resourceIds].sort() }, input.reservationId)
      : null;
    if (approval && "error" in approval) {
      await client.query("rollback");
      return empty({ error: approval.error });
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
    await releaseInterval(client, input.reservationId);
    const updated = await client.query(
      `update scheduler_reservations
       set mechanic_id = $2, operation_code = $3, parts_status = $4, version = version + 1, confirmed_by = $5, confirmed_at = $6, confirmed_minutes = $7
       where id = $1 and version = $8`,
      [input.reservationId, input.mechanicId, input.operation.operationCode, input.parts, approval && "by" in approval ? approval.by : null, approval && "by" in approval ? approval.at : null, approval && "by" in approval ? approval.minutes : null, input.expectedVersion]
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
    await writeMirrors(client, input.reservationId, split.blocks);
    if (schedulerCrmWritesEnabled()) throw new Error("crm_writes_are_disabled");
    await client.query("commit");
    return { status: 200, id: input.reservationId, persisted: true, crmWritten: false, createdClient: false, createdOrder: false, workOrderId: current.rows[0].work_order_id, version: input.expectedVersion + 1 };
  } catch (error) {
    await client.query("rollback");
    const mapped = mapFailure(error);
    if (mapped) return mapped;
    throw error;
  }
}

export async function cancelInDatabase(client: Client, reservationId: string, expectedVersion: number, actor: BookingActor, crmToken?: string): Promise<BookResult> {
  await client.query("begin");
  try {
    await client.query("select set_config('app.actor_session', $1, true)", [actor.sessionId ?? ""]);
    const session = asActor(await loadSession(client, actor.sessionId));
    await assertCrm(client, crmToken);
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
    if (!mayChangeExistingReservation(session, current.rows[0].mechanic_id, current.rows[0].mechanic_id)) {
      await client.query("rollback");
      return empty({ status: 403, error: "forbidden" });
    }
    await client.query("update scheduler_resource_holds set active = false where hold_id in (select id from scheduler_holds where reservation_id = $1)", [reservationId]);
    await client.query("update scheduler_holds set active = false where reservation_id = $1", [reservationId]);
    await releaseInterval(client, reservationId);
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
    const mapped = mapFailure(error);
    if (mapped) return mapped;
    throw error;
  }
}

export async function recordApproval(client: Client, actor: BookingActor, input: {
  requestId: string;
  operationCode: string;
  mechanicId: string;
  date: string;
  start: string;
  minutes: number;
  resourceIds: string[];
}): Promise<BookResult> {
  await client.query("begin");
  try {
    await client.query("select set_config('app.actor_session', $1, true)", [actor.sessionId ?? ""]);
    const session = await loadSession(client, actor.sessionId);
    if (session.role !== "owner" && session.role !== "admin") {
      await client.query("rollback");
      return empty({ status: 403, error: "forbidden" });
    }
    const id = `apr-${crypto.randomUUID()}`;
    await client.query(
      `insert into scheduler_approvals
        (id, request_id, operation_code, mechanic_id, work_date, start_clock, minutes, resource_ids, confirmed_by, confirmed_role, expires_at)
       values ($1,$2,$3,$4,$5::date,$6,$7,$8::text[],$9,$10, now() + interval '15 minutes')`,
      [id, input.requestId, input.operationCode, input.mechanicId, input.date, input.start, input.minutes, [...input.resourceIds].sort(), session.staffId, session.role]
    );
    await client.query("commit");
    return { status: 200, id, persisted: true, crmWritten: false, createdClient: false, createdOrder: false, workOrderId: null };
  } catch (error) {
    await client.query("rollback");
    const mapped = mapFailure(error);
    if (mapped) return mapped;
    throw error;
  }
}

/** Old calendar create/cancel. Same lock, same CRM snapshot, both CRM surfaces, no second ledger. */
export async function commitLegacyCalendarWrite(client: Client, input: {
  appointmentId: string;
  mechanicId: string;
  resourceId: string;
  date: string;
  start: string;
  minutes: number;
  hours: WorkshopHours;
  actor: BookingActor;
  crmToken?: string;
  action?: "create" | "cancel";
}): Promise<BookResult> {
  if (!hoursReady(input.hours)) return empty({ status: 503, error: "config_missing" });
  await client.query("begin");
  try {
    await client.query("select set_config('app.actor_session', $1, true)", [input.actor.sessionId ?? ""]);
    const session = asActor(await loadSession(client, input.actor.sessionId));
    await assertCrm(client, input.crmToken);
    if (input.action === "cancel") {
      if (!mayChangeExistingReservation(session, input.mechanicId, input.mechanicId)) {
        await client.query("rollback");
        return empty({ status: 403, error: "forbidden" });
      }
      const existing = await client.query("select mechanic_id from scheduler_store_appointments where active and (id = $1 or id like $1 || ':%') for update", [input.appointmentId]);
      if (!existing.rowCount) {
        await client.query("rollback");
        return empty({ error: "missing" });
      }
      if (!mayChangeExistingReservation(session, existing.rows[0].mechanic_id, existing.rows[0].mechanic_id)) {
        await client.query("rollback");
        return empty({ status: 403, error: "forbidden" });
      }
      await releaseInterval(client, input.appointmentId);
      if (schedulerCrmWritesEnabled()) throw new Error("crm_writes_are_disabled");
      await client.query("commit");
      return { status: 200, id: input.appointmentId, persisted: true, crmWritten: false, createdClient: false, createdOrder: false, workOrderId: null };
    }
    if (!mayChangeExistingReservation(session, session.mechanicId ?? input.mechanicId, input.mechanicId)) {
      await client.query("rollback");
      return empty({ status: 403, error: "forbidden" });
    }
    const split = splitWorkBlocks({
      id: input.appointmentId,
      date: input.date,
      start: input.start,
      minutes: input.minutes,
      hours: input.hours,
      mechanicId: input.mechanicId,
      resourceIds: input.resourceId ? [input.resourceId] : [],
      operationCode: "legacy",
    });
    if (!split.ok) {
      await client.query("rollback");
      return empty({ error: split.error });
    }
    for (const block of split.blocks) {
      const clash = await client.query(
        `select 1 from scheduler_holds
         where active and mechanic_id = $1
           and tstzrange(start_at, end_at, '[)') && tstzrange(to_timestamp($2/1000.0), to_timestamp($3/1000.0), '[)')
         union all
         select 1 from scheduler_crm_occupancy
         where active and (mechanic_id = $1 or ($4 <> '' and resource_id = $4))
           and tstzrange(start_at, end_at, '[)') && tstzrange(to_timestamp($2/1000.0), to_timestamp($3/1000.0), '[)')`,
        [block.mechanicId, block.startMs, block.endMs, input.resourceId]
      );
      if (clash.rowCount) {
        await client.query("rollback");
        return empty({ error: "conflict" });
      }
    }
    for (const [index, block] of split.blocks.entries()) {
      await mirrorInterval(client, `${input.appointmentId}:${index}:${input.resourceId || "none"}`, block.mechanicId, input.resourceId, block.startMs, block.endMs);
    }
    if (schedulerCrmWritesEnabled()) throw new Error("crm_writes_are_disabled");
    await client.query("commit");
    return { status: 200, id: input.appointmentId, persisted: true, crmWritten: false, createdClient: false, createdOrder: false, workOrderId: null };
  } catch (error) {
    await client.query("rollback");
    const mapped = mapFailure(error);
    if (mapped) return mapped;
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
