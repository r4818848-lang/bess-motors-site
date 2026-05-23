import { normalizePhone } from "./auth";
import { generateOrderNumber } from "./workorder-calc";
import type { Appointment, Database, WorkOrder, WorkOrderLine } from "./store";
import { notifyAppointment, notifyWorkOrderSignRequired } from "./client-notifications";

function ensureClientForBooking(
  db: Database,
  name: string,
  phone: string,
  existingUserId?: string
): { userId: string; vehicleId: string } {
  const normalized = normalizePhone(phone);
  const today = new Date().toISOString().slice(0, 10);

  let user =
    (normalized
      ? db.users.find(
          (u) => u.role === "client" && normalizePhone(u.phone) === normalized
        )
      : undefined) ??
    (existingUserId && existingUserId !== "guest"
      ? db.users.find((u) => u.id === existingUserId)
      : undefined);

  if (!user) {
    user = {
      id: `client-${Date.now()}`,
      phone: normalized || phone.trim(),
      name: name.trim() || "Клиент",
      role: "client",
      createdAt: today,
    };
    db.users.push(user);
  } else if (name.trim() && name !== "—") {
    user.name = name.trim();
  }

  let vehicle = db.vehicles.find((v) => v.userId === user!.id);
  if (!vehicle) {
    vehicle = {
      id: `v-${Date.now()}`,
      vin: "",
      plate: "—",
      mileage: 0,
      make: "—",
      model: "—",
      engine: "",
      engineVolume: "",
      trim: "",
      power: "",
      transmission: "",
      drivetrain: "",
      year: "",
      color: "",
      fuelType: "",
      notes: "",
      userId: user.id,
    };
    db.vehicles.push(vehicle);
  }

  return { userId: user.id, vehicleId: vehicle.id };
}

/** Creates work order from website appointment; links apt.workOrderId. Returns work order id. */
export function createWorkOrderFromAppointment(
  db: Database,
  apt: Appointment,
  resolveServiceName: (serviceId: string) => string
): string {
  if (apt.workOrderId) {
    const exists = db.workOrders.some((o) => o.id === apt.workOrderId);
    if (exists) return apt.workOrderId;
  }

  const clientName = apt.clientName?.trim() || "—";
  const clientPhone = apt.clientPhone?.trim() || "";
  const { userId, vehicleId } = ensureClientForBooking(
    db,
    clientName,
    clientPhone,
    apt.userId
  );

  apt.userId = userId;
  apt.vehicleId = vehicleId;

  const services: WorkOrderLine[] = apt.serviceIds.map((sid, i) => ({
    id: `s-${Date.now()}-${i}`,
    name: resolveServiceName(sid),
    qty: 1,
    price: 0,
    discount: 0,
  }));

  const visitLine = `Визит: ${apt.date} · ${apt.time}`;
  const internalNotes = [
    "Онлайн-запись с сайта",
    `Клиент: ${clientName}`,
    `Телефон: ${clientPhone}`,
    visitLine,
    apt.comment ? `Комментарий: ${apt.comment}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const clientNotes = [apt.comment, visitLine].filter(Boolean).join("\n");

  const workOrder: WorkOrder = {
    id: `wo-${Date.now()}`,
    number: generateOrderNumber(db.workOrders),
    userId,
    vehicleId,
    status: "received",
    services:
      services.length > 0
        ? services
        : [
            {
              id: `s-${Date.now()}`,
              name: "Услуга — онлайн-запись",
              qty: 1,
              price: 0,
              discount: 0,
            },
          ],
    parts: [],
    mechanicId: apt.mechanicId || db.mechanics[0]?.id || "mech-1",
    mechanicLaborPercent: -1,
    mechanicPartsPercent: -1,
    orderDiscount: 0,
    internalNotes,
    clientNotes,
    files: [],
    createdAt: apt.date || new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString().slice(0, 10),
    confirmationStatus: "awaiting_confirmation",
  };

  db.workOrders.push(workOrder);
  apt.workOrderId = workOrder.id;
  apt.repairStatus = "received";
  apt.appointmentStatus = "confirmed";

  notifyAppointment(db, apt, "confirmed");
  notifyWorkOrderSignRequired(db, workOrder);

  return workOrder.id;
}
