"use client";

import { useMemo } from "react";
import { Gift } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { User } from "@/lib/store";
import {
  formatLoyaltyProgress,
  LOYALTY_DISCOUNT_PERCENT,
  LOYALTY_OIL_CHANGES_REQUIRED,
  loyaltyRewardAvailable,
} from "@/lib/loyalty";
import { Card } from "@/components/ui/Card";

export function LoyaltyPanel({ user }: { user: User }) {
  const { locale } = useI18n();
  const text = useMemo(() => formatLoyaltyProgress(user, locale), [user, locale]);

  const title =
    locale === "ru" || locale === "uk"
      ? "Карта лояльности"
      : locale === "en"
        ? "Loyalty program"
        : "Program lojalnościowy";

  return (
    <Card className="p-4 mb-6 flex items-start gap-3">
      <Gift className="text-bm-red shrink-0 mt-0.5" size={20} />
      <div>
        <p className="font-display uppercase text-sm">{title}</p>
        <p className="text-sm text-bm-muted mt-1">{text}</p>
        {loyaltyRewardAvailable(user) && (
          <p className="text-xs text-green-400 mt-2">
            {locale === "ru"
              ? `Сообщите администратору о скидке ${LOYALTY_DISCOUNT_PERCENT}% при следующей замене масла.`
              : locale === "en"
                ? `Tell staff about your ${LOYALTY_DISCOUNT_PERCENT}% oil change discount.`
                : `Powiedz w recepcji o rabacie ${LOYALTY_DISCOUNT_PERCENT}% przy kolejnej wymianie oleju.`}
          </p>
        )}
        <p className="text-[10px] text-bm-muted mt-2">
          {LOYALTY_OIL_CHANGES_REQUIRED}{" "}
          {locale === "ru" ? "оплаченных замен масла" : locale === "en" ? "paid oil changes" : "opłaconych wymian oleju"}
        </p>
      </div>
    </Card>
  );
}
