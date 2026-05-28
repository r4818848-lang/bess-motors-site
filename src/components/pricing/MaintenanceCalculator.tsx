"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
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
  const { locale } = useI18n();
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");
  const [mileage, setMileage] = useState(String(vehicles[0]?.mileage ?? ""));

  const vehicle = vehicles.find((v) => v.id === vehicleId);
  const reminders = useMemo(() => {
    if (!vehicle) return [];
    const v = { ...vehicle, mileage: Number(mileage) || vehicle.mileage };
    const loc = locale === "ru" || locale === "uk" ? "ru" : "pl";
    return buildMaintenanceReminders(v, workOrders, loc);
  }, [vehicle, mileage, workOrders, locale]);

  const title =
    locale === "ru" || locale === "uk"
      ? "Калькулятор ТО"
      : locale === "en"
        ? "Maintenance planner"
        : "Kalkulator serwisu";

  if (!vehicles.length) return null;

  return (
    <Card className="p-6 mt-8">
      <h3 className="font-display uppercase text-sm mb-4">{title}</h3>
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
          placeholder={locale === "pl" ? "Przebieg km" : locale === "en" ? "Mileage km" : "Пробег км"}
        />
      </div>
      <ul className="space-y-3 text-sm">
        {reminders.length === 0 ? (
          <li className="text-bm-muted">
            {locale === "pl" ? "Na ten moment brak pilnych zaleceń." : locale === "en" ? "No urgent items." : "Срочных рекомендаций нет."}
          </li>
        ) : (
          reminders.map((r) => (
            <li key={r.id} className="border-l-2 border-bm-red pl-3">
              <p className="font-medium">{locale === "ru" || locale === "uk" ? r.titleRu : r.titlePl}</p>
              <p className="text-bm-muted text-xs mt-1">
                {locale === "ru" || locale === "uk" ? r.detailRu : r.detailPl}
              </p>
            </li>
          ))
        )}
      </ul>
      <BookingLink className="inline-block mt-4 text-bm-red text-sm font-semibold hover:underline">
        {locale === "pl" ? "Umów wizytę" : locale === "en" ? "Book visit" : "Записаться"}
      </BookingLink>
    </Card>
  );
}
