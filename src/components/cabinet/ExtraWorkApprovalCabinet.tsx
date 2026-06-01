"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { DB_CHANGED_EVENT } from "@/lib/db-events";
import { pullClientPortalFromCloud } from "@/lib/client-portal";
import { loadDb, saveDb, type Database, type WorkOrder } from "@/lib/store";
import { calcClientTotal } from "@/lib/workorder-calc";
import { Card } from "@/components/ui/Card";

function resolveLocal(db: Database, orderId: string, approved: boolean): boolean {
  const order = db.workOrders.find((o) => o.id === orderId);
  const pending = order?.pendingExtraApproval;
  if (!order || !pending || pending.status !== "pending") return false;
  if (approved) {
    order.services = [...order.services, ...pending.lines];
    pending.status = "approved";
  } else {
    pending.status = "rejected";
  }
  order.updatedAt = new Date().toISOString().slice(0, 10);
  order.lastNotifiedClientTotal = calcClientTotal(order);
  saveDb(db);
  return true;
}

export function ExtraWorkApprovalCabinet({ orders }: { orders: WorkOrder[] }) {
  const { t } = useI18n();
  const e = t.extraWork;
  const [busy, setBusy] = useState<string | null>(null);
  const pending = orders.filter((o) => o.pendingExtraApproval?.status === "pending");

  if (!pending.length) return null;

  const onResolve = async (orderId: string, approved: boolean) => {
    setBusy(orderId);
    try {
      const token = localStorage.getItem("bess-jwt");
      const res = await fetch("/api/extra-work", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ orderId, approved }),
      });
      if (res.ok) {
        await pullClientPortalFromCloud();
        window.dispatchEvent(new CustomEvent(DB_CHANGED_EVENT));
        return;
      }
      const db = loadDb();
      resolveLocal(db, orderId, approved);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4 mb-6">
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
