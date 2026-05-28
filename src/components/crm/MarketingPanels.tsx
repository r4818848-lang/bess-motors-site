"use client";

import { useMemo } from "react";
import { loadDb } from "@/lib/store";
import { useDbSync } from "@/hooks/useDbSync";
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
  const tick = useDbSync();
  const rows = useMemo(() => buildAttributionReport(loadDb()), [tick]);

  return (
    <div className="glass rounded-xl p-4 overflow-x-auto">
      <h3 className="font-display text-sm uppercase mb-4">UTM / Źródła</h3>
      <table className="dashboard-table w-full text-sm">
        <thead>
          <tr>
            <th>Źródło</th>
            <th>Zgłoszenia</th>
            <th>Wizyty</th>
            <th>Zlecenia</th>
            <th>Przychód</th>
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
  const tick = useDbSync();
  const f = useMemo(() => buildFunnelStats(loadDb()), [tick]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: "Połączenia", value: f.calls },
        { label: "Wizyty", value: f.appointments },
        { label: "Zlecenia", value: f.workOrders },
        { label: "Call→Wizyta %", value: `${f.conversionCallToApt}%` },
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
      Export klientów CSV
    </button>
  );
}

export function InactiveClientsExport() {
  const download = () => {
    const csv = exportInactiveClientsCsv(loadDb(), 6);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nieaktywni-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <button type="button" className="btn-outline text-sm" onClick={download}>
      Nieaktywni 6+ mies. CSV
    </button>
  );
}
