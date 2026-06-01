"use client";

import { useState, useEffect } from "react";
import { Download, PenLine } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { WorkOrder, Database } from "@/lib/store";
import { loadDb } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { WorkOrderSignatureFlow } from "@/components/cabinet/WorkOrderSignatureFlow";
import { WorkOrderDocumentActions } from "@/components/work-order/WorkOrderDocumentActions";
import { SignLinkShareBlock } from "@/components/work-order/SignLinkShareBlock";
import { PremiumWorkOrderDocument } from "@/components/work-order/PremiumWorkOrderDocument";
import { WorkOrderPhotoGallery } from "@/components/work-order/WorkOrderPhotoGallery";
import { getClientPaymentView } from "@/lib/payment";
import { RepairStatusStepper } from "@/components/cabinet/RepairStatusStepper";
import { downloadWorkOrderPdf } from "@/lib/work-order-pdf";
import {
  resolveOrderDocumentLocale,
  type DocLocale,
} from "@/lib/work-order-locale";
import { isElectronicSignature } from "@/lib/work-order-signature";
import { orderNeedsClientSignature } from "@/lib/order-signature";

interface Props {
  order: WorkOrder;
  db: Database;
  onBack: () => void;
  documentLocale?: DocLocale;
}

export function ClientWorkOrderDetail({ order, db, onBack, documentLocale }: Props) {
  const { t, locale } = useI18n();
  const sig = t.signature;
  const docSt = t.documentStatus;
  const cp = t.clientPayment;
  const [showSign, setShowSign] = useState(false);
  const [localOrder, setLocalOrder] = useState(order);

  useEffect(() => {
    setLocalOrder(order);
  }, [order]);
  const client = db.users.find((u) => u.id === order.userId)!;
  const vehicle = db.vehicles.find((v) => v.id === order.vehicleId);
  const vatRate = db.settings.vatRate ?? 23;
  const docLang = documentLocale ?? resolveOrderDocumentLocale(localOrder, locale);

  const clientPay = getClientPaymentView(localOrder.paymentMethod, localOrder.paymentStatus);
  const clientPayLabel =
    clientPay === "card"
      ? cp.card
      : clientPay === "cash"
        ? cp.cash
        : clientPay === "mixed"
          ? cp.mixed
          : null;

  if (showSign && vehicle) {
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

  if (!vehicle) {
    return (
      <div className="pt-28 text-center text-bm-muted">
        <button type="button" onClick={onBack} className="text-bm-red hover:underline">
          ← {t.cabinet.workOrders}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <button type="button" onClick={onBack} className="text-sm text-bm-red hover:underline">
        ← {t.cabinet.workOrders}
      </button>

      <RepairStatusStepper status={localOrder.status} />

      {(localOrder.files.some(
        (f) =>
          f.type === "image" &&
          (f.dataUrl || f.storageUrl) &&
          (f.category === "before" || f.category === "after")
      )) && (
        <div className="rounded-xl border border-bm-border bg-white p-4">
          <WorkOrderPhotoGallery files={localOrder.files} variant="form" />
        </div>
      )}

      <PremiumWorkOrderDocument
        order={localOrder}
        vehicle={vehicle}
        client={client}
        vatRate={vatRate}
        docLocale={docLang}
        repairStatusLabel={t.repairStatus[localOrder.status]}
        documentStatusLabel={docSt[localOrder.documentStatus ?? "awaiting_signature"]}
        clientPaymentLabel={clientPayLabel}
        toolbar={
          <div className="flex flex-wrap items-center gap-2 justify-end ml-auto">
            {orderNeedsClientSignature(localOrder) && isElectronicSignature(localOrder) && (
              <Button className="text-xs shrink-0" onClick={() => setShowSign(true)}>
                <PenLine className="w-4 h-4" /> {sig.signNow}
              </Button>
            )}
            <button
              type="button"
              className="btn-outline text-xs inline-flex items-center gap-1"
              onClick={() =>
                downloadWorkOrderPdf(
                  localOrder,
                  `${vehicle.make} ${vehicle.model} · ${vehicle.plate}`,
                  docLang
                )
              }
            >
              <Download size={14} /> PDF
            </button>
            <WorkOrderDocumentActions
              order={localOrder}
              client={client}
              vehicle={vehicle}
              iconToolbar
            />
          </div>
        }
        footerActions={
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            <SignLinkShareBlock order={localOrder} client={client} inline />
          </div>
        }
      />

      {localOrder.warrantyUntil && (
        <p className="text-sm text-bm-muted text-center">
          {t.cabinet.warranties}: {localOrder.warrantyUntil}
        </p>
      )}
    </div>
  );
}
