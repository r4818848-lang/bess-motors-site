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
  commitLegacyCalendarWrite,
  commitUnifiedWorkshopWrite,
  connectSchedulerDatabase,
  issueCrmSnapshot,
  moveInDatabase,
  openActorSession,
  recordApproval,
  saveDisplayName,
} from "../src/lib/smart-scheduler/postgres";
import type { Client } from "pg";

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
let ownerActor: BookingActor;

async function bookFresh(client: Client, input: Parameters<typeof bookInDatabase>[1]) {
  const issued = input.crmToken ? { ok: true as const, token: input.crmToken } : await issueCrmSnapshot(client, true);
  if (!issued.ok) {
    return { status: 503 as const, error: issued.error, persisted: false, crmWritten: false as const, createdClient: false as const, createdOrder: false as const, workOrderId: null };
  }
  return bookInDatabase(client, { ...input, actor: input.actor ?? ownerActor, crmToken: issued.token });
}

async function moveFresh(client: Client, input: Parameters<typeof moveInDatabase>[1]) {
  const issued = input.crmToken ? { ok: true as const, token: input.crmToken } : await issueCrmSnapshot(client, true);
  if (!issued.ok) {
    return { status: 503 as const, error: issued.error, persisted: false, crmWritten: false as const, createdClient: false as const, createdOrder: false as const, workOrderId: null };
  }
  return moveInDatabase(client, { ...input, actor: input.actor ?? ownerActor, crmToken: issued.token });
}

async function cancelFresh(client: Client, reservationId: string, expectedVersion: number, actor?: BookingActor) {
  const issued = await issueCrmSnapshot(client, true);
  if (!issued.ok) throw new Error(issued.error);
  return cancelInDatabase(client, reservationId, expectedVersion, actor ?? ownerActor, issued.token);
}

