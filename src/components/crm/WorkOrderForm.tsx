"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, Save, X, Upload, FileText } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { handleWorkOrderClientNotifications, buildCarReadyWhatsAppUrl } from "@/lib/client-notifications";
import {
  loadDb,
  saveDb,
  type WorkOrder,
  type WorkOrderLine,
  type PartLine,
  type AttachedFile,
  type RepairStatus,
  type DocumentStatus,
  type PaymentMethod,
  type PaymentStatus,
  type Database,
  type SignatureMode,
  deriveDocumentStatus,
} from "@/lib/store";
import { PAYMENT_METHODS } from "@/lib/payment";
import { syncWarehouseFromWorkOrder } from "@/lib/warehouse-stock";
import {
  applyInviteeDiscountToOrder,
  applyReferralDiscountToOrder,
  canUseInviteeDiscount,
  canUseReferralDiscount,
  markInviteeDiscountUsed,
  markReferralDiscountUsed,
} from "@/lib/referral-system";
import {
  calcServiceLine,
  calcPartLine,
  calcPartLineProfit,
  calcPartMarginPercent,
  calcServicesSubtotal,
  calcPartsSubtotal,
  calcSubtotal,
  calcOrderDiscountAmount,
  calcClientTotal,
  calcPartsProfit,
  calcMechanicEarnings,
  calcServiceOrderProfit,
  calcOrderBreakdown,
  generateOrderNumber,
} from "@/lib/workorder-calc";
import { Button } from "@/components/ui/Button";
import { PriceNumberInput } from "@/components/ui/PriceNumberInput";
import { VehicleClientEditor } from "@/components/crm/VehicleClientEditor";
import { WorkOrderDocumentActions } from "@/components/work-order/WorkOrderDocumentActions";
import { CrmMessageTemplates } from "@/components/crm/CrmMessageTemplates";
import { WorkOrderAuditPanel } from "@/components/crm/WorkOrderAuditPanel";
import { WorkOrderChecklistPanel } from "@/components/crm/WorkOrderChecklistPanel";
import { downloadReceptionAct, downloadDeliveryAct } from "@/lib/vehicle-doc-pdf";
import type { DocLocale } from "@/lib/work-order-locale";
import { useDbSync } from "@/hooks/useDbSync";
import { mergeRemoteWorkOrderPatch } from "@/lib/work-order-remote-sync";
import { ClientVehiclePicker } from "@/components/crm/ClientVehiclePicker";
import { CrmPageHeader } from "@/components/crm/CrmPageHeader";
import { applyWorkOrderCompletedAt } from "@/lib/work-order-dates";
import { applyWorkOrderClosure, isWorkOrderClosed } from "@/lib/work-order-lifecycle";

type CreateStep = "client" | "works" | "more";
type EditTab = "client" | "works" | "status" | "payment" | "documents" | "more";

const statuses: RepairStatus[] = [
  "received",
  "diagnostic",
  "repair",
  "waitingParts",
  "ready",
  "delivered",
];

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

const documentStatuses: DocumentStatus[] = [
  "awaiting_signature",
  "signed",
  "in_progress",
  "completed",
  "delivered",
];

