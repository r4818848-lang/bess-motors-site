import type { Appointment, ArrivalReminderClaim, Database } from "@/lib/store";
import {
  logArrivalReminder,
  planArrivalReminder,
  readArrivalClaim,
  sameClock,
  shouldLogArrivalSkip,
  type ArrivalReminderPlan,
} from "@/lib/arrival-reminder";
import { calendarOpenKeyboard } from "@/lib/server/telegram-bot/staff-calendar-bot";
import { cleanEnvValue } from "@/lib/server/supabase-config";
import { getTelegramConfig, sendTelegramMessage } from "@/lib/server/telegram-api";

/**
 * The only builder of the owner text "Скоро приедет клиент".
 * Morning digest, client reminders and lead notices are different messages
 * and do not use this lock.
 *
 * Duplicate policy: the claim row is written before the Telegram call.
 * Any outcome after that call — success, error, timeout, thrown request —
 * moves the row to a terminal status. The next cron does not call again.
 * A crash after the claim and before the call also does not retry, because
 * the process cannot know whether the request already reached Telegram.
 */
export type ReminderSend = (chatId: string, text: string, appointmentId: string) => Promise<boolean>;

export type ArrivalReminderStore = {
  load: () => Promise<Database | null>;
  /** Apply `change` to the durable CRM. Return false when the write did not commit. */
  mutate: (change: (db: Database) => void) => Promise<boolean>;
};

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function adminArrivalText(db: Database, apt: Appointment): string {
  const vehicle = db.vehicles.find((item) => item.id === apt.vehicleId);
  const mechanic = db.mechanics.find((item) => item.id === apt.mechanicId);
  const car = [vehicle?.make, vehicle?.model, apt.clientPlate || vehicle?.plate].filter(Boolean).join(" ");
  const service = apt.problemText || apt.serviceIds.join(", ");
  return [
    "🚗 <b>Скоро приедет клиент</b>",
    "",
    `Авто: <b>${escapeHtml(car || "—")}</b>`,
    `Время приезда: <b>${escapeHtml(apt.date)} ${escapeHtml(apt.time)}</b>`,
    `Услуга: ${escapeHtml(service || "—")}`,
    `Механик: ${escapeHtml(mechanic?.name || "—")}`,
    `Клиент: ${escapeHtml(apt.clientName || "—")}`,
    `Телефон: ${escapeHtml(apt.clientPhone || "—")}`,
  ].join("\n");
}

function ensureSettings(db: Database): void {
  if (!db.settings) db.settings = {} as Database["settings"];
}

function claimRow(plan: ArrivalReminderPlan, apt: Appointment, now: Date): ArrivalReminderClaim {
  return {
    key: plan.key,
    appointmentId: apt.id,
    reminderType: "admin_two_hour",
    scheduledAt: plan.scheduledAt,
    date: apt.date,
    time: apt.time,
    status: "claimed",
    claimedAt: now.toISOString(),
    attemptCount: 1,
  };
}

function reminderTargets(db: Database, apt: Appointment, adminChatIds: string[]): string[] {
  const targets = new Set(adminChatIds.filter(Boolean));
  if (apt.notifyMechanic) {
    const mechanic = db.users.find((user) => user.id === apt.mechanicId && user.role === "mechanic");
    if (mechanic?.telegramChatId) targets.add(mechanic.telegramChatId);
  }
  return [...targets];
}

