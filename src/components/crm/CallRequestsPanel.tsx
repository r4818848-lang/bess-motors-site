"use client";

import { useState } from "react";
import { Phone, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { loadDb, saveDb, type CallRequest } from "@/lib/store";
import { saveDbAndPushCrm } from "@/lib/cloud-crm-db";
import { formatDisplayDateTime } from "@/lib/display-date";
import { Button } from "@/components/ui/Button";

export function CallRequestsPanel({ onUpdate }: { onUpdate?: () => void }) {
  const { t } = useI18n();
  const c = t.crm;
  const [tick, setTick] = useState(0);
  const db = loadDb();
  void tick;

  const requests = [...db.callRequests].sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt)
  );

  const setStatus = async (id: string, status: CallRequest["status"]) => {
    const next = loadDb();
    const r = next.callRequests.find((x) => x.id === id);
    if (r) r.status = status;
    const ok = await saveDbAndPushCrm(next);
    if (!ok) return;
    setTick((n) => n + 1);
    onUpdate?.();
  };

  if (!requests.length) return null;

  return (
    <section className="glass-red rounded-xl overflow-hidden neon-border">
      <div className="px-4 py-3 border-b border-bm-border bg-bm-red/10 font-display text-sm uppercase font-bold flex items-center gap-2">
        <Phone size={16} />
        {c.callRequests}
      </div>
      <div className="divide-y divide-bm-border/50">
        {requests.map((r) => (
          <div key={r.id} className="p-4 flex flex-wrap gap-4 justify-between items-start">
            <div>
              <p className="font-semibold text-white">{r.clientName || "—"}</p>
              <p className="font-mono text-bm-red font-bold mt-1">{r.phone}</p>
              <p className="text-sm mt-1">{r.serviceLabel}</p>
              <p className="text-xs text-bm-muted mt-1">
                {formatDisplayDateTime(r.createdAt)} · {c.callStatus[r.status]}
              </p>
              {r.comment && (
                <p className="text-xs text-bm-muted mt-2 italic">{r.comment}</p>
              )}
            </div>
            {r.status === "needs_call" && (
              <Button
                variant="outline"
                className="text-xs"
                onClick={() => setStatus(r.id, "called")}
              >
                <Check size={14} /> {c.markCalled}
              </Button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
