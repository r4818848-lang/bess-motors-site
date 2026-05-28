"use client";

import Link from "next/link";
import { Download, Printer } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { loadDb } from "@/lib/store";
import type { CrmAnalytics } from "@/lib/crm-analytics";
import { exportReportsCsv, exportOrdersDetailCsv } from "@/lib/crm-analytics";
import type { RepairStatus } from "@/lib/store";
import { Card } from "@/components/ui/Card";

interface Props {
  stats: CrmAnalytics;
  periodLabel: string;
}

const statusOrder: RepairStatus[] = [
  "received",
  "diagnostic",
  "repair",
  "waitingParts",
  "ready",
  "delivered",
];

export function CrmExtendedReports({ stats, periodLabel }: Props) {
  const { t } = useI18n();
  const rx = t.reportsExt;
  const rs = t.repairStatus;
  const db = loadDb();

  const downloadDetailCsv = () => {
    const csv = exportOrdersDetailCsv(db, "month", "", "");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zlecenia-szczegoly-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCsv = () => {
    const csv = exportReportsCsv(db, stats, periodLabel);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bess-motors-raport-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary text-xs py-2" onClick={downloadCsv}>
          <Download size={16} /> {rx.exportCsv}
        </button>
        <button type="button" className="btn-outline text-xs py-2" onClick={downloadDetailCsv}>
          <Download size={16} /> CSV zleceń
        </button>
        <button type="button" className="btn-outline text-xs py-2" onClick={() => window.print()}>
          <Printer size={16} /> {rx.printReport}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card glow className="py-4 text-center">
          <p className="text-[10px] uppercase text-bm-muted">{rx.websiteBookings}</p>
          <p className="font-display text-2xl text-bm-red mt-1">{stats.websiteBookings}</p>
        </Card>
        <Card glow className="py-4 text-center">
          <p className="text-[10px] uppercase text-bm-muted">{rx.websiteCalls}</p>
          <p className="font-display text-2xl text-amber-400 mt-1">{stats.websiteCalls}</p>
        </Card>
        <Card glow className="py-4 text-center">
          <p className="text-[10px] uppercase text-bm-muted">{rx.bookingToOrder}</p>
          <p className="font-display text-2xl text-green-400 mt-1">
            {stats.bookingsWithWorkOrder}
          </p>
        </Card>
        <Card glow className="py-4 text-center">
          <p className="text-[10px] uppercase text-bm-muted">{rx.unpaidOrders}</p>
          <p className="font-display text-2xl text-red-400 mt-1">
            {stats.unpaidCount}{" "}
            <span className="text-sm">({stats.unpaidTotal.toFixed(0)} zł)</span>
          </p>
        </Card>
      </div>

      <div className="glass-red rounded-xl p-6 neon-border">
        <h3 className="font-display text-sm uppercase text-bm-red font-bold mb-4">
          {rx.statusPipeline}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {statusOrder.map((st) => (
            <div key={st} className="glass rounded-lg p-3 text-center">
              <p className="text-[9px] uppercase text-bm-muted leading-tight">{rs[st]}</p>
              <p className="font-mono text-xl font-bold text-white mt-1">
                {stats.statusCounts[st]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {stats.unpaidOrders.length > 0 && (
        <div className="glass-red rounded-xl p-6 neon-border overflow-x-auto">
          <h3 className="font-display text-sm uppercase text-amber-400 font-bold mb-4">
            {rx.unpaidList}
          </h3>
          <table className="dashboard-table min-w-[400px]">
            <thead>
              <tr>
                <th>№</th>
                <th>{rx.client}</th>
                <th>{rx.amount}</th>
              </tr>
            </thead>
            <tbody>
              {stats.unpaidOrders.slice(0, 15).map(({ order, total }) => (
                <tr key={order.id}>
                  <td>
                    <Link
                      href={`/crm/work-orders?edit=${order.id}`}
                      className="text-bm-red hover:underline font-mono"
                    >
                      {order.number}
                    </Link>
                  </td>
                  <td>{db.users.find((u) => u.id === order.userId)?.name ?? "—"}</td>
                  <td className="font-mono text-amber-300">{total.toFixed(2)} zł</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-red rounded-xl p-6 neon-border">
          <h3 className="font-display text-sm uppercase text-bm-red font-bold mb-4">
            {rx.topParts}
          </h3>
          <ul className="space-y-2 text-sm">
            {stats.topParts.length === 0 ? (
              <li className="text-bm-muted">—</li>
            ) : (
              stats.topParts.map((p) => (
                <li key={p.name} className="flex justify-between gap-2">
                  <span className="truncate">{p.name}</span>
                  <span className="text-bm-red font-mono shrink-0">
                    {p.amount.toFixed(2)} zł
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="glass-red rounded-xl p-6 neon-border">
          <h3 className="font-display text-sm uppercase text-bm-red font-bold mb-4">
            {rx.mechanicReport}
          </h3>
          <ul className="space-y-2 text-sm">
            {stats.mechanicStats.length === 0 ? (
              <li className="text-bm-muted">—</li>
            ) : (
              stats.mechanicStats.map((m) => (
                <li key={m.mechanicId} className="border-b border-bm-border/30 pb-2">
                  <div className="flex justify-between font-semibold">
                    <span>{m.name}</span>
                    <span className="text-bm-red font-mono">{m.revenue.toFixed(0)} zł</span>
                  </div>
                  <p className="text-[10px] text-bm-muted mt-0.5">
                    {m.orders} {rx.ordersShort} · {rx.mechanicEarn}: {m.earnings.toFixed(0)} zł
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="glass-red rounded-xl p-6 neon-border overflow-x-auto">
        <h3 className="font-display text-sm uppercase text-bm-red font-bold mb-4">
          {rx.marketingTitle}
        </h3>
        {stats.marketing.length === 0 ? (
          <p className="text-sm text-bm-muted">{rx.marketingEmpty}</p>
        ) : (
          <table className="dashboard-table min-w-[480px]">
            <thead>
              <tr>
                <th>{rx.source}</th>
                <th>{rx.websiteBookings}</th>
                <th>{rx.websiteCalls}</th>
                <th>{rx.bookingToOrder}</th>
              </tr>
            </thead>
            <tbody>
              {stats.marketing.map((row) => (
                <tr key={row.source}>
                  <td className="font-mono text-xs">{row.source}</td>
                  <td>{row.bookings}</td>
                  <td>{row.calls}</td>
                  <td>{row.ordersLinked}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="text-[10px] text-bm-muted mt-3">{rx.marketingHint}</p>
      </div>
    </div>
  );
}
