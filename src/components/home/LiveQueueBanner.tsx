"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import Link from "next/link";

type QueueData = {
  activeRepairs: number;
  appointmentsToday: number;
  freeSlotsHint: "low" | "medium" | "high";
};

export function LiveQueueBanner() {
  const { t } = useI18n();
  const q = t.liveQueue;
  const [data, setData] = useState<QueueData | null>(null);

  useEffect(() => {
    fetch("/api/queue")
      .then((r) => r.json())
      .then((j) => setData(j))
      .catch(() => null);
  }, []);

  if (!data) return null;

  const load = q.load
    .replace("{repairs}", String(data.activeRepairs))
    .replace("{appointments}", String(data.appointmentsToday));

  const hint =
    data.freeSlotsHint === "low"
      ? q.hintLow
      : data.freeSlotsHint === "high"
        ? q.hintHigh
        : q.hintMedium;

  return (
    <div className="border-y border-bm-border/50 bg-bm-surface/30">
      <div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div>
          <p className="font-semibold text-bm-red">{load}</p>
          <p className="text-bm-muted text-xs mt-0.5">{hint}</p>
        </div>
        <Link href="/booking" className="text-bm-red font-bold uppercase text-xs hover:underline">
          {t.nav.booking}
        </Link>
      </div>
    </div>
  );
}
