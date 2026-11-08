import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { arrivalTimes, evaluateArrivalTime } from "../src/lib/arrival-window";
import { archiveCalendarHistory, isActiveCalendarVisit, planCalendarArchive } from "../src/lib/calendar-history";
import { cronHoldActive } from "../src/lib/server/crm-cloud-mutate";
import { getSupabaseConfig } from "../src/lib/server/supabase-config";
import { mergeServerCloudMutation } from "../src/lib/crm-db-merge";
import {
  formatMorningDigest,
  isMorningDigestHour,
  morningDigestAlreadySent,
  visibleTodayArrivals,
} from "../src/lib/morning-digest";
import { findMechanicConflict } from "../src/lib/staff-calendar";
import { leadNeedsNotice } from "../src/lib/server/telegram-cron/lead-notifications";
import {
  applyLeadAction,
  formatLeadMessage,
  normalizeSiteLocale,
  quoteSubmittedLine,
  quoteService,
  totalQuote,
  upsertWebsiteLead,
} from "../src/lib/service-leads";
import { mergeStoredDb, type Appointment, type Database, type ServiceLead } from "../src/lib/store";
import { warsawCivilToUtc } from "../src/lib/workshop-schedule";
import { workshopHours } from "../src/lib/businessConfig";
import { adminReplyKeyboard, mainMenuKeyboard } from "../src/lib/server/telegram-bot/keyboards";

const hours = workshopHours();
const lunch = { start: "13:00", end: "14:00" };
const past = new Date("2026-11-08T06:00:00.000Z");

assert.equal(evaluateArrivalTime({ date: "2026-11-09", time: "09:00", now: past }).ok, true);
assert.equal(evaluateArrivalTime({ date: "2026-11-09", time: "13:30", now: past }).ok, true);
assert.equal(evaluateArrivalTime({ date: "2026-11-09", time: "14:00", now: past }).ok, false);
assert.equal(evaluateArrivalTime({ date: "2026-11-09", time: "09:15", now: past }).ok, false);
assert.equal(evaluateArrivalTime({ date: "2026-11-15", time: "10:00", now: past }).ok, false);
assert.deepEqual(arrivalTimes("2026-11-09", past), [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
]);
assert.deepEqual(arrivalTimes("2026-11-15", past), []);

assert.equal(warsawCivilToUtc("2026-01-12", "09:00")?.toISOString(), "2026-01-12T08:00:00.000Z");
assert.equal(warsawCivilToUtc("2026-07-13", "09:00")?.toISOString(), "2026-07-13T07:00:00.000Z");
assert.equal(isMorningDigestHour(new Date("2026-01-12T07:00:00.000Z")), true);
assert.equal(isMorningDigestHour(new Date("2026-07-13T06:00:00.000Z")), true);
assert.equal(isMorningDigestHour(new Date("2026-01-12T06:00:00.000Z")), false);
assert.equal(isMorningDigestHour(new Date("2026-07-13T07:00:00.000Z")), false);

function visit(partial: Partial<Appointment> & Pick<Appointment, "id" | "date" | "time">): Appointment {
  return {
    userId: "u",
    vehicleId: "v",
    serviceIds: ["diagnostic"],
    mechanicId: "mech-1",
    repairStatus: "received",
    appointmentStatus: "scheduled",
    comment: "",
    createdAt: "2026-11-01T08:00:00.000Z",
    clientName: "Jan",
    clientPhone: "+48111222333",
    ...partial,
  };
}

const today = "2026-11-09";
const rows = [
  visit({ id: "today", date: today, time: "09:00" }),
  visit({ id: "other", date: "2026-11-10", time: "09:30" }),
  visit({ id: "old", date: "2026-11-01", time: "10:00", appointmentStatus: "completed" }),
  visit({ id: "cancelled", date: today, time: "10:00", appointmentStatus: "cancelled" }),
  visit({ id: "hidden", date: today, time: "10:30", calendarHidden: true }),
];
assert.deepEqual(visibleTodayArrivals(rows, today).map((row) => row.id), ["today"]);
assert.equal(isActiveCalendarVisit(rows[0], today), true);
assert.equal(isActiveCalendarVisit(rows[1], today), true);
assert.equal(isActiveCalendarVisit(rows[2], today), false);
assert.equal(isActiveCalendarVisit(rows[3], today), false);
assert.equal(isActiveCalendarVisit(rows[4], today), false);
assert.equal(isActiveCalendarVisit(visit({ id: "past", date: "2026-11-01", time: "09:00" }), today), false);

