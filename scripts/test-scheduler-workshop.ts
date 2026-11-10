import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { POST as plan } from "../src/app/api/internal/schedule/plan/route";
import { POST as reservations } from "../src/app/api/internal/schedule/reservations/route";
import { parseOperationCatalog } from "../src/lib/smart-scheduler/catalog";
import {
  productionCrmUrl,
} from "../src/lib/smart-scheduler/crm-connection";
import {
  schedulerCrmWritesEnabled,
  schedulerOwnerWritePilotEnabled,
  schedulerPageOpen,
  schedulerUnifiedCalendarWired,
} from "../src/lib/smart-scheduler/flag";
import {
  commitReservation,
  commitTransaction,
  evaluatePlannerArrival,
  findHoldConflict,
  splitWorkBlocks,
  type Hold,
  type OverlapRule,
} from "../src/lib/smart-scheduler/schedule";
import { assignmentRefusal, planCombinedJob, recommendMechanics } from "../src/lib/smart-scheduler/workshop-plan";
import { workshopHours } from "../src/lib/businessConfig";
import { warsawCivilToUtc } from "../src/lib/workshop-schedule";

const keys = [
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
  "TELEGRAM_ADMIN_CHAT_IDS",
  "SCHEDULER_OWNER_WRITE_PILOT",
  "SCHEDULER_READ_ONLY_PILOT",
  "SCHEDULER_CRM_SOURCE",
  "SCHEDULER_DATABASE_URL",
  "SCHEDULER_CRM_COPY_URL",
  "SMART_WORK_SCHEDULER",
  "SCHEDULER_UNIFIED_CALENDAR",
  "SCHEDULER_TEST_WRITES",
  "VERCEL_ENV",
  "SUPABASE_URL",
] as const;
const saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

