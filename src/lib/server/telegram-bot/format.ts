import type { Database, RepairStatus, WorkOrder } from "@/lib/store";
import { filterOpenWorkOrders } from "@/lib/work-order-lifecycle";
import type { CrmAnalytics, ReportPeriod } from "@/lib/crm-analytics";
import { computeCrmAnalytics, filterByPeriod } from "@/lib/crm-analytics";
import { calcClientTotal } from "@/lib/workorder-calc";
import type { InlineKeyboardMarkup } from "@/lib/server/telegram-api";
import type { HotOrderRow } from "@/lib/hot-orders";
import type { SearchHit } from "./crm-actions";
import { EXPENSE_CATEGORY_RU, PERIOD_RU, REPAIR_STATUS_RU } from "./labels";

function zl(n: number): string {
  return `${n.toFixed(2)} zł`;
}

export function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function formatFinanceReport(
  stats: CrmAnalytics,
  period: ReportPeriod,
  customLabel?: string
): string {
  const label = customLabel ?? PERIOD_RU[period];
  const lines = [
    `📊 <b>Финансовый отчёт</b> — ${esc(label)}`,
    "",
    `💰 Выручка: <b>${zl(stats.revenue)}</b>`,
    `🔩 Маржа запчастей: ${zl(stats.partsProfit)}`,
    `💸 Расходы сервиса: ${zl(stats.expenseTotal)}`,
    `👷 Зарплаты механиков: ${zl(stats.salaries)}`,
    `📈 <b>Прибыль: ${zl(stats.profit)}</b>`,
    "",
    `📋 Заказ-нарядов: ${stats.orderCount}`,
    `🧾 Средний чек: ${zl(stats.avgCheck)}`,
    `⏳ Не оплачено: ${zl(stats.unpaidTotal)} (${stats.unpaidCount})`,
    "",
    "👷 <b>Механики:</b>",
  ];

  if (stats.mechanicStats.length === 0) {
    lines.push("— нет данных");
  } else {
    for (const m of stats.mechanicStats.slice(0, 6)) {
      lines.push(
        `• ${esc(m.name)}: ${m.orders} заказ., выручка ${zl(m.revenue)}, зарплата ${zl(m.earnings)}`
      );
    }
  }

  if (stats.topServices.length > 0) {
    lines.push("", "🔧 <b>Топ услуги:</b>");
    for (const s of stats.topServices.slice(0, 5)) {
      lines.push(`• ${esc(s.name)} — ${zl(s.amount)}`);
    }
  }

  lines.push(
    "",
    `🌐 Записи с сайта: ${stats.websiteBookings} · Звонки: ${stats.websiteCalls}`
  );

  return lines.join("\n");
}

export function formatTodaySummary(db: Database): string {
  const stats = computeCrmAnalytics(db, "day", "", "");
  const today = new Date().toISOString().slice(0, 10);
  const aptsToday = db.appointments.filter((a) => a.date === today);
  const active = db.workOrders.filter((o) => o.status !== "delivered");
  const hot = db.callRequests.filter((c) => c.status === "needs_call").length;

  return [
    `📈 <b>Сводка за сегодня</b> (${today})`,
    "",
    `💰 Выручка: <b>${zl(stats.revenue)}</b>`,
    `📈 Прибыль: <b>${zl(stats.profit)}</b>`,
    `📋 Новых заказ-нарядов: ${stats.orderCount}`,
    `🔧 Активных в работе: ${active.length}`,
    `📅 Записей на сегодня: ${aptsToday.length}`,
    `📞 Ожидают звонка: ${hot}`,
    `⏳ Не оплачено: ${zl(stats.unpaidTotal)}`,
  ].join("\n");
}

