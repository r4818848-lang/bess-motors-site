"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { DB_CHANGED_EVENT } from "@/lib/db-events";
import { pullClientPortalFromCloud } from "@/lib/client-portal";
import type { WorkOrder } from "@/lib/store";
import { Card } from "@/components/ui/Card";

export function ExtraWorkApprovalCabinet({ orders }: { orders: WorkOrder[] }) {
  const { t } = useI18n();
  const e = t.extraWork;
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const pending = orders.filter((o) => o.pendingExtraApproval?.status === "pending");

  if (!pending.length) return null;

  const onResolve = async (orderId: string, approved: boolean) => {
    setBusy(orderId);
    setError("");
    try {
      const token = localStorage.getItem("bess-jwt");
      if (!token) {
        setError(e.title);
        return;
      }
      const res = await fetch("/api/extra-work", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, approved }),
      });
      const data = (await res.json()) as { ok?: boolean };
      if (res.ok && data.ok) {
        await pullClientPortalFromCloud();
        window.dispatchEvent(new CustomEvent(DB_CHANGED_EVENT));
        return;
      }
      setError(e.title);
    } catch {
      setError(e.title);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4 mb-6">
      {error && <p className="text-sm text-bm-red">{error}</p>}
      {pending.map((o) => {
        const p = o.pendingExtraApproval!;
        return (
          <Card key={o.id} className="p-5 border-amber-500/40">
            <p className="font-display uppercase text-sm text-amber-400 mb-2">{e.title}</p>
            <p className="font-mono text-bm-red text-sm">{o.number}</p>
            {p.note && <p className="text-sm mt-2">{p.note}</p>}
            <ul className="text-sm mt-2 space-y-1">
              {p.lines.map((l) => (
                <li key={l.id}>
                  • {l.name} — {l.price} zł
                </li>
              ))}
            </ul>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                className="btn-primary text-xs flex-1"
                disabled={busy === o.id}
                onClick={() => void onResolve(o.id, true)}
              >
                {e.approve}
              </button>
              <button
                type="button"
                className="btn-outline text-xs flex-1"
                disabled={busy === o.id}
                onClick={() => void onResolve(o.id, false)}
              >
                {e.decline}
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
