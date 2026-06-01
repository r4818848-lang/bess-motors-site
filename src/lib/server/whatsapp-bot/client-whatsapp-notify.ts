import { cleanEnvValue } from "@/lib/server/supabase-config";
import {
  isWhatsAppConfigured,
  sendWhatsAppCtaUrl,
  sendWhatsAppTemplate,
  sendWhatsAppText,
} from "@/lib/server/whatsapp-api";
import { orderNeedsClientSignature as orderNeedsSignature } from "@/lib/order-signature";
import type { Database, User, WorkOrder } from "@/lib/store";
import { calcClientTotal } from "@/lib/workorder-calc";
import { stripHtmlForWhatsApp } from "@/lib/whatsapp-messages";
import type { BotLocale } from "@/lib/server/telegram-bot/client-i18n";
import { mutateCrm } from "@/lib/server/telegram-bot/crm-actions";
import {
  canSendWhatsAppNotify,
  canSendTelegramNotify,
} from "@/lib/server/telegram-bot/bot-notify-guard";
import { isQuietHours } from "@/lib/quiet-hours";
import { isWorkOrderClosed } from "@/lib/work-order-lifecycle";
import { sendTelegramMessage } from "@/lib/server/telegram-api";
import {
  repairStatusLabel,
  signKeyboardLocalized,
  woNotifyCopy,
} from "@/lib/server/telegram-bot/client-wo-notify-text";
import { ratingKeyboard } from "@/lib/server/telegram-bot/client-extras";
import { resolveWhatsAppRecipient } from "./whatsapp-phone";

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

async function sendWhatsAppWithTemplateFallback(
  to: string,
  text: string,
  templateEnvKey: string,
  templateParams: string[]
): Promise<boolean> {
  const plain = stripHtmlForWhatsApp(text);
  const direct = await sendWhatsAppText(to, plain);
  if (direct.ok) return true;

  const templateName = cleanEnvValue(process.env[templateEnvKey]);
  if (!templateName) return false;

  const lang = cleanEnvValue(process.env.WHATSAPP_TEMPLATE_LANG) ?? "pl";
  const tpl = await sendWhatsAppTemplate(to, templateName, lang, [
    { type: "body", parameters: templateParams.map((t) => ({ type: "text", text: t })) },
  ]);
  return tpl.ok;
}

async function sendWhatsAppToUser(
  user: User,
  text: string,
  opts?: {
    category?: "booking" | "status" | "promo";
    critical?: boolean;
    cta?: { label: string; url: string };
    templateKey?: string;
    templateParams?: string[];
  }
): Promise<boolean> {
  if (!isWhatsAppConfigured()) return false;
  if (!canSendWhatsAppNotify(user, opts?.category ?? "status", { critical: opts?.critical })) {
    return false;
  }
  if (!opts?.critical && isQuietHours(new Date(), user.botQuietHours !== false)) return false;

  const to = resolveWhatsAppRecipient(user);
  if (!to) return false;

  if (opts?.cta) {
    const plain = stripHtmlForWhatsApp(text);
    const res = await sendWhatsAppCtaUrl(to, plain, opts.cta.label, opts.cta.url);
    if (res.ok) return true;
    if (opts.templateKey && opts.templateParams) {
      return sendWhatsAppWithTemplateFallback(
        to,
        `${plain}\n${opts.cta.url}`,
        opts.templateKey,
        opts.templateParams
      );
    }
    return false;
  }

  if (opts?.templateKey && opts.templateParams) {
    return sendWhatsAppWithTemplateFallback(to, text, opts.templateKey, opts.templateParams);
  }

  const res = await sendWhatsAppText(to, stripHtmlForWhatsApp(text));
  return res.ok;
}

async function sendTelegramToUser(
  user: User,
  text: string,
  keyboard?: { inline_keyboard: { text: string; url?: string; callback_data?: string }[][] },
  opts?: { category?: "booking" | "status" | "promo"; critical?: boolean }
): Promise<void> {
  if (!canSendTelegramNotify(user, opts?.category ?? "status", { critical: opts?.critical })) {
    return;
  }
  if (!opts?.critical && isQuietHours(new Date(), user.botQuietHours !== false)) return;
  await sendTelegramMessage(user.telegramChatId!, text, keyboard);
}