interface WorkOrderFormProps {
  orderId?: string | null;
  /** Pre-select client when opening create flow from clients list */
  initialUserId?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export function WorkOrderForm({
  orderId,
  initialUserId,
  onClose,
  onSaved,
}: WorkOrderFormProps) {
  const { t, locale } = useI18n();
  const w = t.wo;
  const c = t.crm;
  const doc = t.document;
  const docSt = t.documentStatus;
  const pm = t.paymentMethods;
  const ps = t.paymentStatus;

  const dbTick = useDbSync();
  const db = useMemo(() => loadDb(), [dbTick]);
  const existing = orderId ? db.workOrders.find((o) => o.id === orderId) : null;
  const isNew = !existing;

  const [order, setOrder] = useState<WorkOrder>(existing ?? emptyOrder(db));
  const [createStep, setCreateStep] = useState<CreateStep>("client");
  const [editTab, setEditTab] = useState<EditTab>("client");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!orderId || isNew) return;
    const fresh = loadDb().workOrders.find((o) => o.id === orderId);
    if (!fresh) return;
    setOrder((prev) => mergeRemoteWorkOrderPatch(prev, fresh));
  }, [orderId, isNew, dbTick]);

  useEffect(() => {
    if (!isNew || !initialUserId) return;
    const fresh = loadDb();
    const user = fresh.users.find((u) => u.id === initialUserId && u.role === "client");
    if (!user) return;
    const vehicle =
      fresh.vehicles.find((v) => v.userId === user.id) ?? null;
    if (!vehicle) return;
    setOrder((o) => ({
      ...o,
      userId: user.id,
      vehicleId: vehicle.id,
    }));
    setCreateStep("works");
  }, [initialUserId, isNew, dbTick]);

  const mechProfile = db.mechanics.find((m) => m.id === order.mechanicId);

  const totals = useMemo(() => {
    const servicesSub = calcServicesSubtotal(order);
    const partsSub = calcPartsSubtotal(order);
    const sub = calcSubtotal(order);
    const discountAmt = calcOrderDiscountAmount(order);
    const clientTotal = calcClientTotal(order);
    const partsProfit = calcPartsProfit(order);
    const earnings = calcMechanicEarnings(order, db.settings, mechProfile);
    const serviceProfit = calcServiceOrderProfit(order, db.settings, mechProfile);
    return {
      servicesSub,
      partsSub,
      sub,
      discountAmt,
      clientTotal,
      partsProfit,
      earnings,
      serviceProfit,
    };
  }, [order, mechProfile, db.settings]);

  const selectClientVehicle = (userId: string, vehicleId: string | null) => {
    const fresh = loadDb();
    let vid = vehicleId?.trim() || "";
    if (!vid) {
      const existing = fresh.vehicles.find((v) => v.userId === userId);
      if (existing) {
        vid = existing.id;
      } else {
        const newVehicle = {
          id: `v-${Date.now()}`,
          vin: "",
          plate: "—",
          mileage: 0,
          make: "—",
          model: "—",
          engine: "",
          engineVolume: "",
          trim: "",
          power: "",
          transmission: "",
          drivetrain: "",
          year: "",
          color: "",
          fuelType: "",
          notes: "",
          userId,
        };
        fresh.vehicles.push(newVehicle);
        saveDb(fresh);
        vid = newVehicle.id;
      }
    }
    setOrder((o) => ({
      ...o,
      userId,
      vehicleId: vid,
    }));
    setSaveError("");
    if (isNew) setCreateStep("works");
  };

  const setDocumentLocale = (documentLocale: DocLocale) => {
    setOrder((o) => ({ ...o, documentLocale }));
  };

  const updateService = (i: number, patch: Partial<WorkOrderLine>) => {
    const services = [...order.services];
    services[i] = { ...services[i], ...patch };
    setOrder({ ...order, services });
  };

  const updatePart = (i: number, patch: Partial<PartLine>) => {
    const parts = [...order.parts];
    parts[i] = { ...parts[i], ...patch };
    setOrder({ ...order, parts });
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    category: AttachedFile["category"]
  ) => {
    const files = e.target.files;
    if (!files?.length) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const type: AttachedFile["type"] = file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("video/")
            ? "video"
            : file.type === "application/pdf"
              ? "pdf"
              : "document";
        const attached: AttachedFile = {
          id: `f-${Date.now()}-${Math.random()}`,
          name: file.name,
          type,
          category,
          dataUrl: reader.result as string,
          uploadedAt: new Date().toISOString(),
        };
        setOrder((o) => ({ ...o, files: [...o.files, attached] }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const persistOrder = (draft: WorkOrder, opts?: { close?: boolean }) => {
    if (!draft.userId || !draft.vehicleId) {
      setSaveError(w.selectClientVehicle);
      if (isNew) setCreateStep("client");
      return false;
    }
    setSaveError("");
    const fresh = loadDb();
    const idx = fresh.workOrders.findIndex((o) => o.id === draft.id);
    const previousOrder = idx >= 0 ? { ...fresh.workOrders[idx] } : null;
    const documentStatus =
      draft.documentStatus ??
      deriveDocumentStatus(draft.status, draft.confirmationStatus);
    const isPaid = draft.paymentStatus === "paid";
    const updated = applyWorkOrderCompletedAt(
      applyWorkOrderClosure({
        ...draft,
        documentStatus,
        updatedAt: new Date().toISOString().slice(0, 10),
        paymentStatus: draft.paymentStatus ?? "unpaid",
        ...(isPaid
          ? { paidAt: draft.paidAt ?? new Date().toISOString().slice(0, 10) }
          : {
              paidAt: undefined,
              paymentMethod: undefined,
              paidCashAmount: undefined,
              paidCardAmount: undefined,
            }),
      })
    );
    if (idx >= 0) fresh.workOrders[idx] = updated;
    else fresh.workOrders.push(updated);
    handleWorkOrderClientNotifications(fresh, updated, previousOrder);
    if (updated.referralDiscountApplied && updated.paymentStatus === "paid") {
      markReferralDiscountUsed(fresh, updated.userId, updated);
    }
    if (updated.referralInviteeDiscountApplied && updated.paymentStatus === "paid") {
      markInviteeDiscountUsed(fresh, updated.userId, updated);
    }
    saveDb(syncWarehouseFromWorkOrder(fresh, updated));
    if (opts?.close !== false) onSaved();
    return true;
  };

  const save = () => {
    persistOrder(order);
  };

  const remove = () => {
    if (!confirm(w.confirmDelete)) return;
    const fresh = loadDb();
    fresh.workOrders = fresh.workOrders.filter((o) => o.id !== order.id);
    saveDb(fresh);
    onSaved();
  };

  const client = db.users.find((u) => u.id === order.userId);
  const vehicle = db.vehicles.find((v) => v.id === order.vehicleId);
  const vatRate = db.settings.vatRate ?? 23;
  const breakdown = calcOrderBreakdown(order, vatRate);
  const referralDiscountReady = client ? canUseReferralDiscount(client, db) : false;
  const inviteeDiscountReady = client ? canUseInviteeDiscount(client) : false;

  const createSteps: { id: CreateStep; label: string }[] = [
    { id: "client", label: w.stepClient },
    { id: "works", label: w.stepWorks },
    { id: "more", label: w.stepMore },
  ];

  const showClient = isNew ? createStep === "client" : editTab === "client";
  const showWorks = isNew ? createStep === "works" : editTab === "works";
  const showStatus = !isNew && editTab === "status";
  const showPayment = !isNew && editTab === "payment";
  const showDocuments = isNew ? createStep === "more" : editTab === "documents";
  const showMore = isNew ? createStep === "more" : editTab === "more";
  const showStatusFields = showStatus || (isNew && createStep === "more");
  const showPaymentFields = showPayment || (isNew && createStep === "more");

  const editTabs: { id: EditTab; label: string }[] = [
    { id: "client", label: c.tabClientVehicle },
    { id: "works", label: c.tabWorksParts },
    { id: "status", label: c.tabOrderStatus },
    { id: "payment", label: c.tabPayment },
    { id: "documents", label: c.tabDocumentsSend },
    { id: "more", label: c.tabMore },
  ];

  const vehicleLabel = vehicle
    ? `${vehicle.make} ${vehicle.model}${vehicle.plate ? ` · ${vehicle.plate}` : ""}`
    : undefined;

  return (
    <div className="space-y-6 pb-24">
      <CrmPageHeader
        breadcrumbs={
          existing
            ? [
                { label: c.workOrders, href: "/crm/work-orders" },
                { label: order.number },
                ...(client?.name ? [{ label: client.name }] : []),
                ...(vehicleLabel ? [{ label: vehicleLabel }] : []),
              ]
            : [
                { label: c.workOrders, href: "/crm/work-orders" },
                { label: w.newOrder },
              ]
        }
        title={existing ? `${w.editOrder} ${order.number}` : w.newOrder}
        subtitle={
          isNew
            ? w.quickCreateHint
            : [client?.name, client?.phone, vehicleLabel].filter(Boolean).join(" · ")
        }
      />

      {saveError && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
          {saveError}
        </p>
      )}

      {!isNew && (
        <div className="crm-mw-tabs">
          {editTabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setEditTab(id)}
              className={`crm-mw-tab ${editTab === id ? "active" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {isNew && (
        <div className="flex flex-wrap gap-2">
          {createSteps.map(({ id, label }, i) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                if (id !== "client" && (!order.userId || !order.vehicleId)) {
                  setSaveError(w.selectClientVehicle);
                  setCreateStep("client");
                  return;
                }
                setCreateStep(id);
              }}
              className={`crm-mw-tab rounded-full ${
                createStep === id ? "active border-blue-200" : ""
              }`}
            >
              {i + 1}. {label}
            </button>
          ))}
        </div>
      )}

      {showMore && referralDiscountReady && client && (
        <div className="glass rounded-xl p-4 border border-green-500/40 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-green-400">
            🎁 Klient ma <b>15% rabatu referral</b> (5 potwierdzonych poleceń). Jednorazowo na to
            zlecenie.
            {client.referralDiscountExpiresAt && (
              <span className="block text-xs text-bm-muted mt-1">
                Ważne do: {client.referralDiscountExpiresAt.slice(0, 10)}
              </span>
            )}
          </p>
          <Button
            type="button"
            variant="outline"
            className="text-xs border-green-500/50 text-green-400"
            onClick={() => setOrder((o) => applyReferralDiscountToOrder(o))}
          >
            Zastosuj 15% rabat
          </Button>
        </div>
      )}

      {showMore && inviteeDiscountReady && client && (
        <div className="glass rounded-xl p-4 border border-blue-500/40 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-blue-300">
            🎁 Klient przyszedł z polecenia — <b>5% rabatu</b> na to zlecenie (po pierwszym WZ).
          </p>
          <Button
            type="button"
            variant="outline"
            className="text-xs border-blue-500/50 text-blue-300"
            onClick={() => setOrder((o) => applyInviteeDiscountToOrder(o))}
          >
            Zastosuj 5% (polecony)
          </Button>
        </div>
      )}

      {showClient && (
      <div className="crm-mw-card rounded-md p-6 space-y-4">
        <ClientVehiclePicker
          userId={order.userId}
          vehicleId={order.vehicleId}
          onSelect={(uid, vid) => {
            selectClientVehicle(uid, vid);
          }}
        />
        {order.userId && order.vehicleId && (
          <VehicleClientEditor
            userId={order.userId}
            vehicleId={order.vehicleId}
            onVehicleId={(id) => setOrder((o) => ({ ...o, vehicleId: id }))}
          />
        )}
      </div>
      )}

      {isNew && createStep === "client" && (
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => {
              if (!order.userId || !order.vehicleId) {
                setSaveError(w.selectClientVehicle);
                return;
              }
              setCreateStep("works");
            }}
          >
            {w.stepNext}
          </Button>
        </div>
      )}

      {showMore && (
        <>
      <WorkOrderChecklistPanel order={order} onChange={(patch) => setOrder({ ...order, ...patch })} />
      <WorkOrderAuditPanel order={order} />
        </>
      )}

      {showStatusFields && (
      <div className="crm-mw-card rounded-md p-6 space-y-4">
        <h3 className="font-display text-sm uppercase text-bm-red font-bold">{c.tabOrderStatus}</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="text-xs uppercase text-bm-muted">{doc.documentStatus}</label>
          <select
            className="input-premium mt-1"
            value={order.documentStatus ?? "awaiting_signature"}
            onChange={(e) => {
              const documentStatus = e.target.value as DocumentStatus;
              const next = applyWorkOrderClosure({
                ...order,
                documentStatus,
                ...(documentStatus === "delivered" ? { status: "delivered" as const } : {}),
              });
              setOrder(next);
              if (!isNew) persistOrder(next, { close: false });
            }}
          >
            {documentStatuses.map((s) => (
              <option key={s} value={s}>
                {docSt[s]}
              </option>
            ))}
          </select>
          {!isWorkOrderClosed(order) && (
            <button
              type="button"
              className="btn-primary text-xs mt-2 w-full"
              onClick={() => {
                if (!confirm(c.markDeliveredConfirm)) return;
                const closed = applyWorkOrderClosure({
                  ...order,
                  documentStatus: "delivered",
                  status: "delivered",
                });
                setOrder(closed);
                persistOrder(closed);
              }}
            >
              {c.markDelivered}
            </button>
          )}
        </div>
        <div>
          <label className="text-xs uppercase text-bm-muted">{c.status}</label>
          <select
            className="input-premium mt-1"
            value={order.status}
            onChange={(e) => {
              const status = e.target.value as RepairStatus;
              const next = {
                ...order,
                status,
                documentStatus:
                  status === "delivered"
                    ? ("delivered" as DocumentStatus)
                    : order.documentStatus && order.confirmationStatus === "confirmed"
                      ? order.documentStatus
                      : deriveDocumentStatus(status, order.confirmationStatus),
              };
              const draft = status === "delivered" ? applyWorkOrderClosure(next) : next;
              setOrder(draft);
              if (!isNew) persistOrder(draft, { close: false });
            }}
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {t.repairStatus[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs uppercase text-bm-muted">{c.clientPartsView}</label>
          <select
            className="input-premium mt-1"
            value={order.clientPartsStatus ?? ""}
            onChange={(e) =>
              setOrder({
                ...order,
                clientPartsStatus: (e.target.value || undefined) as
                  | WorkOrder["clientPartsStatus"]
                  | undefined,
              })
            }
          >
            <option value="">—</option>
            <option value="ordered">{c.partsStatusOrdered}</option>
            <option value="in_transit">{c.partsStatusTransit}</option>
            <option value="arrived">{c.partsStatusArrived}</option>
          </select>
          {client?.phone && vehicle && (
            <CrmMessageTemplates
              clientPhone={client.phone}
              orderNumber={order.number}
              vehicleLabel={`${vehicle.make} ${vehicle.model} · ${vehicle.plate}`}
              locale={locale === "uk" ? "uk" : locale === "ru" ? "ru" : locale === "en" ? "en" : "pl"}
            />
          )}
          {order.status === "ready" && client?.phone && vehicle && (
            <a
              href={buildCarReadyWhatsAppUrl(
                client.phone,
                order.number,
                `${vehicle.make} ${vehicle.model} · ${vehicle.plate}`,
                locale
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs text-green-400 hover:text-green-300 underline"
            >
              {t.notifExt.whatsAppReady}
            </a>
          )}
        </div>
        <div>
          <label className="text-xs uppercase text-bm-muted">{w.assignMechanic}</label>
          <select
            className="input-premium mt-1"
            value={order.mechanicId}
            onChange={(e) =>
              setOrder({
                ...order,
                mechanicId: e.target.value,
                mechanicLaborPercent: -1,
                mechanicPartsPercent: -1,
              })
            }
          >
            {db.mechanics.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        </div>
      </div>
      )}

      {showPaymentFields && (
      <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="text-xs uppercase text-bm-muted">{w.orderDiscount}</label>
          <PriceNumberInput
            className="input-premium mt-1"
            min={0}
            max={100}
            value={order.orderDiscount}
            onChange={(orderDiscount) => setOrder({ ...order, orderDiscount })}
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm cursor-pointer pb-3">
            <input
              type="checkbox"
              className="accent-bm-red"
              checked={order.vatEnabled ?? false}
              onChange={(e) => setOrder({ ...order, vatEnabled: e.target.checked })}
            />
            {doc.vatEnabled} ({vatRate}%)
          </label>
        </div>
        <div>
          <label className="text-xs uppercase text-bm-muted">{w.laborPercent}</label>
          <input
            type="number"
            className="input-premium mt-1"
            min={-1}
            max={100}
            placeholder={String(totals.earnings.laborPercent)}
            value={order.mechanicLaborPercent < 0 ? "" : order.mechanicLaborPercent}
            onChange={(e) => {
              const v = e.target.value;
              setOrder({
                ...order,
                mechanicLaborPercent: v === "" ? -1 : Number(v),
              });
            }}
          />
          <p className="text-[10px] text-bm-muted mt-1">{w.percentOverrideHint}</p>
        </div>
        <div>
          <label className="text-xs uppercase text-bm-muted">{w.partsPercent}</label>
          <input
            type="number"
            className="input-premium mt-1"
            min={-1}
            max={100}
            placeholder={String(totals.earnings.partsPercent)}
            value={order.mechanicPartsPercent < 0 ? "" : order.mechanicPartsPercent}
            onChange={(e) => {
              const v = e.target.value;
              setOrder({
                ...order,
                mechanicPartsPercent: v === "" ? -1 : Number(v),
              });
            }}
          />
        </div>
      </div>

      <div className="crm-mw-card rounded-md p-6 space-y-4">
        <h3 className="font-display text-sm uppercase text-bm-red font-bold">{w.paymentTitle}</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs uppercase text-bm-muted">{w.paymentStatusLabel}</label>
            <select
              className="input-premium mt-1"
              value={order.paymentStatus ?? "unpaid"}
              onChange={(e) => {
                const paymentStatus = e.target.value as PaymentStatus;
                setOrder({
                  ...order,
                  paymentStatus,
                  ...(paymentStatus === "unpaid"
                    ? { paymentMethod: undefined, paidAt: undefined }
                    : { paidAt: order.paidAt ?? new Date().toISOString().slice(0, 10) }),
                });
              }}
            >
              <option value="unpaid">{ps.unpaid}</option>
              <option value="paid">{ps.paid}</option>
            </select>
          </div>
          <div>
            <label className="text-xs uppercase text-bm-muted">{w.paymentMethodLabel}</label>
            <select
              className="input-premium mt-1"
              disabled={order.paymentStatus !== "paid"}
              value={order.paymentMethod ?? ""}
              onChange={(e) =>
                setOrder({
                  ...order,
                  paymentMethod: (e.target.value || undefined) as PaymentMethod | undefined,
                })
              }
            >
              <option value="">—</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {pm[m]}
                </option>
              ))}
            </select>
          </div>
          {order.paymentMethod === "card_cash" && order.paymentStatus === "paid" && (
            <>
              <div>
                <label className="text-xs uppercase text-bm-muted">{w.paidCashPart}</label>
                <PriceNumberInput
                  min={0}
                  step={0.01}
                  className="input-premium mt-1"
                  value={order.paidCashAmount ?? 0}
                  onChange={(paidCashAmount) =>
                    setOrder({
                      ...order,
                      paidCashAmount: paidCashAmount === 0 ? undefined : paidCashAmount,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-xs uppercase text-bm-muted">{w.paidCardPart}</label>
                <PriceNumberInput
                  min={0}
                  step={0.01}
                  className="input-premium mt-1"
                  value={order.paidCardAmount ?? 0}
                  onChange={(paidCardAmount) =>
                    setOrder({
                      ...order,
                      paidCardAmount: paidCardAmount === 0 ? undefined : paidCardAmount,
                    })
                  }
                />
              </div>
            </>
          )}
        </div>
      </div>
      </>
      )}

      {showWorks && (
      <>
      <div className="crm-mw-card rounded-md overflow-hidden">
        <div className="px-4 py-3 border-b border-bm-border bg-bm-red/10 flex justify-between items-center">
          <h3 className="font-display text-sm uppercase font-bold text-bm-red">{w.worksTable}</h3>
          <button
            type="button"
            onClick={() =>
              setOrder({
                ...order,
                services: [
                  ...order.services,
                  { id: `s-${Date.now()}`, name: "", qty: 1, price: 0, discount: 0 },
                ],
              })
            }
            className="text-xs text-bm-red flex items-center gap-1 hover:underline"
          >
            <Plus size={14} /> {w.addWork}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>{c.name}</th>
                <th>{c.qty}</th>
                <th>{c.price}</th>
                <th>{c.discount} %</th>
                <th>{c.total}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {order.services.map((line, i) => (
                <tr key={line.id}>
                  <td>
                    <input
                      className="input-premium text-sm py-1 min-w-[140px]"
                      value={line.name}
                      onChange={(e) => updateService(i, { name: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="input-premium text-sm py-1 w-14"
                      value={line.qty}
                      onChange={(e) => updateService(i, { qty: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <PriceNumberInput
                      className="input-premium text-sm py-1 w-20"
                      min={0}
                      step={0.01}
                      value={line.price}
                      onChange={(price) => updateService(i, { price })}
                    />
                  </td>
                  <td>
                    <PriceNumberInput
                      className="input-premium text-sm py-1 w-14"
                      min={0}
                      max={100}
                      value={line.discount}
                      onChange={(discount) => updateService(i, { discount })}
                    />
                  </td>
                  <td className="font-mono text-bm-red whitespace-nowrap">
                    {calcServiceLine(line).toFixed(2)} zł
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() =>
                        setOrder({ ...order, services: order.services.filter((_, j) => j !== i) })
                      }
                      className="text-bm-muted hover:text-bm-red"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="crm-mw-card rounded-md overflow-hidden mt-4">
        <div className="px-4 py-3 border-b border-bm-border bg-bm-red/10 flex justify-between items-center">
          <h3 className="font-display text-sm uppercase font-bold text-bm-red">{w.partsTable}</h3>
          <button
            type="button"
            onClick={() =>
              setOrder({
                ...order,
                parts: [
                  ...order.parts,
                  {
                    id: `p-${Date.now()}`,
                    name: "",
                    partNumber: "",
                    supplier: "",
                    qty: 1,
                    purchasePrice: 0,
                    sellPrice: 0,
                    discount: 0,
                  },
                ],
              })
            }
            className="text-xs text-bm-red flex items-center gap-1 hover:underline"
          >
            <Plus size={14} /> {w.addPart}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>{c.name}</th>
                <th>{w.partNumber}</th>
                <th>{w.supplier}</th>
                <th>{c.qty}</th>
                <th>{c.purchasePrice}</th>
                <th>{c.sellPrice}</th>
                <th>{c.discount} %</th>
                <th>{c.margin}</th>
                <th>{c.total}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {order.parts.map((line, i) => (
                <tr key={line.id}>
                  <td>
                    <input
                      className="input-premium text-sm py-1 min-w-[120px]"
                      value={line.name}
                      onChange={(e) => updatePart(i, { name: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="input-premium text-sm py-1 min-w-[90px] font-mono"
                      placeholder="SKU"
                      value={line.partNumber ?? ""}
                      onChange={(e) => updatePart(i, { partNumber: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="input-premium text-sm py-1 min-w-[100px]"
                      value={line.supplier ?? ""}
                      onChange={(e) => updatePart(i, { supplier: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="input-premium text-sm py-1 w-14"
                      value={line.qty}
                      onChange={(e) => updatePart(i, { qty: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <PriceNumberInput
                      className="input-premium text-sm py-1 w-18"
                      min={0}
                      step={0.01}
                      value={line.purchasePrice}
                      onChange={(purchasePrice) => updatePart(i, { purchasePrice })}
                    />
                  </td>
                  <td>
                    <PriceNumberInput
                      className="input-premium text-sm py-1 w-18"
                      min={0}
                      step={0.01}
                      value={line.sellPrice}
                      onChange={(sellPrice) => updatePart(i, { sellPrice })}
                    />
                  </td>
                  <td>
                    <PriceNumberInput
                      className="input-premium text-sm py-1 w-12"
                      min={0}
                      max={100}
                      value={line.discount}
                      onChange={(discount) => updatePart(i, { discount })}
                    />
                  </td>
                  <td className="text-green-400 text-xs font-mono whitespace-nowrap">
                    {calcPartMarginPercent(line).toFixed(0)}%
                  </td>
                  <td className="font-mono text-bm-red whitespace-nowrap">
                    {calcPartLine(line).toFixed(2)} zł
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() =>
                        setOrder({ ...order, parts: order.parts.filter((_, j) => j !== i) })
                      }
                      className="text-bm-muted hover:text-bm-red"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {showMore && (
      <>
      {/* Notes */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs uppercase text-bm-red">{w.internalNotes}</label>
          <textarea
            className="input-premium mt-1 min-h-[80px]"
            value={order.internalNotes}
            onChange={(e) => setOrder({ ...order, internalNotes: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs uppercase text-bm-muted">{w.clientNotes}</label>
          <textarea
            className="input-premium mt-1 min-h-[80px]"
            value={order.clientNotes}
            onChange={(e) => setOrder({ ...order, clientNotes: e.target.value })}
          />
        </div>
      </div>

      {/* Files */}
      <div className="crm-mw-card rounded-md p-6">
        <h3 className="font-display text-sm uppercase text-bm-red mb-4">{w.attachments}</h3>
        <div className="flex flex-wrap gap-3 mb-4">
          {(
            [
              ["before", w.photoBefore],
              ["after", w.photoAfter],
              ["repair", w.videoRepair],
              ["invoice", "PDF / Invoice"],
              ["warranty", w.warranty],
            ] as const
          ).map(([cat, label]) => (
            <label key={cat} className="btn-outline text-xs cursor-pointer">
              <Upload size={14} />
              {label}
              <input
                type="file"
                multiple
                accept={cat === "repair" ? "video/*,image/*" : "image/*,application/pdf,.doc,.docx"}
                className="hidden"
                onChange={(e) => handleFileUpload(e, cat)}
              />
            </label>
          ))}
        </div>
        <label className="flex items-center gap-2 mt-4 text-sm text-bm-muted cursor-pointer">
          <input
            type="checkbox"
            checked={!!order.showInGallery}
            onChange={(e) => setOrder({ ...order, showInGallery: e.target.checked })}
            className="accent-bm-red"
          />
          {w.showInGallery}
        </label>
        {order.files.length > 0 && (
          <ul className="grid sm:grid-cols-2 gap-2 text-sm mt-4">
            {order.files.map((f) => (
              <li key={f.id} className="flex justify-between glass rounded p-2">
                <span className="truncate">
                  [{f.category}] {f.name}
                </span>
                <button
                  type="button"
                  className="text-bm-red ml-2"
                  onClick={() =>
                    setOrder({ ...order, files: order.files.filter((x) => x.id !== f.id) })
                  }
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      </>
      )}

      {(showPaymentFields || (isNew && (createStep === "works" || createStep === "more"))) && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="crm-mw-card rounded-md p-4">
          <p className="text-xs text-bm-muted uppercase">{w.worksTotal}</p>
          <p className="font-display text-xl font-bold">{totals.servicesSub.toFixed(2)} zł</p>
        </div>
        <div className="crm-mw-card rounded-md p-4">
          <p className="text-xs text-bm-muted uppercase">{w.partsTotal}</p>
          <p className="font-display text-xl font-bold">{totals.partsSub.toFixed(2)} zł</p>
        </div>
        <div className="crm-mw-card rounded-md p-4">
          <p className="text-xs text-bm-muted uppercase">{w.discountAmount}</p>
          <p className="font-display text-xl text-bm-red">
            {totals.discountAmt > 0 ? `-${totals.discountAmt.toFixed(2)}` : "—"} zł
          </p>
        </div>
        <div className="crm-mw-card rounded-md p-4 border-bm-red">
          <p className="text-xs text-bm-muted uppercase">{w.clientTotal}</p>
          <p className="font-display text-2xl font-bold text-glow">
            {breakdown.grossTotal.toFixed(2)} zł
          </p>
          {order.vatEnabled && breakdown.vatAmount > 0 && (
            <p className="text-xs text-bm-muted mt-1">
              {w.vatAmount}: {breakdown.vatAmount.toFixed(2)} zł
            </p>
          )}
        </div>
        <div className="crm-mw-card rounded-md p-4 border-green-500/40 sm:col-span-2">
          <p className="text-xs text-bm-muted uppercase">{w.serviceProfit}</p>
          <p
            className={`font-display text-2xl font-bold ${
              totals.serviceProfit.total >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {totals.serviceProfit.total >= 0 ? "+" : ""}
            {totals.serviceProfit.total.toFixed(2)} zł
          </p>
          <p className="text-[11px] sm:text-xs text-bm-muted mt-2 leading-relaxed">
            {w.serviceProfitLabor}: +{totals.serviceProfit.laborMargin.toFixed(2)} zł ·{" "}
            {w.serviceProfitParts}: +{totals.serviceProfit.partsMargin.toFixed(2)} zł
            {totals.serviceProfit.partsCost > 0 &&
              ` · ${w.serviceProfitPartsCost}: ${totals.serviceProfit.partsCost.toFixed(2)} zł`}
            {totals.serviceProfit.mechanicPay > 0 &&
              ` · ${w.mechanicSalary}: −${totals.serviceProfit.mechanicPay.toFixed(2)} zł`}
          </p>
        </div>
        <div className="crm-mw-card rounded-md p-4">
          <p className="text-xs text-bm-muted uppercase">{c.profit} ({w.partsProfit})</p>
          <p className="font-display text-xl text-green-400">+{totals.partsProfit.toFixed(2)} zł</p>
        </div>
        <div className="crm-mw-card rounded-md p-4 sm:col-span-2 lg:col-span-1">
          <p className="text-xs text-bm-muted uppercase">{w.mechanicSalary}</p>
          <p className="font-display text-2xl text-amber-400">
            {totals.earnings.total.toFixed(2)} zł
          </p>
          <p className="text-xs text-bm-muted mt-2">
            {w.fromLabor}: {totals.earnings.fromLabor.toFixed(2)} zł ({totals.earnings.laborPercent}%)
            · {w.fromParts}: {totals.earnings.fromParts.toFixed(2)} zł ({totals.earnings.partsPercent}%)
            {totals.earnings.bonus > 0 && ` · ${w.bonus}: ${totals.earnings.bonus.toFixed(2)} zł`}
          </p>
        </div>
      </div>
      )}

      {client && vehicle && showDocuments && (
        <div className="crm-mw-card rounded-md p-6">
          <h3 className="font-display text-sm uppercase text-bm-red mb-4 flex items-center gap-2">
            <FileText size={16} /> {w.sendDocuments}
          </h3>
          <div className="mb-4">
            <label className="text-xs uppercase text-bm-muted block mb-2">
              {doc.signatureMode}
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase border transition-all ${
                  (order.signatureMode ?? "electronic") === "electronic"
                    ? "bg-bm-red/25 border-bm-red text-bm-red"
                    : "border-bm-border text-bm-muted hover:text-white"
                }`}
                onClick={() => setOrder({ ...order, signatureMode: "electronic" })}
              >
                {doc.signatureElectronic}
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase border transition-all ${
                  order.signatureMode === "physical"
                    ? "bg-bm-red/25 border-bm-red text-bm-red"
                    : "border-bm-border text-bm-muted hover:text-white"
                }`}
                onClick={() => setOrder({ ...order, signatureMode: "physical" as SignatureMode })}
              >
                {doc.signaturePhysical}
              </button>
            </div>
            <p className="text-[10px] text-bm-muted mt-2">{doc.signatureModeHint}</p>
          </div>
          <WorkOrderDocumentActions
            order={order}
            client={client}
            vehicle={vehicle}
            onDocumentLocaleChange={setDocumentLocale}
          />
          {order.signature && (order.signatureMode ?? "electronic") === "electronic" && (
            <div className="mt-4 pt-4 border-t border-bm-border text-xs text-bm-muted">
              <p className="text-green-400">{t.signature.confirmed}</p>
              <p>{new Date(order.signature.signedAt).toLocaleString()}</p>
              <p>IP: {order.signature.ip}</p>
              {order.signature.deviceInfo && <p className="truncate">{order.signature.deviceInfo}</p>}
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              className="text-xs"
              onClick={() => void downloadReceptionAct(order, vehicle, client)}
            >
              PDF przyjęcie
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-xs"
              onClick={() => void downloadDeliveryAct(order, vehicle, client)}
            >
              {c.pdfDeliveryAct}
            </Button>
          </div>
        </div>
      )}

      {isNew && createStep === "works" && (
        <div className="flex flex-wrap justify-between gap-2">
          <Button type="button" variant="outline" onClick={() => setCreateStep("client")}>
            {w.stepBack}
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setCreateStep("more")}>
              {w.stepMore}
            </Button>
            <Button type="button" onClick={save}>
              <Save size={16} /> {t.common.save}
            </Button>
          </div>
        </div>
      )}

      {isNew && createStep === "more" && (
        <div className="flex justify-start">
          <Button type="button" variant="outline" onClick={() => setCreateStep("works")}>
            {w.stepBack}
          </Button>
        </div>
      )}

      <div className="crm-sticky-actions">
        {existing && (
          <Button variant="outline" onClick={remove} className="text-red-600 border-red-300 mr-auto">
            <Trash2 size={16} /> {t.common.delete}
          </Button>
        )}
        <Button variant="outline" onClick={onClose}>
          <X size={16} /> {t.common.cancel}
        </Button>
        <Button onClick={save}>
          <Save size={16} /> {t.common.save}
        </Button>
      </div>
    </div>
  );
}
