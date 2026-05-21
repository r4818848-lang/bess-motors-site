"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { loadDb } from "@/lib/store";
import {
  calcClientTotal,
  calcPartsProfit,
  calcMechanicEarnings,
} from "@/lib/workorder-calc";
import { aggregatePaymentBreakdown } from "@/lib/payment";
import { AnalyticsCharts } from "./AnalyticsCharts";
import { Card } from "@/components/ui/Card";

type Period = "day" | "week" | "month" | "year" | "2years" | "custom";

function filterByPeriod(
  dateStr: string,
  period: Period,
  from: string,
  to: string
): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  if (period === "custom") {
    return dateStr >= from && dateStr <= to;
  }
  const days: Record<Period, number> = {
    day: 1,
    week: 7,
    month: 30,
    year: 365,
    "2years": 730,
    custom: 0,
  };
  const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= days[period];
}

export function FinanceReports() {
  const { t } = useI18n();
  const w = t.wo;
  const c = t.crm;
  const pm = t.paymentMethods;
  const db = loadDb();
  const [period, setPeriod] = useState<Period>("month");
  const [dateFrom, setDateFrom] = useState("2025-01-01");
  const [dateTo, setDateTo] = useState("2025-12-31");

  const stats = useMemo(() => {
    const orders = db.workOrders.filter((o) =>
      filterByPeriod(o.createdAt, period, dateFrom, dateTo)
    );
    const expenses = db.expenses.filter((e) =>
      filterByPeriod(e.date, period, dateFrom, dateTo)
    );

    const revenue = orders.reduce((s, o) => s + calcClientTotal(o), 0);
    const partsProfit = orders.reduce((s, o) => s + calcPartsProfit(o), 0);
    const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);

    let salaries = 0;
    orders.forEach((o) => {
      const m = db.mechanics.find((x) => x.id === o.mechanicId);
      salaries += calcMechanicEarnings(o, db.settings, m).total;
    });

    const profit = revenue - expenseTotal - salaries;
    const avgCheck = orders.length ? revenue / orders.length : 0;

    const clientTotals = new Map<string, number>();
    orders.forEach((o) => {
      clientTotals.set(o.userId, (clientTotals.get(o.userId) ?? 0) + calcClientTotal(o));
    });
    const topClient = [...clientTotals.entries()].sort((a, b) => b[1] - a[1])[0];

    const payments = aggregatePaymentBreakdown(orders);

    return {
      revenue,
      partsProfit,
      expenseTotal,
      salaries,
      profit,
      avgCheck,
      orderCount: orders.length,
      topClient,
      payments,
    };
  }, [db, period, dateFrom, dateTo]);

  const periods: { id: Period; label: string }[] = [
    { id: "day", label: w.periodDay },
    { id: "week", label: w.periodWeek },
    { id: "month", label: w.periodMonth },
    { id: "year", label: w.periodYear },
    { id: "2years", label: w.period2Years },
    { id: "custom", label: w.periodCustom },
  ];

  return (
    <div className="space-y-8">
      <h2 className="font-display text-xl uppercase text-glow">{w.reports}</h2>

      <div className="flex flex-wrap gap-2">
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
        <div className="flex flex-wrap gap-4">
          <input type="date" className="input-premium w-auto" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <input type="date" className="input-premium w-auto" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
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
              ["cash", stats.payments.cash],
              ["cash_receipt", stats.payments.cash_receipt],
              ["card", stats.payments.card],
              ["transfer", stats.payments.transfer],
              ["blik", stats.payments.blik],
            ] as const
          ).map(([key, val]) => (
            <div key={key} className="glass rounded-lg p-3">
              <p className="text-[10px] uppercase text-bm-muted">{pm[key]}</p>
              <p className="font-mono text-lg text-white mt-1">{val.toFixed(2)} zł</p>
            </div>
          ))}
          <div className="glass rounded-lg p-3">
            <p className="text-[10px] uppercase text-bm-muted">{pm.card_cash} (nal)</p>
            <p className="font-mono text-lg text-white mt-1">
              {stats.payments.card_cash_cash.toFixed(2)} zł
            </p>
          </div>
          <div className="glass rounded-lg p-3">
            <p className="text-[10px] uppercase text-bm-muted">{pm.card_cash} (karta)</p>
            <p className="font-mono text-lg text-white mt-1">
              {stats.payments.card_cash_card.toFixed(2)} zł
            </p>
          </div>
          <div className="glass rounded-lg p-3 border border-amber-500/30">
            <p className="text-[10px] uppercase text-amber-400">{w.paymentUnpaid}</p>
            <p className="font-mono text-lg text-amber-300 mt-1">
              {stats.payments.unpaid.toFixed(2)} zł
            </p>
          </div>
          <div className="glass rounded-lg p-3 border border-green-500/30">
            <p className="text-[10px] uppercase text-green-400">{w.paymentPaidTotal}</p>
            <p className="font-mono text-lg text-green-300 mt-1">
              {stats.payments.paidTotal.toFixed(2)} zł
            </p>
          </div>
        </div>
      </div>

      <AnalyticsCharts />
    </div>
  );
}
