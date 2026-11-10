import { Client } from "pg";
import type { Operation } from "@/lib/smart-scheduler/catalog";
import { bookingFingerprint, mayChangeExistingReservation, selectRequiredResources, type BookingActor } from "@/lib/smart-scheduler/booking-rules";
import type { CrmAppointmentDoc } from "@/lib/smart-scheduler/crm-reconcile";
import { canAutoBook } from "@/lib/smart-scheduler/policy";
import { rangesOverlap, splitWorkBlocks, type Hold, type PartsStatus } from "@/lib/smart-scheduler/schedule";
import type { ResourceSetting } from "@/lib/smart-scheduler/settings";
import type { WorkshopHours } from "@/lib/workshop-schedule";
import { issueCrmSnapshot, openActorSession, type BookResult } from "@/lib/smart-scheduler/postgres";

const COPY_NAME = "bess_crm_copy_test";

export type LiveCalendarInput = {
  action: "create" | "move" | "cancel";
  kind: "legacy" | "scheduler";
  appointmentId: string;
  mechanicId: string;
  date: string;
  workStart: string;
  workMinutes: number;
  resourceId?: string;
  arrivalTime?: string;
  pickupDate?: string;
  clientPhone?: string;
  clientName?: string;
  userId?: string;
  vehicleId?: string;
  hours: WorkshopHours;
  actor: BookingActor;
  crmToken?: string;
  expectedVersion?: number;
  operation?: Operation;
  parts?: PartsStatus;
  failpoint?: "after-store";
  idempotencyKey?: string;
  vin?: string;
  plate?: string;
  make?: string;
  model?: string;
  serviceIds?: string[];
  comment?: string;
  confirmNewClient?: boolean;
  confirmNewVehicle?: boolean;
};

type CrmUser = { id: string; phone: string; name: string; role: "client"; createdAt: string };
type CrmVehicle = { id: string; userId: string; vin: string; plate: string; make: string; model: string; mileage: number; engine: string; trim: string; power: string };

function digits(value: string): string {
  return value.replace(/\D/g, "");
}

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

function resolveParty(input: LiveCalendarInput, users: CrmUser[], vehicles: CrmVehicle[]): { users: CrmUser[]; vehicles: CrmVehicle[]; userId: string; vehicleId: string; createdClient: boolean } | { error: string } {
  const phone = digits(input.clientPhone ?? "");
  const vin = clean(input.vin).toUpperCase();
  const plate = clean(input.plate).toUpperCase();
  const askedClient = Boolean(phone || clean(input.clientName) || input.userId);
  const askedVehicle = Boolean(vin || plate || clean(input.make) || clean(input.model) || input.vehicleId);
  if (!askedClient && !askedVehicle) {
    return { users, vehicles, userId: input.userId ?? "", vehicleId: input.vehicleId ?? "", createdClient: false };
  }
  let createdClient = false;
  let user = input.userId ? users.find((item) => item.id === input.userId) : undefined;
  if (!user && phone) user = users.find((item) => digits(item.phone) === phone);
  if (!user && askedClient) {
    if (!input.confirmNewClient || !phone || !clean(input.clientName)) return { error: "client_unconfirmed" };
    user = { id: `user-${phone}`, phone, name: clean(input.clientName), role: "client", createdAt: new Date().toISOString() };
    users = [...users, user];
    createdClient = true;
  }
  if (askedClient && !user) return { error: "client_unconfirmed" };
  let vehicle = input.vehicleId ? vehicles.find((item) => item.id === input.vehicleId) : undefined;
  if (!vehicle && vin) vehicle = vehicles.find((item) => clean(item.vin).toUpperCase() === vin);
  if (!vehicle && plate) vehicle = vehicles.find((item) => clean(item.plate).toUpperCase() === plate);
  if (!vehicle && askedVehicle) {
    if (!input.confirmNewVehicle || !user || (!vin && !plate)) return { error: "vehicle_unconfirmed" };
    vehicle = {
      id: `veh-${vin || plate}`,
      userId: user.id,
      vin,
      plate,
      make: clean(input.make),
      model: clean(input.model),
      mileage: 0,
      engine: "",
      trim: "",
      power: "",
    };
    vehicles = [...vehicles, vehicle];
  }
  if (vehicle && user && vehicle.userId !== user.id) user = users.find((item) => item.id === vehicle?.userId) ?? user;
  return { users, vehicles, userId: user?.id ?? input.userId ?? "", vehicleId: vehicle?.id ?? input.vehicleId ?? "", createdClient };
}

