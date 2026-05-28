import { buildBookingIcs } from "@/lib/ics-calendar";
import { siteConfig } from "@/lib/site";
import { sendTelegramMessage } from "@/lib/server/telegram-api";
import type { Appointment } from "@/lib/store";
import type { BotLocale } from "./client-i18n";
import { getClientServiceLabel } from "./client-services";
import { formatDateShort } from "./client-services";
import { telegramBotDeepLink } from "./client-extras";

export function formatShareAppointmentText(
  locale: BotLocale,
  apt: Appointment,
  services: string
): string {
  const date = formatDateShort(apt.date, locale);
  const addr = siteConfig.address;
  const title =
    locale === "pl"
      ? "📤 <b>Wizyta BESS MOTORS</b>"
      : locale === "en"
        ? "📤 <b>BESS MOTORS appointment</b>"
        : "📤 <b>Запись BESS MOTORS</b>";
  return [
    title,
    "",
    `📅 <b>${date}</b> · ${apt.time}`,
    `🔧 ${services}`,
    `📍 ${addr}`,
    `📱 ${siteConfig.phone}`,
  ].join("\n");
}

export async function sendShareAppointment(
  chatId: number,
  locale: BotLocale,
  apt: Appointment
): Promise<void> {
  const services = apt.serviceIds.map((id) => getClientServiceLabel(id, locale)).join(", ");
  const text = formatShareAppointmentText(locale, apt, services);
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
    telegramBotDeepLink(`apt_${apt.id}`)
  )}&text=${encodeURIComponent(`${apt.date} ${apt.time} — BESS MOTORS`)}`;

  void buildBookingIcs({
    title: `BESS MOTORS — ${services}`,
    description: services,
    location: siteConfig.address,
    date: apt.date,
    time: apt.time,
  });

  await sendTelegramMessage(chatId, text, {
    inline_keyboard: [
      [{ text: locale === "pl" ? "📤 Udostępnij" : locale === "en" ? "📤 Share" : "📤 Поделиться", url: shareUrl }],
    ],
  });
}