async function sendToClient(
  user: User,
  text: string,
  keyboard?: { inline_keyboard: { text: string; url?: string; callback_data?: string }[][] },
  opts?: {
    category?: "booking" | "status" | "promo";
    critical?: boolean;
    templateKey?: string;
    templateParams?: string[];
    signCta?: { orderId: string; locale: BotLocale };
  }
): Promise<void> {
  const category = opts?.category ?? "status";
  const critical = opts?.critical;

  await sendTelegramToUser(user, text, keyboard, { category, critical });

  const copy = opts?.signCta ? woNotifyCopy(opts.signCta.locale) : null;
  const signUrl = opts?.signCta ? `${siteUrl()}/sign/${opts.signCta.orderId}` : undefined;

  await sendWhatsAppToUser(user, text, {
    category,
    critical,
    templateKey: opts?.templateKey,
    templateParams: opts?.templateParams,
    cta:
      signUrl && copy
        ? { label: copy.signBtn.replace(/✍️\s*/, "").slice(0, 20), url: signUrl }
        : undefined,
  });
}

export async function notifyWhatsAppWorkOrderChange(
  db: Database,
  order: WorkOrder,
  previous?: WorkOrder | null
): Promise<void> {
  const user = db.users.find((u) => u.id === order.userId && u.role === "client");
  if (!user || !resolveWhatsAppRecipient(user)) return;

  const loc: BotLocale = user.telegramLocale ?? "ru";
  const copy = woNotifyCopy(loc);
  const car = esc(vehicleLabel(db, order));
  const carPlain = vehicleLabel(db, order);
  const total = calcClientTotal(order);

  const signJustRequired =
    orderNeedsSignature(order) && (!previous || !orderNeedsSignature(previous));

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
      signKeyboardLocalized(order.id, siteUrl(), loc),
      {
        critical: true,
        templateKey: "WHATSAPP_TEMPLATE_SIGN",
        templateParams: [order.number, carPlain, total.toFixed(2)],
        signCta: { orderId: order.id, locale: loc },
      }
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
          `🌐 ${siteUrl()}/cabinet`,
        ].join("\n"),
        undefined,
        {
          category: "status",
          templateKey: "WHATSAPP_TEMPLATE_READY",
          templateParams: [carPlain, order.number],
        }
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
        ratingKeyboard(loc, order.id),
        { category: "status" }
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
        ].join("\n"),
        undefined,
        {
          category: "status",
          templateKey: "WHATSAPP_TEMPLATE_STATUS",
          templateParams: [order.number, carPlain, statusLabel],
        }
      );
    }
  }
}

export async function dispatchWhatsAppFromCrmSave(
  previous: Database,
  next: Database
): Promise<void> {
  if (!isWhatsAppConfigured()) return;

  for (const order of next.workOrders) {
    const old = previous.workOrders.find((o) => o.id === order.id);
    if (!old) {
      if (orderNeedsSignature(order) || order.status !== "received") {
        await notifyWhatsAppWorkOrderChange(next, order, null);
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
      if (user && canSendWhatsAppNotify(user, "status")) {
        const loc = user.telegramLocale ?? "ru";
        const delta = newTotal - oldTotal;
        const msg =
          loc === "pl"
            ? `📊 Kosztorys zaktualizowany\n\n📋 ${order.number}\n💰 ${oldTotal.toFixed(2)} → ${newTotal.toFixed(2)} zł (${delta >= 0 ? "+" : ""}${delta.toFixed(2)})`
            : loc === "en"
              ? `📊 Estimate updated\n\n📋 ${order.number}\n💰 ${oldTotal.toFixed(2)} → ${newTotal.toFixed(2)} zł`
              : `📊 Смета обновлена\n\n📋 ${order.number}\n💰 ${oldTotal.toFixed(2)} → ${newTotal.toFixed(2)} zł`;
        await sendWhatsAppToUser(user, msg, { category: "status" });
        order.lastNotifiedClientTotal = newTotal;
      }
    }

    await notifyWhatsAppWorkOrderChange(next, order, old);
  }
}

export async function notifyWhatsAppSignByPhone(
  db: Database,
  order: WorkOrder
): Promise<void> {
  const user = db.users.find((u) => u.id === order.userId && u.role === "client");
  if (!user) return;
  if (!orderNeedsSignature(order)) return;

  const loc: BotLocale = user.telegramLocale ?? "ru";
  const copy = woNotifyCopy(loc);
  const car = esc(vehicleLabel(db, order));
  const carPlain = vehicleLabel(db, order);

  await sendToClient(
    user,
    [
      copy.signDocTitle,
      "",
      copy.signDocBody.replace("{number}", esc(order.number)).replace("{car}", car),
      "",
      copy.signDocHint,
    ].join("\n"),
    signKeyboardLocalized(order.id, siteUrl(), loc),
    {
      critical: true,
      templateKey: "WHATSAPP_TEMPLATE_SIGN",
      templateParams: [order.number, carPlain],
      signCta: { orderId: order.id, locale: loc },
    }
  );
}
