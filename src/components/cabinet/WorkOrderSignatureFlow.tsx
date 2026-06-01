"use client";

import { useState } from "react";
import { Check, PenLine } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { WorkOrder, Database, OrderSignature } from "@/lib/store";
import { loadDb, saveDb } from "@/lib/store";
import { SignaturePad } from "@/components/signature/SignaturePad";
import { Button } from "@/components/ui/Button";
import { PremiumWorkOrderDocument } from "@/components/work-order/PremiumWorkOrderDocument";
import { WorkOrderPhotoGallery } from "@/components/work-order/WorkOrderPhotoGallery";
import { mergeClientPortalIntoDb } from "@/lib/client-portal";
import { nowIsoTimestamp } from "@/lib/work-order-timestamp";
import {
  fetchClientIp,
  getDeviceInfo,
  getFullSignatureConfirmationText,
} from "@/lib/work-order-share";
import {
  resolveOrderDocumentLocale,
  type DocLocale,
} from "@/lib/work-order-locale";
import { mergeRemoteWorkOrderPatch } from "@/lib/work-order-remote-sync";

type CloudSignContext = {
  phone: string;
  plate: string;
};

interface Props {
  order: WorkOrder;
  db: Database;
  onDone: () => void;
  onCancel: () => void;
  cloudSign?: CloudSignContext;
  documentLocale?: DocLocale;
  urlLang?: string | null;
}

async function submitSignatureToCloud(
  orderId: string,
  phone: string,
  plate: string,
  meta: OrderSignature,
  clientSignature: string
): Promise<{ ok: true; order: WorkOrder } | { ok: false; error: string }> {
  const res = await fetch("/api/sign-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "submit",
      orderId,
      phone,
      plate,
      signature: meta,
      clientSignature,
    }),
  });
  const data = (await res.json()) as {
    ok?: boolean;
    order?: WorkOrder;
    error?: string;
  };
  if (!res.ok || !data.ok || !data.order) {
    return { ok: false, error: data.error ?? `http_${res.status}` };
  }
  return { ok: true, order: data.order };
}

export function WorkOrderSignatureFlow({
  order,
  db,
  onDone,
  onCancel,
  cloudSign,
  documentLocale,
  urlLang,
}: Props) {
  const { t, locale } = useI18n();
  const s = t.signature;
  const docLocale = documentLocale ?? resolveOrderDocumentLocale(order, locale, urlLang);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [priceOk, setPriceOk] = useState(false);
  const [repairOk, setRepairOk] = useState(false);
  const [worksOk, setWorksOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const vatRate = db.settings.vatRate ?? 23;
  const client = db.users.find((u) => u.id === order.userId);
  const vehicle = db.vehicles.find((v) => v.id === order.vehicleId);
  const confirmText = getFullSignatureConfirmationText(docLocale);

  const submit = async () => {
    if (!signatureData || !priceOk || !repairOk || !worksOk || submitting) return;
    if (!client || !vehicle) return;

    setSubmitting(true);
    setSubmitError("");

    const ip = await fetchClientIp();
    const meta: OrderSignature = {
      dataUrl: signatureData,
      signedAt: new Date().toISOString(),
      signedBy: client.name ?? "Client",
      ip,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      deviceInfo: getDeviceInfo(),
      priceAgreed: priceOk,
      repairAgreed: repairOk,
      confirmationText: confirmText,
    };

    const phone = cloudSign?.phone ?? client.phone;
    const plate = cloudSign?.plate ?? vehicle.plate;

    const cloudResult = await submitSignatureToCloud(
      order.id,
      phone,
      plate,
      meta,
      signatureData
    );

    if (cloudResult.ok) {
      const fresh = loadDb();
      const idx = fresh.workOrders.findIndex((o) => o.id === order.id);
      const merged = mergeRemoteWorkOrderPatch(
        idx >= 0 ? fresh.workOrders[idx] : order,
        cloudResult.order
      );
      if (idx >= 0) fresh.workOrders[idx] = merged;
      else fresh.workOrders.push(merged);
      saveDb(fresh, { skipCloudPush: true });
      mergeClientPortalIntoDb({
        user: client,
        vehicles: fresh.vehicles.filter((v) => v.userId === client.id),
        workOrders: fresh.workOrders.filter((o) => o.userId === client.id),
        appointments: fresh.appointments.filter((a) => a.userId === client.id),
        notifications: (fresh.notifications ?? []).filter(
          (n) => n.userId === client.id
        ),
      });
      setSubmitting(false);
      onDone();
      return;
    }

    const allowDevOffline =
      process.env.NODE_ENV === "development" &&
      (cloudResult.error === "cloud_disabled" || cloudResult.error === "cloud_read_failed");

    if (!allowDevOffline) {
      setSubmitError(
        locale === "ru"
          ? "Не удалось сохранить подпись. Попробуйте ещё раз или обратитесь в сервис."
          : locale === "pl"
            ? "Nie udało się zapisać podpisu. Spróbuj ponownie lub zadzwoń."
            : "Could not save signature. Please try again or contact the service."
      );
      setSubmitting(false);
      return;
    }

    const fresh = loadDb();
    const wo = fresh.workOrders.find((o) => o.id === order.id);
    if (wo) {
      wo.confirmationStatus = "confirmed";
      wo.signature = meta;
      wo.clientSignature = signatureData;
      wo.updatedAt = nowIsoTimestamp();
      wo.documentStatus =
        wo.status === "delivered"
          ? "delivered"
          : wo.status === "ready"
            ? "completed"
            : "signed";
      saveDb(fresh);
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

  const clientPhotos = order.files.filter(
    (f) =>
      f.type === "image" &&
      (f.dataUrl || f.storageUrl) &&
      (f.category === "before" || f.category === "after")
  );

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {clientPhotos.length > 0 && (
          <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-lg">
            <WorkOrderPhotoGallery files={order.files} variant="form" />
          </div>
        )}

        <PremiumWorkOrderDocument
          order={order}
          vehicle={vehicle}
          client={client}
          vatRate={vatRate}
          docLocale={docLocale}
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

        {submitError && (
          <p className="text-sm text-red-400 text-center bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
            {submitError}
          </p>
        )}

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
