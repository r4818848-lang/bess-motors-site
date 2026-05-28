"use client";

import { useMemo } from "react";
import { loadDb } from "@/lib/store";
import { listAllReferrers, REFERRAL_QUALIFIED_REQUIRED } from "@/lib/referral-system";
import { useDbSync } from "@/hooks/useDbSync";

export function ReferralLeaderboard() {
  const tick = useDbSync();
  const top = useMemo(() => {
    void tick;
    const db = loadDb();
    return listAllReferrers(db)
      .filter((r) => r.qualifiedCount > 0)
      .slice(0, 10);
  }, [tick]);

  if (top.length === 0) return null;

  return (
    <div className="glass rounded-xl p-4 mb-6">
      <p className="font-display uppercase text-sm text-bm-red mb-3">🏆 Top polecający</p>
      <ol className="space-y-2 text-sm">
        {top.map((r, i) => (
          <li key={r.referrerId} className="flex justify-between gap-2">
            <span>
              <b className="text-bm-red">{i + 1}.</b> {r.name}
            </span>
            <span className="text-bm-muted font-mono">
              {r.qualifiedCount}/{REFERRAL_QUALIFIED_REQUIRED}
              {r.discountAvailable ? " · rabat" : ""}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
