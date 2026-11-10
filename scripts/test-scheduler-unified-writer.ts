import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";
import { workshopHours } from "../src/lib/businessConfig";
import { parseOperationCatalog } from "../src/lib/smart-scheduler/catalog";
import type { BookingActor } from "../src/lib/smart-scheduler/booking-rules";
import { commitLiveCalendar, commitSchedulerToCrm, connectLiveCrmCopy, type LiveCalendarInput } from "../src/lib/smart-scheduler/live-crm";
import { openActorSession } from "../src/lib/smart-scheduler/postgres";

delete process.env.VERCEL_ENV;
delete process.env.SUPABASE_URL;
if (!process.env.SCHEDULER_CRM_COPY_URL) {
  process.env.SCHEDULER_CRM_COPY_URL = "postgresql://ubuntu@/bess_crm_copy_test?host=/var/run/postgresql";
}

const hours = workshopHours();
const catalog = parseOperationCatalog(readFileSync(join(process.cwd(), "data/smart-scheduler/bess_operation_seed.csv"), "utf8"));
const oil = catalog.find((item) => item.operationCode === "MA-001");
if (!oil) throw new Error("catalog");

function input(actor: BookingActor, extra: Partial<LiveCalendarInput> & { appointmentId: string }): LiveCalendarInput {
  return {
    action: "create",
    kind: "scheduler",
    mechanicId: "mech-1",
    date: "2026-12-15",
    workStart: "10:00",
    workMinutes: 45,
    resourceId: "lift-1",
    arrivalTime: "09:30",
    hours,
    actor,
    operation: oil,
    parts: "available",
    ...extra,
  };
}

async function surface(client: Client, id: string): Promise<{ store: number; row: number; status: string | null }> {
  const store = await client.query<{ n: number }>(
    "select count(*)::int as n from crm_store, lateral jsonb_array_elements(doc->'appointments') item where item->>'id' = $1",
    [id]
  );
  const row = await client.query<{ n: number; status: string | null }>("select count(*)::int as n, max(doc->>'appointmentStatus') as status from appointments where id = $1", [id]);
  return { store: store.rows[0].n, row: row.rows[0].n, status: row.rows[0].status };
}

async function ensureDatabase(name: string): Promise<void> {
  const root = new Client({ connectionString: process.env.SCHEDULER_ADMIN_URL || "postgresql://ubuntu@/postgres?host=/var/run/postgresql" });
  await root.connect();
  const found = await root.query("select 1 from pg_database where datname = $1", [name]);
  if (!found.rowCount) await root.query(`create database ${name}`);
  await root.end();
}

