"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { contentLocale } from "@/lib/i18n/locale-utils";
import type { Vehicle, WorkOrder } from "@/lib/store";
import { buildMaintenanceReminders } from "@/lib/maintenance-reminders";
import { BookingLink } from "@/components/analytics/BookingLink";
import { Card } from "@/components/ui/Card";

export function MaintenanceCalculator({
  vehicles,
  workOrders,
}: {
  vehicles: Vehicle[];
  workOrders: WorkOrder[];
}) {
  const { locale, t } = useI18n();
  const m = t.maintenanceCalc;
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");
  const [mileage, setMileage] = useState(String(vehicles[0]?.mileage ?? ""));

  const vehicle = vehicles.find((v) => v.id === vehicleId);
  const loc = contentLocale(locale);
  const reminders = useMemo(() => {
    if (!vehicle) return [];
    const v = { ...vehicle, mileage: Number(mileage) || vehicle.mileage };
    return buildMaintenanceReminders(v, workOrders, loc);
  }, [vehicle, mileage, workOrders, loc]);

  if (!vehicles.length) return null;

  return (
    <Card className="p-6 mt-8">
      <h3 className="font-display uppercase text-sm mb-4">{m.title}</h3>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <select className="input text-sm" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.make} {v.model} · {v.plate}
            </option>
          ))}
        </select>
        <input
          className="input text-sm"
          type="number"
          value={mileage}
          onChange={(e) => setMileage(e.target.value)}
          placeholder={m.mileagePlaceholder}
        />
      </div>
      <ul className="space-y-3 text-sm">
        {reminders.length === 0 ? (
          <li className="text-bm-muted">{m.noUrgent}</li>
        ) : (
          reminders.map((r) => (
            <li key={r.id} className="border-l-2 border-bm-red pl-3">
              <p className="font-medium">{loc === "ru" ? r.titleRu : r.titlePl}</p>
              <p className="text-bm-muted text-xs mt-1">{loc === "ru" ? r.detailRu : r.detailPl}</p>
            </li>
          ))
        )}
      </ul>
      <BookingLink className="inline-block mt-4 text-bm-red text-sm font-semibold hover:underline">
        {m.bookVisit}
      </BookingLink>
    </Card>
  );
}

