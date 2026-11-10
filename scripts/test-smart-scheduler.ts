import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { workshopHours } from "../src/lib/businessConfig";
import { evaluateArrivalTime } from "../src/lib/arrival-window";
import { warsawCivilToUtc, warsawParts } from "../src/lib/workshop-schedule";
import { assertUniqueCatalog, parseOperationCatalog } from "../src/lib/smart-scheduler/catalog";
import { canonicalCrmDigest, canonicalCrmLines, compatibleResourceFields, crmSurfacesMatch, resourceIdsForOccupancy } from "../src/lib/smart-scheduler/crm-reconcile";
import { planCrmConnection, productionCrmUrl } from "../src/lib/smart-scheduler/crm-connection";
import { schedulerCrmWritesEnabled, schedulerPageOpen, schedulerReadOnlyPilotEnabled, schedulerTestWritesEnabled, schedulerUnifiedCalendarWired, schedulerUnifiedModeRequired, smartWorkSchedulerEnabled } from "../src/lib/smart-scheduler/flag";
import { mayAutoAssignMechanic, mechanicColumn } from "../src/lib/smart-scheduler/identity";
import { workOverlapWarnings } from "../src/lib/smart-scheduler/overlaps";
import { notificationRetryDelayMs } from "../src/lib/smart-scheduler/notification-outbox";
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
import { bookingFingerprint, mayChangeExistingReservation, selectRequiredResources } from "../src/lib/smart-scheduler/booking-rules";
import { readOnlyAppointments } from "../src/lib/smart-scheduler/crm-read";
import { schedulerDatabaseUrl } from "../src/lib/smart-scheduler/postgres";
import { visibleToActor, responseLeaksSecrets } from "../src/lib/smart-scheduler/visibility";
import { assembleBoard } from "../src/lib/smart-scheduler/board";
import { syntheticSnapshot, upcomingMonday } from "../src/lib/smart-scheduler/fixture";
import { defaultSchedulerSettings, localTestSchedulerSettings, resourceReady } from "../src/lib/smart-scheduler/settings";
import { cancelOnLedger, linkExistingWorkOrder, moveOnLedger, reserveOnLedger, resetSchedulerLedger, schedulerLedgerSnapshot } from "../src/lib/smart-scheduler/ledger";
import { canAutoBook, excludedFromAuto } from "../src/lib/smart-scheduler/policy";
import { applyRunflatOnce, breakHolds, resolveDuration, suggestSlots } from "../src/lib/smart-scheduler/schedule";
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

assert.equal(evaluateArrivalTime({ date: "2026-11-13", time: "17:30", now: new Date("2026-11-01T08:00:00Z") }).ok, true);
assert.equal(evaluateArrivalTime({ date: "2026-11-13", time: "18:00", now: new Date("2026-11-01T08:00:00Z") }).ok, false);
assert.equal(evaluateArrivalTime({ date: "2026-11-14", time: "13:30", now: new Date("2026-11-01T08:00:00Z") }).ok, true);
assert.equal(evaluateArrivalTime({ date: "2026-11-15", time: "10:00", now: new Date("2026-11-01T08:00:00Z") }).ok, false);
assert.equal(evaluateArrivalTime({ date: "2026-11-09", time: "11:20", now: new Date("2026-11-01T08:00:00Z") }).ok, false);
assert.equal(evaluatePlannerArrival({ date: "2026-11-09", time: "11:20", manual: true, now: new Date("2026-11-01T08:00:00Z") }).ok, true);
assert.equal(evaluatePlannerArrival({ date: "2026-11-13", time: "17:30", manual: true, now: new Date("2026-11-01T08:00:00Z") }).ok, true);
assert.equal(evaluatePlannerArrival({ date: "2026-11-13", time: "18:00", manual: true, now: new Date("2026-11-01T08:00:00Z") }).ok, false);
assert.equal(evaluatePlannerArrival({ date: "2026-11-14", time: "14:00", manual: true, now: new Date("2026-11-01T08:00:00Z") }).ok, false);
assert.equal(evaluatePlannerArrival({ date: "2026-11-09", time: "11:20", now: new Date("2026-11-01T08:00:00Z") }).ok, false);

