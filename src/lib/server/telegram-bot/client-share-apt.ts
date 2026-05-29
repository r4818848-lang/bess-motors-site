import { buildBookingIcs } from "@/lib/ics-calendar";
import { siteConfig } from "@/lib/site";
import { sendTelegramMessage } from "@/lib/server/telegram-api";
import type { Appointment } from "@/lib/store";
import type { BotLocale } from "./client-i18n";
import { getClientBotLabels } from "./client-i18n";
import { getClientServiceLabel } from "./client-services";
import { formatDateShort } from "./client-services";
import { telegramBotDeepLink } from "./client-extras";

export function formatShareAppointmentText(
  locale: BotLocale,
  apt: Appointment,
  services: string
): string {
  const L = getClientBotLabels(locale);
  const date = formatDateShort(apt.date, locale);
  const addr = siteConfig.address;
  return [
    L.shareAptTitle,
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
  const L = getClientBotLabels(locale);
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
      [{ text: L.shareBtn, url: shareUrl }],
    ],
  });
}
