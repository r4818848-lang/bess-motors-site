"use client";

import { useMemo, useState } from "react";
import { useDbSync } from "@/hooks/useDbSync";
import { loadDb, saveDb } from "@/lib/store";
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

const STATUS_LABEL: Record<ReferralInviteStatus, string> = {
  registered: "Zarejestrowany",
  pending_visit: "Był w serwisie — brak opłaconego WZ",
  qualified: "✅ Opłacony + wydany WZ",
};

function StatusBadge({ status }: { status: ReferralInviteStatus }) {
  const cls =
    status === "qualified"
      ? "text-green-400"
      : status === "pending_visit"
        ? "text-amber-400"
        : "text-bm-muted";
  return <span className={`text-xs ${cls}`}>{STATUS_LABEL[status]}</span>;
}

function ReferrerRow({ summary }: { summary: ReferrerSummary }) {
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
          <p className="text-xs text-bm-muted font-mono">{summary.phone} · kod: {summary.code}</p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <span>
            Potwierdzeni: <b className="text-bm-red">{summary.qualifiedCount}</b> / {summary.required}
          </span>
          {summary.discountAvailable && (
            <span className="text-green-400 font-bold">
              {REFERRAL_REWARD_DISCOUNT_PERCENT}% do {summary.discountExpiresAt?.slice(0, 10) ?? "—"}
            </span>
          )}
          {summary.discountUsed && (
            <span className="text-bm-muted">
              Rabat użyty {summary.discountUsedOnOrderNumber ? `(${summary.discountUsedOnOrderNumber})` : ""}
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-bm-border/30">
          {summary.referred.length === 0 ? (
            <p className="text-sm text-bm-muted pt-3">Brak poleconych klientów.</p>
          ) : (
            <table className="dashboard-table w-full text-sm mt-3">
              <thead>
                <tr>
                  <th>Klient</th>
                  <th>Telefon</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>WZ</th>
                  <th>5% gościa</th>
                </tr>
              </thead>
              <tbody>
                {summary.referred.map((r) => (
                  <tr key={r.userId}>
                    <td>{r.name}</td>
                    <td className="font-mono text-xs">{r.phone}</td>
                    <td>{r.referredAt?.slice(0, 10) ?? "—"}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="font-mono text-xs">
                      {r.qualifyingOrderNumber ?? "—"}
                    </td>
                    <td className="text-xs">
                      {r.inviteeDiscountUsed
                        ? "użyto"
                        : r.inviteeDiscountAvailable
                          ? "dostępne"
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
  const tick = useDbSync();
  const [msg, setMsg] = useState("");
  const referrers = useMemo(() => listAllReferrers(loadDb()), [tick]);

  const recompute = () => {
    const db = loadDb();
    const result = recomputeAllReferrals(db);
    saveDb(db);
    setMsg(
      `Zaktualizowano ${result.referrersUpdated} polecających. Nowe 15%: ${result.newlyUnlocked.length}. Nagrody 5%: ${result.inviteesRewarded}.`
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
        <button type="button" className="btn-primary text-sm" onClick={recompute}>
          Przelicz wszystkich
        </button>
        <button type="button" className="btn-outline text-sm" onClick={downloadCsv}>
          Export CSV
        </button>
      </div>
      {msg && <p className="text-sm text-green-400">{msg}</p>}

      <div className="glass rounded-xl p-4 text-sm text-bm-silver">
        <p className="font-display uppercase text-bm-red mb-2">Zasady programu</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Potwierdzony = <b>paid</b> + <b>delivered</b>.
          </li>
          <li>
            <b>{REFERRAL_QUALIFIED_REQUIRED}</b> potwierdzonych → <b>{REFERRAL_REWARD_DISCOUNT_PERCENT}%</b> dla
            polecającego (ważne {REFERRAL_DISCOUNT_VALID_DAYS} dni).
          </li>
          <li>
            Polecony klient → <b>{REFERRAL_INVITEE_DISCOUNT_PERCENT}%</b> po pierwszym potwierdzonym WZ.
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        {referrers.length === 0 ? (
          <p className="text-bm-muted text-sm">Brak danych referralowych.</p>
        ) : (
          referrers.map((s) => <ReferrerRow key={s.referrerId} summary={s} />)
        )}
      </div>
    </div>
  );
}
