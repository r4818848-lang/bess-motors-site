"use client";

import { useState } from "react";
import { PenLine } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { WorkOrder, Database } from "@/lib/store";
import {
  calcServiceLine,
  calcPartLine,
  calcClientTotal,
  calcOrderDiscountAmount,
  calcSubtotal,
} from "@/lib/workorder-calc";
import { Button } from "@/components/ui/Button";
import { generateWorkOrderPdf } from "@/lib/pdf";
import { WorkOrderSignatureFlow } from "@/components/cabinet/WorkOrderSignatureFlow";
import { loadDb } from "@/lib/store";

interface Props {
  order: WorkOrder;
  db: Database;
  onBack: () => void;
}

export function ClientWorkOrderDetail({ order, db, onBack }: Props) {
  const { t } = useI18n();
  const sig = t.signature;
  const w = t.wo;
  const [showSign, setShowSign] = useState(false);
  const [localOrder, setLocalOrder] = useState(order);
  const client = db.users.find((u) => u.id === order.userId)!;
  const vehicle = db.vehicles.find((v) => v.id === order.vehicleId);
  const subtotal = calcSubtotal(localOrder);
  const discount = calcOrderDiscountAmount(localOrder);
  const total = calcClientTotal(localOrder);

  const clientFiles = localOrder.files.filter((f) => f.category !== "internal");

  if (showSign) {
    return (
      <WorkOrderSignatureFlow
        order={localOrder}
        db={db}
        onDone={() => {
          const fresh = loadDb();
          const updated = fresh.workOrders.find((o) => o.id === order.id);
          if (updated) setLocalOrder(updated);
          setShowSign(false);
        }}
        onCancel={() => setShowSign(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <button type="button" onClick={onBack} className="text-sm text-bm-red hover:underline">
        ← {t.cabinet.workOrders}
      </button>

      <div className="glass-red rounded-xl p-6 neon-border">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <p className="font-display font-bold text-xl font-mono text-bm-red">{localOrder.number}</p>
            <p className="text-sm text-bm-muted mt-1">{localOrder.createdAt}</p>
            <span className="status-pill bg-bm-red/20 text-bm-red mt-2 inline-block mr-2">
              {t.repairStatus[localOrder.status]}
            </span>
            <span
              className={`status-pill text-[10px] inline-block ${
                localOrder.confirmationStatus === "confirmed"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-amber-500/20 text-amber-400"
              }`}
            >
              {localOrder.confirmationStatus === "confirmed" ? sig.confirmed : sig.awaiting}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {localOrder.confirmationStatus !== "confirmed" && (
              <Button className="text-xs" onClick={() => setShowSign(true)}>
                <PenLine className="w-4 h-4" /> {sig.signNow}
              </Button>
            )}
            <Button
              variant="outline"
              className="text-xs"
              onClick={() => vehicle && generateWorkOrderPdf(localOrder, vehicle, client)}
            >
              {t.cabinet.downloadPdf}
            </Button>
          </div>
        </div>
        {localOrder.signature && (
          <p className="text-xs text-bm-muted mt-2">
            {sig.signedAt}: {new Date(localOrder.signature.signedAt).toLocaleString()}
          </p>
        )}

        {vehicle && (
          <p className="mt-4 text-sm">
            {vehicle.make} {vehicle.model} · {vehicle.plate}
          </p>
        )}

        {order.clientNotes && (
          <p className="mt-4 text-sm text-bm-muted border-l-2 border-bm-red pl-3">
            {order.clientNotes}
          </p>
        )}
      </div>

      <div className="glass-red rounded-xl overflow-hidden neon-border">
        <table className="dashboard-table text-sm">
          <thead>
            <tr>
              <th>Praca / Część</th>
              <th>Ilość</th>
              <th>Cena</th>
              <th>Rabat</th>
              <th>Suma</th>
            </tr>
          </thead>
          <tbody>
            {localOrder.services.map((l) => (
              <tr key={l.id}>
                <td>{l.name}</td>
                <td>{l.qty}</td>
                <td>{l.price} zł</td>
                <td>{l.discount > 0 ? `-${l.discount}%` : "—"}</td>
                <td className="text-bm-red font-mono">{calcServiceLine(l).toFixed(2)} zł</td>
              </tr>
            ))}
            {localOrder.parts.map((l) => (
              <tr key={l.id}>
                <td>{l.name}</td>
                <td>{l.qty}</td>
                <td>{l.sellPrice} zł</td>
                <td>{l.discount > 0 ? `-${l.discount}%` : "—"}</td>
                <td className="text-bm-red font-mono">{calcPartLine(l).toFixed(2)} zł</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass rounded-xl p-4 space-y-2 text-sm max-w-sm ml-auto">
        <div className="flex justify-between text-bm-muted">
          <span>Suma</span>
          <span>{subtotal.toFixed(2)} zł</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-bm-red">
            <span>{w.yourDiscount}</span>
            <span>-{discount.toFixed(2)} zł</span>
          </div>
        )}
        <div className="flex justify-between font-display font-bold text-lg border-t border-bm-border pt-2">
          <span>{w.finalPrice}</span>
          <span className="text-glow">{total.toFixed(2)} zł</span>
        </div>
      </div>

      {clientFiles.length > 0 && (
        <div>
          <h3 className="font-display text-sm uppercase text-bm-red mb-3">{t.cabinet.photos}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {clientFiles.map((f) =>
              f.dataUrl && f.type === "image" ? (
                <img
                  key={f.id}
                  src={f.dataUrl}
                  alt={f.name}
                  className="rounded-lg border border-bm-border aspect-video object-cover"
                />
              ) : (
                <div key={f.id} className="glass rounded p-3 text-xs">
                  [{f.category}] {f.name}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {order.warrantyUntil && (
        <p className="text-sm text-bm-muted">
          {t.cabinet.warranties}: do {order.warrantyUntil}
        </p>
      )}
    </div>
  );
}
