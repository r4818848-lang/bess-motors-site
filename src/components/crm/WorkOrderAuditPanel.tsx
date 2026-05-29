"use client";

import type { WorkOrder } from "@/lib/store";

export function WorkOrderAuditPanel({ order }: { order: WorkOrder }) {
  const log = order.auditLog ?? [];
  if (!log.length) return null;

  return (
    <div className="glass rounded-xl p-4 mt-4">
      <p className="text-xs uppercase text-bm-muted mb-2">Historia zmian (auto)</p>
      <ul className="text-xs space-y-1 max-h-40 overflow-y-auto font-mono">
        {[...log].reverse().map((e, i) => (
          <li key={i} className="text-bm-muted">
            <span className="text-bm-red">{e.at.slice(0, 16).replace("T", " ")}</span> · {e.field}
            {e.to ? `: ${e.from ?? "—"} → ${e.to}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
