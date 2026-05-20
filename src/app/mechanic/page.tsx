"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { AppointmentCalendar } from "@/components/crm/AppointmentCalendar";
import { loadDb, saveDb, type RepairStatus } from "@/lib/store";
import { calcServiceLine, calcMechanicEarnings } from "@/lib/workorder-calc";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const statuses: RepairStatus[] = [
  "received",
  "diagnostic",
  "repair",
  "waitingParts",
  "ready",
  "delivered",
];

function MechanicPageContent() {
  const { t } = useI18n();
  const m = t.mechanic;
  const w = t.wo;
  const searchParams = useSearchParams();
  const showCalendar = searchParams.get("view") === "calendar";
  const [mechanicId, setMechanicId] = useState("mech-1");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setTick((n) => n + 1);
  }, []);

  const db = loadDb();
  void tick;

  const mechProfile = db.mechanics.find((x) => x.id === mechanicId);
  const myOrders = db.workOrders.filter((o) => o.mechanicId === mechanicId);

  const totalEarnings = useMemo(() => {
    return myOrders.reduce((sum, order) => {
      return sum + calcMechanicEarnings(order, db.settings, mechProfile).total;
    }, 0);
  }, [myOrders, db.settings, mechProfile]);

  const updateStatus = (orderId: string, status: RepairStatus) => {
    const fresh = loadDb();
    const order = fresh.workOrders.find((o) => o.id === orderId);
    if (order) {
      order.status = status;
      saveDb(fresh);
      setTick((n) => n + 1);
    }
  };

  if (showCalendar) {
    return (
      <DashboardLayout role="mechanic">
        <div className="p-6 lg:p-10">
          <Link href="/mechanic" className="text-sm text-bm-muted hover:text-bm-red">
            ← {m.title}
          </Link>
          <h1 className="font-display text-2xl font-bold uppercase text-glow mt-4 mb-8">
            {t.calendar.mySchedule}
          </h1>
          <AppointmentCalendar role="mechanic" mechanicId={mechanicId} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="mechanic">
      <div className="p-6 lg:p-10">
        <Link href="/crm" className="text-sm text-bm-muted hover:text-bm-red">
          ← CRM
        </Link>
        <h1 className="font-display text-2xl font-bold uppercase text-glow mt-4 mb-2">
          {m.title}
        </h1>
        <select
          className="input-premium w-auto mb-8"
          value={mechanicId}
          onChange={(e) => setMechanicId(e.target.value)}
        >
          {db.mechanics.map((mech) => (
            <option key={mech.id} value={mech.id}>
              {mech.name}
            </option>
          ))}
        </select>

        <div className="grid md:grid-cols-4 gap-4 mb-10">
          {[
            { label: m.today, count: myOrders.length },
            { label: m.inProgress, count: myOrders.filter((o) => o.status === "repair").length },
            { label: m.completed, count: myOrders.filter((o) => o.status === "delivered").length },
            { label: m.totalEarnings, count: `${totalEarnings.toFixed(2)} zł` },
          ].map((stat, i) => (
            <Card key={i} glow className="text-center py-6">
              <p className="text-xs uppercase text-bm-muted">{stat.label}</p>
              <p className="font-display text-3xl font-bold text-bm-red">{stat.count}</p>
            </Card>
          ))}
        </div>

        <h2 className="font-display uppercase text-bm-red mb-4">{m.myTasks}</h2>
        <div className="space-y-6">
          {myOrders.map((order) => {
            const vehicle = db.vehicles.find((v) => v.id === order.vehicleId);
            const client = db.users.find((u) => u.id === order.userId);
            const earn = calcMechanicEarnings(order, db.settings, mechProfile);
            return (
              <Card key={order.id} glow>
                <div className="flex flex-wrap justify-between gap-4 mb-4">
                  <div>
                    <p className="font-display font-bold text-bm-red">{order.number}</p>
                    <p className="text-lg font-semibold mt-1">
                      {vehicle?.make} {vehicle?.model}
                    </p>
                    <p className="text-sm text-bm-muted">
                      {vehicle?.plate} · {client?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="status-pill bg-bm-red/20 text-bm-red h-fit inline-block mb-2">
                      {t.repairStatus[order.status]}
                    </span>
                    <p className="text-xs uppercase text-bm-muted">{m.yourEarnings}</p>
                    <p className="font-display text-xl font-bold text-amber-400">
                      {earn.total.toFixed(2)} zł
                    </p>
                    <p className="text-[10px] text-bm-muted mt-1">
                      {w.fromLabor}: {earn.fromLabor.toFixed(2)} ({earn.laborPercent}%) ·{" "}
                      {w.fromParts}: {earn.fromParts.toFixed(2)} ({earn.partsPercent}%)
                    </p>
                  </div>
                </div>

                <h3 className="text-xs uppercase text-bm-muted mb-2">{t.crm.servicesTable}</h3>
                <ul className="space-y-2 mb-4">
                  {order.services.map((s) => (
                    <li key={s.id} className="flex justify-between text-sm glass rounded p-2">
                      <span>
                        {s.name} × {s.qty}
                      </span>
                      <span className="font-mono text-bm-red">
                        {calcServiceLine(s).toFixed(2)} zł
                      </span>
                    </li>
                  ))}
                </ul>

                {order.clientNotes && (
                  <p className="text-sm text-bm-muted border-l-2 border-bm-border pl-3 mb-4">
                    {order.clientNotes}
                  </p>
                )}

                <p className="text-xs uppercase text-bm-muted mb-2">{m.updateStatus}</p>
                <div className="flex flex-wrap gap-2">
                  {statuses.map((s) => (
                    <Button
                      key={s}
                      variant={order.status === s ? "primary" : "outline"}
                      className="text-xs py-1 px-3"
                      onClick={() => updateStatus(order.id, s)}
                    >
                      {t.repairStatus[s]}
                    </Button>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function MechanicPage() {
  return (
    <Suspense fallback={<div className="pt-28 text-center text-bm-muted">...</div>}>
      <MechanicPageContent />
    </Suspense>
  );
}
