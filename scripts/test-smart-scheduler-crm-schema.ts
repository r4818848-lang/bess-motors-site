import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";
import { workshopHours } from "../src/lib/businessConfig";
import { parseOperationCatalog } from "../src/lib/smart-scheduler/catalog";
import { canonicalCrmDigest } from "../src/lib/smart-scheduler/crm-reconcile";
import type { BookingActor } from "../src/lib/smart-scheduler/booking-rules";
import { commitLiveCalendar, connectLiveCrmCopy, type LiveCalendarInput } from "../src/lib/smart-scheduler/live-crm";
import { issueCrmSnapshot, openActorSession } from "../src/lib/smart-scheduler/postgres";

delete process.env.VERCEL_ENV;
delete process.env.SUPABASE_URL;

const hours = workshopHours();
const catalog = parseOperationCatalog(readFileSync(join(process.cwd(), "data/smart-scheduler/bess_operation_seed.csv"), "utf8"));
const oil = catalog.find((item) => item.operationCode === "MA-001");
if (!oil) throw new Error("catalog");

const existing = {
  id: "apt-existing",
  userId: "guest",
  vehicleId: "",
  serviceIds: ["otherReason"],
  date: "2026-12-01",
  time: "11:00",
  mechanicId: "mech-1",
  repairStatus: "received",
  appointmentStatus: "scheduled",
  comment: "",
  source: "manual",
  createdAt: "2026-12-01T08:00:00.000Z",
  workStart: "11:00",
  workMinutes: 45,
  resourceId: "lift-1",
  calendarHidden: false,
  visitState: "expected",
};

async function bootstrap(): Promise<void> {
  const admin = new Client({ connectionString: "postgresql://ubuntu@/postgres?host=/var/run/postgresql" });
  await admin.connect();
  await admin.query("select pg_terminate_backend(pid) from pg_stat_activity where datname = 'bess_crm_copy_test' and pid <> pg_backend_pid()");
  await admin.query("drop database if exists bess_crm_copy_test");
  await admin.query("create database bess_crm_copy_test");
  await admin.end();
}

async function denied(client: Client, role: string, sql: string): Promise<boolean> {
  await client.query("begin");
  await client.query(`set local role ${role}`);
  try {
    await client.query(sql);
    await client.query("rollback");
    return false;
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    await client.query("rollback");
    return code === "42501";
  }
}

async function freshToken(client: Client): Promise<string> {
  const issued = await issueCrmSnapshot(client, true);
  if (!issued.ok) throw new Error(issued.error);
  return issued.token;
}

async function surfaceCount(client: Client, appointmentId: string): Promise<{ store: number; row: number }> {
  const store = await client.query<{ n: number }>(
    "select count(*)::int as n from crm_store, lateral jsonb_array_elements(doc->'appointments') item where item->>'id' = $1",
    [appointmentId]
  );
  const row = await client.query<{ n: number }>("select count(*)::int as n from appointments where id = $1", [appointmentId]);
  return { store: store.rows[0].n, row: row.rows[0].n };
}

