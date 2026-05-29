import { normalizePhone, normalizePlateKey } from "./auth";
import { hashPassword } from "./crypto";
import { generateOrderNumber } from "./workorder-calc";
import type { Appointment, Database, Vehicle, WorkOrder, WorkOrderLine } from "./store";
import {
  handleAppointmentNotification,
  handleWorkOrderClientNotifications,
} from "./client-notifications";

export function ensureClientForBooking(
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
      name: name.trim() || "Klient",
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

/** Sets plate + password hash for cabinet login (online booking). */
export async function ensureClientCredentialsForBooking(
  db: Database,
  name: string,
  phone: string,
  plate: string | undefined,
  existingUserId?: string
): Promise<{ userId: string; vehicleId: string }> {
  const { userId, vehicleId: defaultVehicleId } = ensureClientForBooking(
    db,
    name,
    phone,
    existingUserId
  );
  const plateKey = normalizePlateKey(plate ?? "");
  const user = db.users.find((u) => u.id === userId);
  if (!user) return { userId, vehicleId: defaultVehicleId };

  let vehicleId = defaultVehicleId;

  if (plateKey.length >= 2) {
    const byPlate = db.vehicles.find(
      (v) => v.userId === userId && normalizePlateKey(v.plate) === plateKey
    );
    if (byPlate) {
      vehicleId = byPlate.id;
    } else {
      const defaultVehicle = db.vehicles.find((v) => v.id === defaultVehicleId);
      if (
        defaultVehicle &&
        (!defaultVehicle.plate?.trim() || defaultVehicle.plate === "—")
      ) {
        defaultVehicle.plate = plate!.trim();
        vehicleId = defaultVehicle.id;
      } else {
        const newVehicle: Vehicle = {
          id: `v-${Date.now()}`,
          vin: "",
          plate: plate!.trim(),
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
          userId,
        };
        db.vehicles.push(newVehicle);
        vehicleId = newVehicle.id;
      }
    }

    if (!user.passwordHash) {
      user.passwordHash = await hashPassword(plateKey);
      delete user.password;
    }
  }

  return { userId, vehicleId };
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

  const visitLine = `Wizyta: ${apt.date} · ${apt.time}`;
  const internalNotes = [
    "Rezerwacja online ze strony",
    `Klient: ${clientName}`,
    `Telefon: ${clientPhone}`,
    visitLine,
    apt.comment ? `Komentarz: ${apt.comment}` : "",
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
              name: "Usługa — rezerwacja online",
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

  handleAppointmentNotification(db, apt, "confirmed");
  handleWorkOrderClientNotifications(db, workOrder, null);

  return workOrder.id;
}
