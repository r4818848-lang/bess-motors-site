"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useDbSync } from "@/hooks/useDbSync";
import { loadDb } from "@/lib/store";
import { useI18n } from "@/lib/i18n/context";
import { Card } from "@/components/ui/Card";
import { displayOrderTotal } from "@/lib/crm-display-price";
import { staffCrmFetch } from "@/lib/crm-staff-fetch";
import type { SupplierConnectionPublic } from "@/lib/suppliers/types";

export function CrmTodayPanel() {
  const { t } = useI18n();
  const c = t.crm;
  const tick = useDbSync();
  const [suppliers, setSuppliers] = useState<SupplierConnectionPublic[]>([]);
  useEffect(() => {
    void staffCrmFetch("/api/crm/suppliers/connections").then(async (res) => {
      if (!res?.ok) return;
      const json = (await res.json()) as { connections: SupplierConnectionPublic[] };
      setSuppliers(json.connections || []);
    });
  }, [tick]);
  const data = useMemo(() => {
    void tick;
    const db = loadDb();
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const vatRate = db.settings.vatRate ?? 23;
    const apts = db.appointments.filter(
      (a) => a.date === today && a.appointmentStatus !== "cancelled"
    );
    const aptsTomorrow = db.appointments.filter(
      (a) => a.date === tomorrow && a.appointmentStatus !== "cancelled"
    );
    const active = db.workOrders.filter(
      (o) => o.status !== "delivered" && o.status !== "cancelled"
    );
    const waitingParts = db.workOrders.filter(
      (o) => o.status === "waitingParts" || o.status === "partsOrdered"
    );
    const doneToday = db.workOrders.filter(
      (o) =>
        (o.completedAt || o.updatedAt || "").startsWith(today) &&
        (o.status === "delivered" || o.status === "ready")
    );
    const revenueToday = doneToday.reduce(
      (s, o) => s + displayOrderTotal(o, "gross", vatRate),
      0
    );
    const unsigned = db.workOrders.filter(
      (o) =>
        o.confirmationStatus !== "confirmed" ||
        o.documentStatus === "awaiting_signature"
    );
    const unpaid = db.workOrders.filter(
      (o) => o.paymentStatus !== "paid" && o.status === "ready"
    );
    const critical = db.workOrders.filter((o) => o.slaLevel === "critical");
    const ready = db.workOrders.filter((o) => o.status === "ready");
    return {
      apts,
      aptsTomorrow,
      active: active.length,
      waitingParts: waitingParts.length,
      revenueToday,
      doneToday: doneToday.length,
      unsigned,
      unpaid,
      critical,
      ready,
      today,
    };
  }, [tick]);

  return (
    <div className="space-y-4 mb-8">
      <h2 className="font-display uppercase text-lg">
        {c.todayTitle} · {data.today}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card className="p-4 text-center">
          <p className="text-[10px] uppercase text-bm-muted">{c.appointmentsToday}</p>
          <p className="text-2xl font-bold text-bm-red">{data.apts.length}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-[10px] uppercase text-bm-muted">{c.activeOrders}</p>
          <p className="text-2xl font-bold">{data.active}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-[10px] uppercase text-bm-muted">Ожидают запчастей</p>
          <p className="text-2xl font-bold text-amber-400">{data.waitingParts}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-[10px] uppercase text-bm-muted">Выручка сегодня</p>
          <p className="text-xl font-bold text-green-400">{data.revenueToday.toFixed(0)} zł</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-[10px] uppercase text-bm-muted">Готово сегодня</p>
          <p className="text-2xl font-bold">{data.doneToday}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-[10px] uppercase text-bm-muted">Записи на завтра</p>
          <p className="text-2xl font-bold">{data.aptsTomorrow.length}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-[10px] uppercase text-bm-muted">{c.readyCount}</p>
          <p className="text-2xl font-bold text-green-400">{data.ready.length}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-[10px] uppercase text-bm-muted">SLA</p>
          <p className="text-2xl font-bold text-red-400">{data.critical.length}</p>
        </Card>
      </div>
      {suppliers.length > 0 && (
        <Card className="p-4">
          <p className="text-xs uppercase text-bm-muted mb-2">Статусы поставщиков</p>
          <ul className="text-sm flex flex-wrap gap-3">
            {suppliers.map((s) => (
              <li key={s.supplierId}>
                <b>{s.displayName}</b>: {s.status}
              </li>
            ))}
          </ul>
          <Link href="/crm?tab=settings" className="text-xs text-bm-red mt-2 inline-block">
            Настройки подключений →
          </Link>
        </Card>
      )}
      {data.apts.length > 0 && (
        <Card className="p-4">
          <p className="text-xs uppercase text-bm-muted mb-2">{c.todaySchedule}</p>
          <ul className="text-sm space-y-1">
            {data.apts.slice(0, 8).map((a) => (
              <li key={a.id}>
                <b>{a.time}</b> — {a.clientName ?? "—"} · {a.clientPhone ?? ""}
              </li>
            ))}
          </ul>
          <Link href="/crm/appointments" className="text-xs text-bm-red mt-2 inline-block">
            {c.allAppointmentsLink}
          </Link>
        </Card>
      )}
    </div>
  );
}
