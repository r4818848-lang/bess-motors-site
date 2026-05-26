"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Wrench,
  CalendarDays,
  Wallet,
  LogOut,
  Car,
  User,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { AppointmentCalendar } from "@/components/crm/AppointmentCalendar";
import {
  getMechanicProfileId,
  getCurrentUser,
  logout,
} from "@/lib/auth";
import { loadDb, saveDb, type RepairStatus } from "@/lib/store";
import { handleWorkOrderClientNotifications } from "@/lib/client-notifications";
import { getAppointmentContext } from "@/lib/appointments";
import { calcServiceLine, calcMechanicEarnings } from "@/lib/workorder-calc";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DB_CHANGED_EVENT } from "@/lib/db-events";

const statuses: RepairStatus[] = [
  "received",
  "diagnostic",
  "repair",
  "waitingParts",
  "ready",
  "delivered",
];

type MechTab = "tasks" | "appointments" | "salary" | "calendar";

function MechanicPageContent() {
  const { t } = useI18n();
  const m = t.mechanic;
  const w = t.wo;
  const cal = t.calendar;
  const searchParams = useSearchParams();
  const [tick, setTick] = useState(0);
  const [tab, setTab] = useState<MechTab>("tasks");

  useEffect(() => {
    const view = searchParams.get("view");
    if (view === "calendar") setTab("calendar");
  }, [searchParams]);

  useEffect(() => {
    const onDb = () => setTick((n) => n + 1);
    window.addEventListener(DB_CHANGED_EVENT, onDb);
    return () => window.removeEventListener(DB_CHANGED_EVENT, onDb);
  }, []);

  void tick;

  const mechanicId = getMechanicProfileId();
  const user = getCurrentUser();
  const db = loadDb();
  const mechProfile = mechanicId
    ? db.mechanics.find((x) => x.id === mechanicId)
    : undefined;

  const myOrders = useMemo(
    () =>
      mechanicId
        ? db.workOrders
            .filter((o) => o.mechanicId === mechanicId)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        : [],
    [db.workOrders, mechanicId]
  );

  const myAppointments = useMemo(() => {
    if (!mechanicId) return [];
    const today = new Date().toISOString().slice(0, 10);
    return db.appointments
      .filter((a) => a.mechanicId === mechanicId && a.date >= today)
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  }, [db.appointments, mechanicId]);

  const earningsByOrder = useMemo(() => {
    if (!mechProfile) return [];
    return myOrders.map((order) => ({
      order,
      earn: calcMechanicEarnings(order, db.settings, mechProfile),
    }));
  }, [myOrders, mechProfile, db.settings]);

  const totalEarnings = earningsByOrder.reduce((s, x) => s + x.earn.total, 0);

  const monthEarnings = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return earningsByOrder
      .filter(({ order }) => order.createdAt.startsWith(ym))
      .reduce((s, x) => s + x.earn.total, 0);
  }, [earningsByOrder]);

  const activeOrders = myOrders.filter((o) => o.status !== "delivered");
  const inProgress = myOrders.filter((o) => o.status === "repair");

  const updateStatus = (orderId: string, status: RepairStatus) => {
    const fresh = loadDb();
    const order = fresh.workOrders.find((o) => o.id === orderId);
    if (order) {
      const previous = { ...order };
      order.status = status;
      handleWorkOrderClientNotifications(fresh, order, previous);
      saveDb(fresh);
      setTick((n) => n + 1);
    }
  };

  const tabs: { id: MechTab; icon: typeof Wrench; label: string }[] = [
    { id: "tasks", icon: Wrench, label: m.myTasks },
    { id: "appointments", icon: CalendarDays, label: m.myAppointments },
    { id: "salary", icon: Wallet, label: m.mySalary },
    { id: "calendar", icon: CalendarDays, label: cal.title },
  ];

  if (!mechanicId || !user) return null;

  return (
    <DashboardLayout role="mechanic">
      <div className="p-6 lg:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <Link href="/" className="text-sm text-bm-muted hover:text-bm-red">
              ← {t.nav.home}
            </Link>
            <h1 className="font-display text-2xl font-bold uppercase text-glow mt-2">
              {m.title}
            </h1>
            <p className="text-bm-muted text-sm mt-1">
              {user.name} · {user.phone}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              logout();
              setTick((n) => n + 1);
            }}
          >
            <LogOut className="w-4 h-4" /> {m.logout}
          </Button>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            { label: m.activeOrders, count: activeOrders.length },
            { label: m.inProgress, count: inProgress.length },
            { label: m.appointmentsToday, count: myAppointments.length },
            { label: m.monthEarnings, count: `${monthEarnings.toFixed(2)} zł` },
          ].map((stat, i) => (
            <Card key={i} glow className="text-center py-5">
              <p className="text-xs uppercase text-bm-muted">{stat.label}</p>
              <p className="font-display text-2xl font-bold text-bm-red mt-1">{stat.count}</p>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                tab === id ? "bg-bm-red shadow-neon-sm" : "glass text-bm-muted hover:text-white"
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {tab === "calendar" && (
          <AppointmentCalendar role="mechanic" mechanicId={mechanicId} />
        )}

        {tab === "appointments" && (
          <div className="space-y-4">
            <h2 className="font-display uppercase text-bm-red">{m.myAppointments}</h2>
            {myAppointments.length === 0 ? (
              <Card glow className="text-center py-12 text-bm-muted">
                {m.noAppointments}
              </Card>
            ) : (
              myAppointments.map((apt) => {
                const ctx = getAppointmentContext(db, apt);
                return (
                  <Card key={apt.id} glow>
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <p className="font-display font-bold text-bm-red">
                          {apt.date} · {apt.time}
                        </p>
                        <p className="text-lg font-semibold mt-1 flex items-center gap-2">
                          <User className="w-4 h-4 text-bm-muted" />
                          {ctx.contact.name}
                        </p>
                        <p className="text-sm text-bm-muted">{ctx.contact.phone}</p>
                        {ctx.vehicle && (
                          <p className="text-sm text-bm-muted flex items-center gap-2 mt-1">
                            <Car className="w-4 h-4" />
                            {ctx.vehicle.make} {ctx.vehicle.model} · {ctx.vehicle.plate}
                          </p>
                        )}
                      </div>
                      <span className="status-pill bg-bm-red/20 text-bm-red h-fit">
                        {t.repairStatus[apt.repairStatus]}
                      </span>
                    </div>
                    {apt.comment && (
                      <p className="text-sm text-bm-muted mt-3 border-l-2 border-bm-border pl-3">
                        {apt.comment}
                      </p>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        )}

        {tab === "salary" && mechProfile && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Card glow className="text-center py-6">
                <p className="text-xs uppercase text-bm-muted">{m.totalEarnings}</p>
                <p className="font-display text-3xl font-bold text-amber-400 mt-2">
                  {totalEarnings.toFixed(2)} zł
                </p>
              </Card>
              <Card glow className="text-center py-6">
                <p className="text-xs uppercase text-bm-muted">{m.monthEarnings}</p>
                <p className="font-display text-3xl font-bold text-amber-400 mt-2">
                  {monthEarnings.toFixed(2)} zł
                </p>
              </Card>
              <Card glow className="text-center py-6">
                <p className="text-xs uppercase text-bm-muted">{m.myRates}</p>
                <p className="font-display text-lg font-bold text-white mt-2">
                  {w.fromLabor}: {mechProfile.laborPercent}% · {w.fromParts}:{" "}
                  {mechProfile.partsPercent}%
                </p>
                {mechProfile.bonusPerOrder > 0 && (
                  <p className="text-xs text-bm-muted mt-1">
                    {w.bonus}: +{mechProfile.bonusPerOrder} zł
                  </p>
                )}
              </Card>
            </div>

            <h2 className="font-display uppercase text-bm-red">{m.earningsBreakdown}</h2>
            <div className="space-y-4">
              {earningsByOrder.length === 0 ? (
                <Card glow className="text-center py-12 text-bm-muted">
                  {m.noOrders}
                </Card>
              ) : (
                earningsByOrder.map(({ order, earn }) => {
                  const vehicle = db.vehicles.find((v) => v.id === order.vehicleId);
                  return (
                    <Card key={order.id} glow>
                      <div className="flex flex-wrap justify-between gap-4">
                        <div>
                          <p className="font-display font-bold">{order.number}</p>
                          <p className="text-sm text-bm-muted">
                            {vehicle?.make} {vehicle?.model} · {order.createdAt.slice(0, 10)}
                          </p>
                          <span className="status-pill bg-bm-red/20 text-bm-red text-xs mt-2 inline-block">
                            {t.repairStatus[order.status]}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs uppercase text-bm-muted">{m.yourEarnings}</p>
                          <p className="font-display text-2xl font-bold text-amber-400">
                            {earn.total.toFixed(2)} zł
                          </p>
                          <p className="text-[10px] text-bm-muted mt-1">
                            {w.fromLabor}: {earn.fromLabor.toFixed(2)} ({earn.laborPercent}%) ·{" "}
                            {w.fromParts}: {earn.fromParts.toFixed(2)} ({earn.partsPercent}%)
                            {earn.bonus > 0 ? ` · ${w.bonus}: ${earn.bonus.toFixed(2)}` : ""}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}

        {tab === "tasks" && (
          <div className="space-y-6">
            <h2 className="font-display uppercase text-bm-red">{m.myTasks}</h2>
            {myOrders.length === 0 ? (
              <Card glow className="text-center py-12 text-bm-muted">
                {m.noOrders}
              </Card>
            ) : (
              myOrders.map((order) => {
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
                      </div>
                    </div>

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
              })
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function MechanicPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-28 text-center text-bm-muted min-h-[70vh] flex items-center justify-center">
          ...
        </div>
      }
    >
      <MechanicPageContent />
    </Suspense>
  );
}
