import assert from "node:assert/strict";
import { arrivalTimes, evaluateArrivalTime } from "../src/lib/arrival-window";
import { archiveCalendarHistory, planCalendarArchive } from "../src/lib/calendar-history";
import {
  formatMorningDigest,
  isMorningDigestHour,
  morningDigestAlreadySent,
  visibleTodayArrivals,
} from "../src/lib/morning-digest";
import { findMechanicConflict } from "../src/lib/staff-calendar";
import { leadNeedsNotice } from "../src/lib/server/telegram-cron/lead-notifications";
import {
  formatLeadMessage,
  normalizeSiteLocale,
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

console.log("arrival and leads ok");
