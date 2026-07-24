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
  if (/cześć|witaj|menu|wizyta|zapis/i.test(t)) return "pl";
  if (/hello|book|menu/i.test(t)) return "en";
  if (/привіт|меню|запис/i.test(t)) return "uk";
  return "ru";
}

function menuText(loc: BotLocale, name?: string): string {
  const greet = name ? `${name}, ` : "";
  if (loc === "pl") {
    return `${greet}witamy w BESS MOTORS 🚗\n\nUmów wizytę online — wybierz usługę i zostaw telefon. Oddzwonimy.`;
  }
  if (loc === "en") {
    return `${greet}welcome to BESS MOTORS 🚗\n\nBook online — pick a service and leave your phone. We will call you back.`;
  }
  return `${greet}добро пожаловать в BESS MOTORS 🚗\n\nЗапишитесь онлайн — выберите услугу и оставьте телефон. Мы перезвоним.`;
}

async function sendMenu(to: string, loc: BotLocale, name?: string): Promise<void> {
  const text = menuText(loc, name);
  await sendWhatsAppCtaUrl(
    to,
    text,
    loc === "pl" ? "Umów wizytę" : loc === "en" ? "Book" : "Запись",
    `${siteUrl()}/booking`
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
  void body;

  await sendMenu(waId, loc, user?.name);
}
