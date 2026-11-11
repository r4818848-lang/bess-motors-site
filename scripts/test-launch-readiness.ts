import assert from "node:assert/strict";
import {
  leadNoticeDeliveryEnabled,
  reminderDeliveryEnabled,
  cronAuthorized,
  staffCalendarMutationsEnabled,
} from "../src/lib/server/cron-auth";
import {
  deliverAdminArrivalReminders,
  productionAdminChatIds,
} from "../src/lib/server/telegram-cron/admin-arrival-reminders";
import { calendarAppUrl, calendarSiteOrigin } from "../src/lib/server/telegram-bot/staff-calendar-bot";
import { staffRoleFromIds } from "../src/lib/server/staff-calendar-access";
import { installCrmCloudForTests } from "../src/lib/server/crm-cloud";
import { installTelegramSenderForTests } from "../src/lib/server/telegram-api";
import { runAppointmentReminders } from "../src/lib/server/telegram-cron/appointment-reminders";
import { mergeStoredDb, type Appointment, type Database } from "../src/lib/store";

function appointment(patch: Partial<Appointment> = {}): Appointment {
  return {
    id: "apt-test",
    userId: "client-test",
    vehicleId: "v-test",
    serviceIds: ["diagnostic"],
    date: "2026-07-13",
    time: "09:00",
    mechanicId: "mech-1",
    repairStatus: "received",
    appointmentStatus: "scheduled",
    comment: "TEST KALENDARZ",
    clientName: "Test Kalendarz",
    clientPhone: "+48111222333",
    clientPlate: "WX12345",
    source: "telegram",
    createdAt: "2026-07-01T08:00:00.000Z",
    ...patch,
  };
}

function database(apt: Appointment): Database {
  return {
    appointments: [apt],
    users: [
      {
        id: "mech-1",
        role: "mechanic",
        name: "Piotr",
        phone: "+48000000000",
        createdAt: "2024-01-01",
        telegramChatId: "9001",
      },
    ],
    vehicles: [{ id: "v-test", make: "BMW", model: "X3", plate: "WX12345", userId: "client-test" }],
    mechanics: [{ id: "mech-1", name: "Piotr" }],
  } as Database;
}

const due = new Date("2026-07-13T05:00:00.000Z");

