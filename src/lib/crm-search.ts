import type { Database, User, Vehicle, WorkOrder, VehicleHistoryEntry } from "./store";

export function normalizeCrmQuery(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s/g, "");
}

export function isEmptyCrmQuery(raw: string): boolean {
  return normalizeCrmQuery(raw).length === 0;
}

function includesNorm(haystack: string, needle: string): boolean {
  const n = normalizeCrmQuery(needle);
  if (!n) return true;
  return normalizeCrmQuery(haystack).includes(n);
}

export function matchesClientUser(user: User, query: string): boolean {
  if (isEmptyCrmQuery(query)) return true;
  return (
    includesNorm(user.name, query) ||
    includesNorm(user.phone, query) ||
    (user.email ? includesNorm(user.email, query) : false)
  );
}

export function matchesVehicle(vehicle: Vehicle | null | undefined, query: string): boolean {
  if (!vehicle) return false;
  if (isEmptyCrmQuery(query)) return true;
  return (
    includesNorm(vehicle.vin, query) ||
    includesNorm(vehicle.plate, query) ||
    includesNorm(vehicle.make, query) ||
    includesNorm(vehicle.model, query) ||
    includesNorm(`${vehicle.make} ${vehicle.model}`, query)
  );
}

export function matchesClientOrVehicle(
  db: Database,
  userId: string,
  query: string
): boolean {
  if (isEmptyCrmQuery(query)) return true;
  const user = db.users.find((u) => u.id === userId);
  if (user && matchesClientUser(user, query)) return true;
  const vehicles = db.vehicles.filter((v) => v.userId === userId);
  return vehicles.some((v) => matchesVehicle(v, query));
}

export function workOrderMatchesQuery(
  db: Database,
  order: WorkOrder,
  query: string
): boolean {
  if (isEmptyCrmQuery(query)) return true;
  const q = query.trim().toLowerCase();
  if (order.number.toLowerCase().includes(q)) return true;
  const client = db.users.find((u) => u.id === order.userId);
  const vehicle = db.vehicles.find((v) => v.id === order.vehicleId);
  if (client && matchesClientUser(client, query)) return true;
  if (vehicle && matchesVehicle(vehicle, query)) return true;
  return false;
}

export function filterWorkOrdersByQuery(
  db: Database,
  orders: WorkOrder[],
  query: string
): WorkOrder[] {
  return orders.filter((o) => workOrderMatchesQuery(db, o, query));
}

export interface ClientListRow {
  user: User;
  vehicles: Vehicle[];
}

export function filterClients(db: Database, query: string): ClientListRow[] {
  const clients = db.users.filter((u) => u.role === "client");
  return clients
    .map((user) => ({
      user,
      vehicles: db.vehicles.filter((v) => v.userId === user.id),
    }))
    .filter(
      (row) =>
        matchesClientUser(row.user, query) ||
        row.vehicles.some((v) => matchesVehicle(v, query))
    )
    .sort((a, b) => a.user.name.localeCompare(b.user.name));
}

export interface VehicleHistoryRow {
  entry: VehicleHistoryEntry;
  vehicle: Vehicle | null;
  client: User | null;
}

export function filterVehicleHistory(
  db: Database,
  query: string
): VehicleHistoryRow[] {
  return db.vehicleHistory
    .map((entry) => ({
      entry,
      vehicle: db.vehicles.find((v) => v.id === entry.vehicleId) ?? null,
      client: db.users.find((u) => u.id === entry.userId) ?? null,
    }))
    .filter((row) => {
      if (isEmptyCrmQuery(query)) return true;
      if (row.client && matchesClientUser(row.client, query)) return true;
      if (row.vehicle && matchesVehicle(row.vehicle, query)) return true;
      return (
        includesNorm(row.entry.field, query) ||
        includesNorm(row.entry.oldValue, query) ||
        includesNorm(row.entry.newValue, query)
      );
    })
    .sort((a, b) => b.entry.changedAt.localeCompare(a.entry.changedAt));
}
