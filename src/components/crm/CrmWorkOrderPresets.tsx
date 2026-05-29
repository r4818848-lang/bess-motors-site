"use client";

import type { WorkOrderListFilters } from "@/lib/workorder-filters";

const presets: { id: string; label: string; patch: Partial<WorkOrderListFilters> }[] = [
  { id: "all", label: "Wszystkie", patch: { preset: "all", repairStatus: "all", paymentStatus: "all" } },
  { id: "unsigned", label: "Podpis", patch: { preset: "unsigned" } },
  { id: "unpaid", label: "Nieopłacone (gotowe)", patch: { preset: "unpaid_ready" } },
  { id: "sla", label: "SLA ⚠", patch: { preset: "sla_critical" } },
  { id: "parts", label: "Części", patch: { repairStatus: "waitingParts", preset: "all" } },
];

export function CrmWorkOrderPresets({
  active,
  onApply,
}: {
  active?: string;
  onApply: (patch: Partial<WorkOrderListFilters>) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {presets.map((p) => (
        <button
          key={p.id}
          type="button"
          className={`text-xs py-1 px-3 rounded-lg border ${
            active === p.id ? "bg-bm-red border-bm-red" : "border-bm-border hover:border-bm-red"
          }`}
          onClick={() => onApply(p.patch)}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
