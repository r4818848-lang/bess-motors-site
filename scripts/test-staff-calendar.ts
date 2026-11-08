import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { workshopHours } from "../src/lib/businessConfig";
import {
  canStaff,
  evaluateStaffArrival,
  findMechanicConflict,
  occupationChunks,
  planAdminReminder,
} from "../src/lib/staff-calendar";
import { verifyTelegramWebAppInitData } from "../src/lib/server/telegram-webapp-auth";
import { adminReplyKeyboard, mainMenuKeyboard } from "../src/lib/server/telegram-bot/keyboards";
import { mechanicMainKeyboard } from "../src/lib/server/telegram-bot/mechanic-handler";
import {
  clientMainKeyboard,
  clientStartReplyKeyboard,
} from "../src/lib/server/telegram-bot/client-keyboards";
import { getClientBotLabels } from "../src/lib/server/telegram-bot/client-i18n";
import {
  CALENDAR_REPLY_LABEL,
  calendarAppUrl,
  calendarOpenKeyboard,
  isCalendarOpenText,
  staffCalendarMenuButtonBody,
  todayKeyboard,
} from "../src/lib/server/telegram-bot/staff-calendar-bot";
import { warsawCivilToUtc } from "../src/lib/workshop-schedule";
import type { AppointmentStatus } from "../src/lib/store";

const hours = workshopHours();
const lunch = { start: "13:00", end: "14:00" };

function utcHour(dateKey: string, time: string): number {
  const instant = warsawCivilToUtc(dateKey, time);
  assert.ok(instant, `${dateKey} ${time}`);
  return instant.getUTCHours();
}

assert.equal(utcHour("2026-01-12", "09:00"), 8);
assert.equal(utcHour("2026-07-13", "09:00"), 7);
assert.equal(utcHour("2026-03-30", "09:00"), 7);
assert.equal(utcHour("2026-10-26", "09:00"), 8);
assert.equal(warsawCivilToUtc("2026-03-29", "02:30"), null);

const monday = "2026-11-09";
const saturday = "2026-11-14";
const sunday = "2026-11-15";

assert.equal(
  evaluateStaffArrival({ date: monday, time: "08:00", durationMinutes: 60, hours, lunch }).ok,
  false
);
assert.equal(
  evaluateStaffArrival({ date: monday, time: "18:00", durationMinutes: 60, hours, lunch }).ok,
  false
);
assert.equal(
  evaluateStaffArrival({ date: saturday, time: "15:00", durationMinutes: 60, hours, lunch }).ok,
  false
);
assert.equal(
  evaluateStaffArrival({ date: sunday, time: "10:00", durationMinutes: 60, hours, lunch }).ok,
  false
);
assert.equal(
  evaluateStaffArrival({ date: monday, time: "13:30", durationMinutes: 60, hours, lunch, now: new Date("2026-11-09T07:00:00.000Z") }).ok,
  true
);
assert.equal(
  evaluateStaffArrival({
    date: monday,
    time: "17:00",
    durationMinutes: 120,
    hours,
    lunch,
  }).ok,
  false
);
assert.equal(
  evaluateStaffArrival({
    date: monday,
    time: "17:00",
    durationMinutes: 120,
    allowMultiDay: true,
    hours,
    lunch,
  }).ok,
  false
);
assert.equal(
  evaluateStaffArrival({
    date: monday,
    time: "13:30",
    durationMinutes: 120,
    hours,
    lunch,
    now: new Date("2026-11-09T07:00:00.000Z"),
  }).ok,
  true
);

const longJob = occupationChunks({
  date: monday,
  time: "17:00",
  durationMinutes: 120,
  hours,
  lunch,
});
assert.deepEqual(
  longJob.map((chunk) => chunk.dateKey),
  [monday, "2026-11-10"]
);

const base = {
  serviceIds: ["diagnostic"],
  appointmentStatus: "scheduled" as AppointmentStatus,
  holdUntil: undefined,
};

assert.equal(
  findMechanicConflict(
    [{ ...base, id: "a", date: monday, time: "10:00", mechanicId: "mech-1", durationMinutes: 60 }],
    { ...base, id: "b", date: monday, time: "10:00", mechanicId: "mech-2", durationMinutes: 60 },
    hours,
    lunch
  ),
  null
);
assert.equal(
  findMechanicConflict(
    [{ ...base, id: "a", date: monday, time: "10:00", mechanicId: "mech-1", durationMinutes: 120, leavesCar: true }],
    { ...base, id: "b", date: monday, time: "11:00", mechanicId: "mech-1", durationMinutes: 60, leavesCar: true },
    hours,
    lunch
  ),
  null
);
assert.equal(
  findMechanicConflict(
    [{ ...base, id: "a", date: monday, time: "09:00", mechanicId: "mech-1", durationMinutes: 60, workStart: "10:00", workMinutes: 120 }],
    { ...base, id: "b", date: monday, time: "11:00", mechanicId: "mech-1", durationMinutes: 60, workStart: "11:00", workMinutes: 60 },
    hours,
    lunch
  ),
  "a"
);
assert.equal(
  findMechanicConflict(
    [{ ...base, id: "a", date: monday, time: "10:00", mechanicId: "mech-1", durationMinutes: 60 }],
    { ...base, id: "b", date: monday, time: "11:00", mechanicId: "mech-1", durationMinutes: 60 },
    hours,
    lunch
  ),
  null
);

