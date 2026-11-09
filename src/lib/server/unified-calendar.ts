import { workshopHours } from "@/lib/businessConfig";
import type { Appointment, Database } from "@/lib/store";
import { planCrmConnection } from "@/lib/smart-scheduler/crm-connection";
import { canonicalCrmLines, compatibleResourceFields, crmSurfacesMatch, resourceIdsForOccupancy, type CrmAppointmentDoc } from "@/lib/smart-scheduler/crm-reconcile";
import { schedulerUnifiedModeRequired } from "@/lib/smart-scheduler/flag";
import { connectLiveCrmCopy, liveCrmCopyUrl } from "@/lib/smart-scheduler/live-crm";
import { deliverNotification } from "@/lib/smart-scheduler/notification-outbox";
import { rangesOverlap, splitWorkBlocks } from "@/lib/smart-scheduler/schedule";
import type { Client } from "pg";

export type UnifiedAbort = { error: string; status: number; reason?: string };

export type UnifiedOutcome<T> =
  | { handled: false }
  | { handled: true; ok: true; value: T; notified: boolean }
  | { handled: true; ok: false; error: string; status: number; reason?: string };

type Mutation<T> = { value: T; eventKey?: string } | { abort: UnifiedAbort };

/**
 * When unified_calendar is off, or this process is not allowed to touch the local copy,
 * callers keep their existing cloud path. When it is on, the mutator runs inside one
 * PostgreSQL transaction against crm_store and appointments. Production Vercel never connects.
 */
function unavailable(reason: string): UnifiedOutcome<never> {
  return { handled: true, ok: false, error: "crm_unavailable", status: 503, reason };
}

export async function withUnifiedCrm<T>(
  mutate: (db: Database) => Promise<Mutation<T>>,
  options?: { notify?: (previous: Database, next: Database) => Promise<void> }
): Promise<UnifiedOutcome<T>> {
  const required = schedulerUnifiedModeRequired();
  const plan = planCrmConnection(liveCrmCopyUrl());
  if (plan.mode !== "transactional") {
    return required ? unavailable("Транзакционная база не разрешена.") : { handled: false };
  }
  let client: Client;
  try {
    client = await connectLiveCrmCopy();
  } catch {
    return required ? unavailable("Не удалось подключиться к транзакционной базе.") : { handled: false };
  }
  try {
    let enabled = false;
    try {
      const runtime = await client.query<{ unified_calendar: boolean }>("select unified_calendar from scheduler_runtime where id = 'main'");
      enabled = Boolean(runtime.rows[0]?.unified_calendar);
    } catch {
      return required ? unavailable("Не удалось прочитать переключатель календаря.") : { handled: false };
    }
    if (!enabled) return required ? unavailable("Единый календарь включён в процессе, но SQL-переключатель выключен. Старая запись не запущена.") : { handled: false };
    try {
      return await runTransaction(client, mutate, options?.notify);
    } catch {
      return unavailable("Транзакция календаря не выполнена. Запись не сохранена.");
    }
  } finally {
    await client.end();
  }
}