export function formatWorkOrderList(db: Database, page: number, pageSize = 5): { text: string; totalPages: number } {
  const orders = filterOpenWorkOrders([...db.workOrders]).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const slice = orders.slice(page * pageSize, page * pageSize + pageSize);

  if (slice.length === 0) {
    return { text: "📋 <b>Открытые заказ-наряды</b>\n\nНет активных заказов.", totalPages: 1 };
  }

  const lines = [`📋 <b>Заказ-наряды</b> (стр. ${page + 1}/${totalPages})`, ""];
  for (const o of slice) {
    lines.push(formatWorkOrderLine(db, o));
    lines.push("");
  }
  lines.push("<i>Нажмите номер заказа для деталей</i>");
  return { text: lines.join("\n"), totalPages };
}

function formatWorkOrderLine(db: Database, o: WorkOrder): string {
  const vehicle = db.vehicles.find((v) => v.id === o.vehicleId);
  const client = db.users.find((u) => u.id === o.userId);
  const mech = db.mechanics.find((m) => m.id === o.mechanicId);
  const car = vehicle ? `${vehicle.make} ${vehicle.model}`.trim() : "—";
  return [
    `<b>${esc(o.number)}</b> · ${REPAIR_STATUS_RU[o.status]}`,
    `${esc(car)} · ${esc(vehicle?.plate ?? "—")}`,
    `👤 ${esc(client?.name ?? "—")} · 👷 ${esc(mech?.name ?? "—")}`,
    `💰 ${zl(calcClientTotal(o))} · ${o.paymentStatus === "paid" ? "✅ оплачен" : "⏳ долг"}`,
  ].join("\n");
}

