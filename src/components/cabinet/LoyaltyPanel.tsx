"use client";

import { useMemo } from "react";
import { Gift } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { User } from "@/lib/store";
import {
  getLoyaltyOilCount,
  LOYALTY_DISCOUNT_PERCENT,
  LOYALTY_OIL_CHANGES_REQUIRED,
  loyaltyRewardAvailable,
} from "@/lib/loyalty";
import { Card } from "@/components/ui/Card";

export function LoyaltyPanel({ user }: { user: User }) {
  const { t } = useI18n();
  const l = t.loyaltyPanel;
  const n = getLoyaltyOilCount(user);
  const left = Math.max(0, LOYALTY_OIL_CHANGES_REQUIRED - n);

  const text = useMemo(() => {
    if (loyaltyRewardAvailable(user)) {
      return l.progressAvailable.replace("{percent}", String(LOYALTY_DISCOUNT_PERCENT));
    }
    return l.progressCount
      .replace("{count}", String(n))
      .replace("{required}", String(LOYALTY_OIL_CHANGES_REQUIRED))
      .replace("{left}", String(left))
      .replace("{percent}", String(LOYALTY_DISCOUNT_PERCENT));
  }, [user, l, n, left]);

  return (
    <Card className="p-4 mb-6 flex items-start gap-3">
      <Gift className="text-bm-red shrink-0 mt-0.5" size={20} />
      <div>
        <p className="font-display uppercase text-sm">{l.title}</p>
        <p className="text-sm text-bm-muted mt-1">{text}</p>
        {loyaltyRewardAvailable(user) && (
          <p className="text-xs text-green-400 mt-2">
            {l.rewardHint.replace("{percent}", String(LOYALTY_DISCOUNT_PERCENT))}
          </p>
        )}
        <p className="text-[10px] text-bm-muted mt-2">
          {LOYALTY_OIL_CHANGES_REQUIRED} {l.oilChangesRule}
        </p>
      </div>
    </Card>
  );
}
