"use client";

import Link from "next/link";
import { Send } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { telegramBotUrl } from "@/lib/telegram-links";

export function TelegramOpenButton({ startParam }: { startParam?: string }) {
  const { t } = useI18n();

  return (
    <Link
      href={telegramBotUrl(startParam)}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-outline inline-flex items-center gap-2 text-sm"
    >
      <Send size={16} />
      {t.telegramOpen.label}
    </Link>
  );
}