function restore(): void {
  for (const key of keys) {
    const value = saved[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function signedInitData(userId: number): string {
  const params = new URLSearchParams();
  params.set("auth_date", String(Math.floor(Date.now() / 1000)));
  params.set("query_id", "AA");
  params.set("user", JSON.stringify({ id: userId, username: "staff", language_code: "ru" }));
  const pairs = [...params.entries()].map(([key, value]) => `${key}=${value}`).sort();
  const secret = createHmac("sha256", "WebAppData").update(process.env.TELEGRAM_BOT_TOKEN ?? "").digest();
  const hash = createHmac("sha256", secret).update(pairs.join("\n")).digest("hex");
  params.set("hash", hash);
  return params.toString();
}

function hold(id: string, mechanicId: string, start: string, minutes: number, resourceIds: string[]): Hold {
  const split = splitWorkBlocks({
    id,
    date: "2026-11-09",
    start,
    minutes,
    hours: workshopHours(),
    mechanicId,
    resourceIds,
    operationCode: "BR-001",
  });
  if (!split.ok) throw new Error(split.error);
  return split.blocks[0];
}

async function main(): Promise<void> {
  delete process.env.SCHEDULER_OWNER_WRITE_PILOT;
  delete process.env.VERCEL_ENV;
  assert.equal(schedulerOwnerWritePilotEnabled(), false);
  assert.equal(schedulerCrmWritesEnabled(), false);
  assert.equal(schedulerUnifiedCalendarWired(), false);
  assert.equal(productionCrmUrl(), null);

  const catalog = parseOperationCatalog(readFileSync(join(process.cwd(), "data/smart-scheduler/bess_operation_seed.csv"), "utf8"));
  const rules = JSON.parse(readFileSync(join(process.cwd(), "data/smart-scheduler/overlap-rules.json"), "utf8")) as OverlapRule[];
  const pads = catalog.find((item) => item.operationCode === "BR-001");
  const pack = catalog.find((item) => item.operationCode === "BR-003");
  const unknown = catalog.find((item) => item.operationCode === "BR-010");
  if (!pads || !pack || !unknown) throw new Error("catalog");

  const single = planCombinedJob([pads], rules);
  assert.equal(single.minutes, 60);
  assert.equal(single.source, "catalog");
  assert.equal(single.normTrusted, true);

  const combined = planCombinedJob([pads, pack], rules);
  assert.equal(combined.minutes, 90);
  assert.match(combined.explanation, /пакет/);
  assert.ok(combined.minutes < 60 + 90);
  const partial = planCombinedJob([pads, unknown], rules);
  assert.equal(partial.minutes, null);
  assert.equal(partial.source, "unconfirmed");
  assert.equal(partial.normTrusted, false);

  const missing = planCombinedJob([unknown], rules);
  assert.equal(missing.minutes, null);
  assert.equal(missing.source, "unconfirmed");
  assert.equal(missing.normTrusted, false);

  assert.equal(evaluatePlannerArrival({ date: "2026-11-13", time: "17:30", now: new Date("2026-11-13T08:00:00Z") }).ok, true);
  assert.equal(evaluatePlannerArrival({ date: "2026-11-13", time: "18:00", now: new Date("2026-11-13T08:00:00Z") }).ok, false);
  assert.equal(evaluatePlannerArrival({ date: "2026-11-14", time: "13:30", now: new Date("2026-11-14T08:00:00Z") }).ok, true);
  assert.equal(evaluatePlannerArrival({ date: "2026-11-14", time: "14:00", now: new Date("2026-11-14T08:00:00Z") }).ok, false);
  assert.equal(evaluatePlannerArrival({ date: "2026-11-15", time: "10:00", now: new Date("2026-11-15T08:00:00Z") }).ok, false);

  const winter = warsawCivilToUtc("2026-01-15", "12:00");
  const summer = warsawCivilToUtc("2026-07-15", "12:00");
  if (!winter || !summer) throw new Error("warsaw");
  assert.equal(winter.getUTCHours(), 11);
  assert.equal(summer.getUTCHours(), 10);
  const beforeDst = warsawCivilToUtc("2026-03-28", "12:00");
  const afterDst = warsawCivilToUtc("2026-03-30", "12:00");
  if (!beforeDst || !afterDst) throw new Error("dst");
  assert.notEqual(beforeDst.getUTCHours(), afterDst.getUTCHours());

  const busy = hold("busy", "mech-1", "09:00", 240, ["lift-1"]);
  assert.equal(findHoldConflict([busy], hold("next", "mech-1", "10:00", 60, ["lift-2"]))?.code, "mechanic");
  assert.equal(findHoldConflict([busy], hold("lift", "mech-2", "12:00", 60, ["lift-1"]))?.code, "resource");
  assert.equal(findHoldConflict([busy], hold("tyre", "mech-2", "12:00", 60, ["tyre-1"])), null);

  const long = splitWorkBlocks({
    id: "long",
    date: "2026-11-13",
    start: "15:00",
    minutes: 7 * 60,
    hours: workshopHours(),
    mechanicId: "mech-1",
    resourceIds: ["lift-1"],
    operationCode: "BR-001",
  });
  assert.equal(long.ok, true);
  if (long.ok) assert.ok(long.blocks.length > 1);

  const liveIdeas = recommendMechanics({
    mechanics: [
      { id: "mech-1", confirmed: true, label: "Сергей" },
      { id: "mech-2", confirmed: false, label: "Механик 2" },
    ],
    source: "live",
    date: "2026-11-09",
    start: "09:00",
    minutes: 60,
    resourceIds: ["lift-1"],
    hours: workshopHours(),
    occupied: [],
  });
  assert.equal(liveIdeas.some((item) => item.mechanicId === "mech-2"), false);
  assert.equal(assignmentRefusal({
    date: "2026-11-09",
    start: "09:00",
    minutes: 60,
    mechanicId: "mech-2",
    confirmed: false,
    source: "live",
    resourceIds: [],
    hours: workshopHours(),
    occupied: [],
  }), "Личность механика не подтверждена. Автоназначение закрыто.");

  const first = commitReservation({ version: 1, reservations: [] }, {
    expectedVersion: 1,
    idempotencyKey: "same-key",
    holds: [hold("a", "mech-1", "09:00", 60, ["lift-1"])],
  });
  assert.equal(first.status, 200);
  const replay = commitReservation(first.store, {
    expectedVersion: 99,
    idempotencyKey: "same-key",
    holds: [hold("b", "mech-1", "11:00", 60, ["lift-1"])],
  });
  assert.equal(replay.status, 200);
  assert.equal(replay.replayed, true);
  assert.equal(replay.store.reservations.length, 1);
  const stale = commitReservation(first.store, {
    expectedVersion: 1,
    idempotencyKey: "other-key",
    holds: [hold("c", "mech-1", "12:00", 60, ["lift-2"])],
  });
  assert.equal(stale.status, 409);
  assert.equal(stale.error, "version_conflict");
  const rolled = commitTransaction({ version: 1, reservations: [] }, [
    { idempotencyKey: "ok", holds: [hold("d", "mech-1", "09:00", 30, ["lift-1"])] },
    { idempotencyKey: "bad", holds: [], fail: true },
  ]);
  assert.equal(rolled.status, 409);
  assert.equal(rolled.error, "rolled_back");
  assert.equal(rolled.store.reservations.length, 0);

  const closed = await reservations(new Request("http://local/reservations", { method: "POST", body: "{}" }));
  assert.equal(closed.status, 404);
  const planClosed = await plan(new Request("http://local/plan", { method: "POST", body: "{}" }));
  assert.equal(planClosed.status, 404);

  process.env.SCHEDULER_OWNER_WRITE_PILOT = "local";
  process.env.VERCEL_ENV = "production";
  assert.equal(schedulerOwnerWritePilotEnabled(), false);
  assert.equal((await reservations(new Request("http://local/reservations", { method: "POST", body: "{}" }))).status, 404);
  delete process.env.VERCEL_ENV;
  assert.equal(schedulerOwnerWritePilotEnabled(), true);
  assert.equal(schedulerPageOpen(), true);
  assert.equal(schedulerCrmWritesEnabled(), false);

  process.env.SCHEDULER_CRM_COPY_URL = "postgresql://ubuntu@/not-the-copy?host=/var/run/postgresql";
  process.env.TELEGRAM_BOT_TOKEN = "123456:workshop-test";
  process.env.TELEGRAM_CHAT_ID = "77";
  process.env.TELEGRAM_ADMIN_CHAT_IDS = "88";
  delete process.env.SCHEDULER_DATABASE_URL;
  delete process.env.SUPABASE_URL;
  const owner = await reservations(new Request("http://local/reservations", {
    method: "POST",
    headers: { "content-type": "application/json", "x-telegram-init-data": signedInitData(77) },
    body: JSON.stringify({ action: "create", idempotencyKey: "owner-1", date: "2026-11-13", start: "09:00", mechanicId: "mech-1", operationCode: "BR-001" }),
  }));
  const ownerBody = await owner.json() as { error?: string; persisted?: boolean; crmWritten?: boolean };
  assert.equal(owner.status, 503);
  assert.equal(ownerBody.persisted, false);
  assert.equal(ownerBody.crmWritten, false);

  const admin = await reservations(new Request("http://local/reservations", {
    method: "POST",
    headers: { "content-type": "application/json", "x-telegram-init-data": signedInitData(88) },
    body: JSON.stringify({ action: "create", idempotencyKey: "admin-1", date: "2026-11-13", start: "09:00", mechanicId: "mech-1", operationCode: "BR-001" }),
  }));
  const adminBody = await admin.json() as { error?: string; crmWritten?: boolean };
  assert.equal(admin.status, 403);
  assert.equal(adminBody.error, "owner_only");
  assert.notEqual(adminBody.crmWritten, true);

  const stranger = await reservations(new Request("http://local/reservations", {
    method: "POST",
    headers: { "content-type": "application/json", "x-telegram-init-data": signedInitData(999001) },
    body: JSON.stringify({}),
  }));
  assert.equal(stranger.status, 403);

  const unconfirmed = await reservations(new Request("http://local/reservations", {
    method: "POST",
    headers: { "content-type": "application/json", "x-telegram-init-data": signedInitData(77) },
    body: JSON.stringify({ action: "create", idempotencyKey: "mech2", date: "2026-11-13", start: "09:00", mechanicId: "mech-2", operationCode: "BR-001" }),
  }));
  const unconfirmedBody = await unconfirmed.json() as { error?: string; crmWritten?: boolean };
  assert.equal(unconfirmed.status, 409);
  assert.equal(unconfirmedBody.error, "mechanic_not_confirmed");
  assert.equal(unconfirmedBody.crmWritten, false);

  process.env.SCHEDULER_DATABASE_URL = "postgresql://ubuntu@/bess_scheduler_test?host=/var/run/postgresql";
  const refusedMechanic = await reservations(new Request("http://local/reservations", {
    method: "POST",
    headers: { "content-type": "application/json", "x-telegram-init-data": signedInitData(77) },
    body: JSON.stringify({ action: "create", idempotencyKey: "mech2", date: "2026-11-13", start: "09:00", mechanicId: "mech-2", operationCode: "BR-001" }),
  }));
  const refusedBody = await refusedMechanic.json() as { error?: string; crmWritten?: boolean };
  assert.equal(refusedMechanic.status, 409);
  assert.equal(refusedBody.error, "mechanic_not_confirmed");
  assert.equal(refusedBody.crmWritten, false);
  delete process.env.SCHEDULER_DATABASE_URL;

  const planned = await plan(new Request("http://local/plan", {
    method: "POST",
    headers: { "content-type": "application/json", "x-telegram-init-data": signedInitData(77) },
    body: JSON.stringify({
      date: "2026-11-13",
      start: "17:30",
      operationCodes: ["BR-001", "BR-003"],
      mechanicId: "mech-1",
      source: "fixture",
      mechanicConfirmed: true,
      occupied: [{ id: "fake", mechanicId: "mech-1", resourceIds: ["lift-1"], startMs: 0, endMs: 9e15, operationCode: "x", active: true }],
    }),
  }));
  const plannedBody = await planned.json() as { persisted?: boolean; crmWritten?: boolean; error?: string; options?: unknown[]; plan?: { minutes?: number } };
  assert.equal(planned.status, 503);
  assert.equal(plannedBody.error, "occupancy_unavailable");
  assert.equal(plannedBody.plan?.minutes, 90);
  assert.deepEqual(plannedBody.options, []);
  assert.equal(plannedBody.persisted, false);
  assert.equal(plannedBody.crmWritten, false);

  console.log("scheduler workshop ok");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(restore);