assert.equal(effectiveMode(oil, "delayed", true), "APPROVAL");
assert.equal(effectiveMode(oil, "available", false), "APPROVAL");
assert.equal(effectiveMode(tube, "available", true), "MANUAL");
assert.equal(holdsFromLegacy({ id: "stay", date: "2026-11-09", leavesCar: true, pickupDate: "2026-11-10", hours }).length, 0);
assert.equal(holdsFromLegacy({ id: "gone", date: "2026-11-09", mechanicId: "mech-1", workStart: "11:00", workMinutes: 45, visitState: "no_show", hours }).length, 0);
assert.equal(holdsFromLegacy({ id: "work", date: "2026-11-09", mechanicId: "mech-1", workStart: "11:00", workMinutes: 45, leavesCar: true, pickupDate: "2026-11-10", hours }).length, 1);

const overlapRules = JSON.parse(readFileSync(join(process.cwd(), "data/smart-scheduler/overlap-rules.json"), "utf8"));
const overlap = explainOverlap(["MA-001", "MA-004", "MA-005", "MA-003"], catalog, overlapRules);
assert.equal(overlap[0]?.resultOperation, "MA-015");
assert.equal(overlap[0]?.savingsMinutes, 0);
assert.equal(overlap[0]?.minutes, null);
assert.ok((overlap[0]?.replacesSum ?? 0) > 105);
assert.equal(explainOverlap(["MA-001", "MA-002"], catalog, overlapRules)[0]?.savingsMinutes, 0);
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
assert.equal(mechanicMayPlan({ role: "mechanic", mechanicId: "mech-1", canEdit: false }, "mech-1"), false);
assert.equal(mechanicMayPlan({ role: "owner" }, "mech-2"), true);
const editor = { role: "mechanic", mechanicId: "mech-1", canEdit: true, id: "mech-1" };
assert.equal(mayChangeExistingReservation(editor, "mech-2", "mech-1"), false);
assert.equal(mayChangeExistingReservation(editor, "mech-1", "mech-1"), true);
assert.equal(mayChangeExistingReservation({ role: "admin", canEdit: true, id: "admin" }, "mech-2", "mech-1"), true);
assert.notEqual(
  bookingFingerprint({ operationCode: "MA-001", mechanicId: "mech-1", date: "2026-11-10", start: "11:00", minutes: 45, resourceIds: ["lift-1"], parts: "available" }),
  bookingFingerprint({ operationCode: "MA-001", mechanicId: "mech-1", date: "2026-11-10", start: "11:00", minutes: 60, resourceIds: ["lift-1"], parts: "available" })
);
assert.equal(selectRequiredResources(oil, [], defaultSchedulerSettings.resources).ok, false);
const fuel = byCode.get("MA-006");
assert.equal(fuel?.bookingMode, "APPROVAL");
assert.deepEqual(fuel ? selectRequiredResources(fuel, ["ac-1"], defaultSchedulerSettings.resources) : null, { ok: true, resourceIds: [] });

