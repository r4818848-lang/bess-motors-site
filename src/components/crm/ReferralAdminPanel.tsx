"use client";

import { useMemo, useState } from "react";
import { useDbSync } from "@/hooks/useDbSync";
import { useI18n } from "@/lib/i18n/context";
import { loadDb, saveDb } from "@/lib/store";
import { pushCrmSave } from "@/lib/cloud-crm-db";
import { ReferralLeaderboard } from "@/components/crm/ReferralLeaderboard";
import {
  exportReferralsCsv,
  listAllReferrers,
  recomputeAllReferrals,
  REFERRAL_DISCOUNT_VALID_DAYS,
  REFERRAL_INVITEE_DISCOUNT_PERCENT,
  REFERRAL_QUALIFIED_REQUIRED,
  REFERRAL_REWARD_DISCOUNT_PERCENT,
  type ReferralInviteStatus,
  type ReferrerSummary,
} from "@/lib/referral-system";

function StatusBadge({
  status,
  labels,
}: {
  status: ReferralInviteStatus;
  labels: Record<ReferralInviteStatus, string>;
}) {
  const cls =
    status === "qualified"
      ? "text-green-400"
      : status === "pending_visit"
        ? "text-amber-400"
        : "text-bm-muted";
  return <span className={`text-xs ${cls}`}>{labels[status]}</span>;
}

function ReferrerRow({
  summary,
  c,
  statusLabels,
}: {
  summary: ReferrerSummary;
  c: ReturnType<typeof useI18n>["t"]["crm"];
  statusLabels: Record<ReferralInviteStatus, string>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-bm-border/40 rounded-lg overflow-hidden">
      <button
        type="button"
        className="w-full flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-left hover:bg-bm-red/5"
        onClick={() => setOpen(!open)}
      >
        <div>
          <p className="font-semibold">{summary.name}</p>
          <p className="text-xs text-bm-muted font-mono">
            {summary.phone} · {c.referralCode}: {summary.code}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <span>
            {c.referralConfirmed}: <b className="text-bm-red">{summary.qualifiedCount}</b> /{" "}
            {summary.required}
          </span>
          {summary.discountAvailable && (
            <span className="text-green-400 font-bold">
              {REFERRAL_REWARD_DISCOUNT_PERCENT}% → {summary.discountExpiresAt?.slice(0, 10) ?? "—"}
            </span>
          )}
          {summary.discountUsed && (
            <span className="text-bm-muted">
              {c.referralUsed}{" "}
              {summary.discountUsedOnOrderNumber ? `(${summary.discountUsedOnOrderNumber})` : ""}
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-bm-border/30">
          {summary.referred.length === 0 ? (
            <p className="text-sm text-bm-muted pt-3">{c.referralNoReferrals}</p>
          ) : (
            <table className="dashboard-table w-full text-sm mt-3">
              <thead>
                <tr>
                  <th>{c.client}</th>
                  <th>{c.phone}</th>
                  <th>{c.date}</th>
                  <th>{c.status}</th>
                  <th>#</th>
                  <th>5%</th>
                </tr>
              </thead>
              <tbody>
                {summary.referred.map((r) => (
                  <tr key={r.userId}>
                    <td>{r.name}</td>
                    <td className="font-mono text-xs">{r.phone}</td>
                    <td>{r.referredAt?.slice(0, 10) ?? "—"}</td>
                    <td>
                      <StatusBadge status={r.status} labels={statusLabels} />
                    </td>
                    <td className="font-mono text-xs">{r.qualifyingOrderNumber ?? "—"}</td>
                    <td className="text-xs">
                      {r.inviteeDiscountUsed
                        ? c.referralGuestDiscountUsed
                        : r.inviteeDiscountAvailable
                          ? c.referralGuestDiscountAvailable
                          : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export function ReferralAdminPanel() {
  const c = useI18n().t.crm;
  const tick = useDbSync();
  const [msg, setMsg] = useState("");
  const referrers = useMemo(() => listAllReferrers(loadDb()), [tick]);

  const statusLabels: Record<ReferralInviteStatus, string> = {
    registered: c.referralStatusRegistered,
    pending_visit: c.referralStatusPending,
    qualified: c.referralStatusQualified,
  };

  const recompute = async () => {
    const db = loadDb();
    const result = recomputeAllReferrals(db);
    saveDb(db);
    const ok = await pushCrmSave(db);
    if (!ok) alert(c.syncFailed);
    setMsg(
      c.referralRecomputeDone
        .replace("{referrers}", String(result.referrersUpdated))
        .replace("{unlocked}", String(result.newlyUnlocked.length))
        .replace("{rewarded}", String(result.inviteesRewarded))
    );
  };

  const downloadCsv = () => {
    const csv = exportReferralsCsv(loadDb());
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `referrale-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <ReferralLeaderboard />
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary text-sm" onClick={() => void recompute()}>
          {c.referralRecompute}
        </button>
        <button type="button" className="btn-outline text-sm" onClick={downloadCsv}>
          {c.referralExportCsv}
        </button>
      </div>
      {msg && <p className="text-sm text-green-400">{msg}</p>}

      <div className="glass rounded-xl p-4 text-sm text-bm-silver">
        <p className="font-display uppercase text-bm-red mb-2">{c.referralRulesTitle}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{c.referralRule1}</li>
          <li>
            {c.referralRule2
              .replace("{count}", String(REFERRAL_QUALIFIED_REQUIRED))
              .replace("{percent}", String(REFERRAL_REWARD_DISCOUNT_PERCENT))
              .replace("{days}", String(REFERRAL_DISCOUNT_VALID_DAYS))}
          </li>
          <li>
            {c.referralRule3.replace("{inviteePercent}", String(REFERRAL_INVITEE_DISCOUNT_PERCENT))}
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        {referrers.length === 0 ? (
          <p className="text-bm-muted text-sm">{c.referralNoData}</p>
        ) : (
          referrers.map((s) => (
            <ReferrerRow key={s.referrerId} summary={s} c={c} statusLabels={statusLabels} />
          ))
        )}
      </div>
    </div>
  );
}
