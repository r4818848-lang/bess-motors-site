import { cleanEnvValue } from "@/lib/server/supabase-config";
import { sendTelegramMessage } from "@/lib/server/telegram-api";
import type { Database, User, WorkOrder } from "@/lib/store";
import { calcClientTotal } from "@/lib/workorder-calc";
import { getClientBotLabels, type BotLocale } from "./client-i18n";
import { ratingKeyboard } from "./client-extras";
import { mutateCrm } from "./crm-actions";
import { canSendBotNotify } from "./bot-notify-guard";
import { isQuietHours } from "@/lib/quiet-hours";
import { isWorkOrderClosed } from "@/lib/work-order-lifecycle";
import { repairStatusLabel, signKeyboardLocalized, woNotifyCopy } from "./client-wo-notify-text";

function siteUrl(): string {
  return cleanEnvValue(process.env.NEXT_PUBLIC_SITE_URL) || "https://www.bess-motors.com";
}

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function vehicleLabel(db: Database, order: WorkOrder): string {
  const vehicle = db.vehicles.find((v) => v.id === order.vehicleId);
  if (!vehicle) return order.number;
  return `${vehicle.make} ${vehicle.model} · ${vehicle.plate}`.trim() || order.number;
}

function signUrl(orderId: string): string {
  return `${siteUrl()}/sign/${orderId}`;
}

function cabinetUrl(): string {
  return `${siteUrl()}/cabinet`;
}

function signKeyboard(orderId: string, locale: BotLocale) {
  return signKeyboardLocalized(orderId, siteUrl(), locale);
}

function orderNeedsSignature(order: WorkOrder): boolean {
  if (order.confirmationStatus === "confirmed") return false;
  return (
    order.confirmationStatus === "awaiting_confirmation" ||
    order.documentStatus === "awaiting_signature"
  );
}

async function sendToClient(
  user: User,
  text: string,
  keyboard?: { inline_keyboard: { text: string; url?: string; callback_data?: string }[][] },
  opts?: { category?: "booking" | "status" | "promo"; critical?: boolean }
): Promise<void> {
  const category = opts?.category ?? "status";
  if (!canSendBotNotify(user, category, { critical: opts?.critical })) return;
  if (!opts?.critical && isQuietHours(new Date(), user.botQuietHours !== false)) return;
  await sendTelegramMessage(user.telegramChatId!, text, keyboard);
}

export async function notifyTelegramWorkOrderChange(
  db: Database,
  order: WorkOrder,
  previous?: WorkOrder | null
): Promise<void> {
  const user = db.users.find((u) => u.id === order.userId && u.role === "client");
  if (!user?.telegramChatId) return;

  const loc: BotLocale = user.telegramLocale ?? "ru";
  const copy = woNotifyCopy(loc);
  const car = esc(vehicleLabel(db, order));
  const total = calcClientTotal(order);

  const signJustRequired =
    orderNeedsSignature(order) &&
    (!previous || !orderNeedsSignature(previous));

  if (signJustRequired) {
    await sendToClient(
      user,
      [
        copy.signRequiredTitle,
        "",
        copy.signRequiredBody
          .replace("{number}", esc(order.number))
          .replace("{car}", car)
          .replace("{total}", total.toFixed(2)),
        "",
        copy.signRequiredHint,
      ].join("\n"),
      signKeyboard(order.id, loc),
      { critical: true }
    );
    return;
  }

  const statusChanged = previous?.status !== order.status;
  const closedNow =
    isWorkOrderClosed(order) && (!previous || !isWorkOrderClosed(previous));

  if (statusChanged || closedNow) {
    if (order.status === "ready" && !closedNow) {
      await sendToClient(
        user,
        [
          copy.carReadyTitle,
          "",
          copy.carReadyBody.replace("{car}", car).replace("{number}", esc(order.number)),
          "",
          copy.carReadyHint,
          `🌐 ${cabinetUrl()}`,
        ].join("\n"),
        undefined,
        { category: "status" }
      );
      return;
    }

    if (
      (order.status === "delivered" || closedNow) &&
      !order.clientRating &&
      !order.ratingRequestSentAt
    ) {
      await mutateCrm((dbMut) => {
        const o = dbMut.workOrders.find((x) => x.id === order.id);
        if (o && !o.ratingRequestSentAt) {
          o.ratingRequestSentAt = new Date().toISOString();
        }
      });
      await sendToClient(
        user,
        [copy.rateTitle, "", `📋 ${esc(order.number)}`].join("\n"),
        ratingKeyboard(loc, order.id)
      );
      return;
    }

    if (statusChanged) {
      const statusLabel = repairStatusLabel(loc, order.status);
      await sendToClient(
        user,
        [
          copy.statusUpdatedTitle,
          "",
          `📋 ${esc(order.number)}`,
          `🚗 ${car}`,
          `📌 ${esc(statusLabel)}`,
        ].join("\n")
      );
    }
  }
}