const sergeyColumn = mechanicColumn({ id: "mech-1", name: "Siergiej" });
const secondColumn = mechanicColumn({ id: "mech-2", name: "Piotr Nowak" });
const andreyName = mechanicColumn({ id: "mech-2", name: "Andrzej" });
assert.equal(sergeyColumn.confirmed, true);
assert.equal(sergeyColumn.id, "mech-1");
assert.equal(sergeyColumn.label, "Сергей");
assert.equal(sergeyColumn.crmName, "Siergiej");
assert.equal(mechanicColumn({ id: "mech-1", name: "Другое имя" }).label, "Сергей");
assert.equal(secondColumn.confirmed, false);
assert.equal(secondColumn.id, "mech-2");
assert.equal(secondColumn.crmName, "Piotr Nowak");
assert.equal(secondColumn.label, "Механик 2");
assert.equal(andreyName.label, "Механик 2");
assert.equal(andreyName.confirmed, false);
assert.equal(andreyName.crmName, "Andrzej");
assert.equal(mayAutoAssignMechanic(secondColumn, "live"), false);
assert.equal(mayAutoAssignMechanic(andreyName, "live"), false);
assert.equal(mayAutoAssignMechanic(secondColumn, "fixture"), true);
assert.equal(mayAutoAssignMechanic(sergeyColumn, "live"), true);
assert.equal(effectiveMode(oil, undefined, true), "APPROVAL");
assert.equal(canAutoBook({ operation: oil, parts: "unknown", resources: defaultSchedulerSettings.resources, resourceIds: ["lift-1"] }).auto, false);
assert.equal(defaultSchedulerSettings.resources.every((item) => item.confirmed === false && item.status === "maintenance"), true);
assert.equal(defaultSchedulerSettings.schedules.every((item) => item.breaks.length === 0 && item.shiftStart == null), true);
assert.equal(canAutoBook({ operation: oil, parts: "available", resources: defaultSchedulerSettings.resources, resourceIds: ["lift-1"] }).reason, "equipment");
const confirmedResources = defaultSchedulerSettings.resources.map((item) => ({ ...item, status: "available" as const, confirmed: true, udtPermitConfirmed: item.kind === "lift" }));
assert.equal(canAutoBook({ operation: oil, parts: "available", resources: confirmedResources.map((item) => ({ ...item, udtPermitConfirmed: false })), resourceIds: ["lift-1"] }).reason, "equipment");
assert.deepEqual(selectRequiredResources(oil, ["lift-1", "ac-1"], confirmedResources), { ok: true, resourceIds: ["lift-1"] });
assert.equal(canAutoBook({ operation: oil, parts: "available", resources: confirmedResources, resourceIds: ["lift-1"] }).reason, "ok");
const localEquipment = localTestSchedulerSettings();
assert.equal(localEquipment.resources.every((item) => item.status === "available" && item.confirmed), true);
for (const id of ["lift-1", "lift-2", "tyre-1", "balancer-1", "ac-1", "diag-1"]) {
  const resource = localEquipment.resources.find((item) => item.id === id);
  assert.equal(resource?.status, "available");
  assert.equal(resource?.confirmed, true);
}
assert.equal(localEquipment.resources.filter((item) => item.kind === "lift").every((item) => item.udtPermitConfirmed !== true), true);
assert.equal(resourceReady(localEquipment.resources, "lift-1"), false);
assert.equal(resourceReady(localEquipment.resources, "lift-2"), false);
assert.equal(resourceReady(localEquipment.resources, "tyre-1"), true);
assert.equal(resourceReady(localEquipment.resources, "balancer-1"), true);
assert.equal(resourceReady(localEquipment.resources, "ac-1"), true);
assert.equal(resourceReady(localEquipment.resources, "diag-1"), true);
assert.equal(defaultSchedulerSettings.resources.every((item) => item.status === "maintenance"), true);
assert.equal(excludedFromAuto({ ...oil, operationNameRu: "Замена ремня ГРМ", operationNamePl: "Rozrząd" }), true);
assert.equal(excludedFromAuto(byCode.get("DI-014") ?? oil), true);
assert.equal(canAutoBook({ operation: byCode.get("DI-014") ?? tube, parts: "available", resources: defaultSchedulerSettings.resources, resourceIds: ["diag-1"] }).auto, false);
const paused = breakHolds({ date: "2026-11-09", breaks: [{ mechanicId: "mech-1", start: "13:00", end: "13:20" }] });
assert.equal(findHoldConflict(paused, job("during-break", "mech-1", "13:00", 15, [])[0])?.code, "mechanic");
assert.equal(findHoldConflict(paused, job("other-break", "mech-2", "13:00", 15, [])[0]), null);
assert.equal(applyRunflatOnce(60, true, 1.2), 72);
assert.equal(reserve(72), 90);
assert.equal(resolveDuration(45, { minutes: 50, reason: "" }).ok, false);
const custom = resolveDuration(45, { minutes: 50, reason: "ржавый крепёж" });
assert.equal(custom.ok && custom.minutes, 60);
const ideas = suggestSlots({ date: "2026-11-09", start: "11:00", minutes: 45, mechanicId: "mech-1", mechanicIds: ["mech-1", "mech-2"], resourceIds: ["lift-2"], hours, occupied: sergey });
assert.equal(ideas.some((idea) => idea.mechanicId === "mech-2"), true);

