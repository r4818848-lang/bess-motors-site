import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { GET as board } from "../src/app/api/internal/schedule/board/route";
import { POST as reservations } from "../src/app/api/internal/schedule/reservations/route";
import {
  schedulerPageOpen,
  schedulerReadOnlyPilotEnabled,
  schedulerTestWritesEnabled,
  schedulerUnifiedCalendarWired,
  smartWorkSchedulerEnabled,
} from "../src/lib/smart-scheduler/flag";
import { installCrmCloudForTests } from "../src/lib/server/crm-cloud";
import { mainMenuKeyboard } from "../src/lib/server/telegram-bot/keyboards";
import { calendarOpenKeyboard } from "../src/lib/server/telegram-bot/staff-calendar-bot";

const keys = [
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
  "TELEGRAM_ADMIN_CHAT_IDS",
  "SMART_WORK_SCHEDULER",
  "SCHEDULER_UNIFIED_CALENDAR",
  "SCHEDULER_TEST_WRITES",
  "SCHEDULER_TEST_BOARD",
  "SCHEDULER_READ_ONLY_PILOT",
  "SCHEDULER_CRM_SOURCE",
  "SCHEDULER_DATABASE_URL",
  "VERCEL_ENV",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "TELEGRAM_MECHANIC_BINDINGS",
  "TELEGRAM_MECHANIC_CHAT_IDS",
  "TELEGRAM_MECHANIC_ALLOW_LEGACY_CHAT_IDS",
] as const;

const saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

function restore(): void {
  for (const key of keys) {
    const value = saved[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  installCrmCloudForTests(null);
}

function signedInitData(userId: number): string {
  const params = new URLSearchParams();
  params.set("auth_date", String(Math.floor(Date.now() / 1000)));
  params.set("query_id", "AA");
  params.set("user", JSON.stringify({ id: userId, username: "owner", language_code: "ru" }));
  const pairs = [...params.entries()].map(([key, value]) => `${key}=${value}`).sort();
  const secret = createHmac("sha256", "WebAppData").update(process.env.TELEGRAM_BOT_TOKEN ?? "").digest();
  const hash = createHmac("sha256", secret).update(pairs.join("\n")).digest("hex");
  params.set("hash", hash);
  return params.toString();
}

function clearFlags(): void {
  delete process.env.SMART_WORK_SCHEDULER;
  delete process.env.SCHEDULER_UNIFIED_CALENDAR;
  delete process.env.SCHEDULER_TEST_WRITES;
  delete process.env.SCHEDULER_TEST_BOARD;
  delete process.env.SCHEDULER_READ_ONLY_PILOT;
  delete process.env.SCHEDULER_CRM_SOURCE;
  delete process.env.SCHEDULER_DATABASE_URL;
  delete process.env.VERCEL_ENV;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
}

async function main(): Promise<void> {
  installCrmCloudForTests(null);
  clearFlags();
  assert.equal(smartWorkSchedulerEnabled(), false);
  assert.equal(schedulerTestWritesEnabled(), false);
  assert.equal(schedulerUnifiedCalendarWired(), false);
  assert.equal(schedulerReadOnlyPilotEnabled(), false);
  assert.equal(schedulerPageOpen(), false);
  // The regular calendar link must remain intact, and the new entry hidden by default.
  assert.equal(JSON.stringify(mainMenuKeyboard()).includes("/telegram/scheduler"), false);
  assert.equal(JSON.stringify(calendarOpenKeyboard()).includes("/telegram/scheduler"), false);
  assert.equal(JSON.stringify(mainMenuKeyboard()).includes("/telegram/calendar"), true);

  process.env.SCHEDULER_READ_ONLY_PILOT = "local";
  process.env.VERCEL_ENV = "preview";
  assert.equal(schedulerReadOnlyPilotEnabled(), false);
  process.env.VERCEL_ENV = "production";
  assert.equal(schedulerReadOnlyPilotEnabled(), false);

  clearFlags();
  process.env.SCHEDULER_READ_ONLY_PILOT = "production-readonly";
  process.env.VERCEL_ENV = "production";
  process.env.SCHEDULER_CRM_SOURCE = "cloud";
  assert.equal(schedulerReadOnlyPilotEnabled(), true);
  assert.equal(schedulerPageOpen(), true);
  const menu = mainMenuKeyboard().inline_keyboard.flat();
  const smartLinks = menu.filter((row) => row.web_app?.url.endsWith("/telegram/scheduler"));
  assert.equal(smartLinks.length, 1);
  assert.match(smartLinks[0].text, /просмотр/);
  assert.equal(menu.some((row) => row.web_app?.url.endsWith("/telegram/calendar")), true);
  assert.equal(calendarOpenKeyboard().inline_keyboard.flat().filter((row) => row.web_app?.url.endsWith("/telegram/scheduler")).length, 1);
  assert.equal(schedulerTestWritesEnabled(), false);
  process.env.SMART_WORK_SCHEDULER = "true";
  assert.equal(schedulerReadOnlyPilotEnabled(), false);
  assert.equal(JSON.stringify(mainMenuKeyboard()).includes("/telegram/scheduler"), false);
  delete process.env.SMART_WORK_SCHEDULER;

  process.env.TELEGRAM_BOT_TOKEN = "123456:scheduler-readonly-test";
  process.env.TELEGRAM_CHAT_ID = "77";
  delete process.env.TELEGRAM_ADMIN_CHAT_IDS;
  delete process.env.TELEGRAM_MECHANIC_BINDINGS;
  delete process.env.TELEGRAM_MECHANIC_CHAT_IDS;
  delete process.env.TELEGRAM_MECHANIC_ALLOW_LEGACY_CHAT_IDS;
  delete process.env.SCHEDULER_DATABASE_URL;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SCHEDULER_READ_ONLY_PILOT = "production-readonly";
  process.env.VERCEL_ENV = "production";
  process.env.SCHEDULER_CRM_SOURCE = "cloud";

  const initData = signedInitData(77);
  const missing = await board(new Request("http://local/api/internal/schedule/board"));
  assert.equal(missing.status, 401);
  const forged = await board(new Request("http://local/api/internal/schedule/board", {
    headers: { "x-telegram-init-data": initData.replace(/hash=[0-9a-f]+/i, "hash=00") },
  }));
  assert.equal(forged.status, 401);

  const opened = await board(new Request("http://local/api/internal/schedule/board", {
    headers: { "x-telegram-init-data": initData },
  }));
  const body = await opened.json() as { ok?: boolean; error?: string; writable?: boolean; snapshot?: unknown };
  assert.equal(opened.status, 503);
  assert.equal(body.ok, false);
  assert.equal(body.error, "cloud_empty");
  assert.equal(body.writable, false);
  assert.equal(body.snapshot, undefined);

  const stranger = await board(new Request("http://local/api/internal/schedule/board", {
    headers: { "x-telegram-init-data": signedInitData(999001) },
  }));
  assert.equal(stranger.status, 403);

  const write = await reservations(new Request("http://local/api/internal/schedule/reservations", {
    method: "POST",
    headers: { "content-type": "application/json", "x-telegram-init-data": initData },
    body: JSON.stringify({ action: "create", idempotencyKey: "should-not-write" }),
  }));
  const writeBody = await write.json() as { error?: string; persisted?: boolean; crmWritten?: boolean };
  assert.equal(write.status, 404);
  assert.equal(writeBody.error, "disabled");
  assert.equal(writeBody.persisted, undefined);
  assert.notEqual(writeBody.crmWritten, true);

  console.log("scheduler readonly auth ok");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(restore);
