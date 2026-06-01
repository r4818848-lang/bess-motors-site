"use client";

import { useI18n } from "@/lib/i18n/context";
import type { WorkOrderListFilters } from "@/lib/workorder-filters";

type PresetLabelKey =
  | "woPresetAll"
  | "woPresetSign"
  | "woPresetUnpaidReady"
  | "woPresetSla"
  | "woPresetParts";

const presetDefs: {
  id: string;
  labelKey: PresetLabelKey;
  patch: Partial<WorkOrderListFilters>;
}[] = [
  { id: "all", labelKey: "woPresetAll", patch: { preset: "all", repairStatus: "all", paymentStatus: "all" } },
  {
    id: "unsigned",
    labelKey: "woPresetSign",
    patch: { preset: "unsigned", repairStatus: "all", paymentStatus: "all" },
  },
  {
    id: "unpaid",
    labelKey: "woPresetUnpaidReady",
    patch: { preset: "unpaid_ready", repairStatus: "all", paymentStatus: "all" },
  },
  {
    id: "sla",
    labelKey: "woPresetSla",
    patch: { preset: "sla_critical", repairStatus: "all", paymentStatus: "all" },
  },
  {
    id: "parts",
    labelKey: "woPresetParts",
    patch: { repairStatus: "waitingParts", paymentStatus: "all", preset: "all" },
  },
];

export function CrmWorkOrderPresets({
  active,
  onApply,
}: {
  active?: string;
  onApply: (patch: Partial<WorkOrderListFilters>) => void;
}) {
  const c = useI18n().t.crm;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {presetDefs.map((p) => (
        <button
          key={p.id}
          type="button"
          className={`text-xs py-1 px-3 rounded-lg border ${
            active === p.id ? "bg-bm-red border-bm-red" : "border-bm-border hover:border-bm-red"
          }`}
          onClick={() => onApply(p.patch)}
        >
          {c[p.labelKey]}
        </button>
      ))}
    </div>
  );
}
