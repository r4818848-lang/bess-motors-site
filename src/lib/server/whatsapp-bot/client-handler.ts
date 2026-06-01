import { cleanEnvValue } from "@/lib/server/supabase-config";
import {
  markWhatsAppMessageRead,
  sendWhatsAppCtaUrl,
  sendWhatsAppText,
} from "@/lib/server/whatsapp-api";
import type { BotLocale } from "@/lib/server/telegram-bot/client-i18n";
import { loadCrmFromCloud } from "@/lib/server/telegram-bot/crm-actions";
import {
  findClientByWhatsAppWaId,
  linkWhatsAppInbound,
} from "./client-whatsapp-link";
import { phoneToWaId } from "./whatsapp-phone";

type IncomingTextMessage = {
  from: string;
  id: string;
  type: "text";
  text: { body: string };
};

type IncomingButtonMessage = {
  from: string;
  id: string;
  type: "button";
  button: { text: string; payload: string };
};

type IncomingInteractive = {
  from: string;
  id: string;
  type: "interactive";
  interactive: {
    type: "button_reply";
    button_reply: { id: string; title: string };
  };
};

export type WhatsAppIncomingMessage =
  | IncomingTextMessage
  | IncomingButtonMessage
  | IncomingInteractive;

function siteUrl(): string {
  return cleanEnvValue(process.env.NEXT_PUBLIC_SITE_URL) || "https://www.bess-motors.com";
}

function detectLocale(text: string): BotLocale {
  const t = text.toLowerCase();
  if (/cześć|witaj|menu|podpis|zlecenie/i.test(t)) return "pl";
  if (/hello|sign|order/i.test(t)) return "en";
  if (/привіт|меню/i.test(t)) return "uk";
  return "ru";
}

function menuText(loc: BotLocale, name?: string): string {
  const greet = name ? `${name}, ` : "";
  if (loc === "pl") {
    return `${greet}witamy w BESS MOTORS 🚗\n\n• status — Twoje zlecenia\n• podpis — link do podpisu\n• kabinet — panel klienta\n\nNapisz też: menu`;
  }
  if (loc === "en") {
    return `${greet}welcome to BESS MOTORS 🚗\n\n• status — your work orders\n• sign — signing link\n• cabinet — client portal\n\nOr send: menu`;
  }
  return `${greet}добро пожаловать в BESS MOTORS 🚗\n\n• статус — ваши заказ-наряды\n• подпись — ссылка на подпись\n• кабинет — личный кабинет\n\nИли напишите: меню`;
}

async function sendMenu(to: string, loc: BotLocale, name?: string): Promise<void> {
  const text = menuText(loc, name);
  await sendWhatsAppCtaUrl(to, text, loc === "pl" ? "Kabinet" : loc === "en" ? "Portal" : "Кабинет", `${siteUrl()}/cabinet`);
}

async function sendStatus(to: string, userId: string, loc: BotLocale): Promise<void> {
  const db = await loadCrmFromCloud();
  if (!db) {
    await sendWhatsAppText(to, loc === "pl" ? "Brak danych CRM." : "Нет данных CRM.");
    return;
  }

  const orders = db.workOrders
    .filter((o) => o.userId === userId && o.status !== "delivered")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  if (!orders.length) {
    await sendWhatsAppText(
      to,
      loc === "pl" ? "Brak aktywnych zleceń." : "Нет активных заказ-нарядов."
    );
    return;
  }

  const lines = orders.map((o) => {
    const v = db.vehicles.find((x) => x.id === o.vehicleId);
    const car = v ? `${v.make} ${v.model} · ${v.plate}` : o.number;
    return `📋 ${o.number}\n🚗 ${car}\n📌 ${o.status}`;
  });

  await sendWhatsAppText(
    to,
    (loc === "pl" ? "Twoje zlecenia:\n\n" : "Ваши заказы:\n\n") + lines.join("\n\n")
  );
}

