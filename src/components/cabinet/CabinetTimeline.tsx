"use client";

import { useMemo } from "react";
import { useI18n } from "@/lib/i18n/context";
import { buildClientTimeline } from "@/lib/client-timeline";
import type { Database } from "@/lib/store";
import { Card } from "@/components/ui/Card";

export function CabinetTimeline({ db, userId, onOpenOrder }: { db: Database; userId: string; onOpenOrder?: (id: string) => void }) {
  const { locale } = useI18n();
  const loc = locale === "ru" || locale === "uk" ? "ru" : locale === "en" ? "en" : "pl";
  const events = useMemo(() => buildClientTimeline(db, userId, loc), [db, userId, loc]);

  const title =
    locale === "ru" || locale === "uk"
      ? "Лента событий"
      : locale === "en"
        ? "Activity"
        : "Oś czasu";

  if (!events.length) return null;

  return (
    <Card className="p-6 mb-8">
      <h3 className="font-display uppercase text-sm mb-4">{title}</h3>
      <ul className="space-y-3 max-h-80 overflow-y-auto">
        {events.map((e) => (
          <li key={e.id} className="flex gap-3 text-sm border-l-2 border-bm-red/40 pl-3">
            <div className="flex-1">
              <p className="font-medium">{e.title}</p>
              {e.detail ? <p className="text-bm-muted text-xs">{e.detail}</p> : null}
              <p className="text-[10px] text-bm-muted mt-1">{e.at.slice(0, 16).replace("T", " ")}</p>
            </div>
            {e.href?.startsWith("orders:") && onOpenOrder ? (
              <button
                type="button"
                className="text-bm-red text-xs"
                onClick={() => onOpenOrder(e.href!.slice(7))}
              >
                →
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}
