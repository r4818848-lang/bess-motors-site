"use client";

import { useMemo, useState } from "react";
import { useDbSync } from "@/hooks/useDbSync";
import { loadDb, type RepairStatus, type WorkOrder } from "@/lib/store";
import { useI18n } from "@/lib/i18n/context";
import { saveWorkOrderStatusAndSync } from "@/lib/work-order-status-update";

const COLS: RepairStatus[] = [
  "received",
  "diagnostic",
  "repair",
  "waitingParts",
  "ready",
  "delivered",
];

export function WorkOrderKanban({ orders }: { orders?: import("@/lib/store").WorkOrder[] }) {
  const { t } = useI18n();
  const c = t.crm;
  const tick = useDbSync();
  const [dragId, setDragId] = useState<string | null>(null);

  const columns = useMemo(() => {
    void tick;
    const db = loadDb();
    const map = new Map<RepairStatus, WorkOrder[]>();
    for (const s of COLS) map.set(s, []);
    for (const o of orders ?? db.workOrders) {
      const list = map.get(o.status) ?? [];
      list.push(o);
      map.set(o.status, list);
    }
    return { db, map };
  }, [tick, orders]);

  const move = async (orderId: string, status: RepairStatus) => {
    const db = loadDb();
    const order = db.workOrders.find((o) => o.id === orderId);
    if (!order || order.status === status) return;
    const ok = await saveWorkOrderStatusAndSync(orderId, status);
    if (!ok) alert(c.syncFailed);
    setDragId(null);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {COLS.map((status) => {
        const list = columns.map.get(status) ?? [];
        return (
          <div
            key={status}
            className="min-w-[200px] flex-1 crm-kanban-column"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => dragId && move(dragId, status)}
          >
            <p className="text-xs uppercase font-bold text-gray-600 mb-2">
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
                    className={`crm-kanban-card cursor-grab ${sla}`}
                  >
                    <p className="font-mono font-bold text-gray-900">{o.number}</p>
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
