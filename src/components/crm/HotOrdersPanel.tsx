"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Phone,
  Calendar,
  Check,
  MessageSquare,
  FileText,
  Trash2,
  PhoneCall,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { useDbSync } from "@/hooks/useDbSync";
import { loadDb, saveDb, type CallRequest, type Appointment } from "@/lib/store";
import {
  getWebsiteHotOrders,
  filterHotOrders,
  getHotOrdersBadgeCount,
  type HotOrderFilter,
} from "@/lib/hot-orders";
import { createWorkOrderFromAppointment } from "@/lib/create-work-order-from-booking";
import { deleteAppointmentFromCloud } from "@/lib/cloud-appointments";
import { pushCrmDelete, pushCrmSave } from "@/lib/cloud-crm-db";
import { syncAppointmentToCloud } from "@/lib/appointment-cloud-sync";
import { Button } from "@/components/ui/Button";

const FILTERS: HotOrderFilter[] = [
  "all",
  "new",
  "awaiting_call",
  "confirmed",
  "in_progress",
  "completed",
];

export function HotOrdersPanel({ onUpdate }: { onUpdate?: () => void }) {
  const { t } = useI18n();
  const c = t.crm;
  const cal = t.calendar;
  const tick = useDbSync();
  const [filter, setFilter] = useState<HotOrderFilter>("all");

  const db = loadDb();
  void tick;

  const serviceLabel = (id: string) =>
    t.serviceItems[id as keyof typeof t.serviceItems] ?? id;

  const allOrders = useMemo(
    () => getWebsiteHotOrders(db, serviceLabel),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick, t]
  );

  const badgeCount = getHotOrdersBadgeCount(allOrders);
  const orders = filterHotOrders(allOrders, filter);

  const filterLabel = (f: HotOrderFilter) => {
    const map: Record<HotOrderFilter, string> = {
      all: c.hotFilterAll,
      new: c.hotFilterNew,
      awaiting_call: c.hotFilterAwaitingCall,
      confirmed: c.hotFilterConfirmed,
      in_progress: c.hotFilterInProgress,
      completed: c.hotFilterCompleted,
    };
    return map[f];
  };

  const refresh = () => onUpdate?.();

  const setCallStatus = async (id: string, status: CallRequest["status"]) => {
    const next = loadDb();
    const r = next.callRequests.find((x) => x.id === id);
    if (r) r.status = status;
    saveDb(next);
    const ok = await pushCrmSave(next);
    if (!ok) return;
    refresh();
  };

  const confirmBooking = async (id: string) => {
    const next = loadDb();
    const apt = next.appointments.find((x) => x.id === id);
    if (!apt) return;
    createWorkOrderFromAppointment(next, apt, serviceLabel);
    saveDb(next);
    const ok = await syncAppointmentToCloud(next, apt);
    if (!ok) return;
    refresh();
  };

  const setBookingStatus = async (id: string, status: Appointment["appointmentStatus"]) => {
    if (status === "confirmed") {
      await confirmBooking(id);
      return;
    }
    const next = loadDb();
    const a = next.appointments.find((x) => x.id === id);
    if (!a) return;
    a.appointmentStatus = status;
    saveDb(next);
    const ok = await syncAppointmentToCloud(next, a);
    if (!ok) return;
    refresh();
  };

  const workOrderIdFor = (row: (typeof orders)[0]) =>
    row.kind === "booking" ? row.workOrderId ?? null : null;

  const deleteHotOrder = async (row: (typeof orders)[0]) => {
    const woId = workOrderIdFor(row);
    const msg = woId ? c.confirmDeleteHotOrderWithWo : c.confirmDeleteHotOrder;
    if (!confirm(msg)) return;
    if (row.kind === "booking") {
      await deleteAppointmentFromCloud(row.id);
    }

    const next = loadDb();
    if (row.kind === "booking") {
      const apt = next.appointments.find((x) => x.id === row.id);
      if (apt?.workOrderId) {
        next.workOrders = next.workOrders.filter((o) => o.id !== apt.workOrderId);
      }
      next.appointments = next.appointments.filter((x) => x.id !== row.id);
    } else {
      next.callRequests = next.callRequests.filter((x) => x.id !== row.id);
    }
    saveDb(next);
    const ok = await pushCrmDelete(next);
    if (!ok) return;
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-bm-red/20 text-bm-red shadow-neon-sm">
            <Flame size={22} />
          </div>
          <div>
            <h2 className="font-display text-xl uppercase text-glow">{c.hotOrders}</h2>
            <p className="text-xs text-bm-muted mt-1">{c.hotOrdersHint}</p>
          </div>
        </div>
        <AnimatePresence>
          {badgeCount > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="hot-badge-pulse flex items-center gap-2 px-4 py-2 rounded-full bg-bm-red/20 border-2 border-bm-red shadow-neon-sm"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bm-red opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-bm-red" />
              </span>
              <span className="font-display font-bold text-bm-red text-lg">{badgeCount}</span>
              <span className="text-xs uppercase text-bm-muted">{c.newOrdersBadge}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
              filter === f
                ? "bg-bm-red text-white shadow-neon-sm"
                : "glass text-bm-muted hover:text-white border border-bm-border/50"
            }`}
          >
            {filterLabel(f)}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="glass-red rounded-xl p-12 text-center neon-border">
          <Flame className="w-12 h-12 text-bm-muted mx-auto mb-4 opacity-40" />
          <p className="text-bm-muted">{c.hotOrdersEmpty}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {orders.map((row) => {
              const isCall = row.kind === "call";
              const isCallPending = isCall && row.status === "needs_call";
              return (
                <motion.article
                  key={`${row.kind}-${row.id}`}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className={`rounded-xl p-5 neon-border border-l-4 ${
                    isCallPending
                      ? "hot-order-call-pulse glass-red border-l-amber-500 bg-amber-500/5"
                      : "glass-red border-l-bm-red"
                  }`}
                >
                  <div className="flex flex-wrap gap-4 justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {isCallPending && (
                          <span className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/30 text-amber-300 border border-amber-500/50">
                            <PhoneCall size={12} className="animate-pulse" />
                            {c.callRequestBadge}
                          </span>
                        )}
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            isCall
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-bm-red/20 text-bm-red"
                          }`}
                        >
                          {isCall ? c.hotOrderCall : c.hotOrderBooking}
                        </span>
                        {row.isActionRequired && (
                          <span className="hot-badge-pulse h-2 w-2 rounded-full bg-bm-red" />
                        )}
                        <span className="text-[10px] text-bm-muted uppercase">
                          {new Date(row.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="font-semibold text-lg text-white">{row.clientName}</p>
                      <a
                        href={`tel:${row.phone.replace(/\s/g, "")}`}
                        className="font-mono text-bm-red font-bold mt-1 inline-flex items-center gap-1 hover:underline"
                      >
                        <Phone size={14} />
                        {row.phone}
                      </a>
                      <p className="text-sm text-white/90 mt-2 font-medium">{row.serviceLabel}</p>
                      {row.kind === "booking" && row.date && (
                        <p className="text-xs text-bm-muted mt-1 flex items-center gap-1">
                          <Calendar size={12} />
                          {row.date} · {row.time}
                        </p>
                      )}
                      {row.comment && (
                        <p className="text-xs text-bm-muted mt-2 italic flex gap-1">
                          <MessageSquare size={12} className="shrink-0 mt-0.5" />
                          {row.comment}
                        </p>
                      )}
                      <p className="text-[10px] text-bm-muted mt-2 uppercase">
                        {isCall && row.status === "needs_call"
                          ? c.awaitingCallLabel
                          : isCall
                            ? c.callStatus[row.status as keyof typeof c.callStatus]
                            : c.bookingStatus[row.status as keyof typeof c.bookingStatus]}
                      </p>
                      {workOrderIdFor(row) && (
                        <p className="text-[10px] text-bm-red mt-1">{c.workOrderFromBooking}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {isCallPending && (
                        <Button
                          variant="outline"
                          className="text-xs whitespace-nowrap border-amber-500/50 text-amber-300"
                          onClick={() => setCallStatus(row.id, "called")}
                        >
                          <Check size={14} /> {c.markCalled}
                        </Button>
                      )}
                      {row.kind === "booking" && row.status === "scheduled" && (
                        <Button
                          variant="outline"
                          className="text-xs whitespace-nowrap"
                          onClick={() => confirmBooking(row.id)}
                        >
                          <Check size={14} /> {c.confirmBooking}
                        </Button>
                      )}
                      {workOrderIdFor(row) && (
                        <Link
                          href={`/crm/work-orders?edit=${workOrderIdFor(row)}`}
                          className="text-xs py-2 px-3 rounded-lg glass border border-bm-border text-bm-red hover:shadow-neon-sm flex items-center justify-center gap-1"
                        >
                          <FileText size={14} /> {cal.openWorkOrder}
                        </Link>
                      )}
                      {row.kind === "booking" && row.status === "confirmed" && (
                        <Button
                          variant="outline"
                          className="text-xs whitespace-nowrap"
                          onClick={() => setBookingStatus(row.id, "completed")}
                        >
                          <Check size={14} /> {c.completeBooking}
                        </Button>
                      )}
                      <a
                        href={`tel:${row.phone.replace(/\s/g, "")}`}
                        className="btn-primary text-xs py-2 text-center flex items-center justify-center gap-1"
                      >
                        <Phone size={14} /> {c.callClient}
                      </a>
                      <Button
                        variant="outline"
                        className="text-xs whitespace-nowrap text-red-400 border-red-500/40 hover:bg-red-500/10"
                        onClick={() => deleteHotOrder(row)}
                      >
                        <Trash2 size={14} /> {c.deleteHotOrder}
                      </Button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export function useHotOrdersBadgeCount(): number {
  const tick = useDbSync();
  const { t } = useI18n();
  return useMemo(() => {
    const db = loadDb();
    void tick;
    const label = (id: string) =>
      t.serviceItems[id as keyof typeof t.serviceItems] ?? id;
    return getHotOrdersBadgeCount(getWebsiteHotOrders(db, label));
  }, [tick, t]);
}
