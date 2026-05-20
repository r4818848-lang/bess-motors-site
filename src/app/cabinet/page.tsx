"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Car,
  FileText,
  Bell,
  Shield,
  DollarSign,
  Image,
  LogOut,
  CalendarDays,
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
import {
  logout as authLogout,
  restoreSessionFromToken,
  isClientAuthenticated,
} from "@/lib/auth";
import { PhoneAuthForm } from "@/components/auth/PhoneAuthForm";
import { getAppointmentContext } from "@/lib/appointments";
import { calcClientTotal } from "@/lib/workorder-calc";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AIModules } from "@/components/ai/AIModules";
import { ClientWorkOrderDetail } from "@/components/cabinet/ClientWorkOrderDetail";
import { SpendingStats } from "@/components/cabinet/SpendingStats";

const statusOrder: RepairStatus[] = [
  "received",
  "diagnostic",
  "repair",
  "waitingParts",
  "ready",
  "delivered",
];

export default function CabinetPage() {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [db, setDb] = useState<Database | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [tab, setTab] = useState("cars");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
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
    restoreSessionFromToken().finally(() => {
      refreshDb();
      setSessionReady(true);
      setMounted(true);
    });
  }, []);

  const user =
    mounted && db && isClientAuthenticated()
      ? db.users.find((u) => u.id === db.currentUserId && u.role === "client") ?? null
      : null;

  const logout = () => {
    authLogout();
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

  if (!mounted || !sessionReady || !user || !db) {
    return (
      <div className="pt-28 pb-20 min-h-[70vh] flex items-center justify-center px-4 grid-bg">
        <PhoneAuthForm variant="cabinet" onSuccess={() => refreshDb()} />
      </div>
    );
  }

  const myVehicles = db.vehicles.filter((v) => v.userId === user.id);
  const myOrders = db.workOrders.filter((o) => o.userId === user.id);
  const activeOrder = myOrders[0];
  const activeStatusIdx = activeOrder
    ? statusOrder.indexOf(activeOrder.status)
    : 0;

  const myAppointments = db.appointments
    .filter((a) => a.userId === user.id)
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));

  const tabs = [
    { id: "cars", icon: Car, label: t.cabinet.myCars },
    { id: "appointments", icon: CalendarDays, label: t.cabinet.appointments },
    { id: "orders", icon: FileText, label: t.cabinet.workOrders },
    { id: "status", icon: Bell, label: t.cabinet.liveStatus },
    { id: "warranty", icon: Shield, label: t.cabinet.warranties },
    { id: "expenses", icon: DollarSign, label: t.cabinet.expenses },
    { id: "photos", icon: Image, label: t.cabinet.photos },
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
                const ctx = getAppointmentContext(db, apt);
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
              <motion.div
                className="absolute top-4 left-0 h-0.5 bg-bm-red shadow-neon-sm"
                initial={{ width: 0 }}
                animate={{ width: `${(activeStatusIdx / (statusOrder.length - 1)) * 100}%` }}
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

        {tab === "orders" && (
          <>
            {selectedOrderId && myOrders.find((o) => o.id === selectedOrderId) ? (
              <ClientWorkOrderDetail
                order={myOrders.find((o) => o.id === selectedOrderId)!}
                db={db}
                onBack={() => setSelectedOrderId(null)}
              />
            ) : (
              <div className="space-y-4">
                {myOrders.length === 0 ? (
                  <Card glow className="text-center py-12 text-bm-muted">
                    {t.crm.noOrders}
                  </Card>
                ) : (
                  myOrders.map((order) => {
                    const vehicle = db.vehicles.find((v) => v.id === order.vehicleId);
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
                            <span className="status-pill bg-bm-red/20 text-bm-red text-[10px] mt-2 inline-block">
                              {t.repairStatus[order.status]}
                            </span>
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

        {tab === "expenses" && <SpendingStats db={db} userId={user.id} />}

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
              o.files
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
            {myOrders.every((o) => !o.files.some((f) => f.type === "image")) && (
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
