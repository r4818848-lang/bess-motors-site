import { loadDb, saveDb } from "./store";
import type { ServiceId } from "./services-catalog";
import { getStoredAttribution } from "./utm";
import { handleAppointmentNotification } from "./client-notifications";
import { ensureClientCredentialsForBooking } from "./create-work-order-from-booking";
import { pushAppointmentToCloud } from "./cloud-appointments";
import { normalizePlateKey } from "./auth";
import { saveClientCredentials } from "./client-credentials";

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

export async function createBookingAppointment(params: {
  serviceId: ServiceId | string;
  serviceIds: string[];
  date: string;
  time: string;
  comment: string;
  clientName: string;
  clientPhone: string;
  clientPlate: string;
  estimatedTotal?: number;
  cartLines?: { itemId: string; label: string; lineTotal: number; priceFrom: boolean }[];
}): Promise<void> {
  const db = loadDb();
  const plate = params.clientPlate.trim();
  const { userId, vehicleId } = await ensureClientCredentialsForBooking(
    db,
    params.clientName,
    params.clientPhone,
    plate,
    db.currentUserId ?? undefined
  );
  const marketing = getStoredAttribution() ?? undefined;
  const apt = {
    id: `apt-${Date.now()}`,
    userId,
    vehicleId,
    serviceIds: params.serviceIds.length ? params.serviceIds : [params.serviceId],
    date: params.date,
    time: params.time,
    mechanicId: db.mechanics[0]?.id ?? "mech-1",
    repairStatus: "received" as const,
    appointmentStatus: "scheduled" as const,
    comment: params.comment,
    clientName: params.clientName,
    clientPhone: params.clientPhone,
    clientPlate: plate,
    source: "website" as const,
    marketing: marketing ?? undefined,
    createdAt: new Date().toISOString(),
  };
  db.appointments.push(apt);
  handleAppointmentNotification(db, apt, "scheduled");
  saveDb(db);

  if (normalizePlateKey(plate).length >= 2) {
    saveClientCredentials(params.clientPhone, plate);
  }

  await pushAppointmentToCloud(apt);
}
