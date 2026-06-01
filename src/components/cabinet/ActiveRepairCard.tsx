"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { getActiveWorkOrder } from "@/lib/crm-automation";
import { orderNeedsClientSignature } from "@/lib/order-signature";
import { getQueuePosition } from "@/lib/queue-position";
import { repairProgressPercent } from "@/lib/repair-progress";
import type { Database, User } from "@/lib/store";
import { Card } from "@/components/ui/Card";

export function ActiveRepairCard({ user, db }: { user: User; db: Database }) {
  const { t } = useI18n();
  const a = t.activeRepair;
  const order = getActiveWorkOrder(db, user.id);
  if (!order) return null;

  const vehicle = db.vehicles.find((v) => v.id === order.vehicleId);
  const queue = getQueuePosition(db, order);
  const pct = repairProgressPercent(order.status);

  const partsLabels: Record<string, string> = {
    ordered: a.partsOrdered,
    in_transit: a.partsInTransit,
    arrived: a.partsArrived,
  };

  const needsSign = orderNeedsClientSignature(order);

  return (
    <Card glow className="p-6 mb-6 border-bm-red/30">
      <p className="font-display uppercase text-sm text-bm-red mb-2">{a.title}</p>
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
          {a.etaLabel}: <b>{order.estimatedReadyAt}</b>
        </p>
      )}
      {order.clientPartsStatus && (
        <p className="text-sm text-blue-400 mt-1">{partsLabels[order.clientPartsStatus]}</p>
      )}
      {queue && queue.total > 1 && (
        <p className="text-xs text-bm-muted mt-1">
          {a.queueLabel
            .replace("{position}", String(queue.position))
            .replace("{total}", String(queue.total))}
        </p>
      )}
      {needsSign && (
        <Link href={`/sign/${order.id}`} className="btn-primary text-xs mt-4 inline-block">
          {a.signDocument}
        </Link>
      )}
    </Card>
  );
}
