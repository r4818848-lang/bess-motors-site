import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { POST } from "../src/app/api/call-request/route";
import { GET } from "../src/app/api/telegram/cron/lead-notices/route";
import { installCrmCloudForTests } from "../src/lib/server/crm-cloud";
import { installTelegramSenderForTests } from "../src/lib/server/telegram-api";
import { mergeStoredDb, type Database } from "../src/lib/store";

const saved = {
  token: process.env.TELEGRAM_BOT_TOKEN,
  chat: process.env.TELEGRAM_CHAT_ID,
  extra: process.env.TELEGRAM_ADMIN_CHAT_IDS,
  cron: process.env.CRON_SECRET,
  reminder: process.env.REMINDER_DELIVERY,
  vercel: process.env.VERCEL_ENV,
};

function restoreEnv(): void {
  const assign = (key: string, value: string | undefined) => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  };
  assign("TELEGRAM_BOT_TOKEN", saved.token);
  assign("TELEGRAM_CHAT_ID", saved.chat);
  assign("TELEGRAM_ADMIN_CHAT_IDS", saved.extra);
  assign("CRON_SECRET", saved.cron);
  assign("REMINDER_DELIVERY", saved.reminder);
  assign("VERCEL_ENV", saved.vercel);
  installCrmCloudForTests(null);
  installTelegramSenderForTests(null);
}

function createCasStore(initial: Database) {
  let doc = structuredClone(initial);
  let updatedAt = "2026-11-09T00:00:00.000Z";
  let chain = Promise.resolve();
  const enqueue = <T>(job: () => T | Promise<T>): Promise<T> => {
    const run = chain.then(job, job);
    chain = run.then(() => undefined, () => undefined);
    return run;
  };
  return {
    get: () => enqueue(() => ({ doc: structuredClone(doc), updatedAt })),
    patch: (next: Database, expected: string) => enqueue(() => {
      if (expected !== updatedAt) return "stale" as const;
      doc = structuredClone(next);
      updatedAt = new Date(Date.parse(updatedAt) + 1).toISOString();
      return "ok" as const;
    }),
    current: () => structuredClone(doc),
  };
}

async function main(): Promise<void> {
  const vercel = readFileSync("vercel.json", "utf8");
  assert.match(vercel, /\/api\/telegram\/cron\/lead-notices/);
  assert.match(vercel, /\/api\/telegram\/cron\/appointment-reminders/);

  process.env.TELEGRAM_BOT_TOKEN = "123456:test-token";
  process.env.TELEGRAM_CHAT_ID = "1001";
  process.env.TELEGRAM_ADMIN_CHAT_IDS = "1002";
  process.env.CRON_SECRET = "lead-notice-test-secret";
  delete process.env.VERCEL_ENV;
  process.env.REMINDER_DELIVERY = "disabled";

  const store = createCasStore(mergeStoredDb({ leads: [], callRequests: [] }));
  installCrmCloudForTests(store);
  const deliveries: { chatId: string; messageId: number | null; text: string }[] = [];
  let failedSecondChat = false;
  installTelegramSenderForTests(async (chatId, text) => {
    const messageId = chatId === "1002" && !failedSecondChat ? (failedSecondChat = true, null) : 500 + deliveries.length;
    deliveries.push({ chatId, messageId, text });
    return messageId;
  });

  const body = {
    phone: "+48500111222",
    clientName: "Anna",
    serviceLabel: "Wyceń po VIN",
    vin: "WVWZZZ3CZWE123456",
    source: "vin_quote",
    clientRequestId: "form-a",
  };
  const request = () => new Request("http://local/api/call-request", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const [left, right] = await Promise.all([POST(request()), POST(request())]);
  const leftBody = await left.json() as { ok?: boolean; duplicate?: boolean };
  const rightBody = await right.json() as { ok?: boolean; duplicate?: boolean };
  assert.equal(left.ok && right.ok && leftBody.ok && rightBody.ok, true);
  assert.equal([leftBody.duplicate, rightBody.duplicate].filter(Boolean).length, 1);

  const savedDoc = store.current();
  assert.equal(savedDoc.leads?.length, 1);
  assert.equal(savedDoc.callRequests?.length, 1);
  assert.equal(savedDoc.callRequests?.[0].id, `call-${savedDoc.leads?.[0].id}`);
  const lead = savedDoc.leads?.[0];
  assert.equal(lead?.notifyRecipients?.find((row) => row.chatId === "1001")?.status, "sent");
  assert.equal(lead?.notifyRecipients?.find((row) => row.chatId === "1002")?.status, "pending");
  assert.notEqual(lead?.notifyStatus, "sent");
  const firstWave = deliveries.filter((item) => item.text.includes("Новая заявка"));
  assert.equal(firstWave.filter((item) => item.chatId === "1001" && item.messageId != null).length, 1);
  assert.equal(firstWave.filter((item) => item.chatId === "1002" && item.messageId == null).length, 1);

  const denied = await GET(new Request("http://local/api/telegram/cron/lead-notices"));
  assert.equal(denied.status, 401);
  const paused = await GET(new Request("http://local/api/telegram/cron/lead-notices", {
    headers: { authorization: "Bearer lead-notice-test-secret" },
  }));
  assert.equal((await paused.json() as { delivery?: string }).delivery, "skipped");
  assert.equal(deliveries.length, firstWave.length);

  process.env.REMINDER_DELIVERY = "live";
  const retry = await GET(new Request("http://local/api/telegram/cron/lead-notices", {
    headers: { authorization: "Bearer lead-notice-test-secret" },
  }));
  const retryBody = await retry.json() as { delivery?: string; delivered?: number };
  assert.equal(retryBody.delivery, "live");
  assert.equal(retryBody.delivered, 1);
  const held = await GET(new Request("http://local/api/telegram/cron/lead-notices", {
    headers: { authorization: "Bearer lead-notice-test-secret" },
  }));
  assert.equal((await held.json() as { reason?: string }).reason, "other_project");

  const after = store.current().leads?.[0];
  assert.equal(after?.notifyStatus, "sent");
  assert.equal(after?.notifyRecipients?.every((row) => row.status === "sent"), true);
  const notices = deliveries.filter((item) => item.text.includes("Новая заявка") && item.messageId != null);
  assert.equal(notices.filter((item) => item.chatId === "1001").length, 1);
  assert.equal(notices.filter((item) => item.chatId === "1002").length, 1);
  assert.equal(store.current().leads?.length, 1);
  assert.equal(store.current().callRequests?.length, 1);

  console.log("lead notice cas ok");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(restoreEnv);
