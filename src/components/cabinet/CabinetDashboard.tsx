"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import type { Database, User, WorkOrder, Appointment, Vehicle } from "@/lib/store";
import { calcClientTotal } from "@/lib/workorder-calc";
import { repairProgressPercent } from "@/lib/repair-progress";
import { Card } from "@/components/ui/Card";
import { TelegramOpenButton } from "@/components/shared/TelegramOpenButton";
import { BookingLink } from "@/components/analytics/BookingLink";

export function CabinetDashboard({
  user,
  db,
  orders,
  appointments,
  vehicles,
  unreadNotifications,
  onOpenTab,
}: {
  user: User;
  db: Database;
  orders: WorkOrder[];
  appointments: Appointment[];
  vehicles: Vehicle[];
  unreadNotifications: number;
  onOpenTab: (tab: string) => void;
}) {
  const { t } = useI18n();
  const active = [...orders]
    .filter((o) => o.status !== "delivered")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const nextApt = [...appointments]
    .filter((a) => a.date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0];
  const warrantyCount = orders.filter((o) => o.warrantyUntil).length;
  const photoCount = orders.reduce(
    (n, o) => n + o.files.filter((f) => f.category !== "internal").length,
    0
  );
  const referralCode = user.referralCode?.trim();

  return (
    <Card className="p-6 mb-8 border-bm-red/30">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <h2 className="font-display text-lg uppercase">{t.cabinet.dashboardTitle}</h2>
        {referralCode ? <TelegramOpenButton startParam={`ref_${referralCode}`} /> : null}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <button type="button" onClick={() => onOpenTab("orders")} className="text-left rounded-lg border border-bm-border/50 p-4 hover:border-bm-red/50">
          <p className="text-xs text-bm-muted uppercase">{t.cabinet.workOrders}</p>
          <p className="text-2xl font-bold text-bm-red mt-1">{orders.length}</p>
        </button>
        <button type="button" onClick={() => onOpenTab("appointments")} className="text-left rounded-lg border border-bm-border/50 p-4 hover:border-bm-red/50">
          <p className="text-xs text-bm-muted uppercase">{t.cabinet.appointments}</p>
          <p className="text-2xl font-bold mt-1">{appointments.length}</p>
        </button>
        <button type="button" onClick={() => onOpenTab("photos")} className="text-left rounded-lg border border-bm-border/50 p-4 hover:border-bm-red/50">
          <p className="text-xs text-bm-muted uppercase">{t.cabinet.photos}</p>
          <p className="text-2xl font-bold mt-1">{photoCount}</p>
        </button>
        <button type="button" onClick={() => onOpenTab("warranty")} className="text-left rounded-lg border border-bm-border/50 p-4 hover:border-bm-red/50">
          <p className="text-xs text-bm-muted uppercase">{t.cabinet.warranties}</p>
          <p className="text-2xl font-bold mt-1">{warrantyCount}</p>
        </button>
      </div>

      {active ? (
        <div className="rounded-lg bg-bm-surface/50 p-4 mb-4">
          <p className="text-sm text-bm-muted mb-2">{t.cabinet.liveStatus}</p>
          <p className="font-bold">{active.number}</p>
          <p className="text-sm mt-1">
            {t.repairStatus[active.status]} · {repairProgressPercent(active.status)}% ·{" "}
            <b>{calcClientTotal(active).toFixed(2)} zł</b>
          </p>
          <button type="button" className="text-bm-red text-sm mt-2 underline" onClick={() => onOpenTab("status")}>
            {t.cabinet.detailsLink}
          </button>
        </div>
      ) : null}

      {nextApt ? (
        <p className="text-sm text-bm-muted mb-4">
          📅 {nextApt.date} {nextApt.time}
        </p>
      ) : null}

      {unreadNotifications > 0 ? (
        <button type="button" onClick={() => onOpenTab("notifications")} className="text-amber-400 text-sm mb-4 block">
          🔔 {unreadNotifications} {t.cabinet.notifications}
        </button>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <BookingLink className="btn-primary text-sm px-4 py-2 rounded-lg">{t.nav.booking}</BookingLink>
        <Link href="/status" className="text-sm text-bm-muted hover:text-bm-red">
          {t.cabinet.statusWithoutLogin}
        </Link>
      </div>
    </Card>
  );
}
