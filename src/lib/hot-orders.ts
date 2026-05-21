import type { Appointment, CallRequest, Database } from "./store";
import { getAppointmentClientContact } from "./appointments";

export type HotOrderKind = "booking" | "call";

export type HotOrderFilter =
  | "all"
  | "new"
  | "awaiting_call"
  | "confirmed"
  | "in_progress"
  | "completed";

export type HotOrderRow = {
  id: string;
  kind: HotOrderKind;
  createdAt: string;
  clientName: string;
  phone: string;
  serviceLabel: string;
  date?: string;
  time?: string;
  comment: string;
  status: string;
  workOrderId?: string;
  filters: HotOrderFilter[];
  isActionRequired: boolean;
  raw: Appointment | CallRequest;
};

function isWebsiteAppointment(a: Appointment): boolean {
  if (a.source === "website") return true;
  if (a.source === "manual") return false;
  return Boolean(a.clientName && a.clientPhone);
}

function isWebsiteCallRequest(r: CallRequest): boolean {
  return r.source !== "manual";
}

function bookingFilters(apt: Appointment): HotOrderFilter[] {
  const tags: HotOrderFilter[] = ["all"];
  if (apt.appointmentStatus === "scheduled") tags.push("new");
  if (apt.appointmentStatus === "confirmed") {
    tags.push("confirmed");
    if (apt.workOrderId) tags.push("in_progress");
  }
  if (apt.appointmentStatus === "completed" || apt.appointmentStatus === "cancelled") {
    tags.push("completed");
  }
  return tags;
}

function callFilters(call: CallRequest): HotOrderFilter[] {
  const tags: HotOrderFilter[] = ["all"];
  if (call.status === "needs_call") {
    tags.push("new", "awaiting_call");
  }
  if (call.status === "called") tags.push("in_progress");
  if (call.status === "done") tags.push("completed");
  return tags;
}

export function getWebsiteHotOrders(
  db: Database,
  serviceLabel: (id: string) => string
): HotOrderRow[] {
  const rows: HotOrderRow[] = [];

  for (const apt of db.appointments) {
    if (!isWebsiteAppointment(apt)) continue;
    const contact = getAppointmentClientContact(db, apt);
    const filters = bookingFilters(apt);
    rows.push({
      id: apt.id,
      kind: "booking",
      createdAt: apt.createdAt.includes("T")
        ? apt.createdAt
        : `${apt.date}T${apt.time || "00:00"}`,
      clientName: contact.name,
      phone: contact.phone,
      serviceLabel: apt.serviceIds.map(serviceLabel).join(", "),
      date: apt.date,
      time: apt.time,
      comment: apt.comment,
      status: apt.appointmentStatus,
      workOrderId: apt.workOrderId,
      filters,
      isActionRequired: apt.appointmentStatus === "scheduled",
      raw: apt,
    });
  }

  for (const call of db.callRequests) {
    if (!isWebsiteCallRequest(call)) continue;
    const filters = callFilters(call);
    rows.push({
      id: call.id,
      kind: "call",
      createdAt: call.createdAt,
      clientName: call.clientName ?? "—",
      phone: call.phone,
      serviceLabel: call.serviceLabel,
      comment: call.comment,
      status: call.status,
      filters,
      isActionRequired: call.status === "needs_call",
      raw: call,
    });
  }

  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function filterHotOrders(rows: HotOrderRow[], filter: HotOrderFilter): HotOrderRow[] {
  if (filter === "all") return rows;
  return rows.filter((r) => r.filters.includes(filter));
}

/** Badge: new bookings + call requests awaiting phone */
export function getHotOrdersBadgeCount(rows: HotOrderRow[]): number {
  return rows.filter((r) => r.isActionRequired).length;
}