async function runTransaction<T>(
  client: Client,
  mutate: (db: Database) => Promise<Mutation<T>>,
  notify?: (previous: Database, next: Database) => Promise<void>
): Promise<UnifiedOutcome<T>> {
  await client.query("begin");
  try {
    await client.query("select scheduler_lock_workshop()");
    const store = await client.query<{ doc: unknown }>("select doc from crm_store where id = 'main' for update");
    if (!store.rowCount) {
      await client.query("rollback");
      return { handled: true, ok: false, error: "crm_unavailable", status: 503, reason: "В копии нет crm_store." };
    }
    const rows = await client.query<{ id: string; client_phone: string; user_id: string; doc: Appointment; created_at: string }>(
      "select id, client_phone, user_id, doc, created_at from appointments"
    );
    const db = asDatabase(store.rows[0].doc);
    const rowDocs = rows.rows.map((row) => row.doc).filter(Boolean);
    if (!crmSurfacesMatch(db.appointments, rowDocs)) {
      await client.query("rollback");
      return { handled: true, ok: false, error: "crm_diverged", status: 409, reason: divergenceReason(db.appointments, rowDocs) };
    }
    const previous = structuredClone(db);
    const mutation = await mutate(db);
    if ("abort" in mutation) {
      await client.query("rollback");
      return { handled: true, ok: false, ...mutation.abort };
    }
    const occupancy = occupy(db.appointments);
    if (!occupancy.ok) {
      await client.query("rollback");
      return { handled: true, ok: false, error: occupancy.error, status: 409, reason: occupancy.reason };
    }
    const holds = await client.query<{ mechanic_id: string; start_ms: string; end_ms: string; resource_id: string | null }>(
      `select hold.mechanic_id, extract(epoch from hold.start_at) * 1000 as start_ms, extract(epoch from hold.end_at) * 1000 as end_ms, resource.resource_id
       from scheduler_holds hold
       left join scheduler_resource_holds resource on resource.hold_id = hold.id and resource.active
       where hold.active`
    );
    for (const block of occupancy.blocks) {
      const hit = holds.rows.some((hold) => rangesOverlap(block.startMs, block.endMs, Number(hold.start_ms), Number(hold.end_ms)) && (hold.mechanic_id === block.mechanicId || (hold.resource_id && block.resourceIds.includes(hold.resource_id))));
      if (hit) {
        await client.query("rollback");
        return { handled: true, ok: false, error: "crm_conflict", status: 409, reason: "Слот уже занят подтверждённой бронью." };
      }
    }
    const saved = { ...db, currentUserId: null };
    await client.query("update crm_store set doc = $1::jsonb, updated_at = now() where id = 'main'", [JSON.stringify(saved)]);
    if (process.env.SCHEDULER_COPY_FAILPOINT === "after-store") throw new Error("partial_live_write");
    await syncAppointmentRows(client, rows.rows, saved.appointments);
    await refreshOccupancy(client, saved.appointments);
    const matched = await client.query<{ store: string; row: string }>("select scheduler_live_digest('store') as store, scheduler_live_digest('row') as row");
    if (matched.rows[0]?.store !== matched.rows[0]?.row) throw new Error("crm_diverged");
    let notifyThisCommit = false;
    if (mutation.eventKey) {
      const claimed = await client.query(
        `insert into scheduler_notification_log (event_key, status) values ($1, 'pending')
         on conflict (event_key) do nothing returning event_key`,
        [mutation.eventKey]
      );
      notifyThisCommit = (claimed.rowCount ?? 0) > 0;
    }
    await client.query("commit");
    if (notifyThisCommit && notify && mutation.eventKey) {
      try {
        await deliverNotification(client, mutation.eventKey, () => notify(previous, saved));
      } catch {
        /* The booking stays committed. A pending or failed log row can be retried. */
      }
    }
    return { handled: true, ok: true, value: mutation.value, notified: notifyThisCommit };
  } catch (error) {
    await client.query("rollback");
    const message = error instanceof Error ? error.message : "";
    if (message === "partial_live_write") return { handled: true, ok: false, error: "rolled_back", status: 409, reason: "Частичная запись отменена." };
    if (message.includes("crm_diverged")) return { handled: true, ok: false, error: "crm_diverged", status: 409, reason: "crm_store и appointments расходятся." };
    throw error;
  }
}

function asDatabase(value: unknown): Database {
  const raw = (value && typeof value === "object" ? value : {}) as Database;
  return {
    ...raw,
    users: raw.users ?? [],
    vehicles: raw.vehicles ?? [],
    workOrders: raw.workOrders ?? [],
    appointments: raw.appointments ?? [],
    callRequests: raw.callRequests ?? [],
    leads: raw.leads ?? [],
    vehicleHistory: raw.vehicleHistory ?? [],
    warehouse: raw.warehouse ?? [],
    monthlyParts: raw.monthlyParts ?? [],
    monthlyInvoiceParts: raw.monthlyInvoiceParts ?? [],
    monthlyConsumables: raw.monthlyConsumables ?? [],
    expenses: raw.expenses ?? [],
    mechanics: raw.mechanics ?? [],
    settings: raw.settings ?? { defaultLaborPercent: 50, defaultPartsPercent: 50, vatRate: 23, vatEnabledByDefault: true },
    passwordResets: raw.passwordResets ?? [],
    currentUserId: null,
    notifications: raw.notifications ?? [],
    clientRatings: raw.clientRatings ?? [],
  };
}

type StoredRow = { id: string; client_phone: string; user_id: string; doc: Appointment; created_at: string };

