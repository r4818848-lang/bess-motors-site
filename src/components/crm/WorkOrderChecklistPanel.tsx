"use client";

import { useI18n } from "@/lib/i18n/context";
import {
  checklistLabel,
  deliveryChecklistItems,
  receptionChecklistItems,
} from "@/lib/reception-checklist";
import type { WorkOrder } from "@/lib/store";

export function WorkOrderChecklistPanel({
  order,
  onChange,
}: {
  order: WorkOrder;
  onChange: (patch: Partial<WorkOrder>) => void;
}) {
  const { locale } = useI18n();

  const toggle = (
    kind: "reception" | "delivery",
    id: string
  ) => {
    const key = kind === "reception" ? "receptionChecklist" : "deliveryChecklist";
    const prev = (order[key] ?? {}) as Record<string, boolean>;
    onChange({ [key]: { ...prev, [id]: !prev[id] } });
  };

  return (
    <div className="grid md:grid-cols-2 gap-4 mt-4">
      <div className="glass rounded-xl p-4">
        <p className="text-xs uppercase text-bm-red mb-2">Przyjęcie</p>
        {receptionChecklistItems.map((item) => (
          <label key={item.id} className="flex items-center gap-2 text-sm mb-1 cursor-pointer">
            <input
              type="checkbox"
              checked={!!order.receptionChecklist?.[item.id]}
              onChange={() => toggle("reception", item.id)}
            />
            {checklistLabel(item, locale)}
          </label>
        ))}
      </div>
      <div className="glass rounded-xl p-4">
        <p className="text-xs uppercase text-bm-red mb-2">Wydanie</p>
        {deliveryChecklistItems.map((item) => (
          <label key={item.id} className="flex items-center gap-2 text-sm mb-1 cursor-pointer">
            <input
              type="checkbox"
              checked={!!order.deliveryChecklist?.[item.id]}
              onChange={() => toggle("delivery", item.id)}
            />
            {checklistLabel(item, locale)}
          </label>
        ))}
      </div>
    </div>
  );
}