export async function deliverAdminArrivalReminders(input: {
  now: Date;
  adminChatIds: string[];
  store: ArrivalReminderStore;
  send: ReminderSend;
}): Promise<{ sent: number; failed: number; suppressed: number }> {
  const db = await input.store.load();
  if (!db) return { sent: 0, failed: 0, suppressed: 0 };

  let sent = 0;
  let failed = 0;
  let suppressed = 0;

  for (const apt of db.appointments) {
    const plan = planArrivalReminder(apt, input.now);
    if (plan.reason) {
      if (shouldLogArrivalSkip(plan)) {
        logArrivalReminder({
          appointmentId: apt.id,
          scheduledAt: plan.scheduledAt,
          status: "pending",
          dedupeReason: plan.reason,
          attemptCount: 0,
        });
      }
      continue;
    }

    const box: { outcome: "claimed" | "duplicate" | "blocked"; reason?: string; attemptCount: number; status: string } = {
      outcome: "blocked",
      attemptCount: 0,
      status: "pending",
    };
    let committed = false;
    try {
      committed = await input.store.mutate((live) => {
        box.outcome = "blocked";
        box.reason = undefined;
        box.attemptCount = 0;
        box.status = "pending";
        ensureSettings(live);
        const row = live.appointments.find((item) => item.id === apt.id);
        if (!row || !sameClock(row, apt.date, apt.time)) {
          box.reason = "rescheduled";
          return;
        }
        const livePlan = planArrivalReminder(row, input.now);
        if (livePlan.reason) {
          box.reason = livePlan.reason;
          return;
        }
        const existing = readArrivalClaim(live, plan.key);
        if (existing) {
          box.outcome = "duplicate";
          box.reason = "duplicate_claim";
          box.status = existing.status;
          box.attemptCount = existing.attemptCount;
          return;
        }
        live.settings.arrivalReminderClaims = {
          ...(live.settings.arrivalReminderClaims ?? {}),
          [plan.key]: claimRow(plan, row, input.now),
        };
        box.outcome = "claimed";
        box.status = "claimed";
        box.attemptCount = 1;
      });
    } catch {
      committed = false;
    }

    if (!committed || box.outcome !== "claimed") {
      logArrivalReminder({
        appointmentId: apt.id,
        scheduledAt: plan.scheduledAt,
        status: box.status,
        dedupeReason: committed ? box.reason ?? "duplicate_claim" : "conflict",
        attemptCount: box.attemptCount,
      });
      continue;
    }

    const fresh = await input.store.load();
    const live = fresh?.appointments.find((item) => item.id === apt.id);
    const blocked = !fresh || !live || !sameClock(live, apt.date, apt.time)
      ? "rescheduled"
      : planArrivalReminder(live, input.now).reason;
    if (blocked || !fresh || !live) {
      await mark(input.store, plan.key, {
        status: "suppressed",
        dedupeReason: blocked ?? "rescheduled",
      });
      logArrivalReminder({
        appointmentId: apt.id,
        scheduledAt: plan.scheduledAt,
        status: "suppressed",
        dedupeReason: blocked ?? "rescheduled",
        attemptCount: 1,
      });
      suppressed += 1;
      continue;
    }

    // The visit can still change after this read and before Telegram accepts
    // the request. That single in-flight message is not recalled. The claim
    // stays terminal, so the next cron does not send a second one.
    const targets = reminderTargets(fresh, live, input.adminChatIds);
    if (!targets.length) {
      await mark(input.store, plan.key, { status: "suppressed", dedupeReason: "no_recipient" });
      logArrivalReminder({
        appointmentId: apt.id,
        scheduledAt: plan.scheduledAt,
        status: "suppressed",
        dedupeReason: "no_recipient",
        attemptCount: 1,
      });
      suppressed += 1;
      continue;
    }

    let delivered = false;
    try {
      delivered = await sendOnce(input.send, targets, adminArrivalText(fresh, live), live.id);
    } catch {
      delivered = false;
    }
    const sentAt = delivered ? new Date().toISOString() : undefined;
    await mark(input.store, plan.key, {
      status: delivered ? "sent" : "failed",
      dedupeReason: delivered ? undefined : "telegram_uncertain_no_retry",
      sentAt,
    });
    logArrivalReminder({
      appointmentId: apt.id,
      scheduledAt: plan.scheduledAt,
      status: delivered ? "sent" : "failed",
      dedupeReason: delivered ? undefined : "telegram_uncertain_no_retry",
      sentAt,
      attemptCount: 1,
    });
    if (delivered) sent += 1;
    else failed += 1;
  }

  return { sent, failed, suppressed };
}

async function sendOnce(
  send: ReminderSend,
  targets: string[],
  text: string,
  appointmentId: string
): Promise<boolean> {
  let delivered = true;
  for (const chatId of targets) {
    const ok = await send(chatId, text, appointmentId);
    if (!ok) delivered = false;
  }
  return delivered;
}

async function mark(
  store: ArrivalReminderStore,
  key: string,
  patch: Pick<ArrivalReminderClaim, "status" | "dedupeReason" | "sentAt">
): Promise<void> {
  try {
    await store.mutate((db) => {
      ensureSettings(db);
      const current = db.settings.arrivalReminderClaims?.[key];
      if (!current || current.status === "sent") return;
      db.settings.arrivalReminderClaims = {
        ...db.settings.arrivalReminderClaims,
        [key]: { ...current, ...patch, attemptCount: 1 },
      };
    });
  } catch {
    // The claim itself remains. A later cron treats every existing row as terminal.
  }
}

export async function sendAdminArrivalMessage(
  chatId: string,
  text: string,
  appointmentId: string
): Promise<boolean> {
  const messageId = await sendTelegramMessage(chatId, text, calendarOpenKeyboard(appointmentId));
  return messageId != null;
}

export function productionAdminChatIds(): string[] {
  const cfg = getTelegramConfig();
  const ids = new Set<string>(cfg ? cfg.adminChatIds : []);
  const owners = cleanEnvValue(process.env.TELEGRAM_OWNER_CHAT_ID);
  if (owners) {
    for (const id of owners.split(",")) {
      const trimmed = id.trim();
      if (trimmed) ids.add(trimmed);
    }
  }
  return [...ids];
}