async function main(): Promise<void> {
  await ensureDatabase("bess_crm_copy_test");
  const admin = await connectLiveCrmCopy();
  await admin.query(readFileSync(join(process.cwd(), "supabase/crm_store.sql"), "utf8"));
  await admin.query(readFileSync(join(process.cwd(), "supabase/appointments.sql"), "utf8"));
  await admin.query(readFileSync(join(process.cwd(), "supabase/drafts/smart-scheduler.sql"), "utf8"));
  await admin.query("delete from scheduler_resource_holds");
  await admin.query("delete from scheduler_holds");
  await admin.query("delete from scheduler_change_log");
  await admin.query("delete from scheduler_crm_occupancy");
  await admin.query("delete from scheduler_reservations");
  await admin.query("delete from appointments");
  await admin.query("delete from crm_store");
  await admin.query("select scheduler_set_unified_calendar(true)");
  await admin.query("update scheduler_resources set status = 'available', confirmed = true, udt_permit_confirmed = true");
  const owner = await openActorSession(admin, { role: "owner", staffId: "owner-copy", canEdit: true });
  const other = await openActorSession(admin, { role: "admin", staffId: "admin-copy", canEdit: true });

  const blockedLift = await admin.query("update scheduler_resources set udt_permit_confirmed = false where id = 'lift-1'");
  assert.equal(blockedLift.rowCount, 1);
  const unconfirmedLift = await commitSchedulerToCrm(input(owner, { appointmentId: "apt-no-udt", idempotencyKey: "no-udt" }));
  assert.equal(unconfirmedLift.status, 409);
  assert.equal(unconfirmedLift.crmWritten, false);
  assert.equal((await surface(admin, "apt-no-udt")).row, 0);
  await admin.query("update scheduler_resources set udt_permit_confirmed = true where id = 'lift-1'");

  const unconfirmedMechanic = await commitSchedulerToCrm(input(owner, { appointmentId: "apt-mech-2", mechanicId: "mech-2", resourceId: "lift-2", idempotencyKey: "mech-2" }));
  assert.equal(unconfirmedMechanic.status, 409);
  assert.equal(unconfirmedMechanic.error, "mechanic_not_confirmed");
  assert.equal(unconfirmedMechanic.crmWritten, false);

  const created = await commitSchedulerToCrm(input(owner, {
    appointmentId: "apt-copy-1",
    idempotencyKey: "copy-1",
    clientName: "Тест Копия",
    clientPhone: "+48 500 100 200",
    confirmNewClient: true,
    make: "Audi",
    model: "A4",
    vin: "WAUZZZTESTVIN0001",
    plate: "WX 12345",
    confirmNewVehicle: true,
    serviceIds: ["oil"],
    comment: "копия",
  }));
  assert.equal(created.status, 200);
  assert.equal(created.crmWritten, true);
  assert.equal(created.createdClient, true);
  assert.equal(created.createdOrder, false);
  const row = await surface(admin, "apt-copy-1");
  assert.equal(row.store, 1);
  assert.equal(row.row, 1);
  assert.equal(row.status, "scheduled");
  const users = await admin.query<{ n: number }>("select count(*)::int as n from crm_store, lateral jsonb_array_elements(doc->'users') item where item->>'phone' = '48500100200' or item->>'phone' = '+48 500 100 200'");
  assert.equal(users.rows[0].n, 1);

  const replay = await commitSchedulerToCrm(input(owner, {
    appointmentId: "apt-copy-other",
    idempotencyKey: "copy-1",
    clientName: "Тест Копия",
    clientPhone: "48500100200",
    confirmNewClient: true,
    vin: "WAUZZZTESTVIN0001",
    plate: "WX 12345",
    confirmNewVehicle: true,
  }));
  assert.equal(replay.status, 200);
  assert.equal(replay.replayed, true);
  assert.equal(replay.crmWritten, false);
  assert.equal((await surface(admin, "apt-copy-other")).row, 0);
  assert.equal((await admin.query("select count(*)::int as n from appointments")).rows[0].n, 1);

  const again = await commitSchedulerToCrm(input(owner, {
    appointmentId: "apt-copy-2",
    idempotencyKey: "copy-2",
    date: "2026-12-16",
    clientName: "Другое имя",
    clientPhone: "48 500 100 200",
    make: "Audi",
    model: "A4",
    vin: "WAUZZZTESTVIN0001",
    plate: "WX 12345",
  }));
  assert.equal(again.status, 200);
  assert.equal(again.createdClient, false);
  const vehicleCount = await admin.query<{ n: number }>("select count(*)::int as n from crm_store, lateral jsonb_array_elements(doc->'vehicles') item where upper(item->>'vin') = 'WAUZZZTESTVIN0001'");
  assert.equal(vehicleCount.rows[0].n, 1);
  const orders = await admin.query<{ n: number }>("select coalesce(jsonb_array_length(doc->'workOrders'), 0)::int as n from crm_store where id = 'main'");
  assert.equal(orders.rows[0].n, 0);

  const [createA, createB] = await Promise.all([
    commitSchedulerToCrm(input(owner, { appointmentId: "apt-race-a", idempotencyKey: "race-a", date: "2026-12-19", workStart: "10:00" })),
    commitSchedulerToCrm(input(other, { appointmentId: "apt-race-b", idempotencyKey: "race-b", date: "2026-12-19", workStart: "10:00" })),
  ]);
  const creates = [createA, createB];
  assert.equal(creates.filter((item) => item.status === 200 && item.crmWritten).length, 1);
  assert.equal(creates.filter((item) => item.status === 409).length, 1);
  assert.equal((await admin.query<{ n: number }>("select count(*)::int as n from appointments where id in ('apt-race-a', 'apt-race-b')")).rows[0].n, 1);

  const mechanicClash = await commitSchedulerToCrm(input(owner, {
    appointmentId: "apt-mech-clash",
    idempotencyKey: "mech-clash",
    date: "2026-12-15",
    workStart: "10:15",
    resourceId: "lift-2",
  }));
  assert.equal(mechanicClash.status, 409);
  assert.equal(mechanicClash.crmWritten, false);
  assert.equal((await surface(admin, "apt-mech-clash")).row, 0);

  const { issueCrmSnapshot } = await import("../src/lib/smart-scheduler/postgres");
  const liftIssued = await issueCrmSnapshot(admin, true);
  if (!liftIssued.ok) throw new Error(liftIssued.error);
  const liftClash = await commitLiveCalendar(admin, input(owner, {
    kind: "legacy",
    appointmentId: "apt-lift-clash",
    mechanicId: "mech-2",
    date: "2026-12-15",
    workStart: "10:15",
    resourceId: "lift-1",
    crmToken: liftIssued.token,
  }));
  assert.equal(liftClash.status, 409);
  assert.equal(liftClash.crmWritten, false);
  assert.equal((await surface(admin, "apt-lift-clash")).row, 0);

  const stale = await commitSchedulerToCrm(input(owner, {
    action: "move",
    appointmentId: "apt-copy-1",
    workStart: "15:00",
    expectedVersion: 99,
    idempotencyKey: "stale-move",
  }));
  assert.equal(stale.status, 409);
  assert.equal(stale.error, "version_conflict");
  assert.equal((await admin.query<{ start: string }>("select doc->>'workStart' as start from appointments where id = 'apt-copy-1'")).rows[0].start, "10:00");

  const [firstMove, secondMove] = await Promise.all([
    commitSchedulerToCrm(input(other, { action: "move", appointmentId: "apt-copy-1", workStart: "12:00", expectedVersion: 1 })),
    commitSchedulerToCrm(input(owner, { action: "move", appointmentId: "apt-copy-1", workStart: "13:00", expectedVersion: 1 })),
  ]);
  const moves = [firstMove, secondMove];
  assert.equal(moves.filter((item) => item.status === 200 && item.crmWritten).length, 1);
  assert.equal(moves.filter((item) => item.status === 409).length, 1);
  const moved = await admin.query<{ start: string }>("select doc->>'workStart' as start from appointments where id = 'apt-copy-1'");
  const movedStore = await admin.query<{ start: string }>("select item->>'workStart' as start from crm_store, lateral jsonb_array_elements(doc->'appointments') item where item->>'id' = 'apt-copy-1'");
  assert.equal(moved.rows[0].start, movedStore.rows[0].start);
  assert.ok(moved.rows[0].start === "12:00" || moved.rows[0].start === "13:00");

  const left = await connectLiveCrmCopy();
  const right = await connectLiveCrmCopy();
  const leftActor = await openActorSession(left, { role: "owner", staffId: "owner-left", canEdit: true });
  const rightActor = await openActorSession(right, { role: "admin", staffId: "admin-right", canEdit: true });
  const tokenLeft = await (await import("../src/lib/smart-scheduler/postgres")).issueCrmSnapshot(left, true);
  const tokenRight = await (await import("../src/lib/smart-scheduler/postgres")).issueCrmSnapshot(right, true);
  if (!tokenLeft.ok || !tokenRight.ok) throw new Error("snapshot");
  const pair = await Promise.all([
    commitLiveCalendar(left, input(leftActor, { appointmentId: "apt-race-old", kind: "legacy", date: "2026-12-17", workStart: "11:00", crmToken: tokenLeft.token })),
    commitLiveCalendar(right, input(rightActor, { appointmentId: "apt-race-new", date: "2026-12-17", workStart: "11:00", idempotencyKey: "race-new", crmToken: tokenRight.token })),
  ]);
  assert.equal(pair.filter((item) => item.status === 200).length, 1);
  assert.equal(pair.filter((item) => item.status === 409).length, 1);
  assert.equal(pair.filter((item) => item.crmWritten).length, 1);
  const digest = await admin.query<{ store: string; row: string }>("select scheduler_live_digest('store') as store, scheduler_live_digest('row') as row");
  assert.equal(digest.rows[0].store, digest.rows[0].row);
  await left.end();
  await right.end();

  const before = await admin.query<{ n: number }>("select count(*)::int as n from appointments");
  const issued = await issueCrmSnapshot(admin, true);
  if (!issued.ok) throw new Error(issued.error);
  const rolledWrite = await commitLiveCalendar(admin, input(owner, { appointmentId: "apt-partial", date: "2026-12-18", idempotencyKey: "partial", failpoint: "after-store", crmToken: issued.token }));
  assert.equal(rolledWrite.status, 409);
  assert.equal(rolledWrite.error, "rolled_back");
  assert.equal(rolledWrite.crmWritten, false);
  assert.equal((await admin.query<{ n: number }>("select count(*)::int as n from appointments")).rows[0].n, before.rows[0].n);

  const version = await admin.query<{ version: number }>("select version from scheduler_reservations where appointment_id = 'apt-copy-1'");
  const cancelled = await commitSchedulerToCrm(input(owner, { action: "cancel", appointmentId: "apt-copy-1", expectedVersion: version.rows[0].version }));
  assert.equal(cancelled.status, 200);
  assert.equal(cancelled.crmWritten, true);
  const kept = await surface(admin, "apt-copy-1");
  assert.equal(kept.row, 1);
  assert.equal(kept.status, "cancelled");
  const history = await admin.query<{ n: number }>("select count(*)::int as n from scheduler_change_log where appointment_id = 'apt-copy-1'");
  assert.ok(history.rows[0].n >= 2);

  const downUrl = process.env.SCHEDULER_CRM_COPY_URL;
  process.env.SCHEDULER_CRM_COPY_URL = "postgresql://ubuntu@127.0.0.1:1/bess_crm_copy_test";
  const down = await commitSchedulerToCrm(input(owner, { appointmentId: "apt-down", idempotencyKey: "down" }));
  process.env.SCHEDULER_CRM_COPY_URL = downUrl;
  assert.equal(down.status, 503);
  assert.equal(down.crmWritten, false);
  assert.equal((await surface(admin, "apt-down")).row, 0);

  await admin.end();
  await rollbackCopy();
  console.log("scheduler unified writer ok");
}

