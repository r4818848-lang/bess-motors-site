import { loadDb, saveDb } from "./store";
import type { ServiceId } from "./services-catalog";
import { getStoredAttribution } from "./utm";
import { handleAppointmentNotification } from "./client-notifications";
import { ensureClientForBooking } from "./create-work-order-from-booking";
import { pushAppointmentToCloud } from "./cloud-appointments";

export function createCallRequest(params: {
  phone: string;
  clientName: string;
  serviceId: string;
  serviceLabel: string;
  comment?: string;
}): void {
  const db = loadDb();
  const user = db.currentUserId
    ? db.users.find((u) => u.id === db.currentUserId)
    : null;
  const marketing = getStoredAttribution() ?? undefined;
  db.callRequests.push({
    id: `call-${Date.now()}`,
    phone: params.phone,
    clientName: params.clientName,
    userId: user?.id ?? "guest",
    serviceId: params.serviceId,
    serviceLabel: params.serviceLabel,
    comment: params.comment ?? "",
    status: "needs_call",
    source: "website",
    marketing: marketing ?? undefined,
    createdAt: new Date().toISOString(),
  });
  saveDb(db);
}

export function createBookingAppointment(params: {
  serviceId: ServiceId | string;
  serviceIds: string[];
  date: string;
  time: string;
  comment: string;
  clientName: string;
  clientPhone: string;
  estimatedTotal?: number;
  cartLines?: { itemId: string; label: string; lineTotal: number; priceFrom: boolean }[];
}): void {
  const db = loadDb();
  const { userId, vehicleId } = ensureClientForBooking(
    db,
    params.clientName,
    params.clientPhone,
    db.currentUserId ?? undefined
  );
  const marketing = getStoredAttribution() ?? undefined;
  db.appointments.push({
    id: `apt-${Date.now()}`,
    userId,
    vehicleId,
    serviceIds: params.serviceIds.length ? params.serviceIds : [params.serviceId],
    date: params.date,
    time: params.time,
    mechanicId: db.mechanics[0]?.id ?? "mech-1",
    repairStatus: "received",
    appointmentStatus: "scheduled",
    comment: params.comment,
    clientName: params.clientName,
    clientPhone: params.clientPhone,
    source: "website",
    marketing: marketing ?? undefined,
    createdAt: new Date().toISOString(),
  });
  const apt = db.appointments[db.appointments.length - 1];
  handleAppointmentNotification(db, apt, "scheduled");
  saveDb(db);
  void pushAppointmentToCloud(apt);
}
