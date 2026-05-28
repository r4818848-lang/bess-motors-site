"use client";

import { useI18n } from "@/lib/i18n/context";
import type { Database, Vehicle, WorkOrder } from "@/lib/store";
import { calcClientTotal } from "@/lib/workorder-calc";
import { Card } from "@/components/ui/Card";

export function GarageCompare({
  vehicles,
  orders,
}: {
  vehicles: Vehicle[];
  orders: WorkOrder[];
}) {
  const { locale } = useI18n();
  if (vehicles.length < 2) return null;

  const title =
    locale === "ru" || locale === "uk"
      ? "Сравнение авто"
      : locale === "en"
        ? "Compare vehicles"
        : "Porównanie aut";

  return (
    <Card className="p-6 mb-6 overflow-x-auto">
      <h3 className="font-display uppercase text-sm mb-4">{title}</h3>
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="text-bm-muted text-xs uppercase">
            <th className="pb-2">Auto</th>
            <th className="pb-2">{locale === "ru" ? "Пробег" : "Mileage"}</th>
            <th className="pb-2">{locale === "ru" ? "Визитов" : "Visits"}</th>
            <th className="pb-2">{locale === "ru" ? "Сумма" : "Total"}</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v) => {
            const related = orders.filter((o) => o.vehicleId === v.id);
            const total = related.reduce((s, o) => s + calcClientTotal(o), 0);
            return (
              <tr key={v.id} className="border-t border-bm-border/30">
                <td className="py-2 font-medium">
                  {v.plate} · {v.make}
                </td>
                <td className="py-2">{v.mileage?.toLocaleString() ?? "—"} km</td>
                <td className="py-2">{related.length}</td>
                <td className="py-2">{total.toFixed(0)} zł</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
