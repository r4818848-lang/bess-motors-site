"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";
import type { Database } from "@/lib/store";
import { calcClientTotal } from "@/lib/workorder-calc";
import { Card } from "@/components/ui/Card";

interface Props {
  db: Database;
  userId: string;
}

export function SpendingStats({ db, userId }: Props) {
  const { t } = useI18n();
  const w = t.wo;

  const orders = db.workOrders.filter((o) => o.userId === userId);

  const { total, byMonth, byVehicle } = useMemo(() => {
    const total = orders.reduce((s, o) => s + calcClientTotal(o), 0);
    const byMonth = new Map<string, number>();
    const byVehicle = new Map<string, number>();

    orders.forEach((o) => {
      const month = o.createdAt.slice(0, 7);
      byMonth.set(month, (byMonth.get(month) ?? 0) + calcClientTotal(o));
      byVehicle.set(o.vehicleId, (byVehicle.get(o.vehicleId) ?? 0) + calcClientTotal(o));
    });

    return { total, byMonth, byVehicle };
  }, [orders]);

  const maxMonth = Math.max(...[...byMonth.values()], 1);

  return (
    <div className="space-y-6">
      <Card glow className="text-center py-8">
        <p className="text-xs uppercase text-bm-muted tracking-widest">{w.spentTotal}</p>
        <p className="font-display text-4xl font-bold text-bm-red text-glow mt-2">
          {total.toFixed(2)} zł
        </p>
        <p className="text-sm text-bm-muted mt-2">
          {orders.length} {t.cabinet.workOrders.toLowerCase()}
        </p>
      </Card>

      {byMonth.size > 0 && (
        <div>
          <h3 className="font-display text-sm uppercase text-bm-red mb-4">{w.spentByMonth}</h3>
          <div className="space-y-3">
            {[...byMonth.entries()]
              .sort((a, b) => b[0].localeCompare(a[0]))
              .map(([month, amount], i) => (
                <div key={month}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{month}</span>
                    <span className="text-bm-red font-mono">{amount.toFixed(2)} zł</span>
                  </div>
                  <div className="h-2 bg-bm-border rounded overflow-hidden">
                    <motion.div
                      className="h-full bg-bm-red"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(amount / maxMonth) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {byVehicle.size > 0 && (
        <div>
          <h3 className="font-display text-sm uppercase text-bm-red mb-4">{w.spentByCar}</h3>
          <ul className="space-y-2">
            {[...byVehicle.entries()].map(([vid, amount]) => {
              const v = db.vehicles.find((x) => x.id === vid);
              return (
                <li key={vid} className="flex justify-between glass rounded-lg p-3 text-sm">
                  <span>
                    {v ? `${v.make} ${v.model}` : vid}
                  </span>
                  <span className="font-mono text-bm-red">{amount.toFixed(2)} zł</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
