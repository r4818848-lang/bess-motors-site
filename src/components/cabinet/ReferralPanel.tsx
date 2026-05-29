"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { useI18n } from "@/lib/i18n/context";
import type { User } from "@/lib/store";
import { loadDb } from "@/lib/store";
import { useDbSync } from "@/hooks/useDbSync";
import {
  buildReferrerSummary,
  REFERRAL_DISCOUNT_VALID_DAYS,
  REFERRAL_INVITEE_DISCOUNT_PERCENT,
  REFERRAL_QUALIFIED_REQUIRED,
  REFERRAL_REWARD_DISCOUNT_PERCENT,
} from "@/lib/referral-system";
import { ensureReferralCode } from "@/lib/referral-code";
import { Card } from "@/components/ui/Card";

export function ReferralPanel({ user }: { user: User }) {
  const { locale } = useI18n();
  const tick = useDbSync();
  const db = loadDb();
  void tick;
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const code = ensureReferralCode(user, db);
  const bot = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "BessMotors_bot";
  const tgLink = `https://t.me/${bot}?start=ref_${code}`;
  const siteLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/cabinet?ref=${code}`
      : `/cabinet?ref=${code}`;

  const summary = useMemo(() => buildReferrerSummary(db, user.id), [db, user.id, tick]);

  useEffect(() => {
    QRCode.toDataURL(tgLink, { width: 160, margin: 1, color: { dark: "#111111" } })
      .then(setQrUrl)
      .catch(() => setQrUrl(null));
  }, [tgLink]);

  const title =
    locale === "ru" || locale === "uk"
      ? "Пригласить друга"
      : locale === "en"
        ? "Refer a friend"
        : "Poleć znajomego";

  const progressLabel =
    locale === "ru"
      ? `Подтверждено: ${summary?.qualifiedCount ?? 0} / ${REFERRAL_QUALIFIED_REQUIRED}`
      : locale === "pl"
        ? `Potwierdzeni: ${summary?.qualifiedCount ?? 0} / ${REFERRAL_QUALIFIED_REQUIRED}`
        : `Confirmed: ${summary?.qualifiedCount ?? 0} / ${REFERRAL_QUALIFIED_REQUIRED}`;

  const ruleText =
    locale === "ru"
      ? `Друг засчитывается после оплаченного и выданного заказ-наряда. Приглашённый получает ${REFERRAL_INVITEE_DISCOUNT_PERCENT}% на первый визит. Ваша скидка ${REFERRAL_REWARD_DISCOUNT_PERCENT}% действует ${REFERRAL_DISCOUNT_VALID_DAYS} дней.`
      : locale === "pl"
        ? `Znajomy liczy się po opłaconym i wydanym zleceniu. Zaproszony dostaje ${REFERRAL_INVITEE_DISCOUNT_PERCENT}%. Twój rabat ${REFERRAL_REWARD_DISCOUNT_PERCENT}% — ${REFERRAL_DISCOUNT_VALID_DAYS} dni.`
        : `Friend counts after paid+delivered order. Invitee gets ${REFERRAL_INVITEE_DISCOUNT_PERCENT}%. Your ${REFERRAL_REWARD_DISCOUNT_PERCENT}% lasts ${REFERRAL_DISCOUNT_VALID_DAYS} days.`;

  const expiryText =
    summary?.discountExpiresAt && summary.discountAvailable
      ? locale === "ru" || locale === "uk"
        ? `Действует до: ${summary.discountExpiresAt.slice(0, 10)}`
        : locale === "pl"
          ? `Ważne do: ${summary.discountExpiresAt.slice(0, 10)}`
          : `Valid until: ${summary.discountExpiresAt.slice(0, 10)}`
      : null;

  const rewardText = summary?.discountAvailable
    ? locale === "ru" || locale === "uk"
      ? `🎉 Скидка ${REFERRAL_REWARD_DISCOUNT_PERCENT}% на следующий визит!`
      : locale === "pl"
        ? `🎉 Masz ${REFERRAL_REWARD_DISCOUNT_PERCENT}% rabatu!`
        : `🎉 ${REFERRAL_REWARD_DISCOUNT_PERCENT}% off!`
    : summary?.discountUsed
      ? locale === "ru" || locale === "uk"
        ? "Скидка 15% уже использована."
        : locale === "pl"
          ? "Rabat 15% został już wykorzystany."
          : "15% discount already used."
      : locale === "ru" || locale === "uk"
        ? `До скидки ${REFERRAL_REWARD_DISCOUNT_PERCENT}%: ещё ${Math.max(0, REFERRAL_QUALIFIED_REQUIRED - (summary?.qualifiedCount ?? 0))} друзей`
        : locale === "pl"
          ? `Do rabatu ${REFERRAL_REWARD_DISCOUNT_PERCENT}%: jeszcze ${Math.max(0, REFERRAL_QUALIFIED_REQUIRED - (summary?.qualifiedCount ?? 0))} znajomych`
          : `Need ${Math.max(0, REFERRAL_QUALIFIED_REQUIRED - (summary?.qualifiedCount ?? 0))} more friends`;

  const inviteeReward =
    user.referredByUserId && canUseInvitee(user)
      ? locale === "ru" || locale === "uk"
        ? `🎁 Вам доступна скидка ${REFERRAL_INVITEE_DISCOUNT_PERCENT}% (вы пришли по ссылке друга)`
        : locale === "pl"
          ? `🎁 Masz ${REFERRAL_INVITEE_DISCOUNT_PERCENT}% rabatu (link od znajomego)`
          : `🎁 ${REFERRAL_INVITEE_DISCOUNT_PERCENT}% discount for you`
      : null;

  const statusRu = {
    registered: "Зарегистрирован",
    pending_visit: "Был в сервисе",
    qualified: "✅ Засчитан",
  };
  const statusPl = {
    registered: "Zarejestrowany",
    pending_visit: "W serwisie",
    qualified: "✅ Potwierdzony",
  };
  const statusLabels = locale === "ru" || locale === "uk" ? statusRu : statusPl;

  return (
    <Card className="p-6 mb-6">
      <h3 className="font-display uppercase text-sm mb-2">{title}</h3>
      <p className="text-xs text-bm-muted mb-4">{ruleText}</p>
      {inviteeReward && <p className="text-sm text-green-400 mb-4">{inviteeReward}</p>}

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span>{progressLabel}</span>
          <span className="text-bm-red font-bold">{rewardText}</span>
        </div>
        {expiryText && <p className="text-xs text-bm-muted mb-1">{expiryText}</p>}
        <div className="h-2 rounded-full bg-bm-border overflow-hidden">
          <div
            className="h-full bg-bm-red transition-all"
            style={{
              width: `${Math.min(100, ((summary?.qualifiedCount ?? 0) / REFERRAL_QUALIFIED_REQUIRED) * 100)}%`,
            }}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-[160px_1fr] gap-4 mb-4">
        {qrUrl && (
          <div className="text-center">
            <Image
              src={qrUrl}
              alt="QR"
              width={160}
              height={160}
              unoptimized
              className="mx-auto rounded-lg bg-white p-2"
            />
            <p className="text-xs text-bm-muted mt-2">QR → Telegram</p>
          </div>
        )}
        <div>
          <p className="text-sm text-bm-muted mb-1">Telegram</p>
          <p className="text-sm break-all mb-2">{tgLink}</p>
          <p className="text-sm text-bm-muted mb-1">Web</p>
          <p className="text-sm break-all mb-4">{siteLink}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-outline text-sm"
              onClick={() => navigator.clipboard?.writeText(tgLink)}
            >
              {locale === "ru" || locale === "uk"
                ? "Копировать TG"
                : locale === "pl"
                  ? "Kopiuj TG"
                  : "Copy TG"}
            </button>
            <button
              type="button"
              className="btn-outline text-sm"
              onClick={() => navigator.clipboard?.writeText(siteLink)}
            >
              {locale === "ru" || locale === "uk"
                ? "Копировать сайт"
                : locale === "pl"
                  ? "Kopiuj link"
                  : "Copy web"}
            </button>
          </div>
        </div>
      </div>

      {summary && summary.referred.length > 0 && (
        <div className="mt-6 border-t border-bm-border/40 pt-4">
          <p className="text-xs uppercase text-bm-muted mb-2">
            {locale === "ru" || locale === "uk"
              ? "Кого привели"
              : locale === "en"
                ? "Referred friends"
                : "Poleceni"}
          </p>
          <ul className="space-y-2 text-sm">
            {summary.referred.map((r) => (
              <li key={r.userId} className="flex justify-between gap-2">
                <span>{r.name}</span>
                <span className="text-bm-muted shrink-0 text-xs">{statusLabels[r.status]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function canUseInvitee(user: User): boolean {
  return (
    Boolean(user.referredByUserId) &&
    Boolean(user.referredFriendRewardUnlockedAt) &&
    !user.referredFriendDiscountUsedAt
  );
}
