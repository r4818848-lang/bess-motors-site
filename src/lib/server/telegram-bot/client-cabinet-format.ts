import type { ClientPortalSlice } from "@/lib/client-sign";
import type { WorkOrder } from "@/lib/store";
import { calcClientTotal } from "@/lib/workorder-calc";
import { type BotLocale, getClientBotLabels } from "./client-i18n";
import { getClientServiceLabel } from "./client-services";

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function zl(n: number): string {
  return `${n.toFixed(2)} zł`;
}

function repairLabel(locale: BotLocale, status: string): string {
  const L = getClientBotLabels(locale);
  return L.repairStatus[status] ?? status;
}

export function formatLinkedWelcome(locale: BotLocale, name: string): string {
  return getClientBotLabels(locale).linkedWelcome(name);
}

export function formatWorkOrdersList(
  locale: BotLocale,
  slice: ClientPortalSlice,
  page = 0,
  pageSize = 4
): { text: string; totalPages: number } {
  const L = getClientBotLabels(locale);
  const orders = [...slice.workOrders].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const chunk = orders.slice(page * pageSize, page * pageSize + pageSize);

  if (chunk.length === 0) {
    return { text: L.ordersEmpty, totalPages: 1 };
  }

  const lines = [L.ordersTitle(page + 1, totalPages), ""];
  for (const o of chunk) {
    lines.push(formatOrderLine(locale, slice, o), "");
  }
  return { text: lines.join("\n"), totalPages };
}

function formatOrderLine(
  locale: BotLocale,
  slice: ClientPortalSlice,
  o: WorkOrder
): string {
  const L = getClientBotLabels(locale);
  const vehicle = slice.vehicles.find((v) => v.id === o.vehicleId);
  const car = vehicle
    ? `${vehicle.make} ${vehicle.model} · ${vehicle.plate}`.trim()
    : "—";
  const pay = o.paymentStatus === "paid" ? L.paid : L.unpaid;
  const sign =
    o.confirmationStatus !== "confirmed" ? L.needsSignBadge : "";
  return [
    `<b>${esc(o.number)}</b>`,
    `${repairLabel(locale, o.status)}${sign}`,
    `🚗 ${esc(car)}`,
    `💰 ${zl(calcClientTotal(o))} · ${pay}`,
  ].join("\n");
}

export function formatWorkOrderDetail(
  locale: BotLocale,
  slice: ClientPortalSlice,
  orderId: string
): string | null {
  const L = getClientBotLabels(locale);
  const o = slice.workOrders.find((x) => x.id === orderId);
  if (!o) return null;

  const vehicle = slice.vehicles.find((v) => v.id === o.vehicleId);
  const services = o.services
    .map((s) => `  • ${esc(s.name)} × ${s.qty}`)
    .join("\n");

  return [
    `📋 <b>${esc(o.number)}</b>`,
    `${L.orderStatus}: <b>${repairLabel(locale, o.status)}</b>`,
    vehicle
      ? `🚗 ${esc(vehicle.make)} ${esc(vehicle.model)} · ${esc(vehicle.plate)}`
      : "",
    `💰 <b>${zl(calcClientTotal(o))}</b> · ${o.paymentStatus === "paid" ? L.paid : L.unpaid}`,
    o.confirmationStatus !== "confirmed" ? L.needsSignature : L.signed,
    services ? `\n🔧 <b>${L.works}:</b>\n${services}` : "",
    o.clientNotes ? `\n📝 ${esc(o.clientNotes)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatNotifications(
  locale: BotLocale,
  slice: ClientPortalSlice
): string {
  const L = getClientBotLabels(locale);
  const notes = slice.notifications.slice(0, 8);
  if (notes.length === 0) {
    return L.notificationsEmpty;
  }

  const lines = [L.notificationsTitle, ""];
  for (const n of notes) {
    const order = n.workOrderId
      ? slice.workOrders.find((o) => o.id === n.workOrderId)
      : undefined;
    const prefix = n.read ? "•" : "🆕";
    let title = "";
    switch (n.type) {
      case "car_ready":
        title = L.notifCarReady;
        break;
      case "status_change":
        title = `${L.orderStatus}: ${n.status ? repairLabel(locale, n.status) : L.notifStatusUpdated}`;
        break;
      case "sign_required":
        title = L.notifSignRequired;
        break;
      case "appointment_invite":
        title = `${L.notifAppointment} ${n.appointmentDate ?? ""} ${n.appointmentTime ?? ""}`.trim();
        break;
      default:
        title = L.notifDefault;
    }
    lines.push(
      `${prefix} <b>${title}</b>`,
      order ? `   ${esc(order.number)}` : "",
      ""
    );
  }
  return lines.join("\n");
}

export function formatAppointmentsSlice(
  locale: BotLocale,
  slice: ClientPortalSlice
): string {
  const L = getClientBotLabels(locale);
  const today = new Date().toISOString().slice(0, 10);
  const apts = slice.appointments
    .filter((a) => a.date >= today)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    .slice(0, 6);

  if (apts.length === 0) {
    return L.appointmentsEmpty;
  }

  const lines = [L.appointmentsTitle, ""];
  for (const a of apts) {
    const service = a.serviceIds.map((id) => getClientServiceLabel(id, locale)).join(", ");
    lines.push(
      `<b>${a.date} · ${a.time}</b>`,
      `🔧 ${esc(service)}`,
      `📌 ${L.appointmentStatus[a.appointmentStatus] ?? a.appointmentStatus}`,
      ""
    );
  }
  return lines.join("\n");
}

export function formatCarsSlice(locale: BotLocale, slice: ClientPortalSlice): string {
  const L = getClientBotLabels(locale);
  if (slice.vehicles.length === 0) {
    return L.carsEmpty;
  }

  const lines = [L.carsTitle, ""];
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
