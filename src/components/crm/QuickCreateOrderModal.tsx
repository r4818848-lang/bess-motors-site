"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Wrench } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import {
  loadDb,
  saveDb,
  type WorkOrder,
  type Database,
} from "@/lib/store";
import { syncWarehouseFromWorkOrder } from "@/lib/warehouse-stock";
import { generateOrderNumber } from "@/lib/workorder-calc";
import { applyWorkOrderCompletedAt } from "@/lib/work-order-dates";
import { ClientVehiclePicker } from "./ClientVehiclePicker";
import { Button } from "@/components/ui/Button";

function emptyOrder(db: Database): WorkOrder {
  return {
    id: `wo-${Date.now()}`,
    number: generateOrderNumber(db.workOrders),
    userId: "",
    vehicleId: "",
    status: "received",
    services: [{ id: `s-${Date.now()}`, name: "", qty: 1, price: 0, discount: 0 }],
    parts: [],
    mechanicId: db.mechanics[0]?.id ?? "",
    mechanicLaborPercent: -1,
    mechanicPartsPercent: -1,
    orderDiscount: 0,
    internalNotes: "",
    clientNotes: "",
    files: [],
    createdAt: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString().slice(0, 10),
    confirmationStatus: "awaiting_confirmation",
    documentStatus: "awaiting_signature",
    vatEnabled: db.settings.vatEnabledByDefault ?? true,
    paymentStatus: "unpaid",
    signatureMode: "electronic",
  };
}

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (orderId: string) => void;
  initialUserId?: string | null;
};

export function QuickCreateOrderModal({
  open,
  onClose,
  onCreated,
  initialUserId,
}: Props) {
  const { t } = useI18n();
  const c = t.crm;
  const w = t.wo;
  const [userId, setUserId] = useState(initialUserId ?? "");
  const [vehicleId, setVehicleId] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [receptionDate, setReceptionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (initialUserId) {
      setUserId(initialUserId);
      const fresh = loadDb();
      const v = fresh.vehicles.find((x) => x.userId === initialUserId);
      if (v) setVehicleId(v.id);
    }
  }, [open, initialUserId]);

  if (!open) return null;

  const handleCreate = () => {
    if (!userId || !vehicleId) {
      setError(w.selectClientVehicle);
      return;
    }
    const fresh = loadDb();
    const order: WorkOrder = applyWorkOrderCompletedAt({
      ...emptyOrder(fresh),
      userId,
      vehicleId,
      clientNotes,
      createdAt: receptionDate,
      updatedAt: receptionDate,
    });
    fresh.workOrders.push(order);
    saveDb(syncWarehouseFromWorkOrder(fresh, order));
    onCreated(order.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75"
      role="dialog"
      aria-modal
    >
      <div className="crm-modal-panel w-full sm:max-w-2xl max-h-[92dvh] overflow-y-auto safe-area-pb">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3 border-b border-bm-border bg-bm-graphite/95 backdrop-blur-md">
          <div className="flex items-center gap-2 min-w-0">
            <Wrench className="text-bm-red shrink-0" size={22} />
            <h2 className="font-display font-bold uppercase text-sm sm:text-base truncate">
              {c.quickCreateOrderTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 shrink-0"
            aria-label={t.common.cancel}
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          <ClientVehiclePicker
            userId={userId}
            vehicleId={vehicleId}
            onSelect={(uid, vid) => {
              setUserId(uid);
              setVehicleId(vid);
              setError("");
            }}
          />

          <div>
            <label className="text-xs uppercase text-bm-muted">{c.receptionDate}</label>
            <input
              type="date"
              className="input-premium mt-1"
              value={receptionDate}
              onChange={(e) => setReceptionDate(e.target.value)}
            />
            <LinkScheduleHint />
          </div>

          <div>
            <label className="text-xs uppercase text-bm-muted">{w.clientNotes}</label>
            <textarea
              className="input-premium mt-1 min-h-[80px]"
              placeholder={c.orderDescriptionPlaceholder}
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t.common.cancel}
            </Button>
            <Button type="button" onClick={handleCreate}>
              {c.createOrder}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkScheduleHint() {
  const { t } = useI18n();
  const c = t.crm;
  return (
    <Link
      href="/crm/calendar"
      className="inline-block mt-1 text-xs text-bm-red hover:underline"
    >
      {c.scheduleInCalendar}
    </Link>
  );
}