const archived = archiveCalendarHistory(rows, today, "2026-11-09T07:00:00.000Z");
assert.equal(archived.appointments.find((row) => row.id === "today")?.calendarHidden, undefined);
assert.equal(archived.appointments.find((row) => row.id === "other")?.calendarHidden, undefined);
assert.equal(archived.appointments.find((row) => row.id === "old")?.calendarHidden, true);
assert.equal(archived.appointments.find((row) => row.id === "cancelled")?.calendarHidden, true);
assert.equal(planCalendarArchive(rows, today).keepFuture, 1);

assert.equal(
  findMechanicConflict(
    [visit({ id: "drop", date: today, time: "09:00", leavesCar: true, holdUntil: "2026-11-09" })],
    visit({ id: "next", date: today, time: "09:30", leavesCar: true }),
    hours,
    lunch
  ),
  null
);
assert.equal(
  findMechanicConflict(
    [visit({ id: "job", date: today, time: "09:00", workStart: "09:00", workMinutes: 90 })],
    visit({ id: "overlap", date: today, time: "10:00", workStart: "10:00", workMinutes: 60 }),
    hours,
    lunch
  ),
  "job"
);

const db = mergeStoredDb({ appointments: [] });
const first = upsertWebsiteLead(db, {
  clientRequestId: "same",
  phone: "+48111222333",
  name: "Jan Kowalski",
  serviceId: "diagnostic",
  serviceLabel: "Diagnostyka",
  siteLocale: "uk",
  source: "website",
  sourceUrl: "https://www.bess-motors.com/booking",
  now: past,
});
const second = upsertWebsiteLead(db, {
  clientRequestId: "same",
  phone: "+48111222333",
  serviceLabel: "Diagnostyka",
  now: past,
});
assert.equal(first.created, true);
assert.equal(second.created, false);
assert.equal(db.leads.length, 1);
assert.equal(first.lead.siteLocale, "uk");
assert.equal(first.lead.vin, "");
assert.match(formatLeadMessage(first.lead), /Язык сайта: UK/);
assert.match(formatLeadMessage(first.lead), /Не указано/);
assert.equal(normalizeSiteLocale("ua"), "uk");
assert.equal(normalizeSiteLocale("en"), "en");
assert.equal(normalizeSiteLocale(""), "pl");

const priced = quoteService("diagnostic", "Diagnostyka");
assert.match(priced.priceText, /zł|требует расчёта/);
assert.equal(totalQuote([{ priceText: "требует расчёта" }]), "требует расчёта");

const digestDb = {
  ...db,
  appointments: rows,
  vehicles: [{ id: "v", userId: "u", make: "BMW", model: "320", plate: "WX12345", vin: "", mileage: 0, engine: "", engineVolume: "", trim: "", power: "", powerKw: "", transmission: "", drivetrain: "", year: "", color: "", colorHex: "", imageUrl: "", fuelType: "", notes: "" }],
} as Database;
assert.match(formatMorningDigest(digestDb, today), /09:00 \/ Jan \/ BMW 320 WX12345/);
assert.match(formatMorningDigest({ ...digestDb, appointments: [] }, today), /На сегодня записей нет/);
assert.equal(morningDigestAlreadySent({ ...digestDb, settings: { ...digestDb.settings, morningDigestDate: today } }, today), true);

const pending: ServiceLead = { ...first.lead, notifyStatus: "pending", notifyAttempts: 0 };
assert.equal(leadNeedsNotice(pending, new Date(past.getTime() + 60_000)), true);
assert.equal(leadNeedsNotice({ ...pending, notifyStatus: "sent" }, past), false);
assert.equal(leadNeedsNotice(pending, new Date(past.getTime() + 25 * 60 * 60 * 1000)), false);

const labels = JSON.stringify(mainMenuKeyboard()) + JSON.stringify(adminReplyKeyboard());
for (const removed of ["Финансы", "Заказ-наряд", "Горячие", "Долги", "Подпись", "Быстрый заказ", "Импорт", "Аналитика", "Расходы", "Склад", "Запчасти", "Расходники"]) {
  assert.equal(labels.includes(removed), false, removed);
}
assert.match(labels, /📅 Календарь/);
assert.match(labels, /📥 Заявки/);
assert.match(labels, /🚗 Сегодня/);
assert.match(labels, /➕ Новая запись/);