async function main() {
  await bootstrap();
  const admin = await connectLiveCrmCopy();
  await admin.query("set time zone 'UTC'");
  await admin.query(readFileSync(join(process.cwd(), "supabase/crm_store.sql"), "utf8"));
  await admin.query(readFileSync(join(process.cwd(), "supabase/appointments.sql"), "utf8"));
  await admin.query(readFileSync(join(process.cwd(), "supabase/drafts/smart-scheduler.sql"), "utf8"));
  await admin.query("update scheduler_resources set status = 'available', confirmed = true where id in ('lift-1', 'lift-2')");
  const owner: BookingActor = await openActorSession(admin, { role: "owner", staffId: "owner-1", canEdit: true });

  const warsaw = await admin.query<{ work_date: string; work_clock: string }>("select * from scheduler_warsaw_parts('2026-11-10 23:30:00+00')");
  assert.equal(warsaw.rows[0].work_date, "2026-11-11");
  assert.equal(warsaw.rows[0].work_clock, "00:30");
  const morning = await admin.query<{ work_date: string; work_clock: string }>("select * from scheduler_warsaw_parts('2026-11-10 10:00:00+00')");
  assert.equal(morning.rows[0].work_date, "2026-11-10");
  assert.equal(morning.rows[0].work_clock, "11:00");

  const switchedOff = await commitLiveCalendar(admin, liveInput(owner, { appointmentId: "apt-too-early", date: "2026-12-01", workStart: "12:00" }));
  assert.equal(switchedOff.status, 503);
  assert.equal(switchedOff.error, "unified_calendar_disabled");
  assert.deepEqual(await surfaceCount(admin, "apt-too-early"), { store: 0, row: 0 });

  assert.equal(await denied(admin, "scheduler_staff", "select scheduler_open_session('intruder', 'owner', null)"), true);
  assert.equal(await denied(admin, "scheduler_mechanic", "select scheduler_open_session('intruder', 'admin', 'mech-2')"), true);
  assert.equal(await denied(admin, "scheduler_staff", "insert into scheduler_actor_sessions (id, staff_id, actor_role, mechanic_id, db_role, expires_at) values ('ses-evil', 'other-staff', 'owner', null, 'scheduler_staff', now() + interval '5 minutes')"), true);
  assert.equal(await denied(admin, "scheduler_mechanic", "insert into scheduler_actor_sessions (id, staff_id, actor_role, mechanic_id, db_role, expires_at) values ('ses-evil-2', 'mech-1', 'mechanic', 'mech-2', 'scheduler_mechanic', now() + interval '5 minutes')"), true);
  assert.equal(await denied(admin, "scheduler_staff", "select scheduler_set_unified_calendar(true)"), true);

  await admin.query("select scheduler_set_unified_calendar(true)");
  await seedPair(admin, [existing, secondAppointment("apt-other", "mech-2", "12:00", 30)]);
  const sqlDigest = await admin.query<{ store: string; row: string }>("select scheduler_live_digest('store') as store, scheduler_live_digest('row') as row");
  const jsDigest = canonicalCrmDigest([existing, secondAppointment("apt-other", "mech-2", "12:00", 30)]);
  assert.equal(sqlDigest.rows[0].store, sqlDigest.rows[0].row);
  assert.equal(sqlDigest.rows[0].store, jsDigest);

  await admin.query("update appointments set doc = jsonb_set(doc, '{workStart}', '\"11:15\"') where id = 'apt-existing'");
  const diverged = await issueCrmSnapshot(admin, true);
  assert.equal(diverged.ok, false);
  if (!diverged.ok) assert.equal(diverged.error, "crm_diverged");
  const counts = await admin.query<{ store: number; row: number }>(
    "select (select count(*)::int from jsonb_array_elements((select doc->'appointments' from crm_store where id = 'main'))) as store, (select count(*)::int from appointments) as row"
  );
  assert.equal(counts.rows[0].store, counts.rows[0].row);
  await admin.query("update appointments set doc = jsonb_set(doc, '{workStart}', '\"11:00\"') where id = 'apt-existing'");

  const blockedScheduler = await commitLiveCalendar(admin, liveInput(owner, {
    kind: "scheduler",
    appointmentId: "apt-clash",
    date: "2026-12-01",
    workStart: "11:00",
    crmToken: await freshToken(admin),
  }));
  assert.equal(blockedScheduler.status, 409);
  assert.equal(await admin.query("select count(*)::int as n from scheduler_reservations").then((result) => result.rows[0].n), 0);

  const blockedLegacy = await commitLiveCalendar(admin, liveInput(owner, {
    appointmentId: "apt-clash-old",
    date: "2026-12-01",
    workStart: "11:20",
    crmToken: await freshToken(admin),
  }));
  assert.equal(blockedLegacy.status, 409);
  assert.deepEqual(await surfaceCount(admin, "apt-clash-old"), { store: 0, row: 0 });

  const booked = await commitLiveCalendar(admin, liveInput(owner, {
    kind: "scheduler",
    appointmentId: "apt-afternoon",
    date: "2026-12-01",
    workStart: "14:00",
    crmToken: await freshToken(admin),
  }));
  assert.equal(booked.status, 200);
  assert.equal(booked.crmWritten, false);
  assert.deepEqual(await surfaceCount(admin, "apt-afternoon"), { store: 1, row: 1 });
  assert.equal(await admin.query("select count(*)::int as n from scheduler_store_appointments").then((result) => result.rows[0].n), 0);
  assert.equal(await admin.query("select count(*)::int as n from scheduler_row_appointments").then((result) => result.rows[0].n), 0);
  const seenByOld = await commitLiveCalendar(admin, liveInput(owner, {
    appointmentId: "apt-old-sees-new",
    date: "2026-12-01",
    workStart: "14:15",
    resourceId: "lift-2",
    crmToken: await freshToken(admin),
  }));
  assert.equal(seenByOld.status, 409);

  await race(owner, "2026-12-02", "legacy-left");
  await race(owner, "2026-12-03", "scheduler-left");

  const moved = await commitLiveCalendar(admin, liveInput(owner, {
    action: "move",
    kind: "scheduler",
    appointmentId: "apt-afternoon",
    date: "2026-12-01",
    workStart: "16:00",
    expectedVersion: 1,
    crmToken: await freshToken(admin),
  }));
  assert.equal(moved.status, 200);
  const movedRow = await admin.query<{ start: string }>("select doc->>'workStart' as start from appointments where id = 'apt-afternoon'");
  const movedStore = await admin.query<{ start: string }>("select item->>'workStart' as start from crm_store, lateral jsonb_array_elements(doc->'appointments') item where item->>'id' = 'apt-afternoon'");
  assert.equal(movedRow.rows[0].start, "16:00");
  assert.equal(movedStore.rows[0].start, "16:00");
  const oldSlot = await commitLiveCalendar(admin, liveInput(owner, {
    appointmentId: "apt-after-move",
    date: "2026-12-01",
    workStart: "14:00",
    resourceId: "lift-2",
    crmToken: await freshToken(admin),
  }));
  assert.equal(oldSlot.status, 200);

  const cancelled = await commitLiveCalendar(admin, liveInput(owner, {
    action: "cancel",
    kind: "scheduler",
    appointmentId: "apt-afternoon",
    date: "2026-12-01",
    workStart: "16:00",
    expectedVersion: 2,
    crmToken: await freshToken(admin),
  }));
  assert.equal(cancelled.status, 200);
  const cancelledStatus = await admin.query<{ status: string; active: string }>("select doc->>'appointmentStatus' as status, case when doc->>'calendarHidden' = 'true' then '0' else '1' end as active from appointments where id = 'apt-afternoon'");
  assert.equal(cancelledStatus.rows[0].status, "cancelled");
  assert.equal(cancelledStatus.rows[0].active, "0");

  const saturday = await commitLiveCalendar(admin, liveInput(owner, {
    appointmentId: "apt-saturday",
    mechanicId: "mech-1",
    date: "2026-12-05",
    workStart: "09:00",
    workMinutes: 30,
    resourceId: "lift-2",
    crmToken: await freshToken(admin),
  }));
  assert.equal(saturday.status, 200);
  const spill = await commitLiveCalendar(admin, liveInput(owner, {
    kind: "scheduler",
    appointmentId: "apt-spill",
    date: "2026-12-04",
    workStart: "17:30",
    workMinutes: 60,
    crmToken: await freshToken(admin),
  }));
  assert.equal(spill.status, 409);
  assert.deepEqual(await surfaceCount(admin, "apt-spill"), { store: 0, row: 0 });

  const before = await admin.query<{ store: string }>("select scheduler_live_digest('store') as store");
  const rolled = await commitLiveCalendar(admin, liveInput(owner, {
    appointmentId: "apt-partial",
    date: "2026-12-08",
    workStart: "10:00",
    resourceId: "lift-2",
    crmToken: await freshToken(admin),
    failpoint: "after-store",
  }));
  assert.equal(rolled.status, 409);
  assert.equal(rolled.error, "rolled_back");
  const after = await admin.query<{ store: string }>("select scheduler_live_digest('store') as store");
  assert.equal(after.rows[0].store, before.rows[0].store);
  assert.deepEqual(await surfaceCount(admin, "apt-partial"), { store: 0, row: 0 });

  await admin.query("begin");
  await admin.query("update crm_store set doc = jsonb_set(doc, '{appointments}', (doc->'appointments') || '[{\"id\":\"partial-sql\"}]'::jsonb)");
  let partialFailed = false;
  try {
    await admin.query("insert into appointments (id, client_phone, user_id, doc) values ('partial-sql', '', 'guest', null)");
  } catch {
    partialFailed = true;
  }
  assert.equal(partialFailed, true);
  await admin.query("rollback");
  assert.equal((await surfaceCount(admin, "partial-sql")).store, 0);

  await admin.query("select scheduler_set_unified_calendar(false)");
  const disabledAgain = await commitLiveCalendar(admin, liveInput(owner, {
    appointmentId: "apt-after-off",
    date: "2026-12-08",
    workStart: "11:00",
    crmToken: await freshToken(admin),
  }));
  assert.equal(disabledAgain.error, "unified_calendar_disabled");
  await admin.end();
  console.log("smart scheduler crm schema ok");

  function liveInput(actor: BookingActor, extra: Partial<LiveCalendarInput> & { appointmentId: string; date: string; workStart: string }): LiveCalendarInput {
    return {
      action: "create",
      kind: "legacy",
      mechanicId: "mech-1",
      workMinutes: 45,
      resourceId: "lift-1",
      hours,
      actor,
      operation: oil,
      parts: "available",
      ...extra,
    };
  }

  async function seedPair(client: Client, docs: unknown[]): Promise<void> {
    const store = { appointments: docs, mechanics: [{ id: "mech-1", name: "Сергей" }, { id: "mech-2", name: "Piotr Nowak" }], users: [], vehicles: [], workOrders: [] };
    await client.query("insert into crm_store (id, doc) values ('main', $1::jsonb)", [JSON.stringify(store)]);
    for (const doc of docs) {
      const row = doc as { id: string };
      await client.query("insert into appointments (id, client_phone, user_id, doc) values ($1, '', 'guest', $2::jsonb)", [row.id, JSON.stringify(doc)]);
    }
  }

  async function race(actor: BookingActor, date: string, winnerSide: "legacy-left" | "scheduler-left"): Promise<void> {
    const left = await connectLiveCrmCopy();
    const right = await connectLiveCrmCopy();
    await left.query("set time zone 'UTC'");
    await right.query("set time zone 'UTC'");
    const leftToken = await freshToken(left);
    const rightToken = await freshToken(right);
    const legacy = liveInput(actor, { appointmentId: `apt-${date}-old`, date, workStart: "11:00", crmToken: winnerSide === "legacy-left" ? leftToken : rightToken });
    const scheduler = liveInput(actor, { kind: "scheduler", appointmentId: `apt-${date}-new`, date, workStart: "11:00", crmToken: winnerSide === "scheduler-left" ? leftToken : rightToken });
    const pair = winnerSide === "legacy-left"
      ? await Promise.all([commitLiveCalendar(left, legacy), commitLiveCalendar(right, scheduler)])
      : await Promise.all([commitLiveCalendar(left, scheduler), commitLiveCalendar(right, legacy)]);
    const successes = pair.filter((item) => item.status === 200);
    const conflicts = pair.filter((item) => item.status === 409);
    assert.equal(successes.length, 1);
    assert.equal(conflicts.length, 1);
    const digests = await admin.query<{ store: string; row: string }>("select scheduler_live_digest('store') as store, scheduler_live_digest('row') as row");
    assert.equal(digests.rows[0].store, digests.rows[0].row);
    await Promise.all([left.end(), right.end()]);
  }
}

function secondAppointment(id: string, mechanicId: string, workStart: string, workMinutes: number) {
  return { ...existing, id, mechanicId, time: workStart, workStart, workMinutes, resourceId: mechanicId === "mech-2" ? "lift-2" : "lift-1" };
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
