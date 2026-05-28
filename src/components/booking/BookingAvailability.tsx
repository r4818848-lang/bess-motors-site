"use client";

import { useEffect, useState } from "react";
import { CalendarCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

type Slot = { date: string; time: string; available: boolean };

export function BookingAvailability({
  onPick,
}: {
  onPick?: (date: string, time: string) => void;
}) {
  const { t } = useI18n();
  const a = t.bookingAvailability;
  const [available, setAvailable] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/appointments/availability?days=7")
      .then((r) => r.json())
      .then((data: { available?: Slot[] }) => {
        if (!cancelled) setAvailable(data.available ?? []);
      })
      .catch(() => {
        if (!cancelled) setAvailable([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <p className="text-center text-xs text-bm-muted mb-4 animate-pulse">{a.loading}</p>
    );
  }

  if (!available.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-bm-border/50 bg-bm-card/40 p-4 mb-6">
      <div className="flex items-center gap-2 text-bm-red mb-2">
        <CalendarCheck size={18} />
        <span className="text-xs font-bold uppercase tracking-wide">{a.title}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {available.map((s) => (
          <button
            key={`${s.date}-${s.time}`}
            type="button"
            onClick={() => onPick?.(s.date, s.time)}
            className="px-3 py-1.5 rounded-lg text-xs border border-bm-red/40 bg-bm-red/10 text-white hover:bg-bm-red/25 transition-colors"
          >
            {s.date.slice(5)} · {s.time}
          </button>
        ))}
      </div>
    </div>
  );
}