async function main(): Promise<void> {

function memoryStore(db: Database) {
  let chain = Promise.resolve();
  return {
    load: async () => db,
    mutate: async (change: (live: Database) => void) => {
      const run = chain.then(() => {
        change(db);
        return true;
      });
      chain = run.then(() => undefined, () => undefined);
      return run;
    },
  };
}

async function run(db: Database, send: (chatId: string) => Promise<boolean>, now = due) {
  const calls: string[] = [];
  const result = await deliverAdminArrivalReminders({
    now,
    adminChatIds: ["1001"],
    store: memoryStore(db),
    send: async (chatId) => {
      calls.push(chatId);
      return send(chatId);
    },
  });
  return { result, calls };
}

const first = database(appointment());
const sent = await run(first, async () => true);
assert.equal(sent.result.sent, 1);
assert.deepEqual(sent.calls, ["1001"]);
const firstClaim = Object.values(first.settings?.arrivalReminderClaims ?? {})[0];
assert.equal(firstClaim?.status, "sent");

const again = await run(first, async () => true);
assert.equal(again.result.sent, 0);
assert.deepEqual(again.calls, []);

const flakyDb = database(appointment({ id: "apt-flaky" }));
const failed = await run(flakyDb, async () => false);
assert.equal(failed.result.failed, 1);
assert.equal(failed.calls.length, 1);
const recovered = await run(flakyDb, async () => true);
assert.equal(recovered.result.sent, 0);
assert.deepEqual(recovered.calls, []);

const cancelDb = database(appointment({ id: "apt-cancel", appointmentStatus: "cancelled" }));
const cancelled = await run(cancelDb, async () => true);
assert.equal(cancelled.result.sent, 0);
assert.deepEqual(cancelled.calls, []);

const moved = database(appointment({ id: "apt-move" }));
await run(moved, async () => true);
moved.appointments[0].date = "2026-07-13";
moved.appointments[0].time = "12:00";
moved.appointments[0].adminReminder = { status: "pending", attempts: 0, deliveredChatIds: [] };
const tooEarly = await run(moved, async () => true, new Date("2026-07-13T05:00:00.000Z"));
assert.deepEqual(tooEarly.calls, []);
const onNewDue = await run(moved, async () => true, new Date("2026-07-13T08:00:00.000Z"));
assert.equal(onNewDue.result.sent, 1);
assert.equal(onNewDue.calls.length, 1);

const mechanicDb = database(appointment({ id: "apt-mech", notifyMechanic: true }));
const both = await run(mechanicDb, async () => true);
assert.deepEqual(both.calls.sort(), ["1001", "9001"]);

const held = database(appointment({ id: "apt-lock" }));
held.settings = {
  ...(held.settings ?? {}),
  arrivalReminderClaims: {
    "apt-lock|admin_two_hour|2026-07-13|09:00": {
      key: "apt-lock|admin_two_hour|2026-07-13|09:00",
      appointmentId: "apt-lock",
      reminderType: "admin_two_hour",
      scheduledAt: due.toISOString(),
      date: "2026-07-13",
      time: "09:00",
      status: "claimed",
      claimedAt: new Date(due.getTime() - 30_000).toISOString(),
      attemptCount: 1,
    },
  },
} as Database["settings"];
const locked = await run(held, async () => true);
assert.deepEqual(locked.calls, []);
const afterLock = await run(held, async () => true, new Date(due.getTime() + 3 * 60 * 1000));
assert.equal(afterLock.result.sent, 0);
assert.deepEqual(afterLock.calls, []);

const previousEnv = {
  VERCEL_ENV: process.env.VERCEL_ENV,
  REMINDER_DELIVERY: process.env.REMINDER_DELIVERY,
  CRON_SECRET: process.env.CRON_SECRET,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  LEAD_NOTICE_DELIVERY: process.env.LEAD_NOTICE_DELIVERY,
};
delete process.env.VERCEL_ENV;
delete process.env.REMINDER_DELIVERY;
assert.equal(reminderDeliveryEnabled(), false);
process.env.VERCEL_ENV = "production";
assert.equal(reminderDeliveryEnabled(), true);
process.env.VERCEL_ENV = "preview";
process.env.REMINDER_DELIVERY = "live";
assert.equal(reminderDeliveryEnabled(), false);
process.env.VERCEL_ENV = "production";
process.env.REMINDER_DELIVERY = "disabled";
assert.equal(reminderDeliveryEnabled(), false);
process.env.REMINDER_DELIVERY = "live";
process.env.LEAD_NOTICE_DELIVERY = "disabled";
assert.equal(reminderDeliveryEnabled(), true);
assert.equal(leadNoticeDeliveryEnabled(), false);
delete process.env.LEAD_NOTICE_DELIVERY;

const writesEnv = process.env.STAFF_CALENDAR_WRITES;
delete process.env.STAFF_CALENDAR_WRITES;
process.env.VERCEL_ENV = "preview";
assert.equal(staffCalendarMutationsEnabled(), false);
process.env.VERCEL_ENV = "production";
assert.equal(staffCalendarMutationsEnabled(), true);
delete process.env.VERCEL_ENV;
assert.equal(staffCalendarMutationsEnabled(), false);
process.env.STAFF_CALENDAR_WRITES = "local";
assert.equal(staffCalendarMutationsEnabled(), true);
process.env.STAFF_CALENDAR_WRITES = "disabled";
process.env.VERCEL_ENV = "production";
assert.equal(staffCalendarMutationsEnabled(), false);
process.env.STAFF_CALENDAR_WRITES = writesEnv;

process.env.CRON_SECRET = "launch-readiness-secret";
assert.equal(cronAuthorized("Bearer launch-readiness-secret"), true);
assert.equal(cronAuthorized("Bearer launch-readiness-secreT"), false);
assert.equal(cronAuthorized(null), false);

delete process.env.NEXT_PUBLIC_SITE_URL;
assert.equal(calendarSiteOrigin(), "https://www.bess-motors.com");
assert.equal(calendarAppUrl("apt-test"), "https://www.bess-motors.com/telegram/calendar?apt=apt-test");
process.env.NEXT_PUBLIC_SITE_URL = "http://example.test";
assert.equal(calendarAppUrl(), "https://www.bess-motors.com/telegram/calendar");
process.env.NEXT_PUBLIC_SITE_URL = "https://www.bess-motors.com";
assert.equal(calendarAppUrl(), "https://www.bess-motors.com/telegram/calendar");

const telegramEnv = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  TELEGRAM_ADMIN_CHAT_IDS: process.env.TELEGRAM_ADMIN_CHAT_IDS,
  TELEGRAM_OWNER_CHAT_ID: process.env.TELEGRAM_OWNER_CHAT_ID,
};
process.env.TELEGRAM_BOT_TOKEN = "123456:launch-readiness";
process.env.TELEGRAM_CHAT_ID = "1001";
process.env.TELEGRAM_ADMIN_CHAT_IDS = "2222";
process.env.TELEGRAM_OWNER_CHAT_ID = "7777";
assert.deepEqual(productionAdminChatIds().sort(), ["1001", "2222", "7777"]);
process.env.TELEGRAM_BOT_TOKEN = telegramEnv.TELEGRAM_BOT_TOKEN;
process.env.TELEGRAM_CHAT_ID = telegramEnv.TELEGRAM_CHAT_ID;
process.env.TELEGRAM_ADMIN_CHAT_IDS = telegramEnv.TELEGRAM_ADMIN_CHAT_IDS;
process.env.TELEGRAM_OWNER_CHAT_ID = telegramEnv.TELEGRAM_OWNER_CHAT_ID;