export async function notifyTelegramAfterOrderMutation(
  orderNumber: string,
  previous?: WorkOrder | null
): Promise<void> {
  const { loadCrmFromCloud } = await import("./crm-actions");
  const db = await loadCrmFromCloud();
  if (!db) return;
  const order = db.workOrders.find((o) => o.number === orderNumber);
  if (!order) return;
  await notifyTelegramWorkOrderChange(db, order, previous);
}

export async function dispatchTelegramFromCrmSave(
  previous: Database,
  next: Database
): Promise<void> {
  for (const order of next.workOrders) {
    const old = previous.workOrders.find((o) => o.id === order.id);
    if (!old) {
      if (orderNeedsSignature(order) || order.status !== "received") {
        await notifyTelegramWorkOrderChange(next, order, null);
      }
      continue;
    }
    const oldTotal = calcClientTotal(old);
    const newTotal = calcClientTotal(order);
    const servicesChanged =
      old.services.length !== order.services.length || Math.abs(oldTotal - newTotal) > 0.01;

    if (
      old.status === order.status &&
      old.confirmationStatus === order.confirmationStatus &&
      old.documentStatus === order.documentStatus &&
      !servicesChanged
    ) {
      continue;
    }

    if (servicesChanged && old.status === order.status) {
      const user = next.users.find((u) => u.id === order.userId);
      if (user?.telegramChatId && canSendBotNotify(user, "status")) {
        const loc = user.telegramLocale ?? "ru";
        const delta = newTotal - oldTotal;
        await sendToClient(
          user,
          [
            loc === "pl"
              ? "📊 <b>Kosztorys zaktualizowany</b>"
              : loc === "en"
                ? "📊 <b>Estimate updated</b>"
                : "📊 <b>Смета обновлена</b>",
            "",
            `📋 ${order.number}`,
            `💰 ${oldTotal.toFixed(2)} → <b>${newTotal.toFixed(2)} zł</b> (${delta >= 0 ? "+" : ""}${delta.toFixed(2)})`,
          ].join("\n"),
          undefined,
          { category: "status" }
        );
        order.lastNotifiedClientTotal = newTotal;
      }
    }

    await notifyTelegramWorkOrderChange(next, order, old);
  }
}

export async function notifyTelegramSignByPhone(
  db: Database,
  order: WorkOrder
): Promise<void> {
  const user = db.users.find((u) => u.id === order.userId && u.role === "client");
  if (!user?.telegramChatId) return;
  if (!orderNeedsSignature(order)) return;

  const loc: BotLocale = user.telegramLocale ?? "ru";
  const copy = woNotifyCopy(loc);
  const car = esc(vehicleLabel(db, order));
  await sendToClient(
    user,
    [
      copy.signDocTitle,
      "",
      copy.signDocBody.replace("{number}", esc(order.number)).replace("{car}", car),
      "",
      copy.signDocHint,
    ].join("\n"),
    signKeyboard(order.id, loc),
    { critical: true }
  );
}
