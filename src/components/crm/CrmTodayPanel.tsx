"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useDbSync } from "@/hooks/useDbSync";
import { loadDb } from "@/lib/store";
import { Card } from "@/components/ui/Card";

export function CrmTodayPanel() {
  const tick = useDbSync();
  const data = useMemo(() => {
    void tick;
    const db = loadDb();
    const today = new Date().toISOString().slice(0, 10);
    const apts = db.appointments.filter(
      (a) => a.date === today && a.appointmentStatus !== "cancelled"
    );
    const active = db.workOrders.filter((o) => o.status !== "delivered");
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
    return { apts, active: active.length, unsigned, unpaid, critical, ready, today };
  }, [tick]);

  return (
    <div className="space-y-4 mb-8">
      <h2 className="font-display uppercase text-lg">Dziś · {data.today}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="p-4 text-center">
          <p className="text-[10px] uppercase text-bm-muted">Wizyty</p>
          <p className="text-2xl font-bold text-bm-red">{data.apts.length}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-[10px] uppercase text-bm-muted">Aktywne WZ</p>
          <p className="text-2xl font-bold">{data.active}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-[10px] uppercase text-bm-muted">Gotowe</p>
          <p className="text-2xl font-bold text-green-400">{data.ready.length}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-[10px] uppercase text-bm-muted">Podpisy</p>
          <p className="text-2xl font-bold text-amber-400">{data.unsigned.length}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-[10px] uppercase text-bm-muted">Nieopłacone</p>
          <p className="text-2xl font-bold">{data.unpaid.length}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-[10px] uppercase text-bm-muted">SLA ⚠</p>
          <p className="text-2xl font-bold text-red-400">{data.critical.length}</p>
        </Card>
      </div>
      {data.apts.length > 0 && (
        <Card className="p-4">
          <p className="text-xs uppercase text-bm-muted mb-2">Harmonogram</p>
          <ul className="text-sm space-y-1">
            {data.apts.slice(0, 8).map((a) => (
              <li key={a.id}>
                <b>{a.time}</b> — {a.clientName ?? "—"} · {a.clientPhone ?? ""}
              </li>
            ))}
          </ul>
          <Link href="/crm/appointments" className="text-xs text-bm-red mt-2 inline-block">
            Wszystkie wizyty →
          </Link>
        </Card>
      )}
    </div>
  );
}
