"use client";

import { useI18n } from "@/lib/i18n/context";
import { useBookingAvailability } from "@/hooks/useBookingAvailability";

const SERVICE_DAYS: Record<string, number> = {
  oil: 1,
  diagnostic: 1,
  brakePads: 2,
  tires: 1,
  default: 3,
};

export function WaitTimeEstimator({ serviceId }: { serviceId?: string }) {
  const { t } = useI18n();
  const { freeSlotCount } = useBookingAvailability(7);

  const estDays = SERVICE_DAYS[serviceId ?? ""] ?? SERVICE_DAYS.default;
  const slotsLabel = freeSlotCount === null ? "…" : String(freeSlotCount);
  const text = t.waitTime.estimate
    .replace("{days}", String(estDays))
    .replace("{slots}", slotsLabel);

  return (
    <p className="text-xs text-bm-muted border border-bm-border/40 rounded-lg px-3 py-2">{text}</p>
  );
}
