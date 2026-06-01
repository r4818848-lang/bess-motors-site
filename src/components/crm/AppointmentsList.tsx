"use client";

import { useState, useMemo } from "react";
import { useDbSync } from "@/hooks/useDbSync";
import Link from "next/link";
import { Filter, Pencil } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { loadDb } from "@/lib/store";
import { filterAppointments, getAppointmentContext } from "@/lib/appointments";
import type { RepairStatus } from "@/lib/store";

export function AppointmentsList() {
  const { t } = useI18n();
  const cal = t.calendar;
  const c = t.crm;
  const dbTick = useDbSync();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [mechanicId, setMechanicId] = useState("all");
  const [repairStatus, setRepairStatus] = useState<RepairStatus | "">("");
  const [clientQ, setClientQ] = useState("");
  const [plateQ, setPlateQ] = useState("");

  void dbTick;
  const db = loadDb();

  const rows = useMemo(() => {
    let list = filterAppointments(db.appointments, {
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      mechanicId,
      repairStatus,
    });
    if (clientQ) {
      const q = clientQ.toLowerCase();
      list = list.filter((a) => {
        const ctx = getAppointmentContext(db, a);
        const name = (a.clientName ?? ctx.client?.name ?? "").toLowerCase();
        const phone = a.clientPhone ?? ctx.client?.phone ?? ctx.contact.phone;
        return name.includes(q) || phone.includes(q);
      });
    }
    if (plateQ) {
      const q = plateQ.toLowerCase();
      list = list.filter((a) => {
        const v = db.vehicles.find((x) => x.id === a.vehicleId);
        return v?.plate.toLowerCase().includes(q);
      });
    }
    return [...list].sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
  }, [db, dateFrom, dateTo, mechanicId, repairStatus, clientQ, plateQ, dbTick]);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl uppercase text-glow">{cal.appointmentsTitle}</h2>

      <div className="glass-red rounded-xl p-5 neon-border">
        <div className="flex items-center gap-2 text-bm-red mb-4">
          <Filter size={16} />
          <span className="text-xs uppercase font-bold">{cal.filters}</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] text-bm-muted uppercase">{cal.dateFrom}</label>
            <input type="date" className="input-premium mt-1 text-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] text-bm-muted uppercase">{cal.dateTo}</label>
            <input type="date" className="input-premium mt-1 text-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] text-bm-muted uppercase">{cal.mechanic}</label>
            <select className="input-premium mt-1 text-sm" value={mechanicId} onChange={(e) => setMechanicId(e.target.value)}>
              <option value="all">{cal.all}</option>
              {db.mechanics.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-bm-muted uppercase">{cal.repairStatus}</label>
            <select className="input-premium mt-1 text-sm" value={repairStatus} onChange={(e) => setRepairStatus(e.target.value as RepairStatus | "")}>
              <option value="">{cal.all}</option>
              {(Object.keys(t.repairStatus) as RepairStatus[]).map((s) => (
                <option key={s} value={s}>{t.repairStatus[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-bm-muted uppercase">{cal.client}</label>
            <input className="input-premium mt-1 text-sm" value={clientQ} onChange={(e) => setClientQ(e.target.value)} placeholder={c.search} />
          </div>
          <div>
            <label className="text-[10px] text-bm-muted uppercase">{cal.plate}</label>
            <input className="input-premium mt-1 text-sm" value={plateQ} onChange={(e) => setPlateQ(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="glass-red rounded-xl overflow-hidden neon-border overflow-x-auto">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>{cal.date}</th>
              <th>{cal.time}</th>
              <th>{cal.client}</th>
              <th>{cal.vehicle}</th>
              <th>{cal.plate}</th>
              <th>{cal.repairStatus}</th>
              <th>{cal.mechanic}</th>
              <th>{cal.comment}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center text-bm-muted py-8">{c.noBookings}</td>
              </tr>
            ) : (
              rows.map((apt) => {
                const ctx = getAppointmentContext(db, apt);
                return (
                  <tr key={apt.id} className="hover:bg-white/5">
                    <td>{apt.date}</td>
                    <td className="font-mono text-bm-red">{apt.time}</td>
                    <td>
                      <div>{ctx.contact.name}</div>
                      <div className="text-[10px] text-bm-muted font-mono">{ctx.contact.phone}</div>
                    </td>
                    <td>{ctx.vehicle ? `${ctx.vehicle.make} ${ctx.vehicle.model}` : "—"}</td>
                    <td>{ctx.vehicle?.plate}</td>
                    <td>
                      <span className="status-pill bg-bm-red/20 text-bm-red text-[10px]">
                        {t.repairStatus[apt.repairStatus]}
                      </span>
                    </td>
                    <td>{ctx.mechanic?.name}</td>
                    <td className="max-w-[120px] truncate text-bm-muted text-xs">{apt.comment}</td>
                    <td>
                      <Link
                        href={`/crm/calendar?apt=${encodeURIComponent(apt.id)}`}
                        className="text-bm-red p-2 inline-flex"
                        title={cal.details}
                      >
                        <Pencil size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
