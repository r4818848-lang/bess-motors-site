"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { getActiveWorkOrder } from "@/lib/crm-automation";
import { getQueuePosition } from "@/lib/queue-position";
import { repairProgressPercent } from "@/lib/repair-progress";
import type { Database, User } from "@/lib/store";
import { Card } from "@/components/ui/Card";

export function ActiveRepairCard({ user, db }: { user: User; db: Database }) {
  const { locale, t } = useI18n();
  const order = getActiveWorkOrder(db, user.id);
  if (!order) return null;

  const vehicle = db.vehicles.find((v) => v.id === order.vehicleId);
  const queue = getQueuePosition(db, order);
  const pct = repairProgressPercent(order.status);

  const etaLabel =
    locale === "ru" || locale === "uk"
      ? "Ориентировочно готово"
      : locale === "en"
        ? "Estimated ready"
        : "Szac. gotowe";

  const partsLabels: Record<string, string> =
    locale === "ru"
      ? { ordered: "Запчасти заказаны", in_transit: "В пути", arrived: "На месте" }
      : locale === "en"
        ? { ordered: "Parts ordered", in_transit: "In transit", arrived: "Arrived" }
        : { ordered: "Części zamówione", in_transit: "W drodze", arrived: "Dotarły" };

  const needsSign =
    order.confirmationStatus !== "confirmed" ||
    order.documentStatus === "awaiting_signature";

  return (
    <Card glow className="p-6 mb-6 border-bm-red/30">
      <p className="font-display uppercase text-sm text-bm-red mb-2">
        {locale === "ru" ? "Активный ремонт" : locale === "en" ? "Active repair" : "Aktywna naprawa"}
      </p>
      <p className="font-mono text-lg font-bold">{order.number}</p>
      {vehicle && (
        <p className="text-bm-muted text-sm mt-1">
          {vehicle.make} {vehicle.model} · {vehicle.plate}
        </p>
      )}
      <p className="mt-3 font-semibold">{t.repairStatus[order.status]}</p>
      <div className="h-2 bg-bm-border rounded-full mt-2 overflow-hidden">
        <div className="h-full bg-bm-red" style={{ width: `${pct}%` }} />
      </div>
      {order.estimatedReadyAt && (
        <p className="text-sm mt-3">
          {etaLabel}: <b>{order.estimatedReadyAt}</b>
        </p>
      )}
      {order.clientPartsStatus && (
        <p className="text-sm text-blue-400 mt-1">{partsLabels[order.clientPartsStatus]}</p>
      )}
      {queue && queue.total > 1 && (
        <p className="text-xs text-bm-muted mt-1">
          {locale === "ru"
            ? `Очередь: ~${queue.position} из ${queue.total}`
            : locale === "en"
              ? `Queue: ~${queue.position} of ${queue.total}`
              : `Kolejka: ~${queue.position} z ${queue.total}`}
        </p>
      )}
      {needsSign && (
        <Link href={`/sign/${order.id}`} className="btn-primary text-xs mt-4 inline-block">
          {locale === "ru" ? "Подписать документ" : locale === "en" ? "Sign document" : "Podpisz dokument"}
        </Link>
      )}
    </Card>
  );
}
