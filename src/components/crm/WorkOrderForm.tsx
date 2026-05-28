"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, Search, Save, X, Upload, FileText } from "lucide-react";
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
  deriveDocumentStatus,
} from "@/lib/store";
import { PAYMENT_METHODS } from "@/lib/payment";
import { searchClientsAndVehicles } from "@/lib/workorder-search";
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
  calcOrderBreakdown,
  generateOrderNumber,
} from "@/lib/workorder-calc";
import { Button } from "@/components/ui/Button";
import { VehicleClientEditor } from "@/components/crm/VehicleClientEditor";
import { WorkOrderDocumentActions } from "@/components/work-order/WorkOrderDocumentActions";

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
    services: [],
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
  onClose: () => void;
  onSaved: () => void;
}

export function WorkOrderForm({ orderId, onClose, onSaved }: WorkOrderFormProps) {
  const { t, locale } = useI18n();
  const w = t.wo;
  const c = t.crm;
  const doc = t.document;
  const docSt = t.documentStatus;
  const pm = t.paymentMethods;
  const ps = t.paymentStatus;

  const db = loadDb();
  const existing = orderId ? db.workOrders.find((o) => o.id === orderId) : null;

  const [order, setOrder] = useState<WorkOrder>(existing ?? emptyOrder(db));
  const [searchQ, setSearchQ] = useState("");
  const [showSearch, setShowSearch] = useState(!existing);

  const searchResults = useMemo(
    () => (searchQ.length >= 2 ? searchClientsAndVehicles(db, searchQ) : []),
    [searchQ, db]
  );

  const mechProfile = db.mechanics.find((m) => m.id === order.mechanicId);

  const totals = useMemo(() => {
    const servicesSub = calcServicesSubtotal(order);
    const partsSub = calcPartsSubtotal(order);
    const sub = calcSubtotal(order);
    const discountAmt = calcOrderDiscountAmount(order);
    const clientTotal = calcClientTotal(order);
    const partsProfit = calcPartsProfit(order);
    const earnings = calcMechanicEarnings(order, db.settings, mechProfile);
    return {
      servicesSub,
      partsSub,
      sub,
      discountAmt,
      clientTotal,
      partsProfit,
      earnings,
    };
  }, [order, mechProfile, db.settings]);

  const selectClientVehicle = (userId: string, vehicleId: string | null) => {
    setOrder((o) => ({
      ...o,
      userId,
      vehicleId: vehicleId ?? o.vehicleId,
    }));
    setShowSearch(false);
    setSearchQ("");
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

  const save = () => {
    if (!order.userId || !order.vehicleId) {
      alert(w.selectClientVehicle);
      return;
    }
    const fresh = loadDb();
    const idx = fresh.workOrders.findIndex((o) => o.id === order.id);
    const previousOrder = idx >= 0 ? { ...fresh.workOrders[idx] } : null;
    const documentStatus =
      order.documentStatus ??
      deriveDocumentStatus(order.status, order.confirmationStatus);
    const isPaid = order.paymentStatus === "paid";
    const updated = {
      ...order,
      documentStatus,
      updatedAt: new Date().toISOString().slice(0, 10),
      paymentStatus: order.paymentStatus ?? "unpaid",
      ...(isPaid
        ? { paidAt: order.paidAt ?? new Date().toISOString().slice(0, 10) }
        : {
            paidAt: undefined,
            paymentMethod: undefined,
            paidCashAmount: undefined,
            paidCardAmount: undefined,
          }),
    };
    if (idx >= 0) fresh.workOrders[idx] = updated;
    else fresh.workOrders.push(updated);
    handleWorkOrderClientNotifications(fresh, updated, previousOrder);
    saveDb(fresh);
    onSaved();
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold uppercase text-glow">
            {existing ? w.editOrder : w.newOrder}
          </h2>
          <p className="font-mono text-bm-red mt-1">{order.number}</p>
        </div>
        <div className="flex gap-2">
          {existing && (
            <Button variant="outline" onClick={remove} className="text-red-400 border-red-400/50">
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

      {/* Client / vehicle search */}
      <div className="glass-red rounded-xl p-6 neon-border">
        <h3 className="font-display text-sm uppercase text-bm-red mb-4">{w.searchClient}</h3>
        {client && !showSearch ? (
          <div className="space-y-4">
            <Button variant="outline" className="text-xs" onClick={() => setShowSearch(true)}>
              {w.changeClient}
            </Button>
            <VehicleClientEditor
              userId={order.userId}
              vehicleId={order.vehicleId}
              onVehicleId={(id) => setOrder((o) => ({ ...o, vehicleId: id }))}
            />
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bm-muted" />
              <input
                className="input-premium pl-10"
                placeholder={c.search}
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
              />
            </div>
            {searchResults.length > 0 && (
              <ul className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                {searchResults.map((r) => (
                  <li key={`${r.user.id}-${r.vehicle?.id}`}>
                    <button
                      type="button"
                      onClick={() =>
                        selectClientVehicle(r.user.id, r.vehicle?.id ?? "")
                      }
                      className="w-full text-left glass rounded-lg p-3 hover:border-bm-red/50 text-sm"
                    >
                      <span className="font-semibold">{r.user.name}</span>
                      <span className="text-bm-muted ml-2">{r.user.phone}</span>
                      {r.vehicle && (
                        <p className="text-bm-red text-xs mt-1">
                          {r.vehicle.make} {r.vehicle.model} · {r.vehicle.plate}
                        </p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {client && vehicle && (
        <div className="glass-red rounded-xl p-6 neon-border">
          <h3 className="font-display text-sm uppercase text-bm-red mb-4 flex items-center gap-2">
            <FileText size={16} /> {w.sendDocuments}
          </h3>
          <WorkOrderDocumentActions order={order} client={client} vehicle={vehicle} />
          {order.signature && (
            <div className="mt-4 pt-4 border-t border-bm-border text-xs text-bm-muted">
              <p className="text-green-400">{t.signature.confirmed}</p>
              <p>{new Date(order.signature.signedAt).toLocaleString()}</p>
              <p>IP: {order.signature.ip}</p>
              {order.signature.deviceInfo && <p className="truncate">{order.signature.deviceInfo}</p>}
            </div>
          )}
        </div>
      )}

      {/* Status + mechanic */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="text-xs uppercase text-bm-muted">{doc.documentStatus}</label>
          <select
            className="input-premium mt-1"
            value={order.documentStatus ?? "awaiting_signature"}
            onChange={(e) =>
              setOrder({ ...order, documentStatus: e.target.value as DocumentStatus })
            }
          >
            {documentStatuses.map((s) => (
              <option key={s} value={s}>
                {docSt[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs uppercase text-bm-muted">{c.status}</label>
          <select
            className="input-premium mt-1"
            value={order.status}
            onChange={(e) => {
              const status = e.target.value as RepairStatus;
              setOrder({
                ...order,
                status,
                documentStatus:
                  order.documentStatus && order.confirmationStatus === "confirmed"
                    ? order.documentStatus
                    : deriveDocumentStatus(status, order.confirmationStatus),
              });
            }}
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {t.repairStatus[s]}
              </option>
            ))}
          </select>
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
        <div>
          <label className="text-xs uppercase text-bm-muted">{w.orderDiscount}</label>
          <input
            type="number"
            className="input-premium mt-1"
            min={0}
            max={100}
            value={order.orderDiscount}
            onChange={(e) => setOrder({ ...order, orderDiscount: Number(e.target.value) })}
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

      <div className="glass-red rounded-xl p-6 neon-border space-y-4">
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
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  className="input-premium mt-1"
                  value={order.paidCashAmount ?? ""}
                  onChange={(e) =>
                    setOrder({
                      ...order,
                      paidCashAmount: e.target.value === "" ? undefined : Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="text-xs uppercase text-bm-muted">{w.paidCardPart}</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  className="input-premium mt-1"
                  value={order.paidCardAmount ?? ""}
                  onChange={(e) =>
                    setOrder({
                      ...order,
                      paidCardAmount: e.target.value === "" ? undefined : Number(e.target.value),
                    })
                  }
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Services table */}
      <div className="glass-red rounded-xl overflow-hidden neon-border">
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
                    <input
                      type="number"
                      className="input-premium text-sm py-1 w-20"
                      value={line.price}
                      onChange={(e) => updateService(i, { price: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="input-premium text-sm py-1 w-14"
                      value={line.discount}
                      onChange={(e) => updateService(i, { discount: Number(e.target.value) })}
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

      {/* Parts table */}
      <div className="glass-red rounded-xl overflow-hidden neon-border">
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
                    <input
                      type="number"
                      className="input-premium text-sm py-1 w-18"
                      value={line.purchasePrice}
                      onChange={(e) => updatePart(i, { purchasePrice: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="input-premium text-sm py-1 w-18"
                      value={line.sellPrice}
                      onChange={(e) => updatePart(i, { sellPrice: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="input-premium text-sm py-1 w-12"
                      value={line.discount}
                      onChange={(e) => updatePart(i, { discount: Number(e.target.value) })}
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
      <div className="glass-red rounded-xl p-6 neon-border">
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

      {/* Totals panel */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-red rounded-xl p-4 neon-border">
          <p className="text-xs text-bm-muted uppercase">{w.worksTotal}</p>
          <p className="font-display text-xl font-bold">{totals.servicesSub.toFixed(2)} zł</p>
        </div>
        <div className="glass-red rounded-xl p-4 neon-border">
          <p className="text-xs text-bm-muted uppercase">{w.partsTotal}</p>
          <p className="font-display text-xl font-bold">{totals.partsSub.toFixed(2)} zł</p>
        </div>
        <div className="glass-red rounded-xl p-4 neon-border">
          <p className="text-xs text-bm-muted uppercase">{w.discountAmount}</p>
          <p className="font-display text-xl text-bm-red">-{totals.discountAmt.toFixed(2)} zł</p>
        </div>
        <div className="glass-red rounded-xl p-4 neon-border border-bm-red">
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
        <div className="glass-red rounded-xl p-4 neon-border">
          <p className="text-xs text-bm-muted uppercase">{c.profit} ({w.partsProfit})</p>
          <p className="font-display text-xl text-green-400">+{totals.partsProfit.toFixed(2)} zł</p>
        </div>
        <div className="glass-red rounded-xl p-4 neon-border sm:col-span-2">
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
    </div>
  );
}
