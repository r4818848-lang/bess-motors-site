"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { getQueuePosition } from "@/lib/queue-position";
import { repairProgressPercent } from "@/lib/repair-progress";
import { orderNeedsClientSignature } from "@/lib/order-signature";
import type { Database, WorkOrder } from "@/lib/store";
import { Card } from "@/components/ui/Card";
import { RepairStatusStepper } from "@/components/cabinet/RepairStatusStepper";

export function ClientLiveStatusPanel({
  order,
  db,
}: {
  order: WorkOrder;
  db: Database;
}) {
  const { t } = useI18n();
  const ps = t.paymentStatus;
  const vehicle = db.vehicles.find((v) => v.id === order.vehicleId);
  const queue = getQueuePosition(db, order);
  const pct = repairProgressPercent(order.status);

  const partsLabels: Record<string, string> = {
    ordered: t.activeRepair.partsOrdered,
    in_transit: t.activeRepair.partsInTransit,
    arrived: t.activeRepair.partsArrived,
  };

  const needsSign = orderNeedsClientSignature(order);

  const pay = order.paymentStatus ?? "unpaid";
  const payLabel = pay === "paid" ? ps.paid : ps.unpaid;

  return (
    <div className="space-y-4 max-w-3xl">
      <Card glow className="p-6">
        <p className="font-mono text-lg font-bold text-bm-red">{order.number}</p>
        {vehicle && (
          <p className="text-bm-muted text-sm mt-1">
            {vehicle.make} {vehicle.model} · {vehicle.plate}
          </p>
        )}
        <p className="mt-4 text-lg font-semibold">{t.repairStatus[order.status]}</p>
        <div className="h-2 bg-bm-border rounded-full mt-3 overflow-hidden">
          <div className="h-full bg-bm-red transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-bm-muted mt-2">
          {t.cabinet.repairProgress}: {pct}%
        </p>
        {order.estimatedReadyAt && (
          <p className="text-sm mt-3">
            {t.activeRepair.etaLabel}: <b>{order.estimatedReadyAt}</b>
          </p>
        )}
        {order.clientPartsStatus && (
          <p className="text-sm text-blue-400 mt-2">
            {partsLabels[order.clientPartsStatus]}
          </p>
        )}
        {queue && queue.total > 1 && (
          <p className="text-xs text-bm-muted mt-2">
            {t.activeRepair.queueLabel
              .replace("{position}", String(queue.position))
              .replace("{total}", String(queue.total))}
          </p>
        )}
        <p className="text-sm mt-3 text-bm-silver">
          {payLabel}
        </p>
        {needsSign && (
          <Link href={`/sign/${order.id}`} className="btn-primary text-xs mt-4 inline-block">
            {t.activeRepair.signDocument}
          </Link>
        )}
      </Card>
      <RepairStatusStepper status={order.status} />
    </div>
  );
}