async function sendSignHint(to: string, userId: string, loc: BotLocale): Promise<void> {
  const db = await loadCrmFromCloud();
  if (!db) return;

  const pending = db.workOrders
    .filter(
      (o) =>
        o.userId === userId &&
        o.confirmationStatus !== "confirmed" &&
        (o.documentStatus === "awaiting_signature" ||
          o.confirmationStatus === "awaiting_confirmation")
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  if (!pending) {
    await sendWhatsAppText(
      to,
      loc === "pl" ? "Brak dokumentów do podpisu." : "Нет документов на подпись."
    );
    return;
  }

  const label = loc === "pl" ? "Podpisz" : loc === "en" ? "Sign" : "Подписать";
  await sendWhatsAppCtaUrl(
    to,
    loc === "pl"
      ? `Zlecenie ${pending.number} czeka na podpis.`
      : `Заказ-наряд ${pending.number} ожидает подпись.`,
    label,
    `${siteUrl()}/sign/${pending.id}`
  );
}

export async function handleWhatsAppClientMessage(
  msg: WhatsAppIncomingMessage,
  contactName?: string
): Promise<void> {
  const waId = phoneToWaId(msg.from);
  await markWhatsAppMessageRead(msg.id).catch(() => undefined);

  let user: Awaited<ReturnType<typeof linkWhatsAppInbound>> = await linkWhatsAppInbound(
    waId,
    contactName
  );
  const db = await loadCrmFromCloud();
  if (!user && db) {
    user = findClientByWhatsAppWaId(db, waId) ?? null;
  }

  const body =
    msg.type === "text"
      ? msg.text.body.trim()
      : msg.type === "button"
        ? msg.button.text.trim()
        : msg.interactive.button_reply.title.trim();

  const loc = user?.telegramLocale ?? detectLocale(body);
  const lower = body.toLowerCase();

  if (
    !user &&
    (lower === "start" ||
      lower === "меню" ||
      lower === "menu" ||
      lower.startsWith("/start"))
  ) {
    await sendWhatsAppText(
      waId,
      loc === "pl"
        ? "Witamy! Podaj numer telefonu z umowy (np. +48…) i numer rejestracyjny auta, aby połączyć konto.\n\nLub zaloguj się w kabinecie na stronie."
        : "Добро пожаловать! Напишите телефон из договора (+48…) и госномер авто для привязки.\n\nИли войдите в кабинет на сайте."
    );
    await sendWhatsAppCtaUrl(
      waId,
      siteUrl(),
      loc === "pl" ? "Strona" : "Сайт",
      siteUrl()
    );
    return;
  }

  if (!user) {
    await sendWhatsAppText(
      waId,
      loc === "pl"
        ? "Nie znaleziono konta po tym numerze WhatsApp. Użyj telefonu z CRM lub napisz do warsztatu."
        : "Аккаунт не найден. Используйте телефон из CRM или свяжитесь с сервисом."
    );
    return;
  }

  if (
    lower === "menu" ||
    lower === "меню" ||
    lower === "start" ||
    lower.startsWith("/start") ||
    lower === "pomoc" ||
    lower === "help"
  ) {
    await sendMenu(waId, loc, user.name);
    return;
  }

  if (lower.includes("status") || lower.includes("статус") || lower === "zlecenia") {
    await sendStatus(waId, user.id, loc);
    return;
  }

  if (
    lower.includes("podpis") ||
    lower.includes("подпис") ||
    lower.includes("sign")
  ) {
    await sendSignHint(waId, user.id, loc);
    return;
  }

  if (lower.includes("kabinet") || lower.includes("кабинет") || lower.includes("cabinet")) {
    await sendWhatsAppCtaUrl(
      waId,
      loc === "pl" ? "Panel klienta BESS MOTORS" : "Личный кабинет BESS MOTORS",
      loc === "pl" ? "Otwórz" : "Открыть",
      `${siteUrl()}/cabinet`
    );
    return;
  }

  await sendMenu(waId, loc, user.name);
}