const monday = upcomingMonday(new Date("2026-11-08T12:00:00Z"));
assert.equal(monday, "2026-11-09");
const snapshot = syntheticSnapshot(new Date("2026-11-08T12:00:00Z"), hours);
assert.equal(snapshot.writable, false);
assert.deepEqual(snapshot.mechanics.map((item) => item.label), ["Сергей", "Механик 2"]);
assert.equal(snapshot.appointments.some((item) => item.date === monday), true);
assert.equal(snapshot.date, "2026-11-08");
const link = linkExistingWorkOrder({ appointmentId: "fix-oil", appointments: snapshot.appointments });
assert.equal(link.workOrderId, "wo-test-1");
assert.equal(link.createdClient, false);
assert.equal(linkExistingWorkOrder({ appointmentId: "missing", appointments: snapshot.appointments }).workOrderId, null);
const hidden = readOnlyAppointments({
  mechanics: [{ id: "mech-1", name: "Siergiej", phone: "+48000000000" }],
  appointments: [{ id: "a1", date: "2026-11-09", time: "11:00", mechanicId: "mech-1", workStart: "11:00", workMinutes: 45, clientPhone: "+48111222333", clientName: "Hidden Person" }],
  workOrders: [],
}, hours);
assert.equal(JSON.stringify(hidden).includes("+48111222333"), false);
assert.equal(JSON.stringify(hidden).includes("Hidden Person"), false);
assert.equal(JSON.stringify(hidden).includes("+48000000000"), false);
const withVin = readOnlyAppointments({
  mechanics: [{ id: "mech-1", name: "Siergiej" }, { id: "mech-2", name: "Piotr Nowak" }],
  vehicles: [{ id: "v1", vin: "TESTVIN0000000001", plate: "WX1001", make: "Test", model: "Compact" }],
  appointments: [
    { id: "own", date: "2026-11-09", time: "11:00", mechanicId: "mech-1", workStart: "11:00", workMinutes: 45, vehicleId: "v1", clientPhone: "+48111222333" },
    { id: "other", date: "2026-11-09", time: "11:20", mechanicId: "mech-2", workStart: "11:20", workMinutes: 60, clientPlate: "WX9999" },
  ],
  workOrders: [],
}, hours);
const mechanicView = visibleToActor({ role: "mechanic", mechanicId: "mech-1", canEdit: false }, withVin.appointments);
assert.deepEqual(mechanicView.map((item) => item.id), ["own"]);
assert.equal(JSON.stringify(mechanicView).includes("WX9999"), false);
assert.equal(JSON.stringify(withVin).includes("TESTVIN0000000001"), false);
assert.equal(responseLeaksSecrets(mechanicView), false);
assert.equal(visibleToActor({ role: "admin", canEdit: true }, withVin.appointments).length, 2);
assert.equal(visibleToActor({ role: "owner", canEdit: true }, withVin.appointments).length, 2);
const liveBoard = assembleBoard({ mode: "live", actor: { role: "owner", canEdit: true }, now: new Date("2026-11-08T12:00:00Z"), hours, crm: null, settings: defaultSchedulerSettings });
assert.equal(liveBoard.snapshot.appointments.length, 0);
assert.equal(liveBoard.snapshot.crmConnected, false);
assert.match(liveBoard.message, /Ошибка подключения к CRM/);
assert.equal(liveBoard.snapshot.source, "live");
assert.deepEqual(workOverlapWarnings([
  { id: "a", mechanicId: "mech-1", date: "2026-12-01", workStart: "11:00", workMinutes: 60, lift: "lift-1", plate: "WX1" },
  { id: "b", mechanicId: "mech-1", date: "2026-12-01", workStart: "11:30", workMinutes: 30, lift: "lift-2", plate: "WX2" },
]), ["Пересечение механика mech-1: WX1 и WX2. Записи не изменены."]);
assert.equal(workOverlapWarnings([
  { id: "a", mechanicId: "mech-1", date: "2026-12-01", workStart: "11:00", workMinutes: 60, lift: "lift-1", plate: "WX1" },
  { id: "b", mechanicId: "mech-2", date: "2026-12-01", workStart: "11:00", workMinutes: 60, lift: "lift-2", plate: "WX2" },
]).length, 0);
assert.equal(JSON.stringify(liveBoard).includes("WX1001"), false);
const namedBoard = assembleBoard({
  mode: "live",
  actor: { role: "owner", canEdit: true },
  now: new Date("2026-11-09T08:00:00Z"),
  hours,
  crm: {
    mechanics: [{ id: "mech-1", name: "Siergiej" }, { id: "mech-2", name: "Piotr Nowak" }],
    appointments: [{ id: "live-1", date: "2026-11-09", time: "09:00", mechanicId: "mech-1", workStart: "11:20", workMinutes: 45, clientPlate: "WX5001" }],
    workOrders: [],
  },
  settings: defaultSchedulerSettings,
});
assert.deepEqual(namedBoard.snapshot.mechanics.map((item) => item.label), ["Сергей", "Механик 2"]);
assert.equal(namedBoard.snapshot.mechanics.find((item) => item.id === "mech-2")?.confirmed, false);
assert.equal(namedBoard.snapshot.appointments[0]?.arrivalTime, "09:00");
assert.equal(namedBoard.snapshot.appointments[0]?.workStart, "11:20");
assert.equal(JSON.stringify(namedBoard.snapshot.mechanics.map((item) => item.label)).includes("Piotr"), false);
assert.equal(JSON.stringify(namedBoard.snapshot.mechanics.map((item) => item.label)).includes("Андрей"), false);
const mechanicBoard = assembleBoard({ mode: "test", actor: { role: "mechanic", mechanicId: "mech-1", canEdit: false }, now: new Date("2026-11-08T12:00:00Z"), hours, crm: null, settings: defaultSchedulerSettings });
assert.equal(mechanicBoard.snapshot.appointments.every((item) => item.mechanicId === "mech-1"), true);
assert.equal(JSON.stringify(mechanicBoard).includes("WX1002"), false);
assert.match(mechanicBoard.message, /TEST/);
const savedDatabase = process.env.SCHEDULER_DATABASE_URL;
const savedVercelForDatabase = process.env.VERCEL_ENV;
process.env.SCHEDULER_DATABASE_URL = "postgresql://example.supabase.co/postgres";
assert.equal(schedulerDatabaseUrl(), null);
process.env.SCHEDULER_DATABASE_URL = "postgresql://ubuntu@/bess_scheduler_test?host=/var/run/postgresql";
delete process.env.VERCEL_ENV;
assert.equal(schedulerDatabaseUrl() != null, true);
process.env.VERCEL_ENV = "production";
assert.equal(schedulerDatabaseUrl(), null);
if (savedDatabase === undefined) delete process.env.SCHEDULER_DATABASE_URL;
else process.env.SCHEDULER_DATABASE_URL = savedDatabase;
if (savedVercelForDatabase === undefined) delete process.env.VERCEL_ENV;
else process.env.VERCEL_ENV = savedVercelForDatabase;

