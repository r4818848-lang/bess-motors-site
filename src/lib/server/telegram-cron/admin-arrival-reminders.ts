import type { Appointment, Database } from "@/lib/store";
import { planAdminReminder } from "@/lib/staff-calendar";
import { calendarOpenKeyboard } from "@/lib/server/telegram-bot/staff-calendar-bot";
import { cleanEnvValue } from "@/lib/server/supabase-config";
import { getTelegramConfig, sendTelegramMessage } from "@/lib/server/telegram-api";

export type ReminderSend = (chatId: string, text: string, appointmentId: string) => Promise<boolean>;

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function adminArrivalText(db: Database, apt: Appointment): string {
  const vehicle = db.vehicles.find((item) => item.id === apt.vehicleId);
  const mechanic = db.mechanics.find((item) => item.id === apt.mechanicId);
  const car = [vehicle?.make, vehicle?.model, apt.clientPlate || vehicle?.plate].filter(Boolean).join(" ");
  const service = apt.problemText || apt.serviceIds.join(", ");
  const soon = apt.adminReminder?.kind === "soon";
  return [
    soon ? "🚗 <b>Скоро приедет клиент</b>" : "🚗 <b>Через 2 часа приедет клиент</b>",
    "",
    `Авто: <b>${escapeHtml(car || "—")}</b>`,
    `Время приезда: <b>${escapeHtml(apt.date)} ${escapeHtml(apt.time)}</b>`,
    `Услуга: ${escapeHtml(service || "—")}`,
    `Механик: ${escapeHtml(mechanic?.name || "—")}`,
    `Клиент: ${escapeHtml(apt.clientName || "—")}`,
    `Телефон: ${escapeHtml(apt.clientPhone || "—")}`,
  ].join("\n");
}

export async function deliverAdminArrivalReminders(input: {
  db: Database;
  now: Date;
  adminChatIds: string[];
  send: ReminderSend;
  save: (db: Database) => Promise<void>;
}): Promise<{ sent: number; failed: number; cancelled: number }> {
  const { db, now, send, save } = input;
  const claimed: Appointment[] = [];
  let cancelled = 0;

  for (const apt of db.appointments) {
    const plan = planAdminReminder(apt, now);
    if (plan.action === "cancel") {
      apt.adminReminder = { ...(apt.adminReminder ?? {}), status: "cancelled" };
      cancelled += 1;
      continue;
    }
    if (plan.action !== "send") continue;
    apt.adminReminder = {
      ...(apt.adminReminder ?? {}),
      status: "sending",
      sendingAt: now.toISOString(),
      dueAt: plan.dueAt,
      kind: plan.kind,
      attempts: (apt.adminReminder?.attempts ?? 0) + 1,
      deliveredChatIds: apt.adminReminder?.deliveredChatIds ?? [],
    };
    claimed.push(apt);
  }

  if (cancelled > 0 || claimed.length > 0) await save(db);
  if (!claimed.length) return { sent: 0, failed: 0, cancelled };

  let sent = 0;
  let failed = 0;
  for (const apt of claimed) {
    const targets = new Set(input.adminChatIds.filter(Boolean));
    if (apt.notifyMechanic) {
      const mechanic = db.users.find((user) => user.id === apt.mechanicId && user.role === "mechanic");
      if (mechanic?.telegramChatId) targets.add(mechanic.telegramChatId);
    }
    const delivered = new Set(apt.adminReminder?.deliveredChatIds ?? []);
    let lastError = "";
    for (const chatId of targets) {
      if (delivered.has(chatId)) continue;
      const ok = await send(chatId, adminArrivalText(db, apt), apt.id);
      if (!ok) {
        lastError = "telegram_failed";
        continue;
      }
      delivered.add(chatId);
      apt.adminReminder = {
        ...apt.adminReminder,
        deliveredChatIds: [...delivered],
      };
      await save(db);
    }
    const pending = [...targets].filter((id) => !delivered.has(id));
    const complete = targets.size > 0 && pending.length === 0;
    apt.adminReminder = {
      ...apt.adminReminder,
      status: complete ? "sent" : "failed",
      sentAt: complete ? now.toISOString() : apt.adminReminder?.sentAt,
      lastError: lastError || (targets.size === 0 ? "no_admin_chat" : undefined),
    };
    if (complete) sent += 1;
    else failed += 1;
    await save(db);
  }

  return { sent, failed, cancelled };
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
