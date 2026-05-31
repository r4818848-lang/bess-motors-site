"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { X, Wrench, Plus, Trash2, Search, QrCode } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { useCrmDisplay } from "@/contexts/CrmDisplayContext";
import {
  loadDb,
  saveDb,
  type WorkOrder,
  type WorkOrderLine,
  type Database,
} from "@/lib/store";
import { syncWarehouseFromWorkOrder } from "@/lib/warehouse-stock";
import {
  calcServiceLine,
  calcClientTotal,
  calcClientTotalWithVat,
  generateOrderNumber,
} from "@/lib/workorder-calc";
import { applyWorkOrderCompletedAt } from "@/lib/work-order-dates";
import {
  checklistLabel,
  quickCreateToggleItems,
} from "@/lib/reception-checklist";
import { crmWorkLineTemplates, workTemplateLabel } from "@/lib/crm-work-templates";
import { ClientVehiclePicker } from "./ClientVehiclePicker";
import { PriceNumberInput } from "@/components/ui/PriceNumberInput";
import { Button } from "@/components/ui/Button";

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
    signatureMode: "electronic",
    receptionChecklist: {},
  };
}

function newServiceLine(): WorkOrderLine {
  return { id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, name: "", qty: 1, price: 0, discount: 0 };
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
  const { t, locale } = useI18n();
  const c = t.crm;
  const w = t.wo;
  const { priceMode, setPriceMode } = useCrmDisplay();

  const [userId, setUserId] = useState(initialUserId ?? "");
  const [vehicleId, setVehicleId] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [receptionDate, setReceptionDate] = useState(new Date().toISOString().slice(0, 10));
  const [showReceptionDate, setShowReceptionDate] = useState(false);
  const [services, setServices] = useState<WorkOrderLine[]>([]);
  const [mechanicId, setMechanicId] = useState("");
  const [vatEnabled, setVatEnabled] = useState(true);
  const [receptionChecklist, setReceptionChecklist] = useState<Record<string, boolean>>({});
  const [showTemplates, setShowTemplates] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const fresh = loadDb();
    setMechanicId(fresh.mechanics[0]?.id ?? "");
    setVatEnabled(fresh.settings.vatEnabledByDefault ?? true);
    setServices([]);
    setReceptionChecklist({});
    setClientNotes("");
    setShowReceptionDate(false);
    setError("");
    if (initialUserId) {
      setUserId(initialUserId);
      const v = fresh.vehicles.find((x) => x.userId === initialUserId);
      setVehicleId(v?.id ?? "");
    } else {
      setUserId("");
      setVehicleId("");
    }
    setReceptionDate(new Date().toISOString().slice(0, 10));
  }, [open, initialUserId]);

  const draftOrder = useMemo((): WorkOrder => {
    const fresh = loadDb();
    return {
      ...emptyOrder(fresh),
      userId,
      vehicleId,
      services,
      mechanicId,
      clientNotes,
      vatEnabled,
      receptionChecklist,
      createdAt: receptionDate,
      updatedAt: receptionDate,
    };
  }, [userId, vehicleId, services, mechanicId, clientNotes, vatEnabled, receptionChecklist, receptionDate]);

  const vatRate = loadDb().settings.vatRate ?? 23;
  const displayTotal =
    priceMode === "gross" && vatEnabled
      ? calcClientTotalWithVat(draftOrder, vatRate)
      : calcClientTotal(draftOrder);

  const toggleFlag = (id: string) => {
    setReceptionChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const updateService = (index: number, patch: Partial<WorkOrderLine>) => {
    setServices((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const addTemplateLine = (name: string) => {
    setServices((prev) => [...prev, { ...newServiceLine(), name }]);
    setShowTemplates(false);
  };

  if (!open) return null;

  const db = loadDb();

  const handleCreate = () => {
    if (!userId || !vehicleId) {
      setError(w.selectClientVehicle);
      return;
    }
    const fresh = loadDb();
    const base = emptyOrder(fresh);
    const order: WorkOrder = applyWorkOrderCompletedAt({
      ...base,
      userId,
      vehicleId,
      clientNotes,
      services: services.length > 0 ? services : [{ ...newServiceLine(), name: "—" }],
      mechanicId: mechanicId || (fresh.mechanics[0]?.id ?? ""),
      vatEnabled,
      receptionChecklist,
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
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85"
      role="dialog"
      aria-modal
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="crm-modal-panel crm-create-order-modal w-full sm:max-w-5xl max-h-[96dvh] flex flex-col overflow-hidden safe-area-pb"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — Motowarsztat style */}
        <div className="shrink-0 flex flex-wrap items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 border-b border-bm-border bg-black">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Wrench className="text-bm-red shrink-0" size={22} />
            <h2 className="font-display font-bold uppercase text-sm sm:text-base text-white truncate">
              {c.quickCreateOrderTitle}
            </h2>
          </div>
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-[220px] min-w-[140px]">
            <QrCode size={16} className="text-bm-muted shrink-0" />
            <input
              className="input-premium text-xs py-1.5 flex-1 opacity-60"
              placeholder={c.aztecPlaceholder}
              disabled
              title={c.aztecSoon}
            />
          </div>
          <div className="crm-price-toggle shrink-0" role="group" aria-label={c.priceDisplayMode}>
            <button
              type="button"
              className={priceMode === "net" ? "active" : ""}
              onClick={() => setPriceMode("net")}
            >
              {c.netto}
            </button>
            <button
              type="button"
              className={priceMode === "gross" ? "active" : ""}
              onClick={() => setPriceMode("gross")}
            >
              {c.brutto}
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white shrink-0"
            aria-label={t.common.cancel}
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          <div className="space-y-2">
            <div className="flex justify-end">
              <button
                type="button"
                className="text-[10px] uppercase text-bm-red hover:underline font-bold"
                onClick={() => setShowReceptionDate((v) => !v)}
              >
                {c.setReceptionDate}
              </button>
            </div>
            {showReceptionDate && (
              <input
                type="date"
                className="input-premium text-sm max-w-xs"
                value={receptionDate}
                onChange={(e) => setReceptionDate(e.target.value)}
              />
            )}
            <ClientVehiclePicker
              userId={userId}
              vehicleId={vehicleId}
              onSelect={(uid, vid) => {
                setUserId(uid);
                setVehicleId(vid);
                setError("");
              }}
            />
            <Link
              href="/crm/calendar"
              className="inline-block text-xs text-bm-red hover:underline font-semibold"
            >
              {c.scheduleInCalendar}
            </Link>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-bm-muted block mb-1">
              {c.orderDescriptionLabel}
            </label>
            <textarea
              className="input-premium min-h-[72px] w-full"
              placeholder={c.orderDescriptionPlaceholder}
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
            />
          </div>

          {/* Task list */}
          <section className="crm-mw-card overflow-hidden">
            <div className="px-3 py-2.5 border-b border-bm-border bg-bm-graphite/80">
              <h3 className="font-display font-bold uppercase text-sm text-white">
                {c.taskListTitle}
              </h3>
            </div>
            <div className="table-scroll">
              <table className="crm-mw-table min-w-[640px]">
                <thead>
                  <tr>
                    <th>{c.name}</th>
                    <th className="w-14">{c.unitPcs}</th>
                    <th className="w-16">{c.qty}</th>
                    <th className="w-20">{c.price}</th>
                    <th className="w-14">{c.discount} %</th>
                    <th className="w-24 text-right">{c.cost}</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {services.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-bm-muted py-6 text-sm">
                        {c.noTaskData}
                      </td>
                    </tr>
                  ) : (
                    services.map((line, i) => (
                      <tr key={line.id}>
                        <td>
                          <input
                            className="input-premium text-sm py-1 min-w-[140px]"
                            value={line.name}
                            onChange={(e) => updateService(i, { name: e.target.value })}
                          />
                        </td>
                        <td className="text-xs text-bm-muted text-center">{c.unitPcs}</td>
                        <td>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            className="input-premium text-sm py-1 w-14"
                            value={line.qty}
                            onChange={(e) =>
                              updateService(i, { qty: Number(e.target.value) || 0 })
                            }
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
                        <td className="font-mono text-sm text-right whitespace-nowrap text-bm-red">
                          {calcServiceLine(line).toFixed(2)}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="text-bm-muted hover:text-red-400 p-1"
                            onClick={() =>
                              setServices((prev) => prev.filter((_, j) => j !== i))
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={6} className="text-right text-xs uppercase text-bm-muted">
                      {c.tableTotal}
                      <span className="block font-normal normal-case text-[9px]">
                        {priceMode === "gross" ? c.brutto : c.netto}
                      </span>
                    </td>
                    <td className="font-mono font-bold text-bm-red text-right">
                      {displayTotal.toFixed(2)} zł
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="flex flex-wrap items-center gap-2 p-3 border-t border-bm-border bg-bm-graphite/40">
              <Button
                type="button"
                className="text-xs"
                onClick={() => setServices((prev) => [...prev, newServiceLine()])}
              >
                <Plus size={14} /> {w.addWork}
              </Button>
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  className="text-xs"
                  onClick={() => setShowTemplates((v) => !v)}
                >
                  <Search size={14} /> {c.templates}
                </Button>
                {showTemplates && (
                  <ul className="absolute z-40 left-0 mt-1 min-w-[220px] crm-mw-card border border-bm-border shadow-xl py-1">
                    {crmWorkLineTemplates.map((tpl) => (
                      <li key={tpl.id}>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-bm-red/10"
                          onClick={() => addTemplateLine(workTemplateLabel(tpl, locale))}
                        >
                          {workTemplateLabel(tpl, locale)}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <select
                className="input-premium text-xs py-1.5 max-w-[180px] ml-auto"
                value={mechanicId}
                onChange={(e) => setMechanicId(e.target.value)}
                title={c.laborIntensity}
              >
                <option value="">{c.laborIntensity}</option>
                {db.mechanics.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Reception toggles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {quickCreateToggleItems.map((item) => (
              <label
                key={item.id}
                className="flex flex-col items-center gap-2 text-center cursor-pointer group"
              >
                <span className="text-[9px] uppercase tracking-wide text-bm-muted leading-tight min-h-[2.5rem] flex items-end">
                  {checklistLabel(item, locale)}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!!receptionChecklist[item.id]}
                  onClick={() => toggleFlag(item.id)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    receptionChecklist[item.id] ? "bg-bm-red" : "bg-bm-border"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      receptionChecklist[item.id] ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </label>
            ))}
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="shrink-0 flex flex-col-reverse sm:flex-row gap-2 justify-end px-4 py-3 border-t border-bm-border bg-bm-graphite/95">
          <Button type="button" variant="outline" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="button" onClick={handleCreate}>
            {c.createOrder}
          </Button>
        </div>
      </div>
    </div>
  );
}
