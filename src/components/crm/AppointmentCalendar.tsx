"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { Fragment } from "react";
import { ChevronLeft, ChevronRight, GripVertical, ExternalLink } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import {
  loadDb,
  saveDb,
  type Appointment,
  type AppointmentStatus,
  type RepairStatus,
} from "@/lib/store";
import { createWorkOrderFromAppointment } from "@/lib/create-work-order-from-booking";
import { syncAppointmentToCloud } from "@/lib/appointment-cloud-sync";
import {
  WORK_HOURS,
  CalendarView,
  formatDateKey,
  addDays,
  startOfWeek,
  getAppointmentContext,
} from "@/lib/appointments";
import { handleAppointmentNotification } from "@/lib/client-notifications";
import { Button } from "@/components/ui/Button";
import { useDbSync } from "@/hooks/useDbSync";

const statuses: RepairStatus[] = [
  "received",
  "diagnostic",
  "repair",
  "waitingParts",
  "ready",
  "delivered",
];

const appointmentStatuses: AppointmentStatus[] = [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
];

interface Props {
  role?: "admin" | "mechanic";
  mechanicId?: string;
  /** Open details panel (from /crm/calendar?apt=…) */
  initialAptId?: string;
}

export function AppointmentCalendar({
  role = "admin",
  mechanicId,
  initialAptId,
}: Props) {
  const { t } = useI18n();
  const cal = t.calendar;
  const c = t.crm;
  const [view, setView] = useState<CalendarView>("week");
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const dbTick = useDbSync();
  const db = loadDb();
  void dbTick;

  const serviceLabel = useCallback(
    (id: string) => t.serviceItems[id as keyof typeof t.serviceItems] ?? id,
    [t.serviceItems]
  );

  useEffect(() => {
    if (!initialAptId) return;
    const apt = db.appointments.find((a) => a.id === initialAptId);
    if (!apt) return;
    setSelected(apt);
    const d = new Date(`${apt.date}T12:00:00`);
    if (!Number.isNaN(d.getTime())) setCursor(d);
  }, [initialAptId, dbTick]);

  const appointments = useMemo(() => {
    let list = db.appointments;
    if (role === "mechanic" && mechanicId) {
      list = list.filter((a) => a.mechanicId === mechanicId);
    }
    return list;
  }, [db.appointments, role, mechanicId, dbTick]);

  const weekStart = startOfWeek(cursor);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const monthGrid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = startOfWeek(first);
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const aptsBySlot = useCallback(
    (date: string, time?: string) =>
      appointments.filter((a) => a.date === date && (!time || a.time === time)),
    [appointments]
  );

  const persistApt = async (fresh: ReturnType<typeof loadDb>, apt: Appointment) => {
    setSyncing(true);
    const ok = await syncAppointmentToCloud(fresh, apt);
    setSyncing(false);
    if (!ok) alert(c.syncFailed);
    setSelected({ ...apt });
  };

  const moveAppointment = (id: string, date: string, time: string) => {
    const fresh = loadDb();
    const apt = fresh.appointments.find((a) => a.id === id);
    if (!apt) return;
    const previous = { date: apt.date, time: apt.time, appointmentStatus: apt.appointmentStatus };
    apt.date = date;
    apt.time = time;
    handleAppointmentNotification(fresh, apt, "rescheduled", previous);
    saveDb(fresh);
    void persistApt(fresh, apt);
  };

  const updateSelected = (patch: Partial<Appointment>) => {
    if (!selected) return;
    const fresh = loadDb();
    const apt = fresh.appointments.find((a) => a.id === selected.id);
    if (!apt) return;
    const previous = {
      date: apt.date,
      time: apt.time,
      appointmentStatus: apt.appointmentStatus,
    };
    const wantsConfirm = patch.appointmentStatus === "confirmed";
    Object.assign(apt, patch);
    if (patch.date !== undefined || patch.time !== undefined) {
      handleAppointmentNotification(fresh, apt, "rescheduled", previous);
    }
    if (wantsConfirm && !apt.workOrderId) {
      createWorkOrderFromAppointment(fresh, apt, serviceLabel);
    }
    saveDb(fresh);
    void persistApt(fresh, apt);
  };

  const confirmSelectedBooking = () => {
    if (!selected || role === "mechanic") return;
    const fresh = loadDb();
    const apt = fresh.appointments.find((a) => a.id === selected.id);
    if (!apt || apt.workOrderId) return;
    createWorkOrderFromAppointment(fresh, apt, serviceLabel);
    saveDb(fresh);
    void persistApt(fresh, apt);
  };

  const navLabel =
    view === "month"
      ? cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })
      : view === "week"
        ? `${formatDateKey(weekDays[0])} — ${formatDateKey(weekDays[6])}`
        : formatDateKey(cursor);

  const AptCard = ({ apt, compact }: { apt: Appointment; compact?: boolean }) => {
    const ctx = getAppointmentContext(db, apt);
    return (
      <div
        draggable
        onDragStart={() => setDragId(apt.id)}
        onDragEnd={() => setDragId(null)}
        onClick={() => setSelected(apt)}
        className={`rounded-md border border-bm-red/40 bg-bm-red/15 px-2 py-1 text-left cursor-grab active:cursor-grabbing hover:bg-bm-red/25 transition-all ${
          dragId === apt.id ? "opacity-50" : ""
        } ${selected?.id === apt.id ? "ring-2 ring-bm-red" : ""}`}
      >
        <div className="flex items-center gap-1">
          <GripVertical className="w-3 h-3 text-bm-muted shrink-0" />
          <span className="font-mono text-[10px] text-bm-red font-bold">{apt.time}</span>
        </div>
        {!compact && (
          <>
            <p className="text-[10px] font-semibold truncate">{ctx.contact.name}</p>
            <p className="text-[9px] text-bm-muted truncate">
              {ctx.vehicle?.make} {ctx.vehicle?.plate}
            </p>
          </>
        )}
      </div>
    );
  };

  const DropSlot = ({
    date,
    time,
    children,
    className = "",
  }: {
    date: string;
    time: string;
    children?: React.ReactNode;
    className?: string;
  }) => (
    <div
      className={`min-h-[52px] border-b border-bm-border/30 p-0.5 ${className}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("aptId") || dragId;
        if (id) moveAppointment(id, date, time);
      }}
    >
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-xl uppercase text-glow">{cal.title}</h2>
        <div className="flex flex-wrap gap-2">
          {(["day", "week", "month"] as CalendarView[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`px-4 py-2 rounded-lg text-xs uppercase ${
                view === v ? "bg-bm-red shadow-neon-sm" : "glass text-bm-muted"
              }`}
            >
              {cal[v]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between glass-red rounded-lg p-3 neon-border">
        <button type="button" onClick={() => setCursor(addDays(cursor, view === "month" ? -30 : view === "week" ? -7 : -1))} className="p-2 hover:text-bm-red">
          <ChevronLeft />
        </button>
        <span className="font-display font-bold uppercase text-sm">{navLabel}</span>
        <button type="button" onClick={() => setCursor(addDays(cursor, view === "month" ? 30 : view === "week" ? 7 : 1))} className="p-2 hover:text-bm-red">
          <ChevronRight />
        </button>
        <Button variant="outline" className="text-xs" onClick={() => setCursor(new Date())}>
          {cal.today}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-red rounded-xl overflow-hidden neon-border">
          {view === "week" && (
            <div className="overflow-x-auto">
              <div className="grid grid-cols-8 min-w-[700px]">
                <div className="border-b border-bm-border bg-bm-graphite p-2 text-[10px] text-bm-muted" />
                {weekDays.map((d) => (
                  <div key={d.toISOString()} className="border-b border-bm-border bg-bm-red/10 p-2 text-center text-xs font-bold">
                    {d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}
                  </div>
                ))}
                {WORK_HOURS.map((time) => (
                  <Fragment key={time}>
                    <div className="border-b border-bm-border/50 p-2 text-[10px] text-bm-muted font-mono">
                      {time}
                    </div>
                    {weekDays.map((d) => {
                      const dk = formatDateKey(d);
                      const slotApts = aptsBySlot(dk, time);
                      return (
                        <DropSlot key={`${dk}-${time}`} date={dk} time={time}>
                          {slotApts.map((apt) => (
                            <div
                              key={apt.id}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData("aptId", apt.id);
                                setDragId(apt.id);
                              }}
                            >
                              <AptCard apt={apt} compact />
                            </div>
                          ))}
                        </DropSlot>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
          )}

          {view === "day" && (
            <div>
              <div className="p-3 border-b border-bm-border bg-bm-red/10 font-display text-sm uppercase">
                {cursor.toLocaleDateString(undefined, { weekday: "long", dateStyle: "long" })}
              </div>
              {WORK_HOURS.map((time) => {
                const dk = formatDateKey(cursor);
                const slotApts = aptsBySlot(dk, time);
                return (
                  <DropSlot key={time} date={dk} time={time} className="flex gap-2 px-2">
                    <span className="w-12 text-xs text-bm-muted font-mono py-2">{time}</span>
                    <div className="flex-1 flex flex-wrap gap-1 py-1">
                      {slotApts.map((apt) => (
                        <div
                          key={apt.id}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData("aptId", apt.id)}
                          className="flex-1 min-w-[140px]"
                        >
                          <AptCard apt={apt} />
                        </div>
                      ))}
                    </div>
                  </DropSlot>
                );
              })}
            </div>
          )}

          {view === "month" && (
            <div className="grid grid-cols-7">
              {["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"].map((d) => (
                <div key={d} className="p-2 text-center text-[10px] text-bm-red border-b border-bm-border">
                  {d}
                </div>
              ))}
              {monthGrid.map((d) => {
                const dk = formatDateKey(d);
                const dayApts = aptsBySlot(dk);
                const inMonth = d.getMonth() === cursor.getMonth();
                return (
                  <div
                    key={dk}
                    className={`min-h-[80px] border border-bm-border/30 p-1 ${inMonth ? "" : "opacity-30"}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const id = e.dataTransfer.getData("aptId") || dragId;
                      if (id) moveAppointment(id, dk, "09:00");
                    }}
                  >
                    <span className="text-[10px] text-bm-muted">{d.getDate()}</span>
                    <div className="space-y-0.5 mt-1">
                      {dayApts.slice(0, 3).map((apt) => (
                        <AptCard key={apt.id} apt={apt} compact />
                      ))}
                      {dayApts.length > 3 && (
                        <span className="text-[9px] text-bm-red">+{dayApts.length - 3}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="glass-red rounded-xl p-5 neon-border h-fit sticky top-24">
          <h3 className="font-display text-sm uppercase text-bm-red mb-4">{cal.details}</h3>
          {!selected ? (
            <p className="text-sm text-bm-muted">{cal.selectHint}</p>
          ) : (
            <div className="space-y-4 text-sm">
              {(() => {
                const ctx = getAppointmentContext(db, selected);
                return (
                  <>
                    <p>
                      <span className="text-bm-muted">{cal.client}:</span> {ctx.contact.name}
                      {ctx.contact.phone && (
                        <span className="block font-mono text-bm-red text-xs mt-0.5">
                          {ctx.contact.phone}
                        </span>
                      )}
                    </p>
                    <p>
                      <span className="text-bm-muted">{cal.vehicle}:</span> {ctx.vehicle?.make}{" "}
                      {ctx.vehicle?.model}
                    </p>
                    <p>
                      <span className="text-bm-muted">{cal.plate}:</span> {ctx.vehicle?.plate}
                    </p>
                    <p>
                      <span className="text-bm-muted">{cal.date}:</span> {selected.date} {selected.time}
                    </p>
                    <p>
                      <span className="text-bm-muted">{cal.services}:</span>{" "}
                      {selected.serviceIds
                        .map((id) => t.serviceItems[id as keyof typeof t.serviceItems] ?? id)
                        .join(", ")}
                    </p>
                    <div>
                      <label className="text-xs text-bm-muted uppercase">{c.status}</label>
                      <select
                        className="input-premium mt-1 text-sm"
                        value={selected.appointmentStatus}
                        disabled={syncing || role === "mechanic"}
                        onChange={(e) =>
                          updateSelected({
                            appointmentStatus: e.target.value as AppointmentStatus,
                          })
                        }
                      >
                        {appointmentStatuses.map((s) => (
                          <option key={s} value={s}>
                            {c.bookingStatus[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                    {role === "admin" &&
                      selected.appointmentStatus === "scheduled" &&
                      !selected.workOrderId && (
                        <Button
                          className="w-full text-xs"
                          disabled={syncing}
                          onClick={confirmSelectedBooking}
                        >
                          {c.bookingStatus.confirmed}
                        </Button>
                      )}
                    <div>
                      <label className="text-xs text-bm-muted uppercase">{cal.mechanic}</label>
                      <select
                        className="input-premium mt-1 text-sm"
                        value={selected.mechanicId}
                        onChange={(e) => updateSelected({ mechanicId: e.target.value })}
                        disabled={role === "mechanic"}
                      >
                        {db.mechanics.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-bm-muted uppercase">{cal.repairStatus}</label>
                      <select
                        className="input-premium mt-1 text-sm"
                        value={selected.repairStatus}
                        onChange={(e) =>
                          updateSelected({ repairStatus: e.target.value as RepairStatus })
                        }
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>
                            {t.repairStatus[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-bm-muted uppercase">{cal.time}</label>
                      <select
                        className="input-premium mt-1 text-sm"
                        value={selected.time}
                        onChange={(e) => updateSelected({ time: e.target.value })}
                      >
                        {WORK_HOURS.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                    {selected.comment && (
                      <p className="text-xs text-bm-muted border-l-2 border-bm-red pl-2">
                        {selected.comment}
                      </p>
                    )}
                    {selected.workOrderId && (
                      <Link
                        href={`/crm/work-orders?edit=${selected.workOrderId}`}
                        className="btn-outline w-full text-center text-xs flex items-center justify-center gap-2"
                      >
                        <ExternalLink size={14} /> {cal.openWorkOrder}
                      </Link>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
