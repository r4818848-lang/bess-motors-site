import { hashPassword } from "@/lib/crypto";
import { normalizePhone, normalizePlateKey } from "@/lib/auth";
import type { Database, User, Vehicle, WorkOrder } from "@/lib/store";

export type ClientPortalSlice = {
  user: User;
  vehicles: Vehicle[];
  workOrders: WorkOrder[];
  appointments: Database["appointments"];
  notifications: Database["notifications"];
};

function findClientByPhone(db: Database, phone: string): User | undefined {
  const normalized = normalizePhone(phone);
  return db.users.find(
    (u) => u.role === "client" && normalizePhone(u.phone) === normalized
  );
}

function pendingWorkOrders(db: Database, userId: string): WorkOrder[] {
  return db.workOrders
    .filter(
      (o) =>
        o.userId === userId &&
        o.confirmationStatus !== "confirmed" &&
        o.documentStatus !== "signed"
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function pickWorkOrderForClient(
  db: Database,
  userId: string,
  orderId?: string
): WorkOrder | null {
  if (orderId) {
    const direct = db.workOrders.find((o) => o.id === orderId && o.userId === userId);
    if (direct) return direct;
  }
  const pending = pendingWorkOrders(db, userId);
  if (orderId) {
    const linked = pending.find((o) => o.id === orderId);
    if (linked) return linked;
  }
  return pending[0] ?? null;
}

/** Phone = login, plate = password; link work order and guest bookings */
export async function ensureClientForSign(
  db: Database,
  phone: string,
  plate: string,
  orderHint?: WorkOrder | null
): Promise<{ user: User; vehicle: Vehicle | null }> {
  const normalized = normalizePhone(phone);
  const plateKey = normalizePlateKey(plate);
  if (!normalized || plateKey.length < 2) {
    throw new Error("invalid_credentials");
  }

  const passwordHash = await hashPassword(plateKey);
  const displayPlate = plate.trim();
  let user = findClientByPhone(db, normalized);

  const prevOwner =
    orderHint?.userId != null
      ? db.users.find((u) => u.id === orderHint.userId)
      : undefined;

  if (!user) {
    user = {
      id: `user-${Date.now()}`,
      phone: normalized,
      name:
        prevOwner?.role === "client" && prevOwner.name
          ? prevOwner.name
          : `Client ${normalized.slice(-4)}`,
      role: "client",
      passwordHash,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    db.users.push(user);
  } else {
    user.passwordHash = passwordHash;
    delete user.password;
  }

  let vehicle =
    db.vehicles.find(
      (v) => v.userId === user!.id && normalizePlateKey(v.plate) === plateKey
    ) ?? null;

  if (!vehicle && orderHint?.vehicleId) {
    vehicle = db.vehicles.find((v) => v.id === orderHint.vehicleId) ?? null;
    if (vehicle) {
      vehicle.userId = user.id;
      if (!vehicle.plate?.trim() || vehicle.plate === "—") {
        vehicle.plate = displayPlate;
      }
    }
  }

  if (!vehicle) {
    vehicle = {
      id: `v-${Date.now()}`,
      vin: "",
      plate: displayPlate,
      mileage: 0,
      make: "",
      model: "",
      engine: "",
      trim: "",
      power: "",
      transmission: "",
      userId: user.id,
    };
    db.vehicles.push(vehicle);
  }

  if (orderHint) {
    orderHint.userId = user.id;
    if (vehicle) orderHint.vehicleId = vehicle.id;
  }

  for (const apt of db.appointments) {
    if (normalizePhone(apt.clientPhone ?? "") !== normalized) continue;
    if (apt.userId === "guest") apt.userId = user.id;
    if (!apt.vehicleId && vehicle) apt.vehicleId = vehicle.id;
  }

  return { user, vehicle };
}

export function sliceForClient(db: Database, userId: string): ClientPortalSlice | null {
  const user = db.users.find((u) => u.id === userId && u.role === "client");
  if (!user) return null;
  const phone = normalizePhone(user.phone);
  return {
    user,
    vehicles: db.vehicles.filter((v) => v.userId === userId),
    workOrders: db.workOrders.filter((o) => o.userId === userId),
    appointments: db.appointments.filter(
      (a) =>
        a.userId === userId ||
        (a.userId === "guest" && normalizePhone(a.clientPhone ?? "") === phone)
    ),
    notifications: (db.notifications ?? []).filter((n) => n.userId === userId),
  };
}
