import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { workshopHours } from "../src/lib/businessConfig";
import { warsawCivilToUtc } from "../src/lib/workshop-schedule";
import type { BookingActor } from "../src/lib/smart-scheduler/booking-rules";
import { parseOperationCatalog } from "../src/lib/smart-scheduler/catalog";
import { schedulerCrmWritesEnabled } from "../src/lib/smart-scheduler/flag";
import { upcomingMonday } from "../src/lib/smart-scheduler/fixture";
import {
  applySchedulerSchema,
  bookInDatabase,
  cancelInDatabase,
  commitUnifiedWorkshopWrite,
  connectSchedulerDatabase,
  moveInDatabase,
  recordApproval,
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
    drop table if exists public.scheduler_resource_holds, public.scheduler_holds, public.scheduler_crm_occupancy,
      public.scheduler_approvals, public.scheduler_reservations,
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
    expectedVersion: 1,
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
    expectedVersion: 1,
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
  await admin.query("select set_config('app.actor_role', 'owner', true)");
  await admin.query("select set_config('app.actor_mechanic', '', true)");
  await admin.query("insert into scheduler_reservations (id, idempotency_key, request_fingerprint, operation_code, mechanic_id, parts_status) values ('res-partial', 'partial', 'partial', 'MA-001', 'mech-2', 'available')");
  await admin.query("rollback");
  const partial = await admin.query<{ n: number }>("select count(*)::int as n from scheduler_reservations where id = 'res-partial'");
  assert.equal(partial.rows[0].n, 0);

  const cancelled = await cancelInDatabase(other, padsResult.id ?? "", 1);
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

  const fuel = catalog.find((item) => item.operationCode === "MA-006");
  const tube = catalog.find((item) => item.operationCode === "BR-010");
  if (!fuel || !tube) throw new Error("catalog");
  const mechanic: BookingActor = { role: "mechanic", mechanicId: "mech-1", canEdit: true, id: "mech-1" };
  const owner: BookingActor = { role: "owner", canEdit: true, id: "owner-1" };
  await admin.query("delete from scheduler_time_off");
  assert.equal(schedulerCrmWritesEnabled(), false);

  const emptyLift = await bookInDatabase(admin, {
    idempotencyKey: "no-lift",
    date: "2026-11-10",
    start: "12:00",
    minutes: 45,
    mechanicId: "mech-2",
    resourceIds: [],
    operation: oilOperation,
    parts: "available",
    hours,
  });
  assert.equal(emptyLift.error, "equipment");

  const crmStart = warsawCivilToUtc("2026-11-10", "09:00");
  const crmEnd = warsawCivilToUtc("2026-11-10", "09:45");
  if (!crmStart || !crmEnd) throw new Error("crm clock");
  const crm = [{ id: "crm-1", appointmentId: "apt-existing", mechanicId: "mech-1", resourceId: "lift-1", startMs: crmStart.getTime(), endMs: crmEnd.getTime() }];
  const crmLift = await bookInDatabase(admin, {
    idempotencyKey: "crm-same-lift",
    date: "2026-11-10",
    start: "09:00",
    minutes: 45,
    mechanicId: "mech-2",
    resourceIds: ["lift-1"],
    operation: oilOperation,
    parts: "available",
    hours,
    crmSnapshot: crm,
  });
  assert.equal(crmLift.error, "crm_conflict");
  const besideCrm = await bookInDatabase(admin, {
    idempotencyKey: "beside-crm",
    date: "2026-11-10",
    start: "09:00",
    minutes: 45,
    mechanicId: "mech-2",
    resourceIds: ["lift-2"],
    operation: padsOperation,
    parts: "available",
    hours,
    crmSnapshot: crm,
  });
  assert.equal(besideCrm.status, 200);
  assert.equal(besideCrm.crmWritten, false);
  const onCrm = await bookInDatabase(admin, {
    idempotencyKey: "on-crm-mechanic",
    date: "2026-11-10",
    start: "09:00",
    minutes: 45,
    mechanicId: "mech-1",
    resourceIds: ["lift-2"],
    operation: oilOperation,
    parts: "available",
    hours,
    crmSnapshot: crm,
  });
  assert.equal(onCrm.error, "crm_conflict");
  const crmLeftover = await admin.query<{ n: number }>("select count(*)::int as n from scheduler_reservations where idempotency_key = 'on-crm-mechanic'");
  assert.equal(crmLeftover.rows[0].n, 0);

  const parallel = await Promise.all([
    bookInDatabase(left, { idempotencyKey: "parallel-1", date: "2026-11-12", start: "09:00", minutes: 45, mechanicId: "mech-1", resourceIds: ["lift-1"], operation: oilOperation, parts: "available", hours }),
    bookInDatabase(right, { idempotencyKey: "parallel-2", date: "2026-11-12", start: "09:00", minutes: 45, mechanicId: "mech-2", resourceIds: ["lift-2"], operation: padsOperation, parts: "available", hours }),
  ]);
  assert.equal(parallel.every((item) => item.status === 200), true);
  const sameLiftRace = await Promise.all([
    bookInDatabase(left, { idempotencyKey: "lift-race-a", date: "2026-11-12", start: "10:00", minutes: 45, mechanicId: "mech-1", resourceIds: ["lift-1"], operation: oilOperation, parts: "available", hours }),
    bookInDatabase(right, { idempotencyKey: "lift-race-b", date: "2026-11-12", start: "10:00", minutes: 45, mechanicId: "mech-2", resourceIds: ["lift-1"], operation: oilOperation, parts: "available", hours }),
  ]);
  assert.equal(sameLiftRace.filter((item) => item.status === 200).length, 1);
  assert.equal(sameLiftRace.filter((item) => item.error === "conflict" || item.error === "crm_conflict").length, 1);

  const stolenCancel = await cancelInDatabase(admin, freed.id ?? "", 1, mechanic);
  assert.equal(stolenCancel.status, 403);
  const stolenMove = await moveInDatabase(admin, {
    reservationId: freed.id ?? "",
    expectedVersion: 1,
    date: monday,
    start: "16:00",
    minutes: 60,
    mechanicId: "mech-1",
    resourceIds: ["lift-1"],
    operation: padsOperation,
    parts: "available",
    hours,
    actor: mechanic,
  });
  assert.equal(stolenMove.status, 403);
  const untouched = await admin.query<{ mechanic_id: string; active: boolean; version: number }>("select mechanic_id, active, version from scheduler_reservations where id = $1", [freed.id]);
  assert.equal(untouched.rows[0].mechanic_id, "mech-2");
  assert.equal(untouched.rows[0].active, true);
  assert.equal(untouched.rows[0].version, 1);
  let sqlForbidden = false;
  await admin.query("begin");
  try {
    await admin.query("select set_config('app.actor_role', 'mechanic', true)");
    await admin.query("select set_config('app.actor_mechanic', 'mech-1', true)");
    await admin.query("update scheduler_reservations set mechanic_id = 'mech-1' where id = $1", [freed.id]);
  } catch (error) {
    sqlForbidden = typeof error === "object" && error !== null && "code" in error && error.code === "42501";
  }
  await admin.query("rollback");
  assert.equal(sqlForbidden, true);

  const unapproved = await bookInDatabase(admin, {
    idempotencyKey: "fuel-open",
    date: "2026-11-10",
    start: "14:00",
    minutes: 45,
    mechanicId: "mech-1",
    resourceIds: ["ac-1"],
    operation: fuel,
    parts: "available",
    hours,
  });
  assert.equal(unapproved.error, "approval_required");
  const mechanicApproval = await recordApproval(admin, mechanic, { operationCode: "MA-006", mechanicId: "mech-1", date: "2026-11-10", start: "14:00", minutes: 45 });
  assert.equal(mechanicApproval.status, 403);
  const recorded = await recordApproval(admin, owner, { operationCode: "MA-006", mechanicId: "mech-1", date: "2026-11-10", start: "14:00", minutes: 45 });
  assert.equal(recorded.status, 200);
  const approved = await bookInDatabase(admin, {
    idempotencyKey: "fuel-open",
    date: "2026-11-10",
    start: "14:00",
    minutes: 45,
    mechanicId: "mech-1",
    resourceIds: ["ac-1"],
    operation: fuel,
    parts: "available",
    hours,
  });
  assert.equal(approved.status, 200);
  const confirmation = await admin.query<{ confirmed_by: string; confirmed_minutes: number; confirmed_at: string | null }>("select confirmed_by, confirmed_minutes, confirmed_at::text from scheduler_reservations where id = $1", [approved.id]);
  assert.equal(confirmation.rows[0].confirmed_by, "owner-1");
  assert.equal(confirmation.rows[0].confirmed_minutes, 45);
  assert.ok(confirmation.rows[0].confirmed_at);
  const consumed = await admin.query<{ n: number }>("select count(*)::int as n from scheduler_approvals where consumed_by = $1", [approved.id]);
  assert.equal(consumed.rows[0].n, 1);
  const optionalHold = await admin.query<{ n: number }>("select count(*)::int as n from scheduler_resource_holds where resource_id = 'ac-1' and active");
  assert.equal(optionalHold.rows[0].n, 0);
  await recordApproval(admin, owner, { operationCode: "BR-010", mechanicId: "mech-1", date: "2026-11-10", start: "15:00", minutes: 45 });
  const manual = await bookInDatabase(admin, {
    idempotencyKey: "manual-tube",
    date: "2026-11-10",
    start: "15:00",
    minutes: 45,
    mechanicId: "mech-1",
    resourceIds: ["lift-1"],
    operation: tube,
    parts: "available",
    hours,
  });
  assert.equal(manual.error, "manual");

  const finger = await bookInDatabase(admin, {
    idempotencyKey: "finger",
    date: "2026-11-12",
    start: "12:00",
    minutes: 45,
    mechanicId: "mech-1",
    resourceIds: ["lift-2"],
    operation: oilOperation,
    parts: "available",
    hours,
  });
  assert.equal(finger.status, 200);
  const changedKey = await bookInDatabase(admin, {
    idempotencyKey: "finger",
    date: "2026-11-12",
    start: "12:00",
    minutes: 60,
    mechanicId: "mech-1",
    resourceIds: ["lift-2"],
    operation: oilOperation,
    parts: "available",
    hours,
  });
  assert.equal(changedKey.error, "idempotency_mismatch");
  const fingerHolds = await admin.query<{ n: number }>(
    "select count(*)::int as n from scheduler_holds where reservation_id = $1 and active and end_at - start_at = interval '45 minutes'",
    [finger.id]
  );
  assert.equal(fingerHolds.rows[0].n, 1);

  const movable = await bookInDatabase(admin, {
    idempotencyKey: "movable",
    date: "2026-11-12",
    start: "13:00",
    minutes: 45,
    mechanicId: "mech-2",
    resourceIds: ["lift-2"],
    operation: oilOperation,
    parts: "available",
    hours,
  });
  assert.equal(movable.status, 200);
  const moves = await Promise.all([
    moveInDatabase(left, { reservationId: movable.id ?? "", expectedVersion: 1, date: "2026-11-12", start: "14:00", minutes: 45, mechanicId: "mech-2", resourceIds: ["lift-2"], operation: oilOperation, parts: "available", hours, actor: owner }),
    moveInDatabase(right, { reservationId: movable.id ?? "", expectedVersion: 1, date: "2026-11-12", start: "15:00", minutes: 45, mechanicId: "mech-2", resourceIds: ["lift-2"], operation: oilOperation, parts: "available", hours, actor: owner }),
  ]);
  assert.equal(moves.filter((item) => item.status === 200).length, 1);
  assert.equal(moves.filter((item) => item.error === "version_conflict").length, 1);
  const movedRow = await admin.query<{ version: number; n: number }>(
    "select r.version, (select count(*)::int from scheduler_holds h where h.reservation_id = r.id and h.active) as n from scheduler_reservations r where r.id = $1",
    [movable.id]
  );
  assert.equal(movedRow.rows[0].version, 2);
  assert.equal(movedRow.rows[0].n, 1);

  const spilled = await bookInDatabase(admin, {
    idempotencyKey: "friday-spill",
    date: "2026-11-13",
    start: "17:30",
    minutes: 60,
    mechanicId: "mech-1",
    resourceIds: ["lift-1"],
    operation: oilOperation,
    parts: "available",
    hours,
  });
  assert.equal(spilled.status, 200);
  const spillCount = await admin.query<{ n: number }>("select count(*)::int as n from scheduler_holds where reservation_id = $1 and active", [spilled.id]);
  assert.equal(spillCount.rows[0].n, 2);
  assert.equal((await cancelInDatabase(admin, spilled.id ?? "", 1)).status, 200);
  const saturdayStart = warsawCivilToUtc("2026-11-14", "09:00");
  const saturdayEnd = warsawCivilToUtc("2026-11-14", "09:30");
  if (!saturdayStart || !saturdayEnd) throw new Error("saturday");
  const spillBlocked = await bookInDatabase(admin, {
    idempotencyKey: "friday-spill-crm",
    date: "2026-11-13",
    start: "17:30",
    minutes: 60,
    mechanicId: "mech-1",
    resourceIds: ["lift-1"],
    operation: oilOperation,
    parts: "available",
    hours,
    crmSnapshot: [{ id: "crm-sat", appointmentId: "apt-sat", mechanicId: "mech-1", resourceId: "", startMs: saturdayStart.getTime(), endMs: saturdayEnd.getTime() }],
  });
  assert.equal(spillBlocked.error, "crm_conflict");
  const spillGone = await admin.query<{ n: number }>("select count(*)::int as n from scheduler_reservations where idempotency_key = 'friday-spill-crm'");
  assert.equal(spillGone.rows[0].n, 0);

  const dropped = await connectSchedulerDatabase();
  await dropped.query("begin");
  await dropped.query("select set_config('app.actor_role', 'owner', true)");
  await dropped.query("select set_config('app.actor_mechanic', '', true)");
  await dropped.query("insert into scheduler_reservations (id, idempotency_key, request_fingerprint, operation_code, mechanic_id, parts_status) values ('res-drop', 'res-drop', 'res-drop', 'MA-001', 'mech-1', 'available')");
  await dropped.end();
  const droppedCount = await admin.query<{ n: number }>("select count(*)::int as n from scheduler_reservations where id = 'res-drop'");
  assert.equal(droppedCount.rows[0].n, 0);

  const role = await admin.query<{ rolsuper: boolean; rolbypassrls: boolean }>("select rolsuper, rolbypassrls from pg_roles where rolname = 'scheduler_mechanic'");
  assert.equal(role.rows[0].rolsuper, false);
  assert.equal(role.rows[0].rolbypassrls, false);
  await admin.query("begin");
  await admin.query("select set_config('app.actor_role', 'mechanic', true)");
  await admin.query("select set_config('app.actor_mechanic', 'mech-1', true)");
  await admin.query("set local role scheduler_mechanic");
  const hidden = await admin.query<{ n: number }>("select count(*)::int as n from scheduler_reservations where mechanic_id = 'mech-2'");
  const visible = await admin.query<{ n: number }>("select count(*)::int as n from scheduler_reservations where mechanic_id = 'mech-1'");
  const deniedUpdate = await admin.query("update scheduler_reservations set parts_status = 'available' where mechanic_id = 'mech-2'");
  await admin.query("rollback");
  assert.equal(hidden.rows[0].n, 0);
  assert.ok(visible.rows[0].n > 0);
  assert.equal(deniedUpdate.rowCount, 0);
  const stillForeign = await admin.query<{ mechanic_id: string }>("select mechanic_id from scheduler_reservations where id = $1", [freed.id]);
  assert.equal(stillForeign.rows[0].mechanic_id, "mech-2");

  const unified = await commitUnifiedWorkshopWrite(admin, {
    idempotencyKey: "unified",
    date: "2026-11-12",
    start: "16:00",
    minutes: 30,
    mechanicId: "mech-1",
    resourceIds: ["lift-2"],
    operation: oilOperation,
    parts: "available",
    hours,
  });
  assert.equal(unified.status, 200);
  assert.equal(unified.crmWritten, false);

  await admin.query("truncate public.scheduler_resource_holds, public.scheduler_holds, public.scheduler_crm_occupancy, public.scheduler_approvals, public.scheduler_reservations, public.scheduler_breaks, public.scheduler_time_off, public.scheduler_shifts, public.scheduler_display_names");
  await admin.query("update public.scheduler_resources set status = 'maintenance', confirmed = false");
  await Promise.all([admin.end(), other.end(), left.end(), right.end()]);
  console.log("smart scheduler postgres ok");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
