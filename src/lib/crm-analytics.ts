import type { Database, RepairStatus, WorkOrder } from "./store";
import {
  calcClientTotal,
  calcMechanicEarnings,
  calcPartsProfit,
  calcServiceLine,
  calcPartLine,
} from "./workorder-calc";
import { formatAttributionLabel, type MarketingAttribution } from "./utm";

export type ReportPeriod = "day" | "week" | "month" | "year" | "2years" | "custom";

export function filterByPeriod(
  dateStr: string,
  period: ReportPeriod,
  from: string,
  to: string
): boolean {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  if (period === "custom") return dateStr >= from && dateStr <= to;
  const days: Record<Exclude<ReportPeriod, "custom">, number> = {
    day: 1,
    week: 7,
    month: 30,
    year: 365,
    "2years": 730,
  };
  const diff = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= days[period];
}

export interface RevenueMonth {
  key: string;
  label: string;
  revenue: number;
  orders: number;
}

export interface NamedAmount {
  name: string;
  amount: number;
  count: number;
}

export interface MechanicStat {
  mechanicId: string;
  name: string;
  revenue: number;
  orders: number;
  earnings: number;
}

export interface MarketingRow {
  source: string;
  bookings: number;
  calls: number;
  ordersLinked: number;
}

export interface CrmAnalytics {
  revenue: number;
  partsProfit: number;
  expenseTotal: number;
  salaries: number;
  profit: number;
  avgCheck: number;
  orderCount: number;
  unpaidTotal: number;
  unpaidCount: number;
  topClient: [string, number] | null;
  revenueByMonth: RevenueMonth[];
  topServices: NamedAmount[];
  topParts: NamedAmount[];
  statusCounts: Record<RepairStatus, number>;
  unpaidOrders: { order: WorkOrder; total: number }[];
  mechanicStats: MechanicStat[];
  marketing: MarketingRow[];
  websiteBookings: number;
  websiteCalls: number;
  bookingsWithWorkOrder: number;
}

function last12MonthKeys(): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    out.push({ key, label: key.slice(5) + "/" + String(d.getFullYear()).slice(2) });
  }
  return out;
}

function attrSource(a?: MarketingAttribution): string {
  return formatAttributionLabel(a) === "—" ? "direct" : (a?.utmSource ?? "direct");
}