type StoredDoc = CrmAppointmentDoc & {
  userId?: string;
  vehicleId?: string;
  serviceIds?: string[];
  time?: string;
  repairStatus?: string;
  comment?: string;
  source?: string;
  createdAt?: string;
  visitState?: string;
  pickupDate?: string;
  clientPhone?: string;
  clientName?: string;
  clientPlate?: string;
};

function empty(error: string, status: 403 | 409 | 503 = 409): BookResult {
  return { status, error, persisted: false, crmWritten: false, createdClient: false, createdOrder: false, workOrderId: null };
}

export function liveCrmCopyUrl(): string | null {
  if (process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview") return null;
  const url = process.env.SCHEDULER_CRM_COPY_URL?.trim() || `postgresql://ubuntu@/${COPY_NAME}?host=/var/run/postgresql`;
  if (/supabase\.co/i.test(url) || !url.includes(COPY_NAME)) return null;
  const supabase = process.env.SUPABASE_URL;
  if (supabase) {
    try {
      if (url.includes(new URL(supabase).host)) return null;
    } catch {
      return null;
    }
  }
  if (!/\/var\/run\/postgresql|localhost|127\.0\.0\.1/.test(url)) return null;
  return url;
}

export async function connectLiveCrmCopy(): Promise<Client> {
  const url = liveCrmCopyUrl();
  if (!url) throw new Error("refusing database");
  const client = new Client({ connectionString: url });
  await client.connect();
  const current = await client.query<{ name: string }>("select current_database() as name");
  if (current.rows[0]?.name !== COPY_NAME) {
    await client.end();
    throw new Error("refusing database");
  }
  return client;
}

function dbMessage(error: unknown): { code: string; message: string } {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  const message = error instanceof Error ? error.message : "";
  return { code, message };
}

function mapFailure(error: unknown): BookResult | null {
  const parsed = dbMessage(error);
  if (parsed.code === "42501" || parsed.message.includes("forbidden_reservation") || parsed.message.includes("forbidden_session")) return empty("forbidden", 403);
  if (parsed.message.includes("crm_unavailable")) return empty("crm_unavailable", 503);
  if (parsed.message.includes("config_missing")) return empty("config_missing", 503);
  if (parsed.message.includes("crm_stale")) return empty("crm_stale", 409);
  if (parsed.message.includes("crm_diverged")) return empty("crm_diverged", 409);
  if (parsed.message.includes("version_conflict")) return empty("version_conflict", 409);
  if (parsed.message.includes("idempotency_mismatch")) return empty("idempotency_mismatch", 409);
  if (parsed.code === "40P01" || parsed.code === "40001") return empty("crm_conflict", 409);
  if (parsed.message.includes("crm_overlap") || parsed.code === "23P01" || parsed.code === "23505") return empty("crm_conflict", 409);
  return null;
}

function activeDoc(doc: CrmAppointmentDoc): boolean {
  return doc.appointmentStatus !== "cancelled" && doc.appointmentStatus !== "completed" && doc.visitState !== "no_show" && doc.calendarHidden !== true;
}

function resourceIdsOf(doc: CrmAppointmentDoc): string[] {
  if (Array.isArray(doc.resourceIds) && doc.resourceIds.length > 0) return [...new Set(doc.resourceIds.filter(Boolean))];
  return doc.resourceId ? [doc.resourceId] : [];
}

/**
 * One transaction against the existing crm_store document and appointments rows.
 * Refuses every database except the local schema copy. Production routes do not call it.
 */
export async function commitLiveCalendar(client: Client, input: LiveCalendarInput): Promise<BookResult> {
  const current = await client.query<{ name: string }>("select current_database() as name");
  if (current.rows[0]?.name !== COPY_NAME) throw new Error("refusing database");
  const runtime = await client.query<{ unified_calendar: boolean }>("select unified_calendar from scheduler_runtime where id = 'main'");
  if (!runtime.rows[0]?.unified_calendar) return empty("unified_calendar_disabled", 503);
  if (!input.hours.opens || !input.hours.closes || !input.hours.saturdayOpens || !input.hours.saturdayCloses) return empty("config_missing", 503);
  if (input.kind === "scheduler" && input.mechanicId === "mech-2") return empty("mechanic_not_confirmed");

  await client.query("begin");
  try {
    await client.query("select set_config('app.actor_session', $1, true)", [input.actor.sessionId ?? ""]);
    const loaded = await client.query<{ staff_id: string; actor_role: string; mechanic_id: string | null }>(
      "select staff_id, actor_role, mechanic_id from scheduler_load_actor($1)",
      [input.actor.sessionId ?? ""]
    );
    const row = loaded.rows[0];
    if (!row) throw Object.assign(new Error("forbidden_reservation"), { code: "42501" });
    const session: BookingActor = { role: row.actor_role, mechanicId: row.mechanic_id ?? undefined, canEdit: true, id: row.staff_id, staffId: row.staff_id, sessionId: input.actor.sessionId };
    await client.query("select scheduler_assert_crm($1)", [input.crmToken ?? ""]);
    const store = await client.query<{ doc: { appointments?: StoredDoc[]; users?: CrmUser[]; vehicles?: CrmVehicle[] } }>("select doc from crm_store where id = 'main' for update");
    const doc = store.rows[0]?.doc ?? { appointments: [] };
    const appointments = Array.isArray(doc.appointments) ? doc.appointments : [];
    const index = appointments.findIndex((item) => item.id === input.appointmentId);
    if (input.action === "create" && index >= 0) {
      await client.query("rollback");
      return empty("conflict");
    }
    if (input.action !== "create" && index < 0) {
      await client.query("rollback");
      return empty("missing");
    }
    const currentMechanic = index >= 0 ? appointments[index].mechanicId ?? "" : session.mechanicId ?? input.mechanicId;
    if (!mayChangeExistingReservation(session, currentMechanic, input.mechanicId)) {
      await client.query("rollback");
      return empty("forbidden", 403);
    }

    let resourceIds = input.resourceId ? [input.resourceId] : [];
    if (input.kind === "scheduler") {
      if (!input.operation || (input.action !== "cancel" && input.operation.bookingMode !== "AUTO")) {
        await client.query("rollback");
        return empty("manual");
      }
      if (input.action !== "cancel") {
        const resources = await client.query<ResourceSetting>(
          `select id, kind, label, status, confirmed, udt_permit_confirmed as "udtPermitConfirmed" from scheduler_resources`
        );
        const selected = selectRequiredResources(input.operation, resourceIds, resources.rows);
        if (!selected.ok) {
          await client.query("rollback");
          return empty(selected.error);
        }
        const permission = canAutoBook({ operation: input.operation, parts: input.parts ?? "unknown", resources: resources.rows, resourceIds: selected.resourceIds });
        if (!permission.auto) {
          await client.query("rollback");
          return empty(permission.reason);
        }
        resourceIds = selected.resourceIds;
      }
      if (input.action === "create") {
        const idempotencyKey = input.idempotencyKey || input.appointmentId;
        const prior = await client.query<{ appointment_id: string; request_fingerprint: string; version: number }>(
          "select appointment_id, request_fingerprint, version from scheduler_reservations where idempotency_key = $1 for update",
          [idempotencyKey]
        );
        if (prior.rowCount) {
          const fingerprint = bookingFingerprint({
            operationCode: input.operation.operationCode,
            mechanicId: input.mechanicId,
            date: input.date,
            start: input.workStart,
            minutes: input.workMinutes,
            resourceIds,
            parts: input.parts ?? "available",
            requestId: idempotencyKey,
          });
          if (prior.rows[0].request_fingerprint !== fingerprint) {
            await client.query("rollback");
            return empty("idempotency_mismatch");
          }
          await client.query("commit");
          return { status: 200, id: prior.rows[0].appointment_id, replayed: true, persisted: true, crmWritten: false, createdClient: false, createdOrder: false, workOrderId: null, version: prior.rows[0].version };
        }
      }
      if (input.action !== "create") {
        const version = await client.query<{ version: number }>("select version from scheduler_reservations where id = $1 and active for update", [`res-${input.appointmentId}`]);
        if (!version.rowCount || version.rows[0].version !== input.expectedVersion) {
          await client.query("rollback");
          return empty(version.rowCount ? "version_conflict" : "missing");
        }
      }
    }

    const party = resolveParty(input, Array.isArray(doc.users) ? doc.users : [], Array.isArray(doc.vehicles) ? doc.vehicles : []);
    if ("error" in party) {
      await client.query("rollback");
      return empty(party.error);
    }
    const next = nextDocument(appointments[index], { ...input, userId: party.userId, vehicleId: party.vehicleId }, resourceIds);
    const others = appointments.filter((item) => item.id !== input.appointmentId);
    await replaceOccupancy(client, others, input.hours);
    if (input.action !== "cancel" && activeDoc(next)) {
      const proposed = blocksFor(next, input.hours);
      if (!proposed.ok) {
        await client.query("rollback");
        return empty(proposed.error);
      }
      const occupied = await occupiedBlocks(client, others, input.hours, input.kind === "scheduler" ? `res-${input.appointmentId}` : "");
      if (!occupied.ok) {
        await client.query("rollback");
        return empty("crm_diverged");
      }
      for (const block of proposed.blocks) {
        const hit = occupied.blocks.some((item) => rangesOverlap(block.startMs, block.endMs, item.startMs, item.endMs) && (item.mechanicId === block.mechanicId || (item.resourceId !== "" && block.resourceIds.includes(item.resourceId))));
        if (hit) {
          await client.query("rollback");
          return empty("crm_conflict");
        }
      }
    }

    const replacement = input.action === "cancel" ? cancelDocument(appointments[index] ?? next) : next;
    const updated = index >= 0 ? appointments.map((item, itemIndex) => itemIndex === index ? replacement : item) : [...appointments, replacement];
    await client.query(
      `insert into crm_store (id, doc, updated_at) values ('main', $1::jsonb, now())
       on conflict (id) do update set doc = jsonb_set(jsonb_set(jsonb_set(crm_store.doc, '{appointments}', $2::jsonb, true), '{users}', $3::jsonb, true), '{vehicles}', $4::jsonb, true), updated_at = now()`,
      [JSON.stringify({ ...doc, appointments: updated, users: party.users, vehicles: party.vehicles }), JSON.stringify(updated), JSON.stringify(party.users), JSON.stringify(party.vehicles)]
    );
    if (input.failpoint === "after-store") throw new Error("partial_live_write");
    await client.query(
      `insert into appointments (id, client_phone, user_id, doc)
       values ($1, $2, $3, $4::jsonb)
       on conflict (id) do update set client_phone = excluded.client_phone, user_id = excluded.user_id, doc = excluded.doc`,
      [replacement.id, replacement.clientPhone || "", replacement.userId || "", JSON.stringify(replacement)]
    );
    if (input.kind === "scheduler" && input.operation) {
      await writeSchedulerRows(client, input, replacement, resourceIds);
    }
    const version = input.action === "create" ? 1 : (input.expectedVersion ?? 0) + 1;
    await client.query(
      "insert into scheduler_change_log (id, appointment_id, action, actor_id, version, reason) values ($1,$2,$3,$4,$5,$6)",
      [`chg-${crypto.randomUUID()}`, replacement.id, input.action, input.actor.staffId || input.actor.id, version, clean(input.comment)]
    );
    await replaceOccupancy(client, updated, input.hours);
    const matched = await client.query<{ store: string; row: string }>("select scheduler_live_digest('store') as store, scheduler_live_digest('row') as row");
    if (matched.rows[0]?.store !== matched.rows[0]?.row) throw new Error("crm_diverged");
    await client.query("commit");
    return { status: 200, id: input.appointmentId, persisted: true, crmWritten: true, createdClient: party.createdClient, createdOrder: false, workOrderId: null, version };
  } catch (error) {
    await client.query("rollback");
    const parsed = dbMessage(error);
    if (parsed.code === "23505" && input.kind === "scheduler" && input.operation && input.action === "create") {
      const idempotencyKey = input.idempotencyKey || input.appointmentId;
      const prior = await client.query<{ appointment_id: string; request_fingerprint: string; version: number }>(
        "select appointment_id, request_fingerprint, version from scheduler_reservations where idempotency_key = $1",
        [idempotencyKey]
      );
      const fingerprint = bookingFingerprint({
        operationCode: input.operation.operationCode,
        mechanicId: input.mechanicId,
        date: input.date,
        start: input.workStart,
        minutes: input.workMinutes,
        resourceIds: input.resourceId ? [input.resourceId] : [],
        parts: input.parts ?? "available",
        requestId: idempotencyKey,
      });
      if (prior.rowCount && prior.rows[0].request_fingerprint === fingerprint) {
        return { status: 200, id: prior.rows[0].appointment_id, replayed: true, persisted: true, crmWritten: false, createdClient: false, createdOrder: false, workOrderId: null, version: prior.rows[0].version };
      }
    }
    const mapped = mapFailure(error);
    if (mapped) return mapped;
    if (error instanceof Error && error.message === "partial_live_write") return empty("rolled_back");
    throw error;
  }
}

function nextDocument(existing: StoredDoc | undefined, input: LiveCalendarInput, resourceIds: string[]): StoredDoc {
  return {
    ...(existing ?? {}),
    id: input.appointmentId,
    userId: input.userId ?? existing?.userId ?? "",
    vehicleId: input.vehicleId ?? existing?.vehicleId ?? "",
    serviceIds: input.serviceIds?.length ? input.serviceIds : existing?.serviceIds?.length ? existing.serviceIds : ["otherReason"],
    date: input.date,
    time: input.arrivalTime ?? existing?.time ?? "",
    mechanicId: input.mechanicId,
    repairStatus: existing?.repairStatus || "received",
    appointmentStatus: existing?.appointmentStatus && input.action !== "create" ? existing.appointmentStatus : "scheduled",
    comment: input.comment ?? existing?.comment ?? "",
    clientPlate: input.plate ?? existing?.clientPlate,
    source: existing?.source || (input.kind === "scheduler" ? "manual" : "telegram"),
    createdAt: existing?.createdAt || new Date().toISOString(),
    workStart: input.workStart,
    workMinutes: input.workMinutes,
    pickupDate: input.pickupDate ?? existing?.pickupDate,
    clientPhone: input.clientPhone ?? existing?.clientPhone,
    clientName: input.clientName ?? existing?.clientName,
    resourceId: resourceIds[0] ?? existing?.resourceId ?? "",
    resourceIds: resourceIds.length ? resourceIds : existing?.resourceIds,
    calendarHidden: input.action === "create" ? false : existing?.calendarHidden ?? false,
    visitState: existing?.visitState || "expected",
  };
}

function cancelDocument(existing: StoredDoc): StoredDoc {
  return { ...existing, appointmentStatus: "cancelled", calendarHidden: true };
}

function blocksFor(doc: StoredDoc, hours: WorkshopHours): { ok: true; blocks: { startMs: number; endMs: number; mechanicId: string; resourceIds: string[] }[] } | { ok: false; error: string } {
  if (!doc.date || !doc.workStart || !doc.mechanicId || !doc.workMinutes) return { ok: false, error: "invalid_time" };
  const split = splitWorkBlocks({
    id: doc.id || "live",
    date: doc.date,
    start: doc.workStart,
    minutes: Number(doc.workMinutes),
    hours,
    mechanicId: doc.mechanicId,
    resourceIds: resourceIdsOf(doc),
    operationCode: "legacy",
  });
  if (!split.ok) return split;
  return { ok: true, blocks: split.blocks.map((block) => ({ startMs: block.startMs, endMs: block.endMs, mechanicId: block.mechanicId, resourceIds: block.resourceIds })) };
}

async function occupiedBlocks(client: Client, docs: StoredDoc[], hours: WorkshopHours, ignoredReservationId: string): Promise<{ ok: true; blocks: { startMs: number; endMs: number; mechanicId: string; resourceId: string }[] } | { ok: false }> {
  const blocks: { startMs: number; endMs: number; mechanicId: string; resourceId: string }[] = [];
  for (const doc of docs) {
    if (!activeDoc(doc) || !doc.workStart || !doc.workMinutes || !doc.mechanicId) continue;
    const split = blocksFor(doc, hours);
    if (!split.ok) return { ok: false };
    for (const block of split.blocks) {
      const resources = block.resourceIds.length ? block.resourceIds : [""];
      for (const resourceId of resources) blocks.push({ startMs: block.startMs, endMs: block.endMs, mechanicId: block.mechanicId, resourceId });
    }
  }
  const holds = await client.query<{ mechanic_id: string; start_ms: string; end_ms: string; resource_id: string | null }>(
    `select hold.mechanic_id, extract(epoch from hold.start_at) * 1000 as start_ms, extract(epoch from hold.end_at) * 1000 as end_ms, resource.resource_id
     from scheduler_holds hold
     left join scheduler_resource_holds resource on resource.hold_id = hold.id and resource.active
     where hold.active and ($1 = '' or hold.reservation_id <> $1)`,
    [ignoredReservationId]
  );
  for (const hold of holds.rows) {
    blocks.push({ startMs: Number(hold.start_ms), endMs: Number(hold.end_ms), mechanicId: hold.mechanic_id, resourceId: hold.resource_id ?? "" });
  }
  return { ok: true, blocks };
}

async function replaceOccupancy(client: Client, docs: StoredDoc[], hours: WorkshopHours): Promise<void> {
  await client.query("delete from scheduler_crm_occupancy");
  for (const doc of docs) {
    if (!activeDoc(doc) || !doc.workStart || !doc.workMinutes || !doc.mechanicId) continue;
    const split = blocksFor(doc, hours);
    if (!split.ok) throw new Error("crm_diverged");
    for (const [index, block] of split.blocks.entries()) {
      const resources = block.resourceIds.length ? block.resourceIds : [""];
      for (const resourceId of resources) {
        await client.query(
          `insert into scheduler_crm_occupancy (id, appointment_id, mechanic_id, resource_id, start_at, end_at)
           values ($1, $2, $3, $4, to_timestamp($5/1000.0), to_timestamp($6/1000.0))`,
          [`${doc.id}:${index}:${resourceId || "none"}`, doc.id, block.mechanicId, resourceId, block.startMs, block.endMs]
        );
      }
    }
  }
}

async function writeSchedulerRows(client: Client, input: LiveCalendarInput, doc: StoredDoc, resourceIds: string[]): Promise<void> {
  const reservationId = `res-${input.appointmentId}`;
  if (input.action === "cancel") {
    await client.query("delete from scheduler_resource_holds where hold_id in (select id from scheduler_holds where reservation_id = $1)", [reservationId]);
    await client.query("delete from scheduler_holds where reservation_id = $1", [reservationId]);
    const cancelled = await client.query("update scheduler_reservations set active = false, version = version + 1 where id = $1 and version = $2", [reservationId, input.expectedVersion]);
    if (cancelled.rowCount !== 1) throw new Error("version_conflict");
    return;
  }
  const split = blocksFor(doc, input.hours);
  if (!split.ok) throw new Error(split.error);
  if (input.action === "move") {
    await client.query("delete from scheduler_resource_holds where hold_id in (select id from scheduler_holds where reservation_id = $1)", [reservationId]);
    await client.query("delete from scheduler_holds where reservation_id = $1", [reservationId]);
    const updated = await client.query("update scheduler_reservations set mechanic_id = $2, version = version + 1 where id = $1 and version = $3", [reservationId, input.mechanicId, input.expectedVersion]);
    if (updated.rowCount !== 1) throw new Error("version_conflict");
  } else if (input.operation) {
    const idempotencyKey = input.idempotencyKey || input.appointmentId;
    const fingerprint = bookingFingerprint({
      operationCode: input.operation.operationCode,
      mechanicId: input.mechanicId,
      date: input.date,
      start: input.workStart,
      minutes: input.workMinutes,
      resourceIds,
      parts: input.parts ?? "available",
      requestId: idempotencyKey,
    });
    await client.query(
      `insert into scheduler_reservations
        (id, idempotency_key, request_fingerprint, appointment_id, operation_code, mechanic_id, parts_status)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [reservationId, idempotencyKey, fingerprint, input.appointmentId, input.operation.operationCode, input.mechanicId, input.parts ?? "available"]
    );
  }
  for (const [index, block] of split.blocks.entries()) {
    const holdId = `${reservationId}:${index}`;
    await client.query(
      "insert into scheduler_holds (id, reservation_id, mechanic_id, operation_code, start_at, end_at) values ($1, $2, $3, $4, to_timestamp($5/1000.0), to_timestamp($6/1000.0))",
      [holdId, reservationId, input.mechanicId, input.operation?.operationCode ?? "legacy", block.startMs, block.endMs]
    );
    for (const resourceId of block.resourceIds) {
      await client.query(
        "insert into scheduler_resource_holds (hold_id, resource_id, start_at, end_at) values ($1, $2, to_timestamp($3/1000.0), to_timestamp($4/1000.0))",
        [holdId, resourceId, block.startMs, block.endMs]
      );
    }
  }
}

/** The HTTP writer. One connection, one transaction, copy database only. */
export async function commitSchedulerToCrm(input: LiveCalendarInput): Promise<BookResult> {
  if (!liveCrmCopyUrl()) return empty("database_required", 503);
  let client: Client;
  try {
    client = await connectLiveCrmCopy();
  } catch {
    return empty("crm_unavailable", 503);
  }
  try {
    const issued = await issueCrmSnapshot(client, true);
    if (!issued.ok) return empty(issued.error === "crm_diverged" ? "crm_diverged" : issued.error, issued.error === "crm_diverged" ? 409 : 503);
    const actor = input.actor.sessionId ? input.actor : await openActorSession(client, {
      role: input.actor.role === "mechanic" ? "mechanic" : input.actor.role === "admin" ? "admin" : "owner",
      staffId: input.actor.staffId || input.actor.id,
      mechanicId: input.actor.mechanicId,
      canEdit: input.actor.canEdit,
    });
    return await commitLiveCalendar(client, { ...input, actor, crmToken: issued.token });
  } catch {
    return empty("crm_unavailable", 503);
  } finally {
    await client.end();
  }
}

/** Server occupancy. The planner must not trust intervals supplied by the browser. */
export async function loadCopyOccupancy(hours: WorkshopHours): Promise<{ ok: true; holds: Hold[] } | { ok: false }> {
  if (!liveCrmCopyUrl()) return { ok: false };
  let client: Client;
  try {
    client = await connectLiveCrmCopy();
  } catch {
    return { ok: false };
  }
  try {
    const docs = await client.query<{ doc: StoredDoc }>(
      `select doc from appointments
       where coalesce(doc->>'appointmentStatus', '') not in ('cancelled', 'completed')
         and coalesce(doc->>'calendarHidden', '') <> 'true'
         and coalesce(doc->>'visitState', '') <> 'no_show'`
    );
    const holds: Hold[] = [];
    for (const row of docs.rows) {
      const doc = row.doc;
      if (!doc?.date || !doc.workStart || !doc.mechanicId || !doc.workMinutes) continue;
      const split = blocksFor(doc, hours);
      if (!split.ok) return { ok: false };
      holds.push(...split.blocks.map((block, index) => ({
        id: `${doc.id}:${index}`,
        mechanicId: block.mechanicId,
        resourceIds: block.resourceIds,
        startMs: block.startMs,
        endMs: block.endMs,
        operationCode: "crm",
        active: true,
      })));
    }
    return { ok: true, holds };
  } catch {
    return { ok: false };
  } finally {
    await client.end();
  }
}
