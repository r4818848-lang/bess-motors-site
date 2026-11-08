import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { workshopHours } from "../src/lib/businessConfig";
import { evaluateArrivalTime } from "../src/lib/arrival-window";
import { warsawCivilToUtc, warsawParts } from "../src/lib/workshop-schedule";
import { assertUniqueCatalog, parseOperationCatalog } from "../src/lib/smart-scheduler/catalog";
import { smartWorkSchedulerEnabled } from "../src/lib/smart-scheduler/flag";
import { searchOperations } from "../src/lib/smart-scheduler/search";
import {
  applyAdjustmentsOnce,
  assignResources,
  commitReservation,
  commitTransaction,
  effectiveMode,
  evaluatePlannerArrival,
  explainOverlap,
  findHoldConflict,
  formulaMinutes,
  holdsFromLegacy,
  planOperationMinutes,
  splitWorkBlocks,
  type SchedulerStore,
} from "../src/lib/smart-scheduler/schedule";
import { guardScheduler, isGuardError, mechanicMayPlan } from "../src/lib/smart-scheduler/access";

const hours = workshopHours();
const catalog = parseOperationCatalog(readFileSync(join(process.cwd(), "data/smart-scheduler/bess_operation_seed.csv"), "utf8"));
assertUniqueCatalog(catalog);
assert.equal(catalog.length, 91);
const byCode = new Map(catalog.map((operation) => [operation.operationCode, operation]));
const oil = byCode.get("MA-001");
const pack = byCode.get("MA-015");
const tube = byCode.get("BR-010");
const r16 = byCode.get("TY-002");
const pads = byCode.get("BR-001");
assert.ok(oil && pack && tube && r16 && pads);
assert.equal(oil.baseLaborHours, 0.5);
assert.equal(oil.minLaborHours, null);
assert.equal(oil.maxLaborHours, null);
assert.equal(oil.referenceCalendarMinutes, 45);
assert.equal(pack.referenceCalendarMinutes, 105);
assert.equal(tube.baseLaborHours, null);
assert.equal(tube.referenceCalendarMinutes, null);
assert.equal(tube.bookingMode, "MANUAL");
assert.equal(byCode.get("DI-014")?.bookingMode, "MANUAL");
assert.equal(byCode.get("DI-014")?.baseLaborHours, null);
for (const operation of catalog) {
  if (operation.referenceCalendarMinutes != null) assert.equal(operation.referenceCalendarMinutes % 15, 0);
}

const groups = searchOperations(catalog, "замена");
assert.equal(groups.mode, "groups");
if (groups.mode === "groups") {
  assert.deepEqual(groups.groups.map((group) => group.label), ["Колодки", "Масло", "Рулевые наконечники", "Рычаги", "Фильтры"]);
}
const padsSearch = searchOperations(catalog, "колод");
assert.equal(padsSearch.mode, "operations");
if (padsSearch.mode === "operations") {
  const codes = padsSearch.hits.map((hit) => hit.code);
  assert.ok(codes.includes("BR-001") && codes.includes("BR-002") && codes.includes("BR-003"));
  assert.ok(codes.every((code) => code.startsWith("BR-")));
}
const typo = searchOperations(catalog, "колотки");
assert.equal(typo.mode, "operations");
if (typo.mode === "operations") assert.ok(typo.hits.some((hit) => hit.code === "BR-001"));
const polish = searchOperations(catalog, "klocki");
assert.equal(polish.mode, "operations");
if (polish.mode === "operations") assert.ok(polish.hits.length > 0);

assert.equal(formulaMinutes({ laborHours: 1.25, normSource: "BASE" }), 90);
assert.equal(formulaMinutes({ laborHours: 0.85, normSource: "BASE" }), 60);
assert.equal(formulaMinutes({ laborHours: 1.25, normSource: "VIN", vehicleClass: "premium" }), 90);
assert.equal(formulaMinutes({ laborHours: 1.25, normSource: "BASE", vehicleClass: "premium" }), 120);
assert.equal(formulaMinutes({ laborHours: 1, normSource: "BASE", overlapSavingsMinutes: 30 }), reserve(60));
assert.equal(formulaMinutes({ laborHours: 1, normSource: "BASE", overlapSavingsMinutes: 30, savingsApproved: true }), reserve(30));
const packPlan = planOperationMinutes(pack);
assert.equal(packPlan.minutes, 105);
assert.equal(packPlan.formulaMinutes, 90);
assert.equal(packPlan.discrepancy, true);
assert.equal(packPlan.source, "reference");
assert.equal(JSON.stringify(packPlan).includes("zł"), false);
assert.equal(planOperationMinutes(tube).source, "unconfirmed");
assert.equal(planOperationMinutes(r16, { priority: "formula" }).minutes, 60);
assert.equal(planOperationMinutes(r16).minutes, 75);

