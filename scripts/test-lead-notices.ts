import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { POST } from "../src/app/api/call-request/route";
import { GET } from "../src/app/api/telegram/cron/lead-notices/route";
import { mergeServerCloudMutation } from "../src/lib/crm-db-merge";
import { installCrmCloudForTests } from "../src/lib/server/crm-cloud";
import { installTelegramSenderForTests } from "../src/lib/server/telegram-api";
import { runAppointmentReminders } from "../src/lib/server/telegram-cron/appointment-reminders";
import { classifyLeadNotice, deliverPendingLeadNotices } from "../src/lib/server/telegram-cron/lead-notifications";
import { leadNoticeDeliveryEnabled, reminderDeliveryEnabled } from "../src/lib/server/cron-auth";
import {
  acceptWebsiteInquiry,
  claimLeadNotice,
  completeLeadNotice,
  leadNoticeEventId,
} from "../src/lib/service-leads";
import { mergeStoredDb, type Database, type ServiceLead } from "../src/lib/store";

const savedEnv = {
  token: process.env.TELEGRAM_BOT_TOKEN,
  chat: process.env.TELEGRAM_CHAT_ID,
  extra: process.env.TELEGRAM_ADMIN_CHAT_IDS,
  cron: process.env.CRON_SECRET,
  reminder: process.env.REMINDER_DELIVERY,
  vercel: process.env.VERCEL_ENV,
  leadNotice: process.env.LEAD_NOTICE_DELIVERY,
};

function restoreEnv(): void {
  const assign = (key: string, value: string | undefined) => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  };
  assign("TELEGRAM_BOT_TOKEN", savedEnv.token);
  assign("TELEGRAM_CHAT_ID", savedEnv.chat);
  assign("TELEGRAM_ADMIN_CHAT_IDS", savedEnv.extra);
  assign("CRON_SECRET", savedEnv.cron);
  assign("REMINDER_DELIVERY", savedEnv.reminder);
  assign("VERCEL_ENV", savedEnv.vercel);
  assign("LEAD_NOTICE_DELIVERY", savedEnv.leadNotice);
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

const chats = ["1001", "1002"];
const when = new Date("2026-11-09T08:00:00.000Z");
const inquiry = {
  phone: "+48500111222",
  name: "Anna",
  vin: "WVWZZZ3CZWE123456",
  serviceLabel: "Wyceń po VIN",
  source: "vin_quote",
  clientRequestId: "form-a",
};

function emptyDb(): Database {
  return mergeStoredDb({ leads: [], callRequests: [] });
}

