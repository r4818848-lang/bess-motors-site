import type { ClientPortalSlice } from "@/lib/client-sign";
import type { Database, WorkOrder } from "@/lib/store";
import { calcClientTotal } from "@/lib/workorder-calc";
import { APPOINTMENT_STATUS_CLIENT } from "./client-labels";
import { getClientServiceLabel } from "./client-services";
import { REPAIR_STATUS_RU } from "./labels";

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function zl(n: number): string {
  return `${n.toFixed(2)} zł`;
}

export function formatLinkedWelcome(name: string): string {
  return [
    `👋 <b>Здравствуйте, ${esc(name)}!</b>`,
    "",
    "Ваш личный кабинет подключён.",
    "Здесь — заказ-наряды, записи и уведомления.",
  ].join("\n");
}

export function formatWorkOrdersList(slice: ClientPortalSlice, page = 0, pageSize = 4): {
  text: string;
  totalPages: number;
} {
  const orders = [...slice.workOrders].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const chunk = orders.slice(page * pageSize, page * pageSize + pageSize);

  if (chunk.length === 0) {
    return { text: "📋 <b>Заказ-наряды</b>\n\nПока нет заказ-нарядов.", totalPages: 1 };
  }

  const lines = [`📋 <b>Заказ-наряды</b> (${page + 1}/${totalPages})`, ""];
  for (const o of chunk) {
    lines.push(formatOrderLine(slice, o), "");
  }
  return { text: lines.join("\n"), totalPages };
}

function formatOrderLine(slice: ClientPortalSlice, o: WorkOrder): string {
  const vehicle = slice.vehicles.find((v) => v.id === o.vehicleId);
  const car = vehicle
    ? `${vehicle.make} ${vehicle.model} · ${vehicle.plate}`.trim()
    : "—";
  const pay = o.paymentStatus === "paid" ? "✅ оплачен" : "⏳ не оплачен";
  const sign =
    o.confirmationStatus !== "confirmed"
      ? " · ✍️ нужна подпись"
      : "";
  return [
    `<b>${esc(o.number)}</b>`,
    `${REPAIR_STATUS_RU[o.status]}${sign}`,
    `🚗 ${esc(car)}`,
    `💰 ${zl(calcClientTotal(o))} · ${pay}`,
  ].join("\n");
}

export function formatWorkOrderDetail(slice: ClientPortalSlice, orderId: string): string | null {
  const o = slice.workOrders.find((x) => x.id === orderId);
  if (!o) return null;

  const vehicle = slice.vehicles.find((v) => v.id === o.vehicleId);
  const services = o.services
    .map((s) => `  • ${esc(s.name)} × ${s.qty}`)
    .join("\n");

  return [
    `📋 <b>${esc(o.number)}</b>`,
    `Статус: <b>${REPAIR_STATUS_RU[o.status]}</b>`,
    vehicle
      ? `🚗 ${esc(vehicle.make)} ${esc(vehicle.model)} · ${esc(vehicle.plate)}`
      : "",
    `💰 <b>${zl(calcClientTotal(o))}</b> · ${o.paymentStatus === "paid" ? "оплачен" : "не оплачен"}`,
    o.confirmationStatus !== "confirmed" ? "✍️ <b>Требуется подпись</b>" : "✅ Подписан",
    services ? `\n🔧 <b>Работы:</b>\n${services}` : "",
    o.clientNotes ? `\n📝 ${esc(o.clientNotes)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatNotifications(slice: ClientPortalSlice): string {
  const notes = slice.notifications.slice(0, 8);
  if (notes.length === 0) {
    return "🔔 <b>Уведомления</b>\n\nНет новых уведомлений.";
  }

  const lines = ["🔔 <b>Уведомления</b>", ""];
  for (const n of notes) {
    const order = n.workOrderId
      ? slice.workOrders.find((o) => o.id === n.workOrderId)
      : undefined;
    const prefix = n.read ? "•" : "🆕";
    let title = "";
    switch (n.type) {
      case "car_ready":
        title = "Авто готово";
        break;
      case "status_change":
        title = `Статус: ${n.status ? REPAIR_STATUS_RU[n.status] : "обновлён"}`;
        break;
      case "sign_required":
        title = "Нужна подпись";
        break;
      case "appointment_invite":
        title = `Запись ${n.appointmentDate ?? ""} ${n.appointmentTime ?? ""}`.trim();
        break;
      default:
        title = "Уведомление";
    }
    lines.push(
      `${prefix} <b>${title}</b>`,
      order ? `   ${esc(order.number)}` : "",
      ""
    );
  }
  return lines.join("\n");
}

export function formatAppointmentsSlice(slice: ClientPortalSlice): string {
  const today = new Date().toISOString().slice(0, 10);
  const apts = slice.appointments
    .filter((a) => a.date >= today)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    .slice(0, 6);

  if (apts.length === 0) {
    return "📅 <b>Записи</b>\n\nНет предстоящих записей.";
  }

  const lines = ["📅 <b>Ближайшие записи</b>", ""];
  for (const a of apts) {
    const service = a.serviceIds.map(getClientServiceLabel).join(", ");
    lines.push(
      `<b>${a.date} · ${a.time}</b>`,
      `🔧 ${esc(service)}`,
      `📌 ${APPOINTMENT_STATUS_CLIENT[a.appointmentStatus] ?? a.appointmentStatus}`,
      ""
    );
  }
  return lines.join("\n");
}

export function formatCarsSlice(slice: ClientPortalSlice): string {
  if (slice.vehicles.length === 0) {
    return "🚗 <b>Мои авто</b>\n\nАвтомобили появятся после первого визита.";
  }

  const lines = ["🚗 <b>Мои автомобили</b>", ""];
  for (const v of slice.vehicles) {
    lines.push(
      `<b>${esc(v.plate)}</b>`,
      `${esc(v.make)} ${esc(v.model)}`.trim(),
      v.vin ? `VIN: ${esc(v.vin)}` : "",
      ""
    );
  }
  return lines.join("\n");
}

export function countPendingSign(slice: ClientPortalSlice): number {
  return slice.workOrders.filter(
    (o) =>
      o.confirmationStatus !== "confirmed" &&
      (o.documentStatus === "awaiting_signature" ||
        o.confirmationStatus === "awaiting_confirmation")
  ).length;
}

export function countUnread(slice: ClientPortalSlice): number {
  return slice.notifications.filter((n) => !n.read).length;
}
