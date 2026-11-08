import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { workshopHours } from "../src/lib/businessConfig";
import { parseOperationCatalog } from "../src/lib/smart-scheduler/catalog";
import { upcomingMonday } from "../src/lib/smart-scheduler/fixture";
import {
  applySchedulerSchema,
  bookInDatabase,
  cancelInDatabase,
  connectSchedulerDatabase,
  moveInDatabase,
  saveDisplayName,
} from "../src/lib/smart-scheduler/postgres";

process.env.SCHEDULER_DATABASE_URL = "postgresql://ubuntu@/bess_scheduler_test?host=/var/run/postgresql";
delete process.env.VERCEL_ENV;
delete process.env.SUPABASE_URL;

const hours = workshopHours();
const catalog = parseOperationCatalog(readFileSync(join(process.cwd(), "data/smart-scheduler/bess_operation_seed.csv"), "utf8"));
const oil = catalog.find((item) => item.operationCode === "MA-001");
const pads = catalog.find((item) => item.operationCode === "BR-001");
if (!oil || !pads) throw new Error("catalog");
const oilOperation = oil;
const padsOperation = pads;
const monday = upcomingMonday(new Date("2026-11-08T12:00:00Z"));

async function main() {
  const admin = await connectSchedulerDatabase();
  await admin.query(`
    drop table if exists public.scheduler_resource_holds, public.scheduler_holds, public.scheduler_reservations,
      public.scheduler_actuals, public.scheduler_breaks, public.scheduler_time_off, public.scheduler_shifts,
      public.scheduler_display_names, public.scheduler_resources, public.scheduler_overlap_rules, public.scheduler_operations cascade
  `);
  await applySchedulerSchema(admin);
  const breaks = await admin.query<{ n: number }>("select count(*)::int as n from scheduler_breaks");
  assert.equal(breaks.rows[0].n, 0);
  const resources = await admin.query<{ status: string; confirmed: boolean }>("select status, confirmed from scheduler_resources");
  assert.equal(resources.rows.length, 6);
  assert.equal(resources.rows.every((row) => row.status === "maintenance" && row.confirmed === false), true);

  const blocked = await bookInDatabase(admin, {
    idempotencyKey: "before-confirm",
    date: monday,
    start: "11:00",
    minutes: 45,
    mechanicId: "mech-1",
    resourceIds: ["lift-1"],
    operation: oilOperation,
    parts: "available",
    hours,
  });
  assert.equal(blocked.status, 409);
  assert.equal(blocked.error, "equipment");
  assert.equal(blocked.persisted, false);

  await admin.query("update scheduler_resources set status = 'available', confirmed = true where id in ('lift-1', 'lift-2')");
  const missingParts = await bookInDatabase(admin, {
    idempotencyKey: "missing-parts",
    date: monday,
    start: "11:00",
    minutes: 45,
    mechanicId: "mech-1",
    resourceIds: ["lift-1"],
    operation: oilOperation,
    parts: "unknown",
    hours,
  });
  assert.equal(missingParts.error, "parts");

  const sergey = await bookInDatabase(admin, {
    idempotencyKey: "sergey-oil",
    date: monday,
    start: "11:00",
    minutes: 45,
    mechanicId: "mech-1",
    resourceIds: ["lift-1"],
    operation: oilOperation,
    parts: "available",
    hours,
    workOrderId: "wo-test-1",
  });
  assert.equal(sergey.status, 200);
  assert.equal(sergey.crmWritten, false);
  assert.equal(sergey.createdClient, false);
  const other = await connectSchedulerDatabase();
  const padsResult = await bookInDatabase(other, {
    idempotencyKey: "pads-lift-2",
    date: monday,
    start: "11:20",
    minutes: 60,
    mechanicId: "mech-2",
    resourceIds: ["lift-2"],
    operation: padsOperation,
    parts: "available",
    hours,
    workOrderId: "wo-test-2",
  });
  assert.equal(padsResult.status, 200);

  const sameLift = await moveInDatabase(other, {
    reservationId: padsResult.id ?? "",
    date: monday,
    start: "11:20",
    minutes: 60,
    mechanicId: "mech-2",
    resourceIds: ["lift-1"],
    operation: padsOperation,
    parts: "available",
    hours,
  });
  assert.equal(sameLift.status, 409);
  assert.equal(sameLift.error, "conflict");
  const stillSecondLift = await other.query<{ resource_id: string }>(
    "select resource_id from scheduler_resource_holds where active and hold_id in (select id from scheduler_holds where reservation_id = $1 and active)",
    [padsResult.id]
  );
  assert.deepEqual(stillSecondLift.rows.map((row) => row.resource_id), ["lift-2"]);

  const sameMechanic = await moveInDatabase(other, {
    reservationId: padsResult.id ?? "",
    date: monday,
    start: "11:20",
    minutes: 60,
    mechanicId: "mech-1",
    resourceIds: ["lift-2"],
    operation: padsOperation,
    parts: "available",
    hours,
  });
  assert.equal(sameMechanic.status, 409);
  const next = await bookInDatabase(admin, {
    idempotencyKey: "sergey-next",
    date: monday,
    start: "11:45",
    minutes: 45,
    mechanicId: "mech-1",
    resourceIds: ["lift-1"],
    operation: oilOperation,
    parts: "available",
    hours,
  });
  assert.equal(next.status, 200);

  const replay = await bookInDatabase(admin, {
    idempotencyKey: "sergey-oil",
    date: monday,
    start: "11:00",
    minutes: 45,
    mechanicId: "mech-1",
    resourceIds: ["lift-1"],
    operation: oilOperation,
    parts: "available",
    hours,
  });
  assert.equal(replay.replayed, true);
  assert.equal(replay.id, sergey.id);

  const left = await connectSchedulerDatabase();
  const right = await connectSchedulerDatabase();
  const race = await Promise.all([
    bookInDatabase(left, { idempotencyKey: "race-a", date: monday, start: "15:00", minutes: 30, mechanicId: "mech-1", resourceIds: ["lift-1"], operation: oilOperation, parts: "available", hours }),
    bookInDatabase(right, { idempotencyKey: "race-b", date: monday, start: "15:00", minutes: 30, mechanicId: "mech-1", resourceIds: ["lift-2"], operation: padsOperation, parts: "available", hours }),
  ]);
  assert.equal(race.filter((item) => item.status === 200).length, 1);
  assert.equal(race.filter((item) => item.status === 409).length, 1);

  await admin.query("begin");
  await admin.query("insert into scheduler_reservations (id, idempotency_key, operation_code, mechanic_id, parts_status) values ('res-partial', 'partial', 'MA-001', 'mech-2', 'available')");
  await admin.query("rollback");
  const partial = await admin.query<{ n: number }>("select count(*)::int as n from scheduler_reservations where id = 'res-partial'");
  assert.equal(partial.rows[0].n, 0);

  const cancelled = await cancelInDatabase(other, padsResult.id ?? "");
  assert.equal(cancelled.status, 200);
  const freed = await bookInDatabase(other, {
    idempotencyKey: "pads-again",
    date: monday,
    start: "11:20",
    minutes: 60,
    mechanicId: "mech-2",
    resourceIds: ["lift-2"],
    operation: padsOperation,
    parts: "available",
    hours,
  });
  assert.equal(freed.status, 200);
  const activeOld = await other.query<{ n: number }>("select count(*)::int as n from scheduler_holds where reservation_id = $1 and active", [padsResult.id]);
  assert.equal(activeOld.rows[0].n, 0);

  const sunday = await bookInDatabase(admin, {
    idempotencyKey: "sunday",
    date: "2026-11-15",
    start: "11:00",
    minutes: 45,
    mechanicId: "mech-2",
    resourceIds: ["lift-2"],
    operation: padsOperation,
    parts: "available",
    hours,
  });
  assert.equal(sunday.status, 409);

  await admin.query("insert into scheduler_shifts (mechanic_id, shift_start) values ('mech-1', '12:00')");
  const early = await bookInDatabase(admin, {
    idempotencyKey: "before-shift",
    date: "2026-11-10",
    start: "11:00",
    minutes: 45,
    mechanicId: "mech-1",
    resourceIds: ["lift-1"],
    operation: oilOperation,
    parts: "available",
    hours,
  });
  assert.equal(early.error, "before_shift");
  await admin.query("delete from scheduler_shifts");
  await admin.query("insert into scheduler_time_off (id, mechanic_id, starts_on, ends_on, kind) values ('off-1', 'mech-1', '2026-11-10', '2026-11-10', 'vacation')");
  const vacation = await bookInDatabase(admin, {
    idempotencyKey: "vacation",
    date: "2026-11-10",
    start: "11:00",
    minutes: 45,
    mechanicId: "mech-1",
    resourceIds: ["lift-1"],
    operation: oilOperation,
    parts: "available",
    hours,
  });
  assert.equal(vacation.error, "absent");
  await saveDisplayName(admin, "mech-2", "Piotr Nowak");
  const named = await admin.query<{ mechanic_id: string }>("select mechanic_id from scheduler_reservations where id = $1", [freed.id]);
  assert.equal(named.rows[0].mechanic_id, "mech-2");
  const label = await admin.query<{ display_name: string }>("select display_name from scheduler_display_names where mechanic_id = 'mech-2'");
  assert.equal(label.rows[0].display_name, "Piotr Nowak");
  assert.notEqual(label.rows[0].display_name, "Андрей");

  await admin.query("begin");
  let anonDenied = false;
  try {
    await admin.query("set local role scheduler_anon");
    await admin.query("select count(*) from scheduler_holds");
  } catch (error) {
    anonDenied = /permission denied/i.test(String(error));
  }
  await admin.query("rollback");
  assert.equal(anonDenied, true);
  await admin.query("begin");
  await admin.query("set local role scheduler_staff");
  const staff = await admin.query<{ n: number }>("select count(*)::int as n from scheduler_holds");
  await admin.query("rollback");
  assert.ok(staff.rows[0].n > 0);

  await admin.query("truncate public.scheduler_resource_holds, public.scheduler_holds, public.scheduler_reservations, public.scheduler_breaks, public.scheduler_time_off, public.scheduler_shifts, public.scheduler_display_names");
  await admin.query("update public.scheduler_resources set status = 'maintenance', confirmed = false");
  await Promise.all([admin.end(), other.end(), left.end(), right.end()]);
  console.log("smart scheduler postgres ok");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