assert.match(quoteSubmittedLine("computer_diag", "Diagnostyka", 1).priceText, /^от \d+ zł$/);
assert.equal(quoteSubmittedLine("missing-service", "Неизвестная", 1).priceText, "требует расчёта");
const shortVin = upsertWebsiteLead(db, {
  clientRequestId: "vin-short",
  phone: "+48111222333",
  name: "Jan",
  vin: "ABC",
  serviceLabel: "VIN",
  siteLocale: "ru",
  now: new Date(past.getTime() + 5 * 60 * 1000),
});
assert.equal(shortVin.lead.vin, "");
assert.equal(shortVin.lead.siteLocale, "ru");

for (const [index, locale] of (["pl", "uk", "ru", "en"] as const).entries()) {
  const saved = upsertWebsiteLead(db, {
    clientRequestId: `locale-${locale}`,
    phone: `+480000001${index}`,
    name: "Test",
    serviceLabel: "Diagnostyka",
    siteLocale: locale,
    now: past,
  });
  assert.equal(saved.created, true);
  assert.equal(saved.lead.siteLocale, locale);
  assert.match(formatLeadMessage(saved.lead), new RegExp(`Язык сайта: ${locale.toUpperCase()}`));
}

const parallelBase = mergeStoredDb({ leads: [] });
upsertWebsiteLead(parallelBase, { clientRequestId: "lead-a", phone: "+48111000001", name: "Anna", serviceLabel: "Olej", now: past });
upsertWebsiteLead(parallelBase, { clientRequestId: "lead-b", phone: "+48111000002", name: "Bartek", serviceLabel: "Hamulce", now: past });
const left = structuredClone(parallelBase);
const right = structuredClone(parallelBase);
applyLeadAction(left.leads[0], "no_answer", new Date("2026-11-08T08:00:00.000Z"), "admin-1");
applyLeadAction(right.leads[1], "decline", new Date("2026-11-08T08:00:01.000Z"), "admin-2");
const merged = mergeServerCloudMutation(left, right);
assert.equal(merged.leads.find((lead) => lead.clientRequestId === "lead-a")?.status, "no_answer");
assert.equal(merged.leads.find((lead) => lead.clientRequestId === "lead-b")?.status, "declined");
const same = structuredClone(merged);
applyLeadAction(same.leads[0], "confirm_call", new Date("2026-11-08T08:05:00.000Z"), "admin-1");
assert.equal(same.leads[0].status, "no_answer");
assert.equal(same.leads[0].contacts.at(-1)?.kind, "call");
applyLeadAction(same.leads[0], "booked", new Date("2026-11-08T08:06:00.000Z"));
assert.equal(same.leads[0].status, "booked");

assert.equal(leadNeedsNotice({ ...pending, notifyStatus: "sending", updatedAt: new Date(past.getTime() + 30_000).toISOString() }, new Date(past.getTime() + 60_000)), false);
assert.equal(cronHoldActive(new Date(past.getTime() + 60_000).toISOString(), past), true);
assert.equal(cronHoldActive(new Date(past.getTime() - 1000).toISOString(), past), false);

const lockSql = readFileSync("supabase/lock-crm-personal-access.sql", "utf8");
assert.match(lockSql, /enable row level security/);
assert.match(lockSql, /force row level security/);
assert.match(lockSql, /revoke all on table public\.crm_store from public, anon, authenticated/);
assert.match(lockSql, /revoke all on table public\.appointments from public, anon, authenticated/);
assert.match(lockSql, /grant select, insert, update, delete on table public\.crm_store to service_role/);
assert.match(lockSql, /grant select, insert, update, delete on table public\.appointments to service_role/);
assert.doesNotMatch(lockSql, /grant .+ to anon/i);
assert.doesNotMatch(lockSql, /to authenticated/i);
const serverAccess = [
  readFileSync("src/lib/server/crm-cloud.ts", "utf8"),
  readFileSync("src/lib/server/appointments-cloud.ts", "utf8"),
].join("\n");
assert.match(serverAccess, /getSupabaseConfig/);
assert.match(serverAccess, /apikey: cfg\.key/);
assert.doesNotMatch(serverAccess, /SUPABASE_ANON|sb_publishable_/);
const savedUrl = process.env.SUPABASE_URL;
const savedKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_publishable_abcdefghijklmnopqrstuvwxyz";
assert.equal(getSupabaseConfig(), null);
process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_abcdefghijklmnopqrstuvwxyz";
assert.equal(getSupabaseConfig()?.key.startsWith("sb_secret_"), true);
if (savedUrl === undefined) delete process.env.SUPABASE_URL;
else process.env.SUPABASE_URL = savedUrl;
if (savedKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
else process.env.SUPABASE_SERVICE_ROLE_KEY = savedKey;
assert.equal(getSupabaseConfig(), null);

console.log("arrival and leads ok");