async function rollbackCopy(): Promise<void> {
  const adminUrl = process.env.SCHEDULER_ADMIN_URL || "postgresql://ubuntu@/postgres?host=/var/run/postgresql";
  const root = new Client({ connectionString: adminUrl });
  await root.connect();
  await root.query("drop database if exists bess_crm_rollback_test");
  await root.query("create database bess_crm_rollback_test");
  await root.end();
  const copy = new Client({ connectionString: adminUrl.replace(/\/postgres(?=$|\?)/, "/bess_crm_rollback_test") });
  await copy.connect();
  const name = await copy.query<{ name: string }>("select current_database() as name");
  assert.equal(name.rows[0].name, "bess_crm_rollback_test");
  await copy.query(readFileSync(join(process.cwd(), "supabase/crm_store.sql"), "utf8"));
  await copy.query(readFileSync(join(process.cwd(), "supabase/appointments.sql"), "utf8"));
  await copy.query(readFileSync(join(process.cwd(), "supabase/drafts/smart-scheduler.sql"), "utf8"));
  await copy.query("insert into appointments (id, client_phone, user_id, doc) values ('kept', '48500100200', 'user-1', '{\"id\":\"kept\",\"appointmentStatus\":\"scheduled\"}'::jsonb)");
  await copy.query(readFileSync(join(process.cwd(), "supabase/drafts/smart-scheduler-rollback.sql"), "utf8"));
  const kept = await copy.query<{ n: number }>("select count(*)::int as n from appointments where id = 'kept'");
  assert.equal(kept.rows[0].n, 1);
  const gone = await copy.query<{ n: number }>("select count(*)::int as n from pg_tables where schemaname = 'public' and tablename = 'scheduler_reservations'");
  assert.equal(gone.rows[0].n, 0);
  await copy.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