function reserve(minutes: number): number {
  return Math.ceil((minutes * 1.15) / 15) * 15;
}

function job(id: string, mechanicId: string, start: string, minutes: number, resourceIds: string[], date = "2026-11-09") {
  const split = splitWorkBlocks({ id, date, start, minutes, hours, mechanicId, resourceIds, operationCode: id });
  if (!split.ok) throw new Error(split.error);
  return split.blocks;
}

const sergey = job("oil", "mech-1", "11:00", 45, ["lift-1"]);
const andrey = job("pads", "mech-2", "11:20", 60, ["lift-2"]);
assert.equal(findHoldConflict(sergey, andrey[0]), null);
assert.equal(findHoldConflict(sergey, { ...andrey[0], resourceIds: ["lift-1"] })?.code, "resource");
assert.equal(findHoldConflict(sergey, job("pads-2", "mech-1", "11:20", 60, ["lift-2"])[0])?.code, "mechanic");
assert.equal(findHoldConflict(sergey, job("next", "mech-1", "11:45", 15, ["lift-1"])[0]), null);

assert.equal(job("open", "mech-1", "09:00", 60, [])[0]?.start, "09:00");
assert.equal(splitWorkBlocks({ id: "early", date: "2026-11-09", start: "08:55", minutes: 15, hours, mechanicId: "mech-1", resourceIds: [], operationCode: "x" }).ok, false);
assert.equal(splitWorkBlocks({ id: "close", date: "2026-11-09", start: "18:00", minutes: 15, hours, mechanicId: "mech-1", resourceIds: [], operationCode: "x" }).ok, false);
assert.equal(job("until-close", "mech-1", "17:00", 60, [])[0]?.end, "18:00");
assert.equal(splitWorkBlocks({ id: "sat", date: "2026-11-14", start: "14:00", minutes: 15, hours, mechanicId: "mech-1", resourceIds: [], operationCode: "x" }).ok, false);
assert.equal(job("sat-end", "mech-1", "13:00", 60, [], "2026-11-14")[0]?.end, "14:00");
const friday = job("spill", "mech-1", "17:30", 60, [], "2026-11-13");
assert.deepEqual(friday.map((item) => `${item.date} ${item.start}-${item.end}`), ["2026-11-13 17:30-18:00", "2026-11-14 09:00-09:30"]);
const saturday = job("weekend", "mech-1", "13:30", 60, [], "2026-11-14");
assert.deepEqual(saturday.map((item) => item.date), ["2026-11-14", "2026-11-16"]);

assert.equal(evaluateArrivalTime({ date: "2026-11-09", time: "13:30", now: new Date("2026-11-01T08:00:00Z") }).ok, true);
assert.equal(evaluateArrivalTime({ date: "2026-11-09", time: "11:20", now: new Date("2026-11-01T08:00:00Z") }).ok, false);
assert.equal(evaluatePlannerArrival({ date: "2026-11-09", time: "11:20", manual: true, now: new Date("2026-11-01T08:00:00Z") }).ok, true);
assert.equal(evaluatePlannerArrival({ date: "2026-11-09", time: "14:00", manual: true, now: new Date("2026-11-01T08:00:00Z") }).ok, false);
assert.equal(evaluatePlannerArrival({ date: "2026-11-09", time: "11:20", now: new Date("2026-11-01T08:00:00Z") }).ok, false);

assert.equal(effectiveMode(oil, "delayed", true), "APPROVAL");
assert.equal(effectiveMode(oil, "available", false), "APPROVAL");
assert.equal(effectiveMode(tube, "available", true), "MANUAL");
assert.equal(holdsFromLegacy({ id: "stay", date: "2026-11-09", leavesCar: true, pickupDate: "2026-11-10", hours }).length, 0);
assert.equal(holdsFromLegacy({ id: "gone", date: "2026-11-09", mechanicId: "mech-1", workStart: "11:00", workMinutes: 45, visitState: "no_show", hours }).length, 0);
assert.equal(holdsFromLegacy({ id: "work", date: "2026-11-09", mechanicId: "mech-1", workStart: "11:00", workMinutes: 45, leavesCar: true, pickupDate: "2026-11-10", hours }).length, 1);

