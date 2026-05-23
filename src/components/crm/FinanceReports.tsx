"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { loadDb } from "@/lib/store";
import { aggregatePaymentBreakdown } from "@/lib/payment";
import {
  computeCrmAnalytics,
  filterByPeriod,
  type ReportPeriod,
} from "@/lib/crm-analytics";
import { AnalyticsCharts } from "./AnalyticsCharts";
import { CrmExtendedReports } from "./CrmExtendedReports";
import { Card } from "@/components/ui/Card";

export function FinanceReports() {
  const { t } = useI18n();
  const w = t.wo;
  const c = t.crm;
  const pm = t.paymentMethods;
  const db = loadDb();
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [dateFrom, setDateFrom] = useState("2025-01-01");
  const [dateTo, setDateTo] = useState("2026-12-31");

  const stats = useMemo(
    () => computeCrmAnalytics(db, period, dateFrom, dateTo),
    [db, period, dateFrom, dateTo]
  );

  const payments = useMemo(() => {
    const orders = db.workOrders.filter((o) =>
      filterByPeriod(o.createdAt, period, dateFrom, dateTo)
    );
    return aggregatePaymentBreakdown(orders);
  }, [db, period, dateFrom, dateTo]);

  const periods: { id: ReportPeriod; label: string }[] = [
    { id: "day", label: w.periodDay },
    { id: "week", label: w.periodWeek },
    { id: "month", label: w.periodMonth },
    { id: "year", label: w.periodYear },
    { id: "2years", label: w.period2Years },
    { id: "custom", label: w.periodCustom },
  ];

  const periodLabel = periods.find((p) => p.id === period)?.label ?? period;

  return (
    <div className="space-y-8 print:text-black">
      <h2 className="font-display text-xl uppercase text-glow">{w.reports}</h2>

      <div className="flex flex-wrap gap-2 print:hidden">
        {periods.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={`px-4 py-2 rounded-lg text-sm uppercase transition-all ${
              period === p.id ? "bg-bm-red shadow-neon-sm" : "glass text-bm-muted"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {period === "custom" && (
        <div className="flex flex-wrap gap-4 print:hidden">
          <input
            type="date"
            className="input-premium w-auto"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <input
            type="date"
            className="input-premium w-auto"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: c.revenue, value: stats.revenue, color: "text-bm-red" },
          { label: w.expensesTotal, value: stats.expenseTotal, color: "text-red-400" },
          { label: w.mechanicSalaries, value: stats.salaries, color: "text-amber-400" },
          { label: c.profit, value: stats.profit, color: "text-green-400" },
          { label: w.partsProfit, value: stats.partsProfit, color: "text-green-400" },
          { label: c.avgCheck, value: stats.avgCheck, color: "text-white" },
        ].map((item, i) => (
          <Card key={i} glow className="py-5 text-center">
            <p className="text-xs uppercase text-bm-muted">{item.label}</p>
            <p className={`font-display text-2xl font-bold mt-2 ${item.color}`}>
              {item.value.toFixed(2)} zł
            </p>
          </Card>
        ))}
      </div>

      {stats.topClient && (
        <p className="text-sm text-bm-muted">
          {w.topClient}:{" "}
          <span className="text-white">
            {db.users.find((u) => u.id === stats.topClient![0])?.name} —{" "}
            {stats.topClient[1].toFixed(2)} zł
          </span>
        </p>
      )}

      <div className="glass-red rounded-xl p-6 neon-border space-y-4">
        <h3 className="font-display text-sm uppercase text-bm-red font-bold">
          {w.paymentReportTitle}
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          {(
            [
              ["cash", payments.cash],
              ["cash_receipt", payments.cash_receipt],
              ["card", payments.card],
              ["transfer", payments.transfer],
              ["blik", payments.blik],
            ] as const
          ).map(([key, val]) => (
            <div key={key} className="glass rounded-lg p-3">
              <p className="text-[10px] uppercase text-bm-muted">{pm[key]}</p>
              <p className="font-mono text-lg text-white mt-1">{val.toFixed(2)} zł</p>
            </div>
          ))}
          <div className="glass rounded-lg p-3 border border-amber-500/30">
            <p className="text-[10px] uppercase text-amber-400">{w.paymentUnpaid}</p>
            <p className="font-mono text-lg text-amber-300 mt-1">
              {payments.unpaid.toFixed(2)} zł
            </p>
          </div>
          <div className="glass rounded-lg p-3 border border-green-500/30">
            <p className="text-[10px] uppercase text-green-400">{w.paymentPaidTotal}</p>
            <p className="font-mono text-lg text-green-300 mt-1">
              {payments.paidTotal.toFixed(2)} zł
            </p>
          </div>
        </div>
      </div>

      <AnalyticsCharts stats={stats} />
      <CrmExtendedReports stats={stats} periodLabel={periodLabel} />
    </div>
  );
}
