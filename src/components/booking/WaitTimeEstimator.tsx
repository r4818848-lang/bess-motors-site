"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

const SERVICE_DAYS: Record<string, number> = {
  oil: 1,
  diagnostic: 1,
  brakePads: 2,
  tires: 1,
  default: 3,
};

export function WaitTimeEstimator({ serviceId }: { serviceId?: string }) {
  const { locale } = useI18n();
  const [slots, setSlots] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/appointments/availability")
      .then((r) => r.json())
      .then((data) => {
        const days = data?.days as { date: string; slots: string[] }[] | undefined;
        if (!days) return;
        const free = days.reduce((n, d) => n + (d.slots?.length ?? 0), 0);
        setSlots(free);
      })
      .catch(() => setSlots(null));
  }, []);

  const estDays = SERVICE_DAYS[serviceId ?? ""] ?? SERVICE_DAYS.default;
  const text =
    locale === "ru" || locale === "uk"
      ? `Ориентир: ближайшая запись ~${estDays} дн. · свободных слотов: ${slots ?? "…"}`
      : locale === "en"
        ? `Estimate: next slot ~${estDays} day(s) · free slots: ${slots ?? "…"}`
        : `Szacunek: najbliższy termin ~${estDays} dni · wolne sloty: ${slots ?? "…"}`;

  return (
    <p className="text-xs text-bm-muted border border-bm-border/40 rounded-lg px-3 py-2">{text}</p>
  );
}
