"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BookingLink } from "@/components/analytics/BookingLink";
import { SocialContactLink } from "@/components/analytics/SocialContactLink";
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
  Activity,
  Search,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import {
  loadDb,
  saveDb,
  type Database,
  type RepairStatus,
  type Vehicle,
} from "@/lib/store";
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  maybeShowBrowserNotifications,
  requestNotificationPermission,
  getNotificationCopy,
} from "@/lib/client-notifications";
import { decodeVin, applyVinDecodeToForm } from "@/lib/vin";
import { enrichVehicleMedia } from "@/lib/vehicle-image";
import { siteConfig } from "@/lib/site";
import { normalizePhone } from "@/lib/auth";
import { linkGuestBookingsToClient } from "@/lib/link-client-bookings";
import { useAuth } from "@/lib/auth/session-context";
import { PhoneAuthForm } from "@/components/auth/PhoneAuthForm";
import { getAppointmentContext } from "@/lib/appointments";
import { calcClientTotal } from "@/lib/workorder-calc";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ClientWorkOrderDetail } from "@/components/cabinet/ClientWorkOrderDetail";
import { SpendingStats } from "@/components/cabinet/SpendingStats";
import { ServiceHistoryTimeline } from "@/components/cabinet/ServiceHistoryTimeline";
import { WorkOrderFilters } from "@/components/crm/WorkOrderFilters";
import {
  filterWorkOrders,
  defaultWorkOrderFilters,
} from "@/lib/workorder-filters";
import { getClientPaymentView } from "@/lib/payment";
import { PremiumVehicleShowcase } from "@/components/vehicle/PremiumVehicleShowcase";
import { VehicleThumbnail } from "@/components/vehicle/VehicleThumbnail";
import { VehiclePhoto } from "@/components/vehicle/VehiclePhoto";

const statusOrder: RepairStatus[] = [
  "received",
  "diagnostic",
  "repair",
  "waitingParts",
  "ready",
  "delivered",
];

const emptyVinForm = {
  vin: "",
  plate: "",
  mileage: "",
  make: "",
  model: "",
  engine: "",
  trim: "",
  power: "",
  powerKw: "",
  transmission: "",
  year: "",
  engineVolume: "",
  drivetrain: "",
  fuelType: "",
  color: "",
  colorHex: "",
};

function CabinetPageContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const { sessionReady, clientUser, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [db, setDb] = useState<Database | null>(null);
  const [tab, setTab] = useState("cars");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderFilters, setOrderFilters] = useState(defaultWorkOrderFilters);
  const [vinForm, setVinForm] = useState(emptyVinForm);
  const [vinDecoding, setVinDecoding] = useState(false);
  const [vinMessage, setVinMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const refreshDb = () => setDb(loadDb());

  useEffect(() => {
    refreshDb();
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!sessionReady || !clientUser) return;
    const fresh = loadDb();
    if (linkGuestBookingsToClient(fresh, clientUser.id, clientUser.phone)) {
      saveDb(fresh);
    }
    refreshDb();
  }, [sessionReady, clientUser]);

  useEffect(() => {
    const orderParam = searchParams.get("order");
    const tabParam = searchParams.get("tab");
    if (tabParam === "history") setTab("history");
    if (tabParam === "notifications") setTab("notifications");
    if (orderParam) {
      setTab("orders");
      setSelectedOrderId(orderParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!mounted || !sessionReady || !clientUser || !db) return;
    maybeShowBrowserNotifications(db, clientUser.id, {
      notifExt: t.notifExt,
      repairStatus: t.repairStatus,
    });
  }, [mounted, sessionReady, clientUser, db, t.notifExt, t.repairStatus]);

  const user = mounted && sessionReady ? clientUser : null;

  const logout = () => {
    signOut();
    refreshDb();
  };

  const addVehicle = () => {
    if (!db || !user) return;

    const vin = vinForm.vin.replace(/\s/g, "").toUpperCase();
    if (vin.length !== 17) {
      setVinMessage({ type: "err", text: t.cabinet.vinInvalidLength });
      return;
    }
    if (!vinForm.make.trim()) {
      setVinMessage({ type: "err", text: t.cabinet.vinDecodeFirst });
      return;
    }

    const duplicate = db.vehicles.some(
      (v) => v.userId === user.id && v.vin.replace(/\s/g, "").toUpperCase() === vin
    );
    if (duplicate) {
      setVinMessage({ type: "err", text: t.cabinet.vinAlreadyAdded });
      return;
    }

    const plate = vinForm.plate.trim() || `VIN-${vin.slice(-6)}`;

    const base: Vehicle = {
      id: `v-${Date.now()}`,
      vin,
      plate,
      mileage: Number(vinForm.mileage) || 0,
      make: vinForm.make,
      model: vinForm.model,
      engine: vinForm.engine,
      trim: vinForm.trim,
      power: vinForm.power,
      powerKw: vinForm.powerKw || undefined,
      transmission: vinForm.transmission,
      year: vinForm.year || undefined,
      engineVolume: vinForm.engineVolume || undefined,
      drivetrain: vinForm.drivetrain || undefined,
      fuelType: vinForm.fuelType || undefined,
      color: vinForm.color || undefined,
      colorHex: vinForm.colorHex || undefined,
      userId: user.id,
    };
    const vehicle = enrichVehicleMedia(base) as Vehicle;
    const fresh = loadDb();
    fresh.vehicles.push(vehicle);
    saveDb(fresh);
    setDb({ ...fresh });
    setVinForm(emptyVinForm);
    setVinMessage({ type: "ok", text: t.cabinet.carAdded });
  };

  const searchVin = async () => {
    const vin = vinForm.vin.replace(/\s/g, "").toUpperCase();
    setVinForm((f) => ({ ...f, vin }));

    if (vin.length !== 17) {
      setVinMessage({ type: "err", text: t.cabinet.vinInvalidLength });
      return;
    }

    setVinDecoding(true);
    setVinMessage(null);
    const d = await decodeVin(vin);
    setVinDecoding(false);

    if (d.found) {
      setVinForm((f) => applyVinDecodeToForm(f, d, vin) as typeof emptyVinForm);
      setVinMessage({
        type: "ok",
        text: d.model?.trim() ? t.cabinet.vinDecoded : t.cabinet.vinDecodedPartial,
      });
    } else {
      setVinMessage({ type: "err", text: t.cabinet.vinNotFound });
    }
  };

  const deleteVehicle = (vehicleId: string) => {
    if (!user) return;
    const fresh = loadDb();
    const hasOrders = fresh.workOrders.some(
      (o) => o.vehicleId === vehicleId && o.userId === user.id
    );
    const msg = hasOrders
      ? t.cabinet.confirmDeleteCarWithOrders
      : t.cabinet.confirmDeleteCar;
    if (!confirm(msg)) return;

    fresh.vehicles = fresh.vehicles.filter((v) => v.id !== vehicleId);
    saveDb(fresh);
    setDb({ ...fresh });
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
  const wo = t.wo;
  const activeOrder = myOrders[0];
  const activeStatusIdx = activeOrder
    ? statusOrder.indexOf(activeOrder.status)
    : 0;

  const userPhone = normalizePhone(user.phone);
  const myAppointments = activeDb.appointments
    .filter(
      (a) =>
        a.userId === user.id ||
        (a.userId === "guest" &&
          userPhone &&
          normalizePhone(a.clientPhone ?? "") === userPhone)
    )
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));

  const featuredVehicle =
    myVehicles.find((v) => myOrders.some((o) => o.vehicleId === v.id)) ?? myVehicles[0];

  const myNotifications = getUserNotifications(activeDb, user.id);
  const unreadCount = getUnreadNotificationCount(activeDb, user.id);

  const tabs = [
    { id: "cars", icon: Car, label: t.cabinet.myCars },
    { id: "appointments", icon: CalendarDays, label: t.cabinet.appointments },
    { id: "history", icon: History, label: t.cabinet.history },
    { id: "orders", icon: FileText, label: t.cabinet.workOrders },
    { id: "notifications", icon: Bell, label: t.cabinet.notifications, badge: unreadCount },
    { id: "status", icon: Activity, label: t.cabinet.liveStatus },
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
          {tabs.map(({ id, icon: Icon, label, badge }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                tab === id ? "bg-bm-red shadow-neon-sm" : "glass text-bm-muted hover:text-white"
              }`}
            >
              <Icon size={16} /> {label}
              {badge ? (
                <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-bm-red text-[10px] font-bold flex items-center justify-center">
                  {badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {unreadCount > 0 && tab !== "notifications" && (
          <Card
            glow
            className="mb-6 border-amber-500/40 cursor-pointer hover:border-bm-red/60"
            onClick={() => setTab("notifications")}
          >
            <p className="text-sm font-semibold text-amber-400">
              {t.cabinet.notifications}: {unreadCount}
            </p>
          </Card>
        )}

        {tab === "cars" && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6 lg:col-span-2">
              {featuredVehicle && (
                <PremiumVehicleShowcase
                  key={featuredVehicle.id}
                  vehicle={featuredVehicle}
                  animate
                  onDelete={() => deleteVehicle(featuredVehicle.id)}
                  deleteLabel={t.cabinet.deleteCar}
                />
              )}
              {myVehicles
                .filter((v) => v.id !== featuredVehicle?.id)
                .map((v) => (
                  <PremiumVehicleShowcase
                    key={v.id}
                    vehicle={v}
                    compact
                    animate={false}
                    onDelete={() => deleteVehicle(v.id)}
                    deleteLabel={t.cabinet.deleteCar}
                  />
                ))}
            </div>
            <Card glow>
              <h3 className="font-display uppercase text-bm-red mb-4">{t.cabinet.addCar}</h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    className="input-premium font-mono text-sm flex-1"
                    placeholder={t.cabinet.vin}
                    maxLength={17}
                    value={vinForm.vin}
                    onChange={(e) =>
                      setVinForm((f) => ({
                        ...f,
                        vin: e.target.value.replace(/\s/g, "").toUpperCase(),
                      }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && searchVin()}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 gap-2"
                    disabled={vinDecoding || vinForm.vin.length !== 17}
                    onClick={searchVin}
                  >
                    <Search size={16} />
                    {vinDecoding ? wo.decodingVin : wo.decodeVin}
                  </Button>
                </div>
                {vinMessage && (
                  <p
                    className={`text-xs ${vinMessage.type === "ok" ? "text-green-400" : "text-amber-400"}`}
                  >
                    {vinMessage.text}
                  </p>
                )}
                {vinForm.make.trim() && (
                  <div className="rounded-xl border border-bm-border bg-black/30 p-3">
                    <VehiclePhoto
                      vehicle={{
                        ...vinForm,
                        mileage: Number(vinForm.mileage) || 0,
                      }}
                      compact
                    />
                  </div>
                )}
                <input
                  className="input-premium"
                  placeholder={`${t.cabinet.plate} (${t.cabinet.plateOptional})`}
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
                {(
                  [
                    ["make", wo.make],
                    ["model", wo.model],
                    ["year", wo.year],
                    ["trim", wo.trim],
                    ["engine", wo.engine],
                    ["engineVolume", wo.engineVolume],
                    ["power", wo.power],
                    ["powerKw", wo.powerKw],
                    ["transmission", wo.transmission],
                    ["drivetrain", wo.drivetrain],
                    ["fuelType", wo.fuelType],
                    ["color", wo.color],
                  ] as const
                ).map(([field, label]) => (
                  <input
                    key={field}
                    className="input-premium text-sm"
                    placeholder={label}
                    value={vinForm[field]}
                    onChange={(e) =>
                      setVinForm((f) => ({ ...f, [field]: e.target.value }))
                    }
                  />
                ))}
              </div>
              <Button
                className="w-full mt-4"
                onClick={addVehicle}
                disabled={
                  vinForm.vin.replace(/\s/g, "").length !== 17 || !vinForm.make.trim()
                }
              >
                {t.cabinet.addCar}
              </Button>
            </Card>
          </div>
        )}

        {tab === "appointments" && (
          <div className="space-y-4 max-w-3xl">
            <h3 className="font-display uppercase text-bm-red">{t.calendar.visitHistory}</h3>
            {myAppointments.length === 0 ? (
              <Card glow>
                <p className="text-bm-muted text-sm">{t.crm.noBookings}</p>
                <BookingLink trackSource="cabinet" className="btn-primary inline-block mt-4 text-sm">
                  {t.booking.title}
                </BookingLink>
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
          <div className="space-y-6 max-w-3xl">
            {(() => {
              const statusVehicle = activeDb.vehicles.find((v) => v.id === activeOrder.vehicleId);
              return statusVehicle ? (
                <PremiumVehicleShowcase vehicle={statusVehicle} animate />
              ) : null;
            })()}
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
          </div>
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
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-4 min-w-0">
                            <VehicleThumbnail vehicle={vehicle} showLabel={false} />
                            <div>
                              <p className="font-display font-bold">{order.number}</p>
                              <p className="text-sm text-bm-muted">{order.createdAt}</p>
                            <span className="status-pill bg-bm-red/20 text-bm-red text-[10px] mt-2 inline-block mr-2">
                              {t.repairStatus[order.status]}
                            </span>
                            {payLabel && (
                              <span className="status-pill bg-green-500/20 text-green-400 text-[10px] inline-block">
                                {payLabel}
                              </span>
                            )}
                            </div>
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

        {tab === "notifications" && (
          <div className="space-y-4 max-w-3xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display uppercase text-bm-red">{t.cabinet.notifications}</h3>
              <div className="flex gap-2">
                {typeof Notification !== "undefined" && Notification.permission !== "granted" && (
                  <Button
                    variant="outline"
                    className="text-xs"
                    onClick={() => requestNotificationPermission()}
                  >
                    {t.notifExt.enablePush}
                  </Button>
                )}
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    className="text-xs"
                    onClick={() => {
                      const fresh = loadDb();
                      markAllNotificationsRead(fresh, user.id);
                      saveDb(fresh);
                      refreshDb();
                    }}
                  >
                    {t.notifExt.markAllRead}
                  </Button>
                )}
              </div>
            </div>
            {myNotifications.length === 0 ? (
              <Card glow className="text-center py-12 text-bm-muted">
                {t.notifExt.noNotifications}
              </Card>
            ) : (
              myNotifications.map((n) => {
                const copy = getNotificationCopy(n, activeDb, {
                  notifExt: t.notifExt,
                  repairStatus: t.repairStatus,
                });
                const order = n.workOrderId
                  ? activeDb.workOrders.find((o) => o.id === n.workOrderId)
                  : undefined;
                const titleColor =
                  copy.accent === "green"
                    ? "text-green-400"
                    : copy.accent === "amber"
                      ? "text-amber-400"
                      : copy.accent === "blue"
                        ? "text-blue-400"
                        : "text-bm-red";
                const borderColor =
                  copy.accent === "green"
                    ? "border-green-500/40"
                    : copy.accent === "amber"
                      ? "border-amber-500/40"
                      : copy.accent === "blue"
                        ? "border-blue-500/40"
                        : "border-bm-red/40";
                return (
                  <Card
                    key={n.id}
                    glow
                    className={n.read ? "opacity-70" : borderColor}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className={`font-display font-bold ${titleColor}`}>{copy.title}</p>
                        <p className="text-sm text-bm-muted mt-1">{copy.body}</p>
                        {order && (
                          <p className="text-xs font-mono text-bm-red mt-2">{order.number}</p>
                        )}
                      </div>
                      {!n.read && (
                        <Button
                          variant="outline"
                          className="text-xs shrink-0"
                          onClick={() => {
                            const fresh = loadDb();
                            markNotificationRead(fresh, n.id);
                            saveDb(fresh);
                            refreshDb();
                          }}
                        >
                          OK
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-4">
                      {copy.showReviewLink && (
                        <a
                          href={siteConfig.googleMapsReviewsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-bm-red hover:underline"
                        >
                          {t.notifExt.leaveReview}
                        </a>
                      )}
                      {copy.signHref && (
                        <Link href={copy.signHref} className="text-xs text-amber-400 hover:underline">
                          {t.notifExt.signNow}
                        </Link>
                      )}
                      {copy.orderId && (
                        <button
                          type="button"
                          className="text-xs text-bm-muted hover:text-white"
                          onClick={() => {
                            setTab("orders");
                            setSelectedOrderId(copy.orderId!);
                          }}
                        >
                          {t.notifExt.viewOrder}
                        </button>
                      )}
                      {copy.appointmentTab && (
                        <button
                          type="button"
                          className="text-xs text-bm-muted hover:text-white"
                          onClick={() => setTab("appointments")}
                        >
                          {t.notifExt.viewAppointments}
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
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
            <SocialContactLink kind="telegram" trackSource="cabinet" className="btn-outline text-xs">
              Telegram @bessmotors
            </SocialContactLink>
            <SocialContactLink kind="whatsapp" trackSource="cabinet" className="btn-outline text-xs">
              WhatsApp {siteConfig.phone}
            </SocialContactLink>
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
