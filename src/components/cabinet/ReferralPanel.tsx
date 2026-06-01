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

function fill(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
    template
  );
}

export function ReferralPanel({ user }: { user: User }) {
  const { t } = useI18n();
  const r = t.referralProgram;
  const tick = useDbSync();
  const db = loadDb();
  void tick;
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const code = ensureReferralCode(user, db);

  useEffect(() => {
    void import("@/lib/client-portal").then(({ pushClientPortalPatchToCloud }) =>
      pushClientPortalPatchToCloud({ referralCode: code })
    );
  }, [code]);

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

  const progressLabel = fill(r.progressLabel, {
    count: summary?.qualifiedCount ?? 0,
    required: REFERRAL_QUALIFIED_REQUIRED,
  });

  const ruleText = fill(r.ruleText, {
    inviteePercent: REFERRAL_INVITEE_DISCOUNT_PERCENT,
    rewardPercent: REFERRAL_REWARD_DISCOUNT_PERCENT,
    validDays: REFERRAL_DISCOUNT_VALID_DAYS,
  });

  const expiryText =
    summary?.discountExpiresAt && summary.discountAvailable
      ? fill(r.validUntil, { date: summary.discountExpiresAt.slice(0, 10) })
      : null;

  const remaining = Math.max(0, REFERRAL_QUALIFIED_REQUIRED - (summary?.qualifiedCount ?? 0));

  const rewardText = summary?.discountAvailable
    ? fill(r.rewardAvailable, { percent: REFERRAL_REWARD_DISCOUNT_PERCENT })
    : summary?.discountUsed
      ? r.rewardUsed
      : fill(r.rewardProgress, {
          percent: REFERRAL_REWARD_DISCOUNT_PERCENT,
          remaining,
        });

  const inviteeReward =
    user.referredByUserId && canUseInvitee(user)
      ? fill(r.inviteeReward, { percent: REFERRAL_INVITEE_DISCOUNT_PERCENT })
      : null;

  const statusLabels = {
    registered: r.statusRegistered,
    pending_visit: r.statusPending,
    qualified: r.statusQualified,
  };

  return (
    <Card className="p-6 mb-6">
      <h3 className="font-display uppercase text-sm mb-2">{r.title}</h3>
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
            <p className="text-xs text-bm-muted mt-2">{r.qrHint}</p>
          </div>
        )}
        <div>
          <p className="text-sm text-bm-muted mb-1">{r.telegramLabel}</p>
          <p className="text-sm break-all mb-2">{tgLink}</p>
          <p className="text-sm text-bm-muted mb-1">{r.webLabel}</p>
          <p className="text-sm break-all mb-4">{siteLink}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-outline text-sm"
              onClick={() => navigator.clipboard?.writeText(tgLink)}
            >
              {r.copyTg}
            </button>
            <button
              type="button"
              className="btn-outline text-sm"
              onClick={() => navigator.clipboard?.writeText(siteLink)}
            >
              {r.copyWeb}
            </button>
          </div>
        </div>
      </div>

      {summary && summary.referred.length > 0 && (
        <div className="mt-6 border-t border-bm-border/40 pt-4">
          <p className="text-xs uppercase text-bm-muted mb-2">{r.referredList}</p>
          <ul className="space-y-2 text-sm">
            {summary.referred.map((ref) => (
              <li key={ref.userId} className="flex justify-between gap-2">
                <span>{ref.name}</span>
                <span className="text-bm-muted shrink-0 text-xs">{statusLabels[ref.status]}</span>
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
