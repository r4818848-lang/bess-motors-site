import { normalizePhone } from "@/lib/auth";
import { handleAppointmentNotification } from "@/lib/client-notifications";
import { ensureClientForBooking } from "@/lib/create-work-order-from-booking";
import { assertBookingSlotAvailable } from "@/lib/server/booking-slot-validation";
import { cloudUpsertAppointment } from "@/lib/server/appointments-cloud";
import { notifyAdminTelegram } from "@/lib/server/telegram-api";
import type { Appointment } from "@/lib/store";
import { loadCrmFromCloud, mutateCrm } from "./crm-actions";
import { getClientServiceLabel } from "./client-services";
import type { BotLocale } from "./client-i18n";
import {
  tryLinkTelegramOnBooking,
  type TelegramProfile,
} from "./client-telegram-link";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function notifyAdminNewBooking(apt: Appointment, kind: "booking" | "call"): Promise<void> {
  const label = apt.serviceIds.map((id) => getClientServiceLabel(id)).join(", ");
  if (kind === "booking") {
    await notifyAdminTelegram(
      [
        "<b>📱 Nowa rezerwacja (Telegram)</b>",
        `Data: <b>${apt.date}</b> ${apt.time}`,
        apt.clientName ? `Imię: <b>${escapeHtml(apt.clientName)}</b>` : null,
        apt.clientPhone ? `Telefon: <b>${escapeHtml(apt.clientPhone)}</b>` : null,
        label ? `Usługa: ${escapeHtml(label)}` : null,
        apt.comment ? `Komentarz: ${escapeHtml(apt.comment).slice(0, 400)}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    );
    return;
  }

  await notifyAdminTelegram(
    [
      "<b>📞 Prośba o telefon (Telegram)</b>",
      apt.clientName ? `Imię: <b>${escapeHtml(apt.clientName)}</b>` : null,
      apt.clientPhone ? `Telefon: <b>${escapeHtml(apt.clientPhone)}</b>` : null,
      label ? `Usługa: ${escapeHtml(label)}` : null,
      apt.comment ? `Komentarz: ${escapeHtml(apt.comment).slice(0, 400)}` : null,
    ]
      .filter(Boolean)
      .join("\n")
  );
}

export async function createTelegramBooking(params: {
  serviceId: string;
  date: string;
  time: string;
  clientName: string;
  clientPhone: string;
  comment?: string;
  telegramProfile?: TelegramProfile;
  locale?: BotLocale;
}): Promise<{ ok: boolean; error?: string }> {
  const slotCheck = await assertBookingSlotAvailable({
    date: params.date,
    time: params.time,
  });
  if (!slotCheck.ok) {
    return { ok: false, error: slotCheck.error };
  }

  let created: Appointment | null = null;
  const aptId = `apt-tg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const result = await mutateCrm((db) => {
    const { userId, vehicleId } = ensureClientForBooking(
      db,
      params.clientName,
      params.clientPhone
    );

    if (params.telegramProfile) {
      tryLinkTelegramOnBooking(db, userId, params.telegramProfile, params.locale);
    }

    const apt: Appointment = {
      id: aptId,
      userId,
      vehicleId,
      serviceIds: [params.serviceId],
      date: params.date,
      time: params.time,
      mechanicId: db.mechanics[0]?.id ?? "mech-1",
      repairStatus: "received",
      appointmentStatus: "scheduled",
      comment: params.comment?.trim()
        ? `[Telegram] ${params.comment.trim()}`
        : "Запись через Telegram",
      clientName: params.clientName.trim(),
      clientPhone: params.clientPhone.trim(),
      source: "telegram",
      marketing: { utmSource: "telegram" },
      createdAt: new Date().toISOString(),
    };

    db.appointments.push(apt);
    handleAppointmentNotification(db, apt, "scheduled");
    created = apt;
  });

  if (!result.ok || !created) {
    return { ok: false, error: result.error ?? "save_failed" };
  }

  const aptRow = await cloudUpsertAppointment(created);
  if (!aptRow.ok) {
    console.error("[telegram] booking appointments table sync failed", aptRow.error);
    return { ok: false, error: "appointments_sync_failed" };
  }
  await notifyAdminNewBooking(created, "booking");
  return { ok: true };
}

export async function createTelegramCallRequest(params: {
  serviceId: string;
  clientName: string;
  clientPhone: string;
  comment?: string;
  telegramProfile?: TelegramProfile;
  locale?: BotLocale;
}): Promise<{ ok: boolean; error?: string }> {
  const label = getClientServiceLabel(params.serviceId);
  const comment = [
    params.comment?.trim(),
    `[Telegram · ${label}]`,
  ]
    .filter(Boolean)
    .join(" · ");

  const result = await mutateCrm((db) => {
    const { userId } = ensureClientForBooking(
      db,
      params.clientName,
      params.clientPhone
    );

    if (params.telegramProfile) {
      tryLinkTelegramOnBooking(db, userId, params.telegramProfile, params.locale);
    }

    db.callRequests.push({
      id: `call-tg-${Date.now()}`,
      phone: params.clientPhone.trim(),
      clientName: params.clientName.trim(),
      userId,
      serviceId: params.serviceId,
      serviceLabel: label,
      comment,
      status: "needs_call",
      priority: params.comment?.includes("[URGENT") ? "urgent" : "normal",
      source: "telegram",
      marketing: { utmSource: "telegram" },
      createdAt: new Date().toISOString(),
    });
  });

  if (!result.ok) return { ok: false, error: result.error };

  const pseudoApt = {
    clientName: params.clientName,
    clientPhone: params.clientPhone,
    serviceIds: [params.serviceId],
    comment,
  } as Appointment;
  await notifyAdminNewBooking(pseudoApt, "call");
  return { ok: true };
}

export async function getClientAppointmentsByPhone(phone: string): Promise<Appointment[]> {
  const db = await loadCrmFromCloud();
  if (!db) return [];

  const normalized = normalizePhone(phone);
  if (!normalized) return [];

  const today = new Date().toISOString().slice(0, 10);

  return db.appointments
    .filter((a) => {
      const aptPhone = normalizePhone(a.clientPhone ?? "");
      if (aptPhone && aptPhone === normalized) return true;
      const user = db.users.find((u) => u.id === a.userId);
      return user ? normalizePhone(user.phone) === normalized : false;
    })
    .filter((a) => a.date >= today)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    .slice(0, 8);
}

export function isValidClientPhone(text: string): boolean {
  const digits = text.replace(/\D/g, "");
  return digits.length >= 9;
}

export function isValidClientName(text: string): boolean {
  return text.trim().length >= 2;
}