export function formatWorkOrderDetail(db: Database, orderNumber: string): string | null {
  const o = db.workOrders.find((x) => x.number === orderNumber);
  if (!o) return null;

  const vehicle = db.vehicles.find((v) => v.id === o.vehicleId);
  const client = db.users.find((u) => u.id === o.userId);
  const mech = db.mechanics.find((m) => m.id === o.mechanicId);

  const services = o.services
    .map((s) => `  • ${esc(s.name)} × ${s.qty}`)
    .join("\n");
  const parts = o.parts
    .map((p) => `  • ${esc(p.name)} × ${p.qty}`)
    .join("\n");

  return [
    `📋 <b>${esc(o.number)}</b>`,
    `Статус: <b>${REPAIR_STATUS_RU[o.status]}</b>`,
    `Авто: ${esc(vehicle?.make ?? "")} ${esc(vehicle?.model ?? "")} · ${esc(vehicle?.plate ?? "—")}`,
    `Клиент: ${esc(client?.name ?? "—")} · ${esc(client?.phone ?? "—")}`,
    `Механик: ${esc(mech?.name ?? "—")}`,
    `Сумма: <b>${zl(calcClientTotal(o))}</b> · ${o.paymentStatus === "paid" ? "оплачен" : "не оплачен"}`,
    o.createdAt ? `Создан: ${o.createdAt.slice(0, 10)}` : "",
    services ? `\n🔧 <b>Работы:</b>\n${services}` : "",
    parts ? `\n🔩 <b>Запчасти:</b>\n${parts}` : "",
    o.clientNotes ? `\n📝 ${esc(o.clientNotes)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatHotOrders(rows: HotOrderRow[], page: number, pageSize = 5): { text: string; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const slice = rows.slice(page * pageSize, page * pageSize + pageSize);

  if (slice.length === 0) {
    return { text: "🔥 <b>Горячие заказы</b>\n\nНет новых заявок с сайта.", totalPages: 1 };
  }

  const lines = [`🔥 <b>Горячие заказы</b> (${rows.filter((r) => r.isActionRequired).length} требуют действия)`, ""];
  for (const r of slice) {
    const kind = r.kind === "booking" ? "📅 Запись" : "📞 Звонок";
    const when = r.date ? `${r.date} ${r.time ?? ""}`.trim() : r.createdAt.slice(0, 10);
    lines.push(
      `${kind} · <b>${esc(r.clientName)}</b> ${r.isActionRequired ? "🆕" : ""}`,
      `${esc(r.phone)} · ${esc(r.serviceLabel)}`,
      `📌 ${esc(r.status)} · ${when}`,
      r.comment ? `💬 ${esc(r.comment.slice(0, 120))}` : "",
      ""
    );
  }
  return { text: lines.join("\n"), totalPages };
}

export function formatAppointments(db: Database, page: number, pageSize = 5): { text: string; totalPages: number } {
  const today = new Date().toISOString().slice(0, 10);
  const apts = db.appointments
    .filter((a) => a.date >= today)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  const totalPages = Math.max(1, Math.ceil(apts.length / pageSize));
  const slice = apts.slice(page * pageSize, page * pageSize + pageSize);

  if (slice.length === 0) {
    return { text: "📅 <b>Ближайшие записи</b>\n\nНет предстоящих записей.", totalPages: 1 };
  }

  const lines = [`📅 <b>Ближайшие записи</b> (стр. ${page + 1}/${totalPages})`, ""];
  for (const a of slice) {
    const client = db.users.find((u) => u.id === a.userId);
    const vehicle = db.vehicles.find((v) => v.id === a.vehicleId);
    const mech = db.mechanics.find((m) => m.id === a.mechanicId);
    const name = a.clientName || client?.name || "—";
    const phone = a.clientPhone || client?.phone || "—";
    lines.push(
      `<b>${a.date} · ${a.time}</b> · ${REPAIR_STATUS_RU[a.repairStatus]}`,
      `👤 ${esc(name)} · ${esc(phone)}`,
      vehicle
        ? `🚗 ${esc(vehicle.make)} ${esc(vehicle.model)} · ${esc(vehicle.plate)}`
        : "",
      mech ? `👷 ${esc(mech.name)}` : "",
      a.comment ? `💬 ${esc(a.comment.slice(0, 100))}` : "",
      ""
    );
  }
  return { text: lines.join("\n"), totalPages };
}

export function formatMechanicsReport(db: Database, period: ReportPeriod, from = "", to = ""): string {
  const stats = computeCrmAnalytics(db, period, from, to);
  const lines = [`👷 <b>Механики</b> — ${PERIOD_RU[period]}`, ""];
  if (stats.mechanicStats.length === 0) {
    lines.push("Нет данных за период.");
  } else {
    for (const m of stats.mechanicStats) {
      lines.push(
        `<b>${esc(m.name)}</b>`,
        `  Заказ-нарядов: ${m.orders}`,
        `  Выручка: ${zl(m.revenue)}`,
        `  <b>Заработок: ${zl(m.earnings)}</b>`,
        ""
      );
    }
    lines.push(`💰 Итого зарплаты: <b>${zl(stats.salaries)}</b>`);
  }
  return lines.join("\n");
}

export function formatExpensesList(db: Database): string {
  const recent = [...db.expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15);
  const total = db.expenses.reduce((s, e) => s + e.amount, 0);

  if (recent.length === 0) {
    return "💸 <b>Расходы</b>\n\nРасходов пока нет.";
  }

  const lines = [
    `💸 <b>Последние расходы</b>`,
    `Всего в CRM: <b>${zl(total)}</b> (${db.expenses.length} записей)`,
    "",
  ];
  for (const e of recent) {
    lines.push(
      `${e.date} · ${EXPENSE_CATEGORY_RU[e.category]}`,
      `  ${esc(e.description)} — <b>${zl(e.amount)}</b>`,
      ""
    );
  }
  return lines.join("\n");
}

export function formatWarehouse(db: Database): string {
  const items = db.warehouse;
  const totalQty = items.reduce((s, i) => s + i.qty, 0);
  const low = items.filter((i) => i.qty <= 3);

  const lines = [
    `🏭 <b>Склад</b>`,
    `Позиций: ${items.length} · Единиц: ${totalQty}`,
    "",
  ];

  if (low.length > 0) {
    lines.push("⚠️ <b>Мало на складе:</b>");
    for (const i of low.slice(0, 10)) {
      lines.push(`• ${esc(i.name)} — ${i.qty} шт. (${esc(i.sku)})`);
    }
    lines.push("");
  }

  lines.push("<b>Топ позиций:</b>");
  for (const i of [...items].sort((a, b) => b.qty - a.qty).slice(0, 8)) {
    lines.push(`• ${esc(i.name)}: ${i.qty} шт. · ${zl(i.sellPrice)}`);
  }
  return lines.join("\n");
}

export function workOrderListKeyboard(db: Database, page: number, pageSize = 5): InlineKeyboardMarkup {
  const orders = filterOpenWorkOrders([...db.workOrders]).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  const slice = orders.slice(page * pageSize, page * pageSize + pageSize);
  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));

  const rows: { text: string; callback_data?: string }[][] = slice.map((o) => [
    {
      text: `${o.number} · ${REPAIR_STATUS_RU[o.status]}`,
      callback_data: `wo:n:${o.number}`,
    },
  ]);

  const nav: { text: string; callback_data?: string }[] = [];
  if (page > 0) nav.push({ text: "◀️", callback_data: `wo:p:${page - 1}` });
  nav.push({ text: `${page + 1}/${totalPages}`, callback_data: "noop" });
  if (page < totalPages - 1) nav.push({ text: "▶️", callback_data: `wo:p:${page + 1}` });
  if (nav.length) rows.push(nav);
  rows.push([{ text: "🏠 Меню", callback_data: "menu" }]);

  return { inline_keyboard: rows };
}

export function formatUnpaidList(
  db: Database,
  page: number,
  pageSize = 5
): { text: string; totalPages: number; orders: { number: string }[] } {
  const unpaid = db.workOrders
    .filter((o) => o.paymentStatus !== "paid")
    .map((o) => ({ order: o, total: calcClientTotal(o) }))
    .sort((a, b) => b.total - a.total);

  const totalPages = Math.max(1, Math.ceil(unpaid.length / pageSize));
  const slice = unpaid.slice(page * pageSize, page * pageSize + pageSize);
  const totalDebt = unpaid.reduce((s, u) => s + u.total, 0);

  if (slice.length === 0) {
    return {
      text: "⏳ <b>Долги</b>\n\nВсе заказ-наряды оплачены.",
      totalPages: 1,
      orders: [],
    };
  }

  const lines = [
    `⏳ <b>Неоплаченные заказ-наряды</b> (стр. ${page + 1}/${totalPages})`,
    `Всего долг: <b>${zl(totalDebt)}</b> · ${unpaid.length} шт.`,
    "",
  ];
  for (const { order: o, total } of slice) {
    const vehicle = db.vehicles.find((v) => v.id === o.vehicleId);
    const client = db.users.find((u) => u.id === o.userId);
    lines.push(
      `<b>${esc(o.number)}</b> · ${zl(total)}`,
      `${esc(client?.name ?? "—")} · ${esc(vehicle?.plate ?? "—")}`,
      `${REPAIR_STATUS_RU[o.status]}`,
      ""
    );
  }
  lines.push("<i>Нажмите номер для деталей</i>");
  return {
    text: lines.join("\n"),
    totalPages,
    orders: slice.map(({ order }) => ({ number: order.number })),
  };
}

export function formatSearchResults(db: Database, hits: SearchHit[]): string {
  if (hits.length === 0) return "🔍 <b>Поиск</b>\n\nНичего не найдено.";

  const lines = [`🔍 <b>Результаты</b> (${hits.length})`, ""];
  for (const h of hits) {
    if (h.kind === "order") {
      lines.push(`📋 <b>${esc(h.order.number)}</b> · ${REPAIR_STATUS_RU[h.order.status]}`);
      lines.push(`   ${esc(h.label)}`, "");
    } else if (h.kind === "client") {
      lines.push(`👤 <b>${esc(h.name)}</b> · ${esc(h.phone)}`, "");
    } else {
      lines.push(
        `🚗 <b>${esc(h.plate)}</b> · ${esc(h.make)} ${esc(h.model)}`,
        ""
      );
    }
  }
  return lines.join("\n");
}

export function formatTopClients(db: Database): string {
  const orders = db.workOrders.filter((o) =>
    filterByPeriod(o.createdAt, "month", "", "")
  );
  const map = new Map<string, number>();
  for (const o of orders) {
    map.set(o.userId, (map.get(o.userId) ?? 0) + calcClientTotal(o));
  }
  const rows = [...map.entries()]
    .map(([userId, total]) => ({
      name: db.users.find((u) => u.id === userId)?.name ?? userId,
      total,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  if (rows.length === 0) {
    return "👥 <b>Топ клиентов</b> (месяц)\n\nНет заказ-нарядов за месяц.";
  }

  const lines = ["👥 <b>Топ клиентов</b> (месяц)", ""];
  rows.forEach((r, i) => {
    lines.push(`${i + 1}. ${esc(r.name)} — <b>${zl(r.total)}</b>`);
  });
  return lines.join("\n");
}

export function formatMarketingReport(db: Database): string {
  const stats = computeCrmAnalytics(db, "month", "", "");
  if (stats.marketing.length === 0) {
    return "📣 <b>Маркетинг</b> (месяц)\n\nНет данных UTM за месяц.";
  }

  const lines = ["📣 <b>Маркетинг</b> (месяц)", ""];
  for (const m of stats.marketing.slice(0, 10)) {
    lines.push(
      `<b>${esc(m.source)}</b>`,
      `  Записи: ${m.bookings} · Звонки: ${m.calls} · Заказ-наряды: ${m.ordersLinked}`,
      ""
    );
  }
  return lines.join("\n");
}

export function formatMonthCompare(db: Database): string {
  const stats = computeCrmAnalytics(db, "month", "", "");
  const months = stats.revenueByMonth.filter((m) => m.revenue > 0 || m.orders > 0).slice(-6);

  if (months.length === 0) {
    return "📊 <b>Сравнение месяцев</b>\n\nНет данных.";
  }

  const lines = ["📊 <b>Выручка по месяцам</b>", ""];
  for (const m of months) {
    lines.push(`${m.label}: <b>${zl(m.revenue)}</b> · ${m.orders} заказ-нарядов`);
  }
  return lines.join("\n");
}

export function formatHotBookingDetail(db: Database, aptId: string): string | null {
  const apt = db.appointments.find((a) => a.id === aptId);
  if (!apt) return null;

  const client = db.users.find((u) => u.id === apt.userId);
  const vehicle = db.vehicles.find((v) => v.id === apt.vehicleId);
  const name = apt.clientName || client?.name || "—";
  const phone = apt.clientPhone || client?.phone || "—";

  return [
    "📅 <b>Запись с сайта</b>",
    `Дата: <b>${apt.date} · ${apt.time}</b>`,
    `Клиент: ${esc(name)} · ${esc(phone)}`,
    vehicle
      ? `Авто: ${esc(vehicle.make)} ${esc(vehicle.model)} · ${esc(vehicle.plate)}`
      : "",
    `Статус: ${apt.appointmentStatus}`,
    apt.workOrderId ? `Заказ-наряд: ${apt.workOrderId}` : "⚠️ Заказ-наряд не создан",
    apt.comment ? `💬 ${esc(apt.comment)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatHotCallDetail(db: Database, callId: string): string | null {
  const call = db.callRequests.find((c) => c.id === callId);
  if (!call) return null;

  return [
    "📞 <b>Заявка на звонок</b>",
    `Клиент: <b>${esc(call.clientName ?? "—")}</b>`,
    `Телефон: ${esc(call.phone)}`,
    `Услуга: ${esc(call.serviceLabel)}`,
    `Статус: ${call.status}`,
    call.comment ? `💬 ${esc(call.comment)}` : "",
    `Создана: ${call.createdAt.slice(0, 10)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function searchOrderNumbers(hits: SearchHit[]): string[] {
  return hits.filter((h) => h.kind === "order").map((h) => h.order.number);
}