async function main() {
  const admin = await connectSchedulerDatabase();
  await admin.query(`
    drop table if exists public.scheduler_resource_holds, public.scheduler_holds, public.scheduler_crm_occupancy,
      public.scheduler_crm_snapshot, public.scheduler_row_appointments, public.scheduler_store_appointments,
      public.scheduler_runtime, public.scheduler_notification_log, public.scheduler_actor_sessions, public.scheduler_approvals, public.scheduler_reservations,
      public.scheduler_actuals, public.scheduler_breaks, public.scheduler_time_off, public.scheduler_shifts,
      public.scheduler_display_names, public.scheduler_resources, public.scheduler_overlap_rules, public.scheduler_operations cascade
  `);
  await applySchedulerSchema(admin);
  ownerActor = await openActorSession(admin, { role: "owner", staffId: "owner-1", canEdit: true });
  const breaks = await admin.query<{ n: number }>("select count(*)::int as n from scheduler_breaks");
  assert.equal(breaks.rows[0].n, 0);
  const resources = await admin.query<{ status: string; confirmed: boolean }>("select status, confirmed from scheduler_resources");
  assert.equal(resources.rows.length, 6);
  assert.equal(resources.rows.every((row) => row.status === "maintenance" && row.confirmed === false), true);

  const blocked = await bookFresh(admin, {
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
  const missingParts = await bookFresh(admin, {
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

  const sergey = await bookFresh(admin, {
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
  const padsResult = await bookFresh(other, {
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

  const sameLift = await moveFresh(other, {
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
  assert.equal(sameLift.error, "crm_conflict");
  const stillSecondLift = await other.query<{ resource_id: string }>(
    "select resource_id from scheduler_resource_holds where active and hold_id in (select id from scheduler_holds where reservation_id = $1 and active)",
    [padsResult.id]
  );
  assert.deepEqual(stillSecondLift.rows.map((row) => row.resource_id), ["lift-2"]);

  const sameMechanic = await moveFresh(other, {
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
  const next = await bookFresh(admin, {
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

  const replay = await bookFresh(admin, {
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
    bookFresh(left, { idempotencyKey: "race-a", date: monday, start: "15:00", minutes: 30, mechanicId: "mech-1", resourceIds: ["lift-1"], operation: oilOperation, parts: "available", hours }),
    bookFresh(right, { idempotencyKey: "race-b", date: monday, start: "15:00", minutes: 30, mechanicId: "mech-1", resourceIds: ["lift-2"], operation: padsOperation, parts: "available", hours }),
  ]);
  assert.equal(race.filter((item) => item.status === 200).length, 1);
  assert.equal(race.filter((item) => item.status === 409).length, 1);

  await admin.query("begin");
  await admin.query("select set_config('app.actor_session', $1, true)", [ownerActor.sessionId]);
  await admin.query("insert into scheduler_reservations (id, idempotency_key, request_fingerprint, operation_code, mechanic_id, parts_status) values ('res-partial', 'partial', 'partial', 'MA-001', 'mech-2', 'available')");
  await admin.query("rollback");
  const partial = await admin.query<{ n: number }>("select count(*)::int as n from scheduler_reservations where id = 'res-partial'");
  assert.equal(partial.rows[0].n, 0);

  const cancelled = await cancelFresh(other, padsResult.id ?? "", 1);
  assert.equal(cancelled.status, 200);
  const freed = await bookFresh(other, {
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

  const sunday = await bookFresh(admin, {
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
  const early = await bookFresh(admin, {
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
  const vacation = await bookFresh(admin, {
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
  const mechanic = await openActorSession(admin, { role: "mechanic", staffId: "tg:1001", mechanicId: "mech-1", canEdit: true });
  const owner = ownerActor;
  await admin.query("delete from scheduler_time_off");
  assert.equal(schedulerCrmWritesEnabled(), false);

  const emptyLift = await bookFresh(admin, {
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
  await admin.query("select scheduler_mirror_interval('crm-1', 'mech-1', 'lift-1', to_timestamp($1/1000.0), to_timestamp($2/1000.0))", [crmStart.getTime(), crmEnd.getTime()]);
  const crmLift = await bookFresh(admin, {
    idempotencyKey: "crm-same-lift",
    date: "2026-11-10",
    start: "09:00",
    minutes: 45,
    mechanicId: "mech-2",
    resourceIds: ["lift-1"],
    operation: oilOperation,
    parts: "available",
    hours,
  });
  assert.equal(crmLift.error, "crm_conflict");
  const besideCrm = await bookFresh(admin, {
    idempotencyKey: "beside-crm",
    date: "2026-11-10",
    start: "09:00",
    minutes: 45,
    mechanicId: "mech-2",
    resourceIds: ["lift-2"],
    operation: padsOperation,
    parts: "available",
    hours,
  });
  assert.equal(besideCrm.status, 200);
  assert.equal(besideCrm.crmWritten, false);
  const onCrm = await bookFresh(admin, {
    idempotencyKey: "on-crm-mechanic",
    date: "2026-11-10",
    start: "09:00",
    minutes: 45,
    mechanicId: "mech-1",
    resourceIds: ["lift-2"],
    operation: oilOperation,
    parts: "available",
    hours,
  });
  assert.equal(onCrm.error, "crm_conflict");
  const crmLeftover = await admin.query<{ n: number }>("select count(*)::int as n from scheduler_reservations where idempotency_key = 'on-crm-mechanic'");
  assert.equal(crmLeftover.rows[0].n, 0);

  const parallel = await Promise.all([
    bookFresh(left, { idempotencyKey: "parallel-1", date: "2026-11-12", start: "09:00", minutes: 45, mechanicId: "mech-1", resourceIds: ["lift-1"], operation: oilOperation, parts: "available", hours }),
    bookFresh(right, { idempotencyKey: "parallel-2", date: "2026-11-12", start: "09:00", minutes: 45, mechanicId: "mech-2", resourceIds: ["lift-2"], operation: padsOperation, parts: "available", hours }),
  ]);
  assert.equal(parallel.filter((item) => item.status === 200).length, 1);
  assert.equal(parallel.filter((item) => item.status === 409).length, 1);
  const retryKey = parallel[0].status === 200 ? "parallel-2" : "parallel-1";
  const retried = await bookFresh(admin, {
    idempotencyKey: retryKey,
    date: "2026-11-12",
    start: "09:00",
    minutes: 45,
    mechanicId: retryKey === "parallel-1" ? "mech-1" : "mech-2",
    resourceIds: [retryKey === "parallel-1" ? "lift-1" : "lift-2"],
    operation: retryKey === "parallel-1" ? oilOperation : padsOperation,
    parts: "available",
    hours,
  });
  assert.equal(retried.status, 200);
  const sameLiftRace = await Promise.all([
    bookFresh(left, { idempotencyKey: "lift-race-a", date: "2026-11-12", start: "10:00", minutes: 45, mechanicId: "mech-1", resourceIds: ["lift-1"], operation: oilOperation, parts: "available", hours }),
    bookFresh(right, { idempotencyKey: "lift-race-b", date: "2026-11-12", start: "10:00", minutes: 45, mechanicId: "mech-2", resourceIds: ["lift-1"], operation: oilOperation, parts: "available", hours }),
  ]);
  assert.equal(sameLiftRace.filter((item) => item.status === 200).length, 1);
  assert.equal(sameLiftRace.filter((item) => item.status === 409).length, 1);

  const stolenCancel = await cancelFresh(admin, freed.id ?? "", 1, mechanic);
  assert.equal(stolenCancel.status, 403);
  const stolenMove = await moveFresh(admin, {
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
  let gucIgnored = false;
  await admin.query("begin");
  try {
    await admin.query("select set_config('app.actor_role', 'owner', true)");
    await admin.query("select set_config('app.actor_mechanic', 'mech-1', true)");
    await admin.query("select set_config('app.actor_session', '', true)");
    await admin.query("update scheduler_reservations set parts_status = 'available' where id = $1", [freed.id]);
  } catch (error) {
    gucIgnored = typeof error === "object" && error !== null && "code" in error && error.code === "42501";
  }
  await admin.query("rollback");
  assert.equal(gucIgnored, true);
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

  const unapproved = await bookFresh(admin, {
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
  const mechanicApproval = await recordApproval(admin, mechanic, { requestId: "fuel-1", operationCode: "MA-006", mechanicId: "mech-1", date: "2026-11-10", start: "14:00", minutes: 45, resourceIds: [] });
  assert.equal(mechanicApproval.status, 403);
  const recorded = await recordApproval(admin, owner, { requestId: "fuel-1", operationCode: "MA-006", mechanicId: "mech-1", date: "2026-11-10", start: "14:00", minutes: 45, resourceIds: [] });
  assert.equal(recorded.status, 200);
  const wrongRequest = await bookFresh(admin, {
    idempotencyKey: "fuel-other",
    date: "2026-11-10",
    start: "14:00",
    minutes: 45,
    mechanicId: "mech-1",
    resourceIds: [],
    operation: fuel,
    parts: "available",
    hours,
    requestId: "fuel-other",
  });
  assert.equal(wrongRequest.error, "approval_mismatch");
  const stillOpen = await admin.query<{ n: number }>("select count(*)::int as n from scheduler_approvals where request_id = 'fuel-1' and consumed_by is null");
  assert.equal(stillOpen.rows[0].n, 1);
  const approved = await bookFresh(admin, {
    idempotencyKey: "fuel-open",
    date: "2026-11-10",
    start: "14:00",
    minutes: 45,
    mechanicId: "mech-1",
    resourceIds: [],
    operation: fuel,
    parts: "available",
    hours,
    requestId: "fuel-1",
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
  await recordApproval(admin, owner, { requestId: "tube-1", operationCode: "BR-010", mechanicId: "mech-1", date: "2026-11-10", start: "15:00", minutes: 45, resourceIds: ["lift-1"] });
  const manual = await bookFresh(admin, {
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

  const finger = await bookFresh(admin, {
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
  const changedKey = await bookFresh(admin, {
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

  const movable = await bookFresh(admin, {
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
    moveFresh(left, { reservationId: movable.id ?? "", expectedVersion: 1, date: "2026-11-12", start: "14:00", minutes: 45, mechanicId: "mech-2", resourceIds: ["lift-2"], operation: oilOperation, parts: "available", hours, actor: owner }),
    moveFresh(right, { reservationId: movable.id ?? "", expectedVersion: 1, date: "2026-11-12", start: "15:00", minutes: 45, mechanicId: "mech-2", resourceIds: ["lift-2"], operation: oilOperation, parts: "available", hours, actor: owner }),
  ]);
  assert.equal(moves.filter((item) => item.status === 200).length, 1);
  assert.equal(moves.filter((item) => item.status === 409).length, 1);
  const versionRetry = await moveFresh(admin, { reservationId: movable.id ?? "", expectedVersion: 1, date: "2026-11-12", start: "16:30", minutes: 45, mechanicId: "mech-2", resourceIds: ["lift-2"], operation: oilOperation, parts: "available", hours, actor: owner });
  assert.equal(versionRetry.error, "version_conflict");
  const movedRow = await admin.query<{ version: number; n: number }>(
    "select r.version, (select count(*)::int from scheduler_holds h where h.reservation_id = r.id and h.active) as n from scheduler_reservations r where r.id = $1",
    [movable.id]
  );
  assert.equal(movedRow.rows[0].version, 2);
  assert.equal(movedRow.rows[0].n, 1);

  const spilled = await bookFresh(admin, {
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
  assert.equal((await cancelFresh(admin, spilled.id ?? "", 1)).status, 200);
  const saturdayStart = warsawCivilToUtc("2026-11-14", "09:00");
  const saturdayEnd = warsawCivilToUtc("2026-11-14", "09:30");
  if (!saturdayStart || !saturdayEnd) throw new Error("saturday");
  await admin.query("select scheduler_mirror_interval('crm-sat', 'mech-1', '', to_timestamp($1/1000.0), to_timestamp($2/1000.0))", [saturdayStart.getTime(), saturdayEnd.getTime()]);
  const spillBlocked = await bookFresh(admin, {
    idempotencyKey: "friday-spill-crm",
    date: "2026-11-13",
    start: "17:30",
    minutes: 60,
    mechanicId: "mech-1",
    resourceIds: ["lift-1"],
    operation: oilOperation,
    parts: "available",
    hours,
  });
  assert.equal(spillBlocked.error, "crm_conflict");
  const spillGone = await admin.query<{ n: number }>("select count(*)::int as n from scheduler_reservations where idempotency_key = 'friday-spill-crm'");
  assert.equal(spillGone.rows[0].n, 0);

  const dropped = await connectSchedulerDatabase();
  await dropped.query("begin");
  await dropped.query("select set_config('app.actor_session', $1, true)", [ownerActor.sessionId]);
  await dropped.query("insert into scheduler_reservations (id, idempotency_key, request_fingerprint, operation_code, mechanic_id, parts_status) values ('res-drop', 'res-drop', 'res-drop', 'MA-001', 'mech-1', 'available')");
  await dropped.end();
  const droppedCount = await admin.query<{ n: number }>("select count(*)::int as n from scheduler_reservations where id = 'res-drop'");
  assert.equal(droppedCount.rows[0].n, 0);

  const role = await admin.query<{ rolsuper: boolean; rolbypassrls: boolean }>("select rolsuper, rolbypassrls from pg_roles where rolname = 'scheduler_mechanic'");
  assert.equal(role.rows[0].rolsuper, false);
  assert.equal(role.rows[0].rolbypassrls, false);
  await admin.query("begin");
  await admin.query("select set_config('app.actor_role', 'owner', true)");
  await admin.query("select set_config('app.actor_mechanic', 'mech-1', true)");
  await admin.query("select set_config('app.actor_session', $1, true)", [mechanic.sessionId]);
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

  const unavailable = await issueCrmSnapshot(admin, false);
  assert.equal(unavailable.ok, false);
  const refused = await bookInDatabase(admin, {
    idempotencyKey: "crm-down",
    date: "2026-11-18",
    start: "11:00",
    minutes: 45,
    mechanicId: "mech-1",
    resourceIds: ["lift-1"],
    operation: oilOperation,
    parts: "available",
    hours,
    actor: ownerActor,
  });
  assert.equal(refused.status, 503);
  assert.equal(refused.error, "crm_unavailable");
  const refusedCount = await admin.query<{ n: number }>("select count(*)::int as n from scheduler_reservations where idempotency_key = 'crm-down'");
  assert.equal(refusedCount.rows[0].n, 0);

  const legacyToken = await issueCrmSnapshot(left, true);
  const schedulerToken = await issueCrmSnapshot(right, true);
  if (!legacyToken.ok || !schedulerToken.ok) throw new Error("snapshot");
  const cross = await Promise.all([
    commitLegacyCalendarWrite(left, { appointmentId: "legacy-race", mechanicId: "mech-1", resourceId: "lift-1", date: "2026-11-17", start: "11:00", minutes: 45, hours, actor: ownerActor, crmToken: legacyToken.token }),
    bookInDatabase(right, { idempotencyKey: "scheduler-race", date: "2026-11-17", start: "11:00", minutes: 45, mechanicId: "mech-1", resourceIds: ["lift-1"], operation: oilOperation, parts: "available", hours, actor: ownerActor, crmToken: schedulerToken.token }),
  ]);
  assert.equal(cross.filter((item) => item.status === 200).length, 1);
  assert.equal(cross.filter((item) => item.status === 409).length, 1);
  const legacyFirst = await admin.query<{ store_n: number; row_n: number }>(
    "select (select count(*)::int from scheduler_store_appointments where active and id like 'legacy-race:%' or active and id like 'res-scheduler-race:%') as store_n, (select count(*)::int from scheduler_row_appointments where active and (id like 'legacy-race:%' or id like 'res-scheduler-race:%')) as row_n"
  );
  assert.equal(legacyFirst.rows[0].store_n, legacyFirst.rows[0].row_n);
  assert.equal(legacyFirst.rows[0].store_n, 1);

  const legacyToken2 = await issueCrmSnapshot(left, true);
  const schedulerToken2 = await issueCrmSnapshot(right, true);
  if (!legacyToken2.ok || !schedulerToken2.ok) throw new Error("snapshot");
  const crossBack = await Promise.all([
    bookInDatabase(left, { idempotencyKey: "scheduler-race-2", date: "2026-11-18", start: "11:00", minutes: 45, mechanicId: "mech-2", resourceIds: ["lift-2"], operation: oilOperation, parts: "available", hours, actor: ownerActor, crmToken: schedulerToken2.token }),
    commitLegacyCalendarWrite(right, { appointmentId: "legacy-race-2", mechanicId: "mech-2", resourceId: "lift-2", date: "2026-11-18", start: "11:00", minutes: 45, hours, actor: ownerActor, crmToken: legacyToken2.token }),
  ]);
  assert.equal(crossBack.filter((item) => item.status === 200).length, 1);
  assert.equal(crossBack.filter((item) => item.status === 409).length, 1);

  await admin.query("insert into scheduler_store_appointments (id, mechanic_id, resource_id, start_at, end_at) values ('diverged', 'mech-1', '', now(), now() + interval '30 minutes')");
  const diverged = await issueCrmSnapshot(admin, true);
  assert.equal(diverged.ok, false);
  if (!diverged.ok) assert.equal(diverged.error, "crm_diverged");
  await admin.query("delete from scheduler_store_appointments where id = 'diverged'");

  await admin.query("begin");
  const beforeStore = await admin.query<{ n: number }>("select count(*)::int as n from scheduler_store_appointments");
  await admin.query("insert into scheduler_store_appointments (id, mechanic_id, resource_id, start_at, end_at) values ('partial-store', 'mech-1', '', now(), now() + interval '15 minutes')");
  let partialFailed = false;
  try {
    await admin.query("insert into scheduler_row_appointments (id, mechanic_id, resource_id, start_at, end_at) values ('partial-store', 'mech-1', '', now(), now())");
  } catch {
    partialFailed = true;
  }
  await admin.query("rollback");
  const afterStore = await admin.query<{ n: number }>("select count(*)::int as n from scheduler_store_appointments");
  assert.equal(partialFailed, true);
  assert.equal(afterStore.rows[0].n, beforeStore.rows[0].n);

  const unifiedToken = await issueCrmSnapshot(admin, true);
  if (!unifiedToken.ok) throw new Error(unifiedToken.error);
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
    actor: ownerActor,
    crmToken: unifiedToken.token,
  });
  assert.equal(unified.status, 200);
  assert.equal(unified.crmWritten, false);

  async function denied(role: string, sql: string): Promise<boolean> {
    await admin.query("begin");
    await admin.query(`set local role ${role}`);
    try {
      await admin.query(sql);
      await admin.query("rollback");
      return false;
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      await admin.query("rollback");
      return code === "42501";
    }
  }
  assert.equal(await denied("scheduler_staff", "select scheduler_open_session('intruder', 'owner', null)"), true);
  assert.equal(await denied("scheduler_mechanic", "select scheduler_open_session('intruder', 'admin', 'mech-1')"), true);
  assert.equal(await denied("scheduler_staff", "insert into scheduler_actor_sessions (id, staff_id, actor_role, mechanic_id, db_role, expires_at) values ('ses-evil', 'other-staff', 'owner', null, 'scheduler_staff', now() + interval '5 minutes')"), true);
  assert.equal(await denied("scheduler_staff", "select scheduler_set_unified_calendar(true)"), true);
  const stillOff = await admin.query<{ unified_calendar: boolean }>("select unified_calendar from scheduler_runtime where id = 'main'");
  assert.equal(stillOff.rows[0].unified_calendar, false);

  await admin.query("truncate public.scheduler_resource_holds, public.scheduler_holds, public.scheduler_crm_occupancy, public.scheduler_crm_snapshot, public.scheduler_row_appointments, public.scheduler_store_appointments, public.scheduler_actor_sessions, public.scheduler_approvals, public.scheduler_reservations, public.scheduler_breaks, public.scheduler_time_off, public.scheduler_shifts, public.scheduler_display_names");
  await admin.query("update public.scheduler_resources set status = 'maintenance', confirmed = false");
  await Promise.all([admin.end(), other.end(), left.end(), right.end()]);
  console.log("smart scheduler postgres ok");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
