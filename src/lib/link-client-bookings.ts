import { normalizePhone } from "./auth";
import type { Database } from "./store";

/** Attach guest online bookings to client account when phone matches */
export function linkGuestBookingsToClient(
  db: Database,
  userId: string,
  phone: string
): boolean {
  const normalized = normalizePhone(phone);
  if (!normalized) return false;

  const vehicle = db.vehicles.find((v) => v.userId === userId);
  let changed = false;

  for (const apt of db.appointments) {
    if (apt.userId !== "guest") continue;
    if (normalizePhone(apt.clientPhone ?? "") !== normalized) continue;
    apt.userId = userId;
    if (vehicle && !apt.vehicleId) apt.vehicleId = vehicle.id;
    changed = true;
  }

  return changed;
}
