"use client";

import Link from "next/link";
import { Send } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { telegramBotUrl } from "@/lib/telegram-links";

export function TelegramOpenButton({ startParam }: { startParam?: string }) {
  const { locale } = useI18n();
  const label =
    locale === "ru" || locale === "uk"
      ? "Открыть в Telegram"
      : locale === "en"
        ? "Open in Telegram"
        : "Otwórz w Telegramie";

  return (
    <Link
      href={telegramBotUrl(startParam)}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-outline inline-flex items-center gap-2 text-sm"
    >
      <Send size={16} />
      {label}
    </Link>
  );
}
