"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Car,
  FileText,
  Bell,
  Shield,
  DollarSign,
  Image as ImageIcon,
  LogOut,
  CalendarDays,
  History,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import {
  loadDb,
  saveDb,
  type Database,
  type RepairStatus,
  type Vehicle,
} from "@/lib/store";
import { decodeVin } from "@/lib/vin";
import { siteConfig } from "@/lib/site";
import { useAuth } from "@/lib/auth/session-context";
import { PhoneAuthForm } from "@/components/auth/PhoneAuthForm";
import { getAppointmentContext } from "@/lib/appointments";
import { calcClientTotal } from "@/lib/workorder-calc";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AIModules } from "@/components/ai/AIModules";
import { ClientWorkOrderDetail } from "@/components/cabinet/ClientWorkOrderDetail";
import { SpendingStats } from "@/components/cabinet/SpendingStats";
import { ServiceHistoryTimeline } from "@/components/cabinet/ServiceHistoryTimeline";
import { WorkOrderFilters } from "@/components/crm/WorkOrderFilters";
import {
  filterWorkOrders,
  defaultWorkOrderFilters,
} from "@/lib/workorder-filters";
import { getClientPaymentView } from "@/lib/payment";

const statusOrder: RepairStatus[] = [
  "received",
  "diagnostic",
  "repair",
  "waitingParts",
  "ready",
  "delivered",
];

function CabinetPageContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const { sessionReady, clientUser, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [db, setDb] = useState<Database | null>(null);
  const [tab, setTab] = useState("cars");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderFilters, setOrderFilters] = useState(defaultWorkOrderFilters);
  const [vinForm, setVinForm] = useState({
    vin: "",
    plate: "",
    mileage: "",
    make: "",
    model: "",
    engine: "",
    trim: "",
    power: "",
    transmission: "",
  });

  const refreshDb = () => setDb(loadDb());

  useEffect(() => {
    refreshDb();
    setMounted(true);
  }, []);

  useEffect(() => {
    if (sessionReady) refreshDb();
  }, [sessionReady, clientUser]);

  useEffect(() => {
    const orderParam = searchParams.get("order");
    const tabParam = searchParams.get("tab");
    if (tabParam === "history") setTab("history");
    if (orderParam) {
      setTab("orders");
      setSelectedOrderId(orderParam);
    }
  }, [searchParams]);

  const user = mounted && sessionReady ? clientUser : null;

  const logout = () => {
    signOut();
    refreshDb();
  };

  const addVehicle = () => {
    if (!db || !user) return;
    const vehicle: Vehicle = {
      id: `v-${Date.now()}`,
      vin: vinForm.vin,
      plate: vinForm.plate,
      mileage: Number(vinForm.mileage) || 0,
      make: vinForm.make,
      model: vinForm.model,
      engine: vinForm.engine,
      trim: vinForm.trim,
      power: vinForm.power,
      transmission: vinForm.transmission,
      userId: user.id,
    };
    db.vehicles.push(vehicle);
    saveDb(db);
    setDb({ ...db });
    setVinForm({
      vin: "",
      plate: "",
      mileage: "",
      make: "",
      model: "",
      engine: "",
      trim: "",
      power: "",
      transmission: "",
    });
  };

  const handleVinDecode = async (vin: string) => {
    setVinForm((f) => ({ ...f, vin }));
    const d = await decodeVin(vin);
    if (d.found) {
      setVinForm((f) => ({
        ...f,
        vin,
        make: d.make,
        model: d.model,
        engine: d.engine,
        trim: d.trim,
        power: d.power,
        transmission: d.transmission,
      }));
    }
  };

  if (!mounted || !sessionReady) {
    return (
      <div className="pt-28 pb-20 min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="h-10 w-10 rounded-full border-2 border-bm-red border-t-transparent animate-spin mx-auto" />
          <p className="mt-4 text-sm text-bm-muted">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-28 pb-20 min-h-[70vh] flex items-center justify-center px-4">
        <PhoneAuthForm onSuccess={() => refreshDb()} />
      </div>
    );
  }

  const activeDb = db ?? loadDb();

  const myVehicles = activeDb.vehicles.filter((v) => v.userId === user.id);
  const myOrders = activeDb.workOrders.filter((o) => o.userId === user.id);
  const filteredMyOrders = filterWorkOrders(myOrders, orderFilters).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  const cp = t.clientPayment;
  const activeOrder = myOrders[0];
  const activeStatusIdx = activeOrder
    ? statusOrder.indexOf(activeOrder.status)
    : 0;

  const myAppointments = activeDb.appointments
    .filter((a) => a.userId === user.id)
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));

  const tabs = [
    { id: "cars", icon: Car, label: t.cabinet.myCars },
    { id: "appointments", icon: CalendarDays, label: t.cabinet.appointments },
    { id: "history", icon: History, label: t.cabinet.history },
    { id: "orders", icon: FileText, label: t.cabinet.workOrders },
    { id: "status", icon: Bell, label: t.cabinet.liveStatus },
    { id: "warranty", icon: Shield, label: t.cabinet.warranties },
    { id: "expenses", icon: DollarSign, label: t.cabinet.expenses },
    { id: "photos", icon: ImageIcon, label: t.cabinet.photos },
  ];

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="font-display text-3xl font-bold uppercase">{t.cabinet.title}</h1>
            <p className="text-bm-muted mt-1">
              {user.name} · {user.phone}
            </p>
          </div>
          <Button variant="ghost" onClick={logout}>
            <LogOut className="w-4 h-4" /> {t.cabinet.logout}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                tab === id ? "bg-bm-red shadow-neon-sm" : "glass text-bm-muted hover:text-white"
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {tab === "cars" && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              {myVehicles.map((v) => (
                <Card key={v.id} glow>
                  <p className="font-display font-bold text-lg">
                    {v.make} {v.model}
                  </p>
                  <p className="text-sm text-bm-muted font-mono mt-1">VIN: {v.vin}</p>
                  <p className="text-sm text-bm-muted">
                    {v.plate} · {v.mileage.toLocaleString()} km
                  </p>
                  <p className="text-xs text-bm-red mt-2">
                    {v.engine} · {v.power} · {v.transmission}
                  </p>
                </Card>
              ))}
            </div>
            <Card glow>
              <h3 className="font-display uppercase text-bm-red mb-4">{t.cabinet.addCar}</h3>
              <div className="space-y-3">
                <input
                  className="input-premium font-mono text-sm"
                  placeholder={t.cabinet.vin}
                  value={vinForm.vin}
                  onChange={(e) => handleVinDecode(e.target.value)}
                />
                <input
                  className="input-premium"
                  placeholder={t.cabinet.plate}
                  value={vinForm.plate}
                  onChange={(e) => setVinForm((f) => ({ ...f, plate: e.target.value }))}
                />
                <input
                  className="input-premium"
                  placeholder={t.cabinet.mileage}
                  type="number"
                  value={vinForm.mileage}
                  onChange={(e) => setVinForm((f) => ({ ...f, mileage: e.target.value }))}
                />
                {["make", "model", "engine", "power", "transmission"].map((field) => (
                  <input
                    key={field}
                    className="input-premium text-sm"
                    placeholder={field}
                    value={vinForm[field as keyof typeof vinForm]}
                    onChange={(e) =>
                      setVinForm((f) => ({ ...f, [field]: e.target.value }))
                    }
                  />
                ))}
              </div>
              <Button className="w-full mt-4" onClick={addVehicle}>
                {t.cabinet.addCar}
              </Button>
            </Card>
            <div className="lg:col-span-2">
              <AIModules
                onVinDecoded={(data) =>
                  setVinForm((f) => ({ ...f, ...data }))
                }
              />
            </div>
          </div>
        )}

        {tab === "appointments" && (
          <div className="space-y-4 max-w-3xl">
            <h3 className="font-display uppercase text-bm-red">{t.calendar.visitHistory}</h3>
            {myAppointments.length === 0 ? (
              <Card glow>
                <p className="text-bm-muted text-sm">{t.crm.noBookings}</p>
                <Link href="/booking" className="btn-primary inline-block mt-4 text-sm">
                  {t.booking.title}
                </Link>
              </Card>
            ) : (
              myAppointments.map((apt) => {
                const ctx = getAppointmentContext(activeDb, apt);
                return (
                  <Card key={apt.id} glow>
                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <p className="font-mono text-bm-red font-bold">
                          {apt.date} · {apt.time}
                        </p>
                        <p className="font-semibold mt-1">
                          {ctx.vehicle?.make} {ctx.vehicle?.model} · {ctx.vehicle?.plate}
                        </p>
                        <p className="text-xs text-bm-muted mt-1">
                          {apt.serviceIds
                            .map((id) => t.serviceItems[id as keyof typeof t.serviceItems] ?? id)
                            .join(", ")}
                        </p>
                      </div>
                      <span className="status-pill bg-bm-red/20 text-bm-red h-fit">
                        {t.repairStatus[apt.repairStatus]}
                      </span>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {tab === "status" && activeOrder && (
          <Card glow className="max-w-3xl">
            <h3 className="font-display uppercase mb-6">{t.cabinet.liveStatus}</h3>
            <p className="text-sm text-bm-muted mb-6">Order {activeOrder.number}</p>
            <div className="flex justify-between relative">
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-bm-border" />
              <div
                className="absolute top-4 left-0 h-0.5 bg-bm-red shadow-neon-sm transition-all duration-500"
                style={{
                  width: `${(activeStatusIdx / (statusOrder.length - 1)) * 100}%`,
                }}
              />
              {statusOrder.map((s, i) => {
                const labels = t.repairStatus;
                const label = labels[s as keyof typeof labels];
                const done = i <= activeStatusIdx;
                return (
                  <div key={s} className="relative z-10 flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        done ? "bg-bm-red shadow-neon-sm" : "bg-bm-graphite border border-bm-border"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <p
                      className={`mt-2 text-[10px] uppercase text-center max-w-[70px] ${
                        done ? "text-bm-red" : "text-bm-muted"
                      }`}
                    >
                      {label}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {tab === "history" && (
          <>
            <WorkOrderFilters
              filters={orderFilters}
              onChange={setOrderFilters}
              clientMode
            />
            <ServiceHistoryTimeline
              db={activeDb}
              userId={user.id}
              orderIds={filteredMyOrders.map((o) => o.id)}
              onOpenOrder={(id) => {
                setSelectedOrderId(id);
                setTab("orders");
              }}
            />
          </>
        )}

        {tab === "orders" && (
          <>
            {selectedOrderId && myOrders.find((o) => o.id === selectedOrderId) ? (
              <ClientWorkOrderDetail
                order={myOrders.find((o) => o.id === selectedOrderId)!}
                db={activeDb}
                onBack={() => setSelectedOrderId(null)}
              />
            ) : (
              <div className="space-y-4">
                <WorkOrderFilters
                  filters={orderFilters}
                  onChange={setOrderFilters}
                  clientMode
                />
                {filteredMyOrders.length === 0 ? (
                  <Card glow className="text-center py-12 text-bm-muted">
                    {t.crm.noOrders}
                  </Card>
                ) : (
                  filteredMyOrders.map((order) => {
                    const vehicle = activeDb.vehicles.find((v) => v.id === order.vehicleId);
                    const pay = getClientPaymentView(order.paymentMethod, order.paymentStatus);
                    const payLabel =
                      pay === "card"
                        ? cp.card
                        : pay === "cash"
                          ? cp.cash
                          : pay === "mixed"
                            ? cp.mixed
                            : null;
                    return (
                      <Card
                        key={order.id}
                        glow
                        className="cursor-pointer hover:border-bm-red/60"
                        onClick={() => setSelectedOrderId(order.id)}
                      >
                        <div className="flex flex-wrap justify-between gap-4">
                          <div>
                            <p className="font-display font-bold">{order.number}</p>
                            <p className="text-sm text-bm-muted">
                              {vehicle?.make} {vehicle?.model} · {order.createdAt}
                            </p>
                            <span className="status-pill bg-bm-red/20 text-bm-red text-[10px] mt-2 inline-block mr-2">
                              {t.repairStatus[order.status]}
                            </span>
                            {payLabel && (
                              <span className="status-pill bg-green-500/20 text-green-400 text-[10px] inline-block">
                                {payLabel}
                              </span>
                            )}
                          </div>
                          <p className="font-display text-xl text-bm-red">
                            {calcClientTotal(order).toFixed(2)} zł
                          </p>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}

        {tab === "expenses" && <SpendingStats db={activeDb} userId={user.id} />}

        {tab === "warranty" && (
          <div className="space-y-4">
            {myOrders.filter((o) => o.warrantyUntil).map((o) => (
              <Card key={o.id} glow>
                <p className="font-mono text-bm-red">{o.number}</p>
                <p className="text-sm mt-2">
                  {t.cabinet.warranties} do {o.warrantyUntil}
                </p>
              </Card>
            ))}
            {myOrders.every((o) => !o.warrantyUntil) && (
              <Card glow className="text-center py-12 text-bm-muted">
                {t.cabinet.warranties}
              </Card>
            )}
          </div>
        )}

        {tab === "photos" && (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {myOrders.flatMap((o) =>
              (o.files ?? [])
                .filter((f) => f.type === "image" && f.dataUrl && f.category !== "internal")
                .map((f) => (
                  <img
                    key={f.id}
                    src={f.dataUrl}
                    alt={f.name}
                    className="rounded-xl border border-bm-border aspect-video object-cover"
                  />
                ))
            )}
            {myOrders.every((o) => !(o.files ?? []).some((f) => f.type === "image")) && (
              <Card glow className="col-span-full text-center py-12 text-bm-muted">
                {t.cabinet.photos}
              </Card>
            )}
          </div>
        )}

        <section className="mt-12">
          <h3 className="font-display text-sm uppercase text-bm-red mb-4">
            {t.integrations.telegram} / {t.integrations.whatsapp}
          </h3>
          <div className="flex gap-4">
            <a
              href="https://t.me/bessmotors"
              className="btn-outline text-xs"
              target="_blank"
              rel="noopener noreferrer"
            >
              Telegram @bessmotors
            </a>
            <a
              href="https://wa.me/48791257229"
              className="btn-outline text-xs"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp {siteConfig.phone}
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function CabinetPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-28 pb-20 min-h-[70vh] flex items-center justify-center">
          <div className="h-10 w-10 rounded-full border-2 border-bm-red border-t-transparent animate-spin" />
        </div>
      }
    >
      <CabinetPageContent />
    </Suspense>
  );
}
