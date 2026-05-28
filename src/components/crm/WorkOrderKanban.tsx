"use client";

import { useMemo, useState } from "react";
import { useDbSync } from "@/hooks/useDbSync";
import { loadDb, saveDb, type RepairStatus, type WorkOrder } from "@/lib/store";
import { useI18n } from "@/lib/i18n/context";
import { handleWorkOrderClientNotifications } from "@/lib/client-notifications";

const COLS: RepairStatus[] = [
  "received",
  "diagnostic",
  "repair",
  "waitingParts",
  "ready",
  "delivered",
];

export function WorkOrderKanban() {
  const { t } = useI18n();
  const tick = useDbSync();
  const [dragId, setDragId] = useState<string | null>(null);

  const columns = useMemo(() => {
    void tick;
    const db = loadDb();
    const map = new Map<RepairStatus, WorkOrder[]>();
    for (const s of COLS) map.set(s, []);
    for (const o of db.workOrders) {
      const list = map.get(o.status) ?? [];
      list.push(o);
      map.set(o.status, list);
    }
    return { db, map };
  }, [tick]);

  const move = (orderId: string, status: RepairStatus) => {
    const db = loadDb();
    const order = db.workOrders.find((o) => o.id === orderId);
    if (!order || order.status === status) return;
    const prev = { ...order };
    order.status = status;
    order.updatedAt = new Date().toISOString().slice(0, 10);
    handleWorkOrderClientNotifications(db, order, prev);
    saveDb(db);
    setDragId(null);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {COLS.map((status) => {
        const list = columns.map.get(status) ?? [];
        return (
          <div
            key={status}
            className="min-w-[200px] flex-1 glass rounded-xl p-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => dragId && move(dragId, status)}
          >
            <p className="text-xs uppercase font-bold text-bm-red mb-2">
              {t.repairStatus[status]} ({list.length})
            </p>
            <div className="space-y-2 max-h-[420px] overflow-y-auto">
              {list.map((o) => {
                const client = columns.db.users.find((u) => u.id === o.userId);
                const sla = o.slaLevel === "critical" ? "border-red-500" : o.slaLevel === "warn" ? "border-amber-500" : "border-bm-border/40";
                return (
                  <div
                    key={o.id}
                    draggable
                    onDragStart={() => setDragId(o.id)}
                    className={`p-2 rounded-lg border bg-bm-black/40 text-xs cursor-grab ${sla}`}
                  >
                    <p className="font-mono text-bm-red font-bold">{o.number}</p>
                    <p className="text-bm-muted truncate">{client?.name ?? "—"}</p>
                    {o.estimatedReadyAt && (
                      <p className="text-[10px] mt-1">ETA {o.estimatedReadyAt}</p>
                    )}
                    <select
                      className="input mt-2 w-full text-[10px] py-1"
                      value={o.status}
                      onChange={(e) => move(o.id, e.target.value as RepairStatus)}
                    >
                      {COLS.map((s) => (
                        <option key={s} value={s}>
                          {t.repairStatus[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