async function waitFor(check: () => boolean, label: string): Promise<void> {
  for (let i = 0; i < 50; i++) {
    if (check()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(label);
}

async function main(): Promise<void> {
  const vercel = readFileSync("vercel.json", "utf8");
  const reminders = readFileSync("src/lib/server/telegram-cron/appointment-reminders.ts", "utf8");
  assert.match(vercel, /\/api\/telegram\/cron\/lead-notices/);
  assert.match(reminders, /leadNoticeDeliveryEnabled\(\)/);
  assert.match(reminders, /deliverPendingLeadNotices/);

  process.env.TELEGRAM_BOT_TOKEN = "123456:test-token";
  process.env.TELEGRAM_CHAT_ID = "1001";
  process.env.TELEGRAM_ADMIN_CHAT_IDS = "1002";
  process.env.CRON_SECRET = "lead-notice-test-secret";
  delete process.env.VERCEL_ENV;
  process.env.REMINDER_DELIVERY = "live";

  const passed: string[] = [];

  // A, N. One form post is one lead and one notice. Opening the form again does not send another.
  {
    const store = createCasStore(emptyDb());
    installCrmCloudForTests(store);
    const sent: string[] = [];
    installTelegramSenderForTests(async (chatId) => {
      sent.push(chatId);
      return 700 + sent.length;
    });
    const request = () => new Request("http://local/api/call-request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(inquiry),
    });
    const first = await POST(request());
    const again = await POST(request());
    assert.equal((await first.json() as { duplicate?: boolean }).duplicate, false);
    assert.equal((await again.json() as { duplicate?: boolean }).duplicate, true);
    assert.equal(store.current().leads?.length, 1);
    assert.equal(store.current().callRequests?.length, 1);
    assert.equal(store.current().leads?.[0].notifyEventId, leadNoticeEventId(store.current().leads?.[0].id ?? ""));
    assert.equal(sent.length, 2);
    assert.equal(new Set(sent).size, 2);
    passed.push("A");
    passed.push("N");
  }

  // B, C, D, E, F. Two handlers and two parallel HTTP posts collapse to one lead.
  {
    const left = emptyDb();
    const right = emptyDb();
    const first = acceptWebsiteInquiry(left, inquiry, when, chats);
    const second = acceptWebsiteInquiry(right, { ...inquiry, clientRequestId: "other-tab" }, when, chats);
    const merged = mergeServerCloudMutation(left, right);
    assert.equal(first.lead.id, second.lead.id);
    assert.equal(first.lead.notifyEventId, second.lead.notifyEventId);
    assert.equal(merged.leads.length, 1);
    assert.equal(merged.callRequests.length, 1);
    passed.push("C");

    const store = createCasStore(emptyDb());
    installCrmCloudForTests(store);
    const sent: { chatId: string }[] = [];
    installTelegramSenderForTests(async (chatId) => {
      sent.push({ chatId });
      return 800 + sent.length;
    });
    const request = () => new Request("http://local/api/call-request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(inquiry),
    });
    const [one, two] = await Promise.all([POST(request()), POST(request())]);
    assert.equal(one.ok && two.ok, true);
    assert.equal(store.current().leads?.length, 1);
    assert.equal(store.current().callRequests?.length, 1);
    assert.equal(sent.filter((item) => item.chatId === "1001").length, 1);
    assert.equal(sent.filter((item) => item.chatId === "1002").length, 1);
    passed.push("B");
    passed.push("D");
    passed.push("E");
    passed.push("F");
  }

  // G, H, K. One chat fails, the error is stored, and only that chat is retried.
  {
    const store = createCasStore(emptyDb());
    installCrmCloudForTests(store);
    let failSecond = true;
    installTelegramSenderForTests(async (chatId) => {
      if (chatId === "1002" && failSecond) return { messageId: null, error: "chat not found" };
      return chatId === "1001" ? 901 : 902;
    });
    const response = await POST(new Request("http://local/api/call-request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...inquiry, clientRequestId: "partial" }),
    }));
    assert.equal(response.ok, true);
    const lead = store.current().leads?.[0];
    assert.equal(lead?.notifyRecipients?.find((row) => row.chatId === "1001")?.status, "sent");
    assert.equal(lead?.notifyRecipients?.find((row) => row.chatId === "1002")?.status, "pending");
    assert.equal(lead?.notifyRecipients?.find((row) => row.chatId === "1002")?.lastError, "chat not found");
    assert.notEqual(lead?.notifyStatus, "sent");
    failSecond = false;
    const delivered = await deliverPendingLeadNotices(new Date(Date.now() + 5 * 60 * 1000), chats);
    assert.equal(delivered, 1);
    const after = store.current().leads?.[0];
    assert.equal(after?.notifyStatus, "sent");
    assert.equal(after?.notifyRecipients?.find((row) => row.chatId === "1001")?.messageId, 901);
    assert.equal(after?.notifyRecipients?.find((row) => row.chatId === "1002")?.messageId, 902);
    assert.equal(after?.notifyRecipients?.find((row) => row.chatId === "1002")?.lastError, undefined);
    passed.push("G");
    passed.push("H");
    passed.push("K");
  }

  // I, J, M. A lease that expires during a slow send cannot be closed by the old token.
  {
    const seed = emptyDb();
    acceptWebsiteInquiry(seed, { ...inquiry, clientRequestId: "slow" }, when, []);
    const store = createCasStore(seed);
    installCrmCloudForTests(store);
    let release: () => void = () => undefined;
    const hold = new Promise<void>((resolve) => {
      release = resolve;
    });
    let held = false;
    const calls: number[] = [];
    installTelegramSenderForTests(async () => {
      if (!held) {
        held = true;
        await hold;
        calls.push(11);
        return 11;
      }
      calls.push(22);
      return 22;
    });
    const first = deliverPendingLeadNotices(when, ["1001"]);
    await waitFor(() => store.current().leads?.[0]?.notifyRecipients?.[0]?.status === "sending", "claim was not stored");
    const firstToken = store.current().leads?.[0]?.notifyRecipients?.[0]?.claimToken ?? "";
    const retried = await deliverPendingLeadNotices(new Date(when.getTime() + 3 * 60 * 1000), ["1001"]);
    const secondToken = store.current().leads?.[0]?.notifyRecipients?.[0]?.claimToken ?? "";
    assert.notEqual(secondToken, firstToken);
    assert.equal(retried, 1);
    release();
    await first;
    const row = store.current().leads?.[0]?.notifyRecipients?.[0];
    assert.equal(row?.status, "sent");
    assert.equal(row?.claimToken, secondToken);
    assert.equal(row?.messageId, 22);
    assert.equal(calls.includes(11) && calls.includes(22), true);
    const stale = completeLeadNotice(store.current().leads?.[0] as ServiceLead, "1001", firstToken, true, when, 11);
    assert.equal(stale, "stale");
    passed.push("I");
    passed.push("J");
    passed.push("M");
  }

  // L. A failed CRM write does not send Telegram.
  {
    const store = createCasStore(emptyDb());
    installCrmCloudForTests({
      get: store.get,
      patch: async () => "error",
    });
    const sent: string[] = [];
    installTelegramSenderForTests(async (chatId) => {
      sent.push(chatId);
      return 1;
    });
    const response = await POST(new Request("http://local/api/call-request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...inquiry, clientRequestId: "crm-down" }),
    }));
    assert.equal(response.status, 502);
    assert.equal(sent.length, 0);
    assert.equal(store.current().leads?.length ?? 0, 0);
    passed.push("L");
  }

  // O. A later visit by the same client is a new lead. A retry of the open one is not.
  {
    const db = emptyDb();
    const first = acceptWebsiteInquiry(db, inquiry, when, chats);
    const retry = acceptWebsiteInquiry(db, inquiry, new Date(when.getTime() + 60_000), chats);
    assert.equal(retry.created, false);
    assert.equal(retry.decision, "skip");
    const nextDay = acceptWebsiteInquiry(db, inquiry, new Date(when.getTime() + 25 * 60 * 60 * 1000), chats);
    assert.equal(nextDay.created, true);
    assert.notEqual(nextDay.lead.id, first.lead.id);
    assert.notEqual(nextDay.lead.notifyEventId, first.lead.notifyEventId);
    assert.equal(db.leads.length, 2);
    passed.push("O");
  }

  // P, Q. Historical sent rows, including ones without per-chat state, are not sent again.
  {
    const historical = emptyDb();
    const old = acceptWebsiteInquiry(historical, { ...inquiry, clientRequestId: "old-1" }, when, []);
    old.lead.notifyStatus = "sent";
    old.lead.notifyRecipients = undefined;
    const second = acceptWebsiteInquiry(historical, { ...inquiry, phone: "+48500111333", clientRequestId: "old-2", vin: "WVWZZZ3CZWE123457" }, when, []);
    second.lead.notifyStatus = "sent";
    second.lead.notifyRecipients = [{ chatId: "1001", status: "sent", attempts: 1, claimToken: "done", messageId: 5, sentAt: when.toISOString() }];
    const fresh = acceptWebsiteInquiry(historical, { ...inquiry, phone: "+48500111444", clientRequestId: "fresh", vin: "WVWZZZ3CZWE123458" }, when, []);
    const store = createCasStore(historical);
    installCrmCloudForTests(store);
    const sent: string[] = [];
    installTelegramSenderForTests(async (chatId) => {
      sent.push(chatId);
      return 1000 + sent.length;
    });
    const delivered = await deliverPendingLeadNotices(new Date(when.getTime() + 60_000), chats);
    assert.equal(delivered, 2);
    assert.equal(sent.length, 2);
    const rows = store.current().leads ?? [];
    assert.equal(rows.find((lead) => lead.id === old.lead.id)?.notifyStatus, "sent");
    assert.equal(rows.find((lead) => lead.id === old.lead.id)?.notifyRecipients, undefined);
    assert.equal(rows.find((lead) => lead.id === second.lead.id)?.notifyRecipients?.[0]?.messageId, 5);
    assert.equal(rows.find((lead) => lead.id === fresh.lead.id)?.notifyStatus, "sent");
    const again = await deliverPendingLeadNotices(new Date(when.getTime() + 10 * 60 * 1000), chats);
    assert.equal(again, 0);
    assert.equal(sent.length, 2);
    passed.push("P");
    passed.push("Q");
  }

  // Cron auth, preview skip, and the dedicated route.
  {
    delete process.env.VERCEL_ENV;
    process.env.REMINDER_DELIVERY = "disabled";
    assert.equal(reminderDeliveryEnabled(), false);
    const denied = await GET(new Request("http://local/api/telegram/cron/lead-notices"));
    assert.equal(denied.status, 401);
    process.env.VERCEL_ENV = "preview";
    process.env.REMINDER_DELIVERY = "live";
    assert.equal(reminderDeliveryEnabled(), false);
    delete process.env.VERCEL_ENV;
    process.env.REMINDER_DELIVERY = "live";
    assert.equal(reminderDeliveryEnabled(), true);
    process.env.VERCEL_ENV = "production";
    process.env.CRON_SECRET = "lead-notice-test-secret";
    process.env.LEAD_NOTICE_DELIVERY = "disabled";
    assert.equal(reminderDeliveryEnabled(), true);
    assert.equal(leadNoticeDeliveryEnabled(), false);
    const paused = await GET(new Request("http://local/api/telegram/cron/lead-notices", {
      headers: { authorization: "Bearer lead-notice-test-secret" },
    }));
    assert.equal(paused.status, 200);
    assert.equal((await paused.json()).delivery, "skipped");
    const quiet: string[] = [];
    delete process.env.VERCEL_ENV;
    installTelegramSenderForTests(async () => {
      quiet.push("sent");
      return 1;
    });
    installCrmCloudForTests(createCasStore(emptyDb()));
    const held = acceptWebsiteInquiry(emptyDb(), inquiry, new Date("2026-11-09T11:00:00.000Z"), []).lead;
    held.notifyStatus = "pending";
    const reminderDb = emptyDb();
    reminderDb.leads = [held];
    await runAppointmentReminders(reminderDb, new Date("2026-11-09T12:00:00.000Z"));
    assert.equal(quiet.length, 0);
    delete process.env.LEAD_NOTICE_DELIVERY;
    assert.equal(leadNoticeDeliveryEnabled(), true);
    passed.push("cron");
  }

  {
    const now = new Date("2026-11-09T12:00:00.000Z");
    const base = acceptWebsiteInquiry(emptyDb(), inquiry, now, []).lead;
    const older = new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString();
    const samples: ServiceLead[] = [
      ...Array.from({ length: 40 }, (_, index) => ({ ...base, id: `sent-${index}`, createdAt: older, notifyStatus: "sent" as const, notifyRecipients: undefined })),
      ...Array.from({ length: 20 }, (_, index) => ({ ...base, id: `old-pending-${index}`, createdAt: older, notifyStatus: "pending" as const, notifyAttempts: 1 })),
      ...Array.from({ length: 10 }, (_, index) => ({ ...base, id: `old-sending-${index}`, createdAt: older, updatedAt: older, notifyStatus: "sending" as const, notifyAttempts: 1 })),
      ...Array.from({ length: 15 }, (_, index) => ({ ...base, id: `recent-sent-${index}`, createdAt: now.toISOString(), notifyStatus: "sent" as const, notifyRecipients: undefined })),
      { ...base, id: "recent-pending", createdAt: now.toISOString(), notifyStatus: "pending", notifyAttempts: 0, notifyRecipients: undefined },
    ];
    const counts = { deliver: 0, historical_sent: 0, too_old: 0 };
    for (const lead of samples) {
      const decision = classifyLeadNotice(lead, now);
      if (decision === "deliver" || decision === "historical_sent" || decision === "too_old") counts[decision] += 1;
    }
    assert.equal(counts.deliver, 1);
    assert.equal(counts.historical_sent, 15);
    assert.equal(counts.too_old, 70);
    const dir = mkdtempSync(join(tmpdir(), "lead-audit-"));
    const file = join(dir, "leads.json");
    writeFileSync(file, JSON.stringify({ leads: samples }));
    const tsx = join(process.cwd(), "node_modules", ".bin", "tsx");
    const refused = spawnSync(tsx, ["scripts/audit-lead-notices.ts", file], {
      cwd: process.cwd(),
      env: { ...process.env, SUPABASE_URL: "https://example.supabase.co" },
      encoding: "utf8",
    });
    assert.equal(refused.status, 3);
    const audited = spawnSync(tsx, ["scripts/audit-lead-notices.ts", file], {
      cwd: process.cwd(),
      env: { ...process.env, SUPABASE_URL: "" },
      encoding: "utf8",
    });
    assert.equal(audited.status, 0, audited.stderr);
    const report = JSON.parse(audited.stdout) as { sends: number; counts: { too_old: number } };
    assert.equal(report.sends, 1);
    assert.equal(report.counts.too_old, 70);
    passed.push("historical");
  }

  assert.deepEqual(passed.sort(), ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "cron", "historical"].sort());
  console.log("lead notices ok", passed.join(" "));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(restoreEnv);