void (async () => {
  resetSchedulerLedger();
  const parallel = await Promise.all([
    reserveOnLedger({ idempotencyKey: "p1", date: monday, start: "15:00", minutes: 30, mechanicId: "mech-1", resourceIds: ["lift-1"], operationCode: "MA-001", crmHolds: [], breaks: [], hours }),
    reserveOnLedger({ idempotencyKey: "p2", date: monday, start: "15:00", minutes: 30, mechanicId: "mech-2", resourceIds: ["lift-1"], operationCode: "BR-001", crmHolds: [], breaks: [], hours }),
  ]);
  assert.equal(parallel.filter((item) => item.status === 200).length, 1);
  assert.equal(parallel.filter((item) => item.status === 409).length, 1);
  assert.equal(schedulerLedgerSnapshot().holds.filter((hold) => hold.active).length, 1);
  const kept = parallel.find((item) => item.status === 200);
  const moved = await moveOnLedger({ reservationId: kept?.id ?? "", idempotencyKey: "p1b", date: monday, start: "16:00", minutes: 30, mechanicId: "mech-1", resourceIds: ["lift-1"], operationCode: "MA-001", crmHolds: [], breaks: [], hours });
  assert.equal(moved.status, 200);
  const cancelled = await cancelOnLedger(kept?.id ?? "");
  assert.equal(cancelled.status, 200);
  const again = await reserveOnLedger({ idempotencyKey: "p3", date: monday, start: "15:00", minutes: 30, mechanicId: "mech-2", resourceIds: ["lift-1"], operationCode: "BR-001", crmHolds: [], breaks: [], hours });
  assert.equal(again.status, 200);
  const version = schedulerLedgerSnapshot().version;
  const rolledHold = await reserveOnLedger({ idempotencyKey: "roll", date: "2026-11-13", start: "17:30", minutes: 60, mechanicId: "mech-1", resourceIds: ["lift-2"], operationCode: "SU-001", crmHolds: job("saturday-block", "mech-1", "09:00", 30, ["lift-2"], "2026-11-14"), breaks: [], hours });
  assert.equal(rolledHold.status, 409);
  assert.equal(schedulerLedgerSnapshot().version, version);
  const failed = await reserveOnLedger({ idempotencyKey: "fail", date: monday, start: "10:00", minutes: 15, mechanicId: "mech-2", resourceIds: [], operationCode: "MA-004", crmHolds: [], breaks: [], hours, failBeforeCommit: true });
  assert.equal(failed.error, "rolled_back");
  assert.equal(schedulerLedgerSnapshot().holds.some((hold) => hold.idempotencyKey === "fail"), false);
  assert.equal(splitWorkBlocks({ id: "sunday", date: "2026-11-15", start: "10:00", minutes: 15, hours, mechanicId: "mech-1", resourceIds: [], operationCode: "x" }).ok, false);
  const savedWrites = process.env.SCHEDULER_TEST_WRITES;
  const savedVercel = process.env.VERCEL_ENV;
  const savedFlag = process.env.SMART_WORK_SCHEDULER;
  process.env.SMART_WORK_SCHEDULER = "true";
  process.env.SCHEDULER_TEST_WRITES = "local";
  delete process.env.VERCEL_ENV;
  assert.equal(schedulerTestWritesEnabled(), true);
  process.env.VERCEL_ENV = "production";
  assert.equal(schedulerTestWritesEnabled(), false);
  if (savedWrites === undefined) delete process.env.SCHEDULER_TEST_WRITES;
  else process.env.SCHEDULER_TEST_WRITES = savedWrites;
  if (savedVercel === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = savedVercel;
  delete process.env.SMART_WORK_SCHEDULER;
  assert.equal(smartWorkSchedulerEnabled(), false);
  const disabled = await guardScheduler(new Request("http://local/api/internal/operations"));
  assert.equal(isGuardError(disabled) && disabled.status, 404);
  process.env.SMART_WORK_SCHEDULER = "true";
  assert.equal(schedulerCrmWritesEnabled(), false);
  const unsigned = await guardScheduler(new Request("http://local/api/internal/operations"));
  assert.equal(isGuardError(unsigned) && unsigned.status, 401);
  if (savedFlag === undefined) delete process.env.SMART_WORK_SCHEDULER;
  else process.env.SMART_WORK_SCHEDULER = savedFlag;

  const draft = readFileSync(join(process.cwd(), "supabase/drafts/smart-scheduler.sql"), "utf8");
  assert.match(draft, /DRAFT ONLY/);
  assert.match(draft, /revoke all on table public.scheduler_operations from public, scheduler_anon/);
  assert.match(draft, /'anon', 'authenticated'/);
  assert.match(draft, /force row level security/);
  assert.match(draft, /scheduler_mechanic_no_overlap/);
  assert.match(draft, /scheduler_resource_no_overlap/);
  assert.match(draft, /scheduler_reservations/);
  assert.match(draft, /'maintenance', false/);
  const seed = readFileSync(join(process.cwd(), "supabase/drafts/smart-scheduler-test-seed.sql"), "utf8");
  assert.match(seed, /TEST DATABASE ONLY/);
  assert.doesNotMatch(seed, /\+48\d/);
  const route = readFileSync(join(process.cwd(), "src/app/api/internal/schedule/reservations/route.ts"), "utf8");
  assert.doesNotMatch(route, /body\.store|request\.store|body\.approval|reserveOnLedger|moveOnLedger|cancelOnLedger/);
  assert.match(route, /commitSchedulerToCrm/);
  assert.doesNotMatch(route, /loadCrmFromCloud/);
  assert.match(route, /expectedVersion/);
  const postgres = readFileSync(join(process.cwd(), "src/lib/smart-scheduler/postgres.ts"), "utf8");
  assert.match(postgres, /bookInDatabase/);
  assert.match(postgres, /for update/i);
  assert.match(postgres, /request_fingerprint/);
  assert.doesNotMatch(postgres, /insert into (crm_store|appointments)/i);
  const rollback = readFileSync(join(process.cwd(), "supabase/drafts/smart-scheduler-rollback.sql"), "utf8");
  assert.match(rollback, /crm_store/);
  assert.match(draft, /scheduler_crm_occupancy/);
  assert.match(draft, /scheduler_lock_workshop/);
  assert.match(draft, /scheduler_guard_reservation/);
  assert.match(draft, /scheduler_assert_crm/);
  assert.match(draft, /scheduler_open_session/);
  assert.doesNotMatch(draft, /actor_role text := current_setting\('app.actor_role'/);
  const legacyCalendar = readFileSync(join(process.cwd(), "src/lib/server/staff-calendar-commit.ts"), "utf8");
  assert.doesNotMatch(legacyCalendar, /commitLegacyCalendarWrite|scheduler_lock_workshop|commitUnifiedWorkshopWrite/);
  const pilot = readFileSync(join(process.cwd(), "supabase/drafts/smart-scheduler-pilot.md"), "utf8");
  assert.match(pilot, /резервн/);
  assert.match(pilot, /SMART_WORK_SCHEDULER/);
  assert.match(draft, /perform public\.scheduler_lock_workshop\(\);\n {2}if public\.scheduler_live_crm_enabled\(\)/);
  assert.doesNotMatch(draft, /store_digest text := public\.scheduler_surface_digest/);
  assert.doesNotMatch(draft, /grant execute on function public\.scheduler_open_session\(text, text, text\) to scheduler_staff/);
  assert.match(draft, /revoke all on function public\.scheduler_open_session\(text, text, text\) from public, scheduler_staff/);
  delete process.env.SMART_WORK_SCHEDULER;
  delete process.env.SCHEDULER_READ_ONLY_PILOT;
  delete process.env.SCHEDULER_UNIFIED_CALENDAR;
  assert.equal(schedulerUnifiedCalendarWired(), false);
  assert.equal(schedulerUnifiedModeRequired(), false);
  assert.equal(schedulerReadOnlyPilotEnabled(), false);
  assert.equal(schedulerPageOpen(), false);
  process.env.SCHEDULER_READ_ONLY_PILOT = "local";
  assert.equal(schedulerPageOpen(), true);
  assert.equal(smartWorkSchedulerEnabled(), false);
  assert.equal(schedulerTestWritesEnabled(), false);
  assert.equal(schedulerUnifiedModeRequired(), false);
  delete process.env.SCHEDULER_READ_ONLY_PILOT;
  assert.equal(schedulerPageOpen(), false);
  assert.equal(schedulerTestWritesEnabled(), false);
  const previousVercelEnv = process.env.VERCEL_ENV;
  const previousCrmSource = process.env.SCHEDULER_CRM_SOURCE;
  process.env.VERCEL_ENV = "preview";
  process.env.SCHEDULER_READ_ONLY_PILOT = "production-readonly";
  process.env.SCHEDULER_CRM_SOURCE = "cloud";
  assert.equal(schedulerReadOnlyPilotEnabled(), false);
  assert.equal(schedulerPageOpen(), false);
  process.env.VERCEL_ENV = "production";
  assert.equal(schedulerReadOnlyPilotEnabled(), true);
  assert.equal(schedulerPageOpen(), true);
  assert.equal(schedulerTestWritesEnabled(), false);
  assert.equal(schedulerCrmWritesEnabled(), false);
  process.env.SMART_WORK_SCHEDULER = "true";
  assert.equal(schedulerReadOnlyPilotEnabled(), false);
  delete process.env.SMART_WORK_SCHEDULER;
  process.env.SCHEDULER_UNIFIED_CALENDAR = "on";
  assert.equal(schedulerReadOnlyPilotEnabled(), false);
  delete process.env.SCHEDULER_UNIFIED_CALENDAR;
  delete process.env.SCHEDULER_CRM_SOURCE;
  assert.equal(schedulerReadOnlyPilotEnabled(), false);
  process.env.VERCEL_ENV = "preview";
  process.env.SCHEDULER_READ_ONLY_PILOT = "local";
  assert.equal(schedulerReadOnlyPilotEnabled(), false);
  if (previousVercelEnv === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = previousVercelEnv;
  if (previousCrmSource === undefined) delete process.env.SCHEDULER_CRM_SOURCE;
  else process.env.SCHEDULER_CRM_SOURCE = previousCrmSource;
  delete process.env.SCHEDULER_READ_ONLY_PILOT;
  const launchBootstrap = readFileSync(join(process.cwd(), "src/lib/telegram-webapp-client.ts"), "utf8");
  assert.match(launchBootstrap, /path === "\/telegram\/scheduler"/);
  assert.equal(productionCrmUrl(), null);
  process.env.SCHEDULER_PRODUCTION_DB_PERMIT = "allow";
  process.env.SCHEDULER_CRM_URL = "postgresql://db.example.supabase.co/postgres";
  assert.equal(productionCrmUrl(), null);
  assert.equal(planCrmConnection(null).mode, "refused");
  delete process.env.SCHEDULER_PRODUCTION_DB_PERMIT;
  delete process.env.SCHEDULER_CRM_URL;
  assert.equal(notificationRetryDelayMs(1), 1000);
  assert.equal(notificationRetryDelayMs(2), 2000);
  assert.equal(notificationRetryDelayMs(8), 60_000);
  assert.deepEqual(compatibleResourceFields("lift-1"), { resourceId: "lift-1", resourceIds: ["lift-1"] });
  assert.deepEqual(resourceIdsForOccupancy({ resourceId: "lift-1", resourceIds: ["tyre-1"] }).sort(), ["lift-1", "tyre-1"]);
  const unified = readFileSync(join(process.cwd(), "src/lib/server/unified-calendar.ts"), "utf8");
  assert.doesNotMatch(unified, /delete from appointments["'`]/i);
  assert.match(unified, /delete from appointments where id = any/);
  assert.match(unified, /resourceIdsForOccupancy/);
  assert.match(draft, /scheduler_claim_notification/);
  assert.match(draft, /for update skip locked/i);
  const staffRoute = readFileSync(join(process.cwd(), "src/app/api/staff/calendar/route.ts"), "utf8");
  assert.ok(staffRoute.indexOf('if (action === "list")') < staffRoute.indexOf("if (!staffCalendarMutationsEnabled())"));
  assert.match(readFileSync(join(process.cwd(), "src/app/api/internal/schedule/board/route.ts"), "utf8"), /writeRequired: false/);
  assert.doesNotMatch(legacyCalendar, /commitLiveCalendar|live-crm/);
  assert.doesNotMatch(readFileSync(join(process.cwd(), "src/app/api/appointments/route.ts"), "utf8"), /commitLiveCalendar|live-crm/);
  assert.doesNotMatch(route, /count\(\*\)|commitLiveCalendar|loadCrmFromCloud/);
  assert.match(route, /commitSchedulerToCrm/);
  assert.match(readFileSync(join(process.cwd(), "src/lib/smart-scheduler/live-crm.ts"), "utf8"), /scheduler_live_digest/);
  const sameCountDifferentWork = crmSurfacesMatch(
    [{ id: "a", mechanicId: "mech-1", date: "2026-12-01", workStart: "11:00", workMinutes: 45, resourceId: "lift-1", appointmentStatus: "scheduled" }, { id: "b", mechanicId: "mech-2", date: "2026-12-01", workStart: "12:00", workMinutes: 30, resourceId: "", appointmentStatus: "scheduled" }],
    [{ id: "b", mechanicId: "mech-2", date: "2026-12-01", workStart: "12:00", workMinutes: 30, resourceId: "", appointmentStatus: "scheduled" }, { id: "a", mechanicId: "mech-1", date: "2026-12-01", workStart: "11:30", workMinutes: 45, resourceId: "lift-1", appointmentStatus: "scheduled" }]
  );
  assert.equal(sameCountDifferentWork, false);
  const reversed = canonicalCrmLines([
    { id: "b", mechanicId: "mech-2", date: "2026-12-01", workStart: "12:00", workMinutes: 30, appointmentStatus: "scheduled" },
    { id: "a", mechanicId: "mech-1", date: "2026-12-01", workStart: "11:00", workMinutes: 45, resourceId: "lift-1", appointmentStatus: "scheduled" },
  ]);
  assert.deepEqual(reversed, canonicalCrmLines([...reversed].reverse().map((line) => {
    const [id, mechanicId, date, workStart, workMinutes, resourceId, appointmentStatus, active] = line.split("|");
    return { id, mechanicId, date, workStart, workMinutes, resourceId, appointmentStatus, calendarHidden: active === "0" };
  })));
  assert.equal(canonicalCrmDigest([]), createHash("md5").update("empty").digest("hex"));
  const liveCrm = readFileSync(join(process.cwd(), "src/lib/smart-scheduler/live-crm.ts"), "utf8");
  assert.match(liveCrm, /bess_crm_copy_test/);
  assert.match(liveCrm, /insert into crm_store/);
  assert.match(liveCrm, /insert into appointments/);
  assert.doesNotMatch(liveCrm, /time:\s*input\.workStart/);
  assert.doesNotMatch(liveCrm, /scheduler_store_appointments|scheduler_row_appointments/);
  const schedulerSource = readFileSync(join(process.cwd(), "src/lib/smart-scheduler/schedule.ts"), "utf8");
  assert.doesNotMatch(schedulerSource, /250\s*zł|price\s*:/);
  console.log("smart scheduler ok");
})().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