const visit = {
  date: "2026-07-13",
  time: "09:00",
  appointmentStatus: "scheduled",
  createdAt: "2026-07-01T08:00:00.000Z",
};
assert.equal(planAdminReminder(visit, new Date("2026-07-13T04:59:00.000Z")).action, "skip");
assert.equal(planAdminReminder(visit, new Date("2026-07-13T05:00:00.000Z")).action, "send");
const soon = planAdminReminder(
  { ...visit, createdAt: "2026-07-13T06:30:00.000Z" },
  new Date("2026-07-13T06:30:00.000Z")
);
assert.equal(soon.action, "send");
if (soon.action === "send") assert.equal(soon.kind, "soon");
const movedInsideWindow = planAdminReminder(visit, new Date("2026-07-13T05:30:00.000Z"));
assert.equal(movedInsideWindow.action, "send");
if (movedInsideWindow.action === "send") assert.equal(movedInsideWindow.kind, "soon");
const onTheHour = planAdminReminder(visit, new Date("2026-07-13T05:00:00.000Z"));
if (onTheHour.action === "send") assert.equal(onTheHour.kind, "two_hour");
assert.equal(
  planAdminReminder(
    { ...visit, adminReminder: { status: "sent" } },
    new Date("2026-07-13T05:10:00.000Z")
  ).action,
  "skip"
);
assert.equal(
  planAdminReminder(
    { ...visit, appointmentStatus: "cancelled" },
    new Date("2026-07-13T05:10:00.000Z")
  ).action,
  "cancel"
);
assert.equal(
  planAdminReminder(
    { ...visit, adminReminder: { status: "failed", attempts: 5 } },
    new Date("2026-07-13T05:10:00.000Z")
  ).action,
  "skip"
);

assert.equal(canStaff("owner", "cancel"), true);
assert.equal(canStaff("admin", "create"), true);
assert.equal(canStaff("mechanic", "create"), false);
assert.equal(canStaff("mechanic", "update", { mechanicCanEdit: true }), true);

process.env.TELEGRAM_BOT_TOKEN = "123456:staff-calendar-test";
const nowSec = 1_762_000_000;
const params = new URLSearchParams();
params.set("auth_date", String(nowSec));
params.set("query_id", "AA");
params.set("user", JSON.stringify({ id: 77, language_code: "ru" }));
const pairs = [...params.entries()].map(([key, value]) => `${key}=${value}`).sort();
const secret = createHmac("sha256", "WebAppData").update(process.env.TELEGRAM_BOT_TOKEN).digest();
const hash = createHmac("sha256", secret).update(pairs.join("\n")).digest("hex");
params.set("hash", hash);
const initData = params.toString();
const ok = verifyTelegramWebAppInitData(initData, nowSec);
assert.equal(ok.ok, true);
if (ok.ok) assert.equal(ok.user.id, 77);
assert.equal(verifyTelegramWebAppInitData(initData.replace(hash, "00"), nowSec).ok, false);
assert.equal(verifyTelegramWebAppInitData(initData, nowSec + 90_000).ok, false);
assert.equal(verifyTelegramWebAppInitData("", nowSec).ok, false);
assert.equal(verifyTelegramWebAppInitData("   ", nowSec).ok, false);
assert.equal(verifyTelegramWebAppInitData(undefined, nowSec).ok, false);
assert.equal(
  verifyTelegramWebAppInitData(
    `auth_date=${nowSec}&user=${encodeURIComponent(JSON.stringify({ id: 77 }))}`,
    nowSec
  ).ok,
  false
);

const calendarUrl = "https://www.bess-motors.com/telegram/calendar";
delete process.env.NEXT_PUBLIC_SITE_URL;
assert.equal(calendarAppUrl(), calendarUrl);
assert.equal(calendarAppUrl("apt-test"), `${calendarUrl}?apt=apt-test`);

function inlineCalendar(markup: { inline_keyboard: { text: string; web_app?: { url: string }; url?: string }[][] }) {
  const button = markup.inline_keyboard.flat().find((item) => item.text === "📅 Календарь");
  assert.ok(button);
  assert.equal(button.web_app?.url, calendarUrl);
  assert.equal(button.url, undefined);
  return button;
}

inlineCalendar(mainMenuKeyboard());
inlineCalendar(calendarOpenKeyboard());
inlineCalendar(todayKeyboard());
inlineCalendar(mechanicMainKeyboard());
const record = calendarOpenKeyboard("apt-test").inline_keyboard[0][0];
assert.equal(record.text, "Открыть запись");
assert.equal(record.web_app?.url, `${calendarUrl}?apt=apt-test`);

const replyCalendar = adminReplyKeyboard().keyboard.flat().find((button) => button.text === CALENDAR_REPLY_LABEL);
assert.ok(replyCalendar);
assert.equal(replyCalendar.web_app, undefined);
assert.equal(isCalendarOpenText(CALENDAR_REPLY_LABEL), true);
assert.equal(isCalendarOpenText("/calendar"), true);
assert.equal(isCalendarOpenText("/calendar now"), false);

const menu = staffCalendarMenuButtonBody(4242);
assert.equal(menu.chat_id, 4242);
assert.equal(menu.menu_button.type, "web_app");
assert.equal(menu.menu_button.web_app.url, calendarUrl);
assert.throws(() => staffCalendarMenuButtonBody(Number.NaN));

const clientMarkup = JSON.stringify([
  clientStartReplyKeyboard(getClientBotLabels("ru")),
  clientMainKeyboard("ru"),
  clientMainKeyboard("pl"),
]);
assert.equal(clientMarkup.includes("telegram/calendar"), false);
assert.equal(clientMarkup.includes("web_app"), false);

const apiSource = readFileSync(join(process.cwd(), "src/lib/server/telegram-api.ts"), "utf8");
assert.match(apiSource, /telegramRequest\("setChatMenuButton", body\)/);
assert.doesNotMatch(apiSource, /setChatMenuButton",\s*\{/);

console.log("staff calendar ok");