async function syncAppointmentRows(client: Client, existing: StoredRow[], next: Appointment[]): Promise<void> {
  const previous = new Map(existing.map((row) => [row.id, row]));
  const seen = new Set<string>();
  for (const appointment of next) {
    seen.add(appointment.id);
    const row = previous.get(appointment.id);
    if (!row) {
      applyResourceCompatibility(appointment);
      await client.query(
        `insert into appointments (id, client_phone, user_id, doc, created_at)
         values ($1, $2, $3, $4::jsonb, coalesce($5::timestamptz, now()))`,
        [appointment.id, appointment.clientPhone || "", appointment.userId || "", JSON.stringify(appointment), appointment.createdAt || null]
      );
      continue;
    }
    if (sameDoc(row.doc, appointment)) continue;
    if (row.doc.createdAt) appointment.createdAt = row.doc.createdAt;
    applyResourceCompatibility(appointment);
    await client.query(
      `update appointments
       set doc = $4::jsonb,
           client_phone = case when client_phone is distinct from $2 then $2 else client_phone end,
           user_id = case when user_id is distinct from $3 then $3 else user_id end
       where id = $1`,
      [appointment.id, appointment.clientPhone || "", appointment.userId || "", JSON.stringify(appointment)]
    );
  }
  const removed = existing.filter((row) => !seen.has(row.id)).map((row) => row.id);
  if (removed.length) await client.query("delete from appointments where id = any($1::text[])", [removed]);
}

function sameDoc(left: Appointment, right: Appointment): boolean {
  return stable(left) === stable(right);
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => stable(item)).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).filter((key) => record[key] !== undefined).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stable(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function applyResourceCompatibility(appointment: Appointment): void {
  const extra = appointment as Appointment & { resourceId?: string; resourceIds?: string[] };
  const fields = compatibleResourceFields(extra.resourceId, extra.resourceIds);
  extra.resourceId = fields.resourceId;
  extra.resourceIds = fields.resourceIds;
}

function divergenceReason(storeDocs: CrmAppointmentDoc[], rowDocs: CrmAppointmentDoc[]): string {
  const left = canonicalCrmLines(storeDocs);
  const right = canonicalCrmLines(rowDocs);
  return `crm_store и appointments расходятся (${left.length} и ${right.length}).`;
}

function occupy(appointments: Appointment[]): { ok: true; blocks: { startMs: number; endMs: number; mechanicId: string; resourceIds: string[] }[] } | { ok: false; error: string; reason: string } {
  const blocks: { startMs: number; endMs: number; mechanicId: string; resourceIds: string[] }[] = [];
  const hours = workshopHours();
  for (const appointment of appointments) {
    if (appointment.appointmentStatus === "cancelled" || appointment.appointmentStatus === "completed" || appointment.visitState === "no_show" || appointment.calendarHidden) continue;
    if (!appointment.workStart || !appointment.workMinutes || !appointment.mechanicId) continue;
    const extra = appointment as Appointment & { resourceId?: string; resourceIds?: string[] };
    const split = splitWorkBlocks({
      id: appointment.id,
      date: appointment.date,
      start: appointment.workStart,
      minutes: appointment.workMinutes,
      hours,
      mechanicId: appointment.mechanicId,
      resourceIds: resourceIdsForOccupancy(extra),
      operationCode: "legacy",
    });
    if (!split.ok) return { ok: false, error: split.error, reason: "Интервал работы не помещается в график." };
    for (const block of split.blocks) blocks.push({ startMs: block.startMs, endMs: block.endMs, mechanicId: block.mechanicId, resourceIds: block.resourceIds });
  }
  for (let index = 0; index < blocks.length; index++) {
    for (let other = index + 1; other < blocks.length; other++) {
      const left = blocks[index];
      const right = blocks[other];
      if (!rangesOverlap(left.startMs, left.endMs, right.startMs, right.endMs)) continue;
      if (left.mechanicId === right.mechanicId || left.resourceIds.some((id) => id && right.resourceIds.includes(id))) {
        return { ok: false, error: "crm_conflict", reason: "Пересечение занятости механика или ресурса." };
      }
    }
  }
  return { ok: true, blocks };
}

async function refreshOccupancy(client: Client, appointments: Appointment[]): Promise<void> {
  await client.query("delete from scheduler_crm_occupancy");
  const occupied = occupy(appointments);
  if (!occupied.ok) throw new Error(occupied.error);
  for (const [index, block] of occupied.blocks.entries()) {
    const resources = block.resourceIds.length ? block.resourceIds : [""];
    for (const resourceId of resources) {
      await client.query(
        `insert into scheduler_crm_occupancy (id, appointment_id, mechanic_id, resource_id, start_at, end_at)
         values ($1, $2, $3, $4, to_timestamp($5/1000.0), to_timestamp($6/1000.0))`,
        [`occ-${index}-${resourceId || "none"}`, "crm", block.mechanicId, resourceId, block.startMs, block.endMs]
      );
    }
  }
}

export async function safeExternalNotify(previous: Database, next: Database): Promise<void> {
  const { notifyAfterCrmCloudSave } = await import("@/lib/server/crm-cloud-notify");
  await notifyAfterCrmCloudSave(previous, next);
}