export function computeCrmAnalytics(
  db: Database,
  period: ReportPeriod,
  dateFrom: string,
  dateTo: string
): CrmAnalytics {
  const orders = db.workOrders.filter((o) =>
    filterByPeriod(o.createdAt, period, dateFrom, dateTo)
  );
  const expenses = db.expenses.filter((e) =>
    filterByPeriod(e.date, period, dateFrom, dateTo)
  );
  const appointments = db.appointments.filter((a) =>
    filterByPeriod(a.createdAt.slice(0, 10), period, dateFrom, dateTo)
  );
  const calls = db.callRequests.filter((c) =>
    filterByPeriod(c.createdAt.slice(0, 10), period, dateFrom, dateTo)
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
  const topClient = [...clientTotals.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;

  const monthMap = new Map<string, { revenue: number; orders: number }>();
  last12MonthKeys().forEach(({ key }) => monthMap.set(key, { revenue: 0, orders: 0 }));
  db.workOrders.forEach((o) => {
    const key = o.createdAt.slice(0, 7);
    if (!monthMap.has(key)) monthMap.set(key, { revenue: 0, orders: 0 });
    const row = monthMap.get(key)!;
    row.revenue += calcClientTotal(o);
    row.orders += 1;
  });
  const revenueByMonth = last12MonthKeys().map(({ key, label }) => ({
    key,
    label,
    revenue: monthMap.get(key)?.revenue ?? 0,
    orders: monthMap.get(key)?.orders ?? 0,
  }));

  const serviceMap = new Map<string, NamedAmount>();
  orders.forEach((o) => {
    o.services.forEach((s) => {
      const name = s.name?.trim() || "—";
      const cur = serviceMap.get(name) ?? { name, amount: 0, count: 0 };
      cur.amount += calcServiceLine(s);
      cur.count += 1;
      serviceMap.set(name, cur);
    });
  });
  const topServices = [...serviceMap.values()]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  const partMap = new Map<string, NamedAmount>();
  orders.forEach((o) => {
    o.parts.forEach((p) => {
      const name = p.name?.trim() || "—";
      const cur = partMap.get(name) ?? { name, amount: 0, count: 0 };
      cur.amount += calcPartLine(p);
      cur.count += 1;
      partMap.set(name, cur);
    });
  });
  const topParts = [...partMap.values()].sort((a, b) => b.amount - a.amount).slice(0, 8);

  const statusCounts: Record<RepairStatus, number> = {
    received: 0,
    diagnostic: 0,
    repair: 0,
    waitingParts: 0,
    ready: 0,
    delivered: 0,
  };
  orders.forEach((o) => {
    statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;
  });

  const unpaidOrders = orders
    .filter((o) => o.paymentStatus !== "paid")
    .map((o) => ({ order: o, total: calcClientTotal(o) }))
    .sort((a, b) => b.total - a.total);

  const unpaidTotal = unpaidOrders.reduce((s, u) => s + u.total, 0);

  const mechMap = new Map<string, MechanicStat>();
  orders.forEach((o) => {
    const m = db.mechanics.find((x) => x.id === o.mechanicId);
    const name = m?.name ?? o.mechanicId;
    const cur = mechMap.get(o.mechanicId) ?? {
      mechanicId: o.mechanicId,
      name,
      revenue: 0,
      orders: 0,
      earnings: 0,
    };
    cur.revenue += calcClientTotal(o);
    cur.orders += 1;
    cur.earnings += calcMechanicEarnings(o, db.settings, m).total;
    mechMap.set(o.mechanicId, cur);
  });
  const mechanicStats = [...mechMap.values()].sort((a, b) => b.revenue - a.revenue);

  const marketingMap = new Map<string, MarketingRow>();
  const ensure = (src: string) => {
    if (!marketingMap.has(src)) {
      marketingMap.set(src, { source: src, bookings: 0, calls: 0, ordersLinked: 0 });
    }
    return marketingMap.get(src)!;
  };

  appointments
    .filter((a) => a.source === "website")
    .forEach((a) => {
      const src = attrSource(a.marketing);
      ensure(src).bookings += 1;
      if (a.workOrderId) ensure(src).ordersLinked += 1;
    });

  calls
    .filter((c) => c.source === "website")
    .forEach((c) => {
      ensure(attrSource(c.marketing)).calls += 1;
    });

  const marketing = [...marketingMap.values()].sort(
    (a, b) => b.bookings + b.calls - (a.bookings + a.calls)
  );

  const websiteBookings = appointments.filter((a) => a.source === "website").length;
  const websiteCalls = calls.filter((c) => c.source === "website").length;
  const bookingsWithWorkOrder = appointments.filter(
    (a) => a.source === "website" && a.workOrderId
  ).length;

  return {
    revenue,
    partsProfit,
    expenseTotal,
    salaries,
    profit,
    avgCheck,
    orderCount: orders.length,
    unpaidTotal,
    unpaidCount: unpaidOrders.length,
    topClient,
    revenueByMonth,
    topServices,
    topParts,
    statusCounts,
    unpaidOrders,
    mechanicStats,
    marketing,
    websiteBookings,
    websiteCalls,
    bookingsWithWorkOrder,
  };
}

export function exportReportsCsv(
  db: Database,
  stats: CrmAnalytics,
  periodLabel: string
): string {
  const lines: string[] = [
    `BESS MOTORS — Raport; ${periodLabel}`,
    "",
    "Podsumowanie",
    `Przychód;${stats.revenue.toFixed(2)}`,
    `Koszty;${stats.expenseTotal.toFixed(2)}`,
    `Wynagrodzenia;${stats.salaries.toFixed(2)}`,
    `Zysk;${stats.profit.toFixed(2)}`,
    `Zlecenia;${stats.orderCount}`,
    `Średni paragon;${stats.avgCheck.toFixed(2)}`,
    `Nieopłacone;${stats.unpaidTotal.toFixed(2)} (${stats.unpaidCount})`,
    "",
    "Przychód wg miesięcy",
    "Miesiąc;Przychód;Zlecenia",
    ...stats.revenueByMonth.map(
      (m) => `${m.key};${m.revenue.toFixed(2)};${m.orders}`
    ),
    "",
    "Top usługi",
    "Nazwa;Kwota;Pozycji",
    ...stats.topServices.map((s) => `${s.name};${s.amount.toFixed(2)};${s.count}`),
    "",
    "Marketing",
    "Źródło;Rezerwacje;Telefony;Zlecenia",
    ...stats.marketing.map(
      (m) => `${m.source};${m.bookings};${m.calls};${m.ordersLinked}`
    ),
  ];
  return lines.join("\n");
}