const owners = new Set(["111"]);
const admins = new Set(["111", "222"]);
assert.equal(staffRoleFromIds("111", owners, admins), "owner");
assert.equal(staffRoleFromIds("222", owners, admins), "admin");
assert.equal(staffRoleFromIds("333", owners, admins), null);

const noticeEnv = process.env.VERCEL_ENV;
const noticeToken = process.env.TELEGRAM_BOT_TOKEN;
const noticeChat = process.env.TELEGRAM_CHAT_ID;
const noticeAdmins = process.env.TELEGRAM_ADMIN_CHAT_IDS;
const noticeOwners = process.env.TELEGRAM_OWNER_CHAT_ID;
const noticeLeads = process.env.LEAD_NOTICE_DELIVERY;
delete process.env.VERCEL_ENV;
process.env.TELEGRAM_BOT_TOKEN = "123456:arrival-once";
process.env.TELEGRAM_CHAT_ID = "1001";
delete process.env.TELEGRAM_ADMIN_CHAT_IDS;
delete process.env.TELEGRAM_OWNER_CHAT_ID;
process.env.LEAD_NOTICE_DELIVERY = "disabled";
{
  let doc = mergeStoredDb({
    appointments: [appointment({ id: "apt-once", updatedAt: "2026-07-01T08:00:00.000Z" })],
  });
  let revision = "2026-07-13T00:00:00.000Z";
  installCrmCloudForTests({
    get: async () => ({ doc: structuredClone(doc), updatedAt: revision }),
    patch: async (next, expected) => {
      if (expected !== revision) return "stale";
      doc = structuredClone(next);
      revision = new Date(Date.parse(revision) + 1).toISOString();
      return "ok";
    },
  });
  const texts: string[] = [];
  installTelegramSenderForTests(async (_chatId, text) => {
    texts.push(text);
    return texts.length;
  });
  const dueAt = new Date("2026-07-13T05:00:00.000Z");
  await runAppointmentReminders(structuredClone(doc), dueAt);
  assert.equal(texts.length, 1);
  assert.match(texts[0] ?? "", /Скоро приедет клиент/);
  const claim = Object.values(doc.settings.arrivalReminderClaims ?? {})[0];
  assert.equal(claim?.status, "sent");
  assert.equal(claim?.attemptCount, 1);
  await runAppointmentReminders(structuredClone(doc), new Date(dueAt.getTime() + 5 * 60 * 1000));
  await runAppointmentReminders(structuredClone(doc), new Date(dueAt.getTime() + 40 * 60 * 1000));
  assert.equal(texts.length, 1);
  installCrmCloudForTests(null);
  installTelegramSenderForTests(null);
}
if (noticeEnv === undefined) delete process.env.VERCEL_ENV;
else process.env.VERCEL_ENV = noticeEnv;
if (noticeToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
else process.env.TELEGRAM_BOT_TOKEN = noticeToken;
if (noticeChat === undefined) delete process.env.TELEGRAM_CHAT_ID;
else process.env.TELEGRAM_CHAT_ID = noticeChat;
if (noticeAdmins === undefined) delete process.env.TELEGRAM_ADMIN_CHAT_IDS;
else process.env.TELEGRAM_ADMIN_CHAT_IDS = noticeAdmins;
if (noticeOwners === undefined) delete process.env.TELEGRAM_OWNER_CHAT_ID;
else process.env.TELEGRAM_OWNER_CHAT_ID = noticeOwners;
if (noticeLeads === undefined) delete process.env.LEAD_NOTICE_DELIVERY;
else process.env.LEAD_NOTICE_DELIVERY = noticeLeads;

process.env.VERCEL_ENV = previousEnv.VERCEL_ENV;
process.env.REMINDER_DELIVERY = previousEnv.REMINDER_DELIVERY;
process.env.CRON_SECRET = previousEnv.CRON_SECRET;
process.env.NEXT_PUBLIC_SITE_URL = previousEnv.NEXT_PUBLIC_SITE_URL;
if (previousEnv.LEAD_NOTICE_DELIVERY === undefined) delete process.env.LEAD_NOTICE_DELIVERY;
else process.env.LEAD_NOTICE_DELIVERY = previousEnv.LEAD_NOTICE_DELIVERY;

console.log("launch readiness ok");
}

void main();
