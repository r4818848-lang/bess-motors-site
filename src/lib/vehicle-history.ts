import type { Database, Vehicle, VehicleHistoryEntry } from "./store";

const TRACKED_FIELDS: (keyof Vehicle)[] = [
  "vin",
  "plate",
  "mileage",
  "make",
  "model",
  "engine",
  "engineVolume",
  "trim",
  "power",
  "transmission",
  "drivetrain",
  "year",
  "color",
  "fuelType",
  "notes",
];

export function updateVehicleWithHistory(
  db: Database,
  vehicleId: string,
  patch: Partial<Vehicle>,
  changedBy: string
): Vehicle | null {
  const idx = db.vehicles.findIndex((v) => v.id === vehicleId);
  if (idx < 0) return null;
  const prev = db.vehicles[idx];
  const next = { ...prev, ...patch };
  const now = new Date().toISOString();

  for (const field of TRACKED_FIELDS) {
    const oldVal = String(prev[field] ?? "");
    const newVal = String(next[field] ?? "");
    if (oldVal === newVal) continue;
    db.vehicleHistory.push({
      id: `vh-${Date.now()}-${field}`,
      vehicleId,
      userId: prev.userId,
      changedAt: now,
      changedBy,
      field,
      oldValue: oldVal,
      newValue: newVal,
    });
  }

  db.vehicles[idx] = next;
  return next;
}

export function getVehicleHistory(db: Database, vehicleId: string): VehicleHistoryEntry[] {
  return db.vehicleHistory
    .filter((h) => h.vehicleId === vehicleId)
    .sort((a, b) => b.changedAt.localeCompare(a.changedAt));
}
