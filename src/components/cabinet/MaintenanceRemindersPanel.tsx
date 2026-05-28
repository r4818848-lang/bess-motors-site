"use client";

import { AlertCircle, CalendarClock } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { Vehicle, WorkOrder } from "@/lib/store";
import { buildMaintenanceReminders } from "@/lib/maintenance-reminders";
import { BookingLink } from "@/components/analytics/BookingLink";

type Props = {
  vehicle: Vehicle;
  workOrders: WorkOrder[];
};

export function MaintenanceRemindersPanel({ vehicle, workOrders }: Props) {
  const { locale, t } = useI18n();
  const loc = locale === "ru" || locale === "uk" ? "ru" : "pl";
  const reminders = buildMaintenanceReminders(vehicle, workOrders, loc);

  return (
    <div className="rounded-xl border border-bm-border/50 bg-bm-card/40 p-4 mt-4">
      <div className="flex items-center gap-2 text-bm-red mb-3">
        <CalendarClock size={18} />
        <h3 className="font-display text-xs uppercase font-bold">{t.maintenanceReminders.title}</h3>
      </div>
      <ul className="space-y-3">
        {reminders.map((r) => (
          <li
            key={r.id}
            className={`text-sm rounded-lg p-3 border ${
              r.priority === "soon"
                ? "border-amber-500/40 bg-amber-500/10"
                : r.priority === "upcoming"
                  ? "border-bm-border/50"
                  : "border-bm-border/30 opacity-90"
            }`}
          >
            <div className="flex gap-2 items-start">
              {r.priority !== "ok" && (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold text-white">
                  {loc === "ru" ? r.titleRu : r.titlePl}
                </p>
                <p className="text-bm-muted text-xs mt-1">
                  {loc === "ru" ? r.detailRu : r.detailPl}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <BookingLink trackSource="cabinet_reminders" className="btn-outline text-xs mt-4 inline-block">
        {t.maintenanceReminders.book}
      </BookingLink>
    </div>
  );
}
