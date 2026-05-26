"use client";

import { useState } from "react";
import { Check, PenLine } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { WorkOrder, Database, OrderSignature } from "@/lib/store";
import { loadDb, saveDb } from "@/lib/store";
import { SignaturePad } from "@/components/signature/SignaturePad";
import { Button } from "@/components/ui/Button";
import { PremiumWorkOrderDocument } from "@/components/work-order/PremiumWorkOrderDocument";
import {
  fetchClientIp,
  getDeviceInfo,
  getFullSignatureConfirmationText,
  workOrderLegalLocaleFromUi,
} from "@/lib/work-order-share";

type CloudSignContext = {
  phone: string;
  plate?: string;
};

interface Props {
  order: WorkOrder;
  db: Database;
  onDone: () => void;
  onCancel: () => void;
  cloudSign?: CloudSignContext;
}

export function WorkOrderSignatureFlow({ order, db, onDone, onCancel, cloudSign }: Props) {
  const { t, locale } = useI18n();
  const s = t.signature;
  const docLocale = workOrderLegalLocaleFromUi(locale);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [priceOk, setPriceOk] = useState(false);
  const [repairOk, setRepairOk] = useState(false);
  const [worksOk, setWorksOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const vatRate = db.settings.vatRate ?? 23;
  const client = db.users.find((u) => u.id === order.userId);
  const vehicle = db.vehicles.find((v) => v.id === order.vehicleId);
  const confirmText = getFullSignatureConfirmationText(docLocale);

  const submit = async () => {
    if (!signatureData || !priceOk || !repairOk || !worksOk || submitting) return;
    setSubmitting(true);
    const ip = await fetchClientIp();
    const meta: OrderSignature = {
      dataUrl: signatureData,
      signedAt: new Date().toISOString(),
      signedBy: client?.name ?? "Client",
      ip,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      deviceInfo: getDeviceInfo(),
      priceAgreed: priceOk,
      repairAgreed: repairOk,
      confirmationText: confirmText,
    };

    if (cloudSign) {
      const res = await fetch("/api/sign-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          orderId: order.id,
          phone: cloudSign.phone,
          plate: cloudSign.plate,
          signature: meta,
          clientSignature: signatureData,
        }),
      });
      if (!res.ok) {
        setSubmitting(false);
        return;
      }
    } else {
      const fresh = loadDb();
      const wo = fresh.workOrders.find((o) => o.id === order.id);
      if (wo) {
        wo.confirmationStatus = "confirmed";
        wo.signature = meta;
        wo.clientSignature = signatureData;
        wo.updatedAt = new Date().toISOString().slice(0, 10);
        wo.documentStatus =
          wo.status === "delivered"
            ? "delivered"
            : wo.status === "ready"
              ? "completed"
              : "signed";
        saveDb(fresh);
      }
    }
    setSubmitting(false);
    onDone();
  };

  if (!client || !vehicle) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
        <p className="text-bm-muted">{t.document.orderNotFound}</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <PremiumWorkOrderDocument
          order={order}
          vehicle={vehicle}
          client={client}
          vatRate={vatRate}
          signatureSlot={
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-start gap-3 text-sm cursor-pointer glass rounded-lg p-3 hover:border-bm-red/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={worksOk}
                    onChange={(e) => setWorksOk(e.target.checked)}
                    className="mt-1 accent-bm-red"
                  />
                  {s.agreeWorks}
                </label>
                <label className="flex items-start gap-3 text-sm cursor-pointer glass rounded-lg p-3 hover:border-bm-red/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={priceOk}
                    onChange={(e) => setPriceOk(e.target.checked)}
                    className="mt-1 accent-bm-red"
                  />
                  {s.agreePrice}
                </label>
                <label className="flex items-start gap-3 text-sm cursor-pointer glass rounded-lg p-3 hover:border-bm-red/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={repairOk}
                    onChange={(e) => setRepairOk(e.target.checked)}
                    className="mt-1 accent-bm-red"
                  />
                  {s.agreeRepair}
                </label>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-bm-red flex items-center gap-2">
                <PenLine size={14} /> {s.signHere}
              </p>
              <SignaturePad onChange={setSignatureData} height={220} />
            </div>
          }
        />

        <p className="text-[10px] text-bm-muted text-center leading-relaxed max-w-2xl mx-auto">
          {s.legalNotice}
        </p>

        <div className="flex flex-wrap gap-3 max-w-2xl mx-auto">
          <Button
            className="flex-1 min-w-[200px]"
            onClick={submit}
            disabled={!signatureData || !priceOk || !repairOk || !worksOk || submitting}
          >
            <Check size={16} /> {submitting ? s.submitting : s.confirm}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            {t.common.cancel}
          </Button>
        </div>
      </div>
    </div>
  );
}
