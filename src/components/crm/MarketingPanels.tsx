"use client";

import { useMemo } from "react";
import { loadDb } from "@/lib/store";
import { useDbSync } from "@/hooks/useDbSync";
import { useI18n } from "@/lib/i18n/context";
import {
  buildAttributionReport,
  buildFunnelStats,
  exportClientsCsv,
} from "@/lib/marketing-attribution-report";
import { ReferralAdminPanel } from "@/components/crm/ReferralAdminPanel";
import { exportInactiveClientsCsv } from "@/lib/inactive-clients";

export function ReferralDashboard() {
  return <ReferralAdminPanel />;
}

export function MarketingAttributionPanel() {
  const c = useI18n().t.crm;
  const tick = useDbSync();
  const rows = useMemo(() => buildAttributionReport(loadDb()), [tick]);

  return (
    <div className="glass rounded-xl p-4 overflow-x-auto">
      <h3 className="font-display text-sm uppercase mb-4">{c.utmSourcesTitle}</h3>
      <table className="dashboard-table w-full text-sm">
        <thead>
          <tr>
            <th>{c.utmSourceCol}</th>
            <th>{c.utmCallsCol}</th>
            <th>{c.utmVisitsCol}</th>
            <th>{c.utmOrdersCol}</th>
            <th>{c.utmRevenueCol}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.source}>
              <td>{r.source}</td>
              <td>{r.calls}</td>
              <td>{r.appointments}</td>
              <td>{r.orders}</td>
              <td>{r.revenue.toFixed(0)} zł</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FunnelPanel() {
  const c = useI18n().t.crm;
  const tick = useDbSync();
  const f = useMemo(() => buildFunnelStats(loadDb()), [tick]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: c.funnelCalls, value: f.calls },
        { label: c.funnelAppointments, value: f.appointments },
        { label: c.funnelOrders, value: f.workOrders },
        { label: c.funnelConversion, value: `${f.conversionCallToApt}%` },
      ].map((k) => (
        <div key={k.label} className="glass rounded-xl p-4 text-center">
          <p className="text-xs text-bm-muted uppercase">{k.label}</p>
          <p className="text-2xl font-bold text-bm-red mt-2">{k.value}</p>
        </div>
      ))}
    </div>
  );
}

export function ClientsCsvExport() {
  const c = useI18n().t.crm;
  const download = () => {
    const csv = exportClientsCsv(loadDb());
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bess-clients-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button type="button" className="btn-outline text-sm" onClick={download}>
      {c.exportClientsCsv}
    </button>
  );
}

export function InactiveClientsExport() {
  const c = useI18n().t.crm;
  const download = () => {
    const csv = exportInactiveClientsCsv(loadDb());
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bess-inactive-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button type="button" className="btn-outline text-sm" onClick={download}>
      {c.exportInactiveCsv}
    </button>
  );
}