const overlap = explainOverlap(["MA-001", "MA-004", "MA-005", "MA-003"], catalog);
assert.equal(overlap[0]?.resultOperation, "MA-015");
assert.equal(overlap[0]?.minutes, 105);
assert.ok((overlap[0]?.replacesSum ?? 0) > 105);
assert.equal(explainOverlap(["MA-001", "MA-002"], catalog)[0]?.minutes, null);
assert.equal(applyAdjustmentsOnce([{ id: "runflat", coefficient: 1.15 }, { id: "runflat", coefficient: 1.15 }]).coefficient, 1.15);

assert.equal(warsawCivilToUtc("2026-03-29", "02:30"), null);
assert.equal(splitWorkBlocks({ id: "dst", date: "2026-03-29", start: "02:30", minutes: 15, hours, mechanicId: "mech-1", resourceIds: [], operationCode: "x" }).ok, false);
const winter = warsawCivilToUtc("2026-03-27", "09:00");
const summer = warsawCivilToUtc("2026-03-30", "09:00");
assert.ok(winter && summer);
assert.equal(winter.getUTCHours(), 8);
assert.equal(summer.getUTCHours(), 7);
const ambiguous = warsawCivilToUtc("2026-10-25", "02:30");
assert.ok(ambiguous);
assert.equal(warsawParts(ambiguous).minutes, 150);
assert.equal(ambiguous.getUTCHours(), 1);

const lifts = [{ id: "lift-1", kind: "lift", confirmed: true }, { id: "lift-2", kind: "lift", confirmed: true }];
const first = assignResources({ required: ["mechanic", "lift"], confirmed: lifts, holds: [], startMs: sergey[0].startMs, endMs: sergey[0].endMs });
assert.equal(first.ok && first.resourceIds[0], "lift-1");
const second = assignResources({ required: ["lift"], confirmed: lifts, holds: [{ ...sergey[0], resourceIds: ["lift-1"] }], startMs: andrey[0].startMs, endMs: andrey[0].endMs });
assert.equal(second.ok && second.resourceIds[0], "lift-2");
const busy = assignResources({ required: ["lift"], confirmed: [lifts[0]], holds: [{ ...sergey[0], resourceIds: ["lift-1"] }], startMs: andrey[0].startMs, endMs: andrey[0].endMs });
assert.equal(busy.ok, false);

let store: SchedulerStore = { version: 1, reservations: [] };
const saved = commitReservation(store, { expectedVersion: 1, idempotencyKey: "a", holds: sergey });
assert.equal(saved.status, 200);
store = saved.store;
const stale = commitReservation(store, { expectedVersion: 1, idempotencyKey: "b", holds: andrey });
assert.equal(stale.status, 409);
assert.equal(stale.error, "version_conflict");
const replay = commitReservation(store, { expectedVersion: 1, idempotencyKey: "a", holds: sergey });
assert.equal(replay.replayed, true);
assert.equal(replay.store.version, store.version);
const rolled = commitTransaction({ version: 1, reservations: [] }, [
  { idempotencyKey: "one", holds: sergey },
  { idempotencyKey: "two", holds: andrey, fail: true },
]);
assert.equal(rolled.status, 409);
assert.equal(rolled.store.version, 1);
assert.equal(mechanicMayPlan({ role: "mechanic", mechanicId: "mech-1" }, "mech-2"), false);
assert.equal(mechanicMayPlan({ role: "owner" }, "mech-2"), true);

void (async () => {
  const savedFlag = process.env.SMART_WORK_SCHEDULER;
  delete process.env.SMART_WORK_SCHEDULER;
  assert.equal(smartWorkSchedulerEnabled(), false);
  const disabled = await guardScheduler(new Request("http://local/api/internal/operations"));
  assert.equal(isGuardError(disabled) && disabled.status, 404);
  process.env.SMART_WORK_SCHEDULER = "true";
  const unsigned = await guardScheduler(new Request("http://local/api/internal/operations"));
  assert.equal(isGuardError(unsigned) && unsigned.status, 401);
  if (savedFlag === undefined) delete process.env.SMART_WORK_SCHEDULER;
  else process.env.SMART_WORK_SCHEDULER = savedFlag;

  const draft = readFileSync(join(process.cwd(), "supabase/drafts/smart-scheduler.sql"), "utf8");
  assert.match(draft, /DRAFT ONLY/);
  assert.match(draft, /revoke all on table public.scheduler_operations from anon, authenticated/);
  const schedulerSource = readFileSync(join(process.cwd(), "src/lib/smart-scheduler/schedule.ts"), "utf8");
  assert.doesNotMatch(schedulerSource, /250\s*zł|price\s*:/);
  console.log("smart scheduler ok");
})().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
