import type { Database, User, Vehicle, WorkOrder, VehicleHistoryEntry } from "./store";
import { clientListSortDate, sortWorkOrdersByDateDesc } from "./crm-dates";

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

export function clientHasMatchingWorkOrder(
  db: Database,
  userId: string,
  query: string
): boolean {
  if (isEmptyCrmQuery(query)) return true;
  const q = query.trim().toLowerCase();
  return db.workOrders.some(
    (o) => o.userId === userId && o.number.toLowerCase().includes(q)
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
  if (clientHasMatchingWorkOrder(db, userId, query)) return true;
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
  return sortWorkOrdersByDateDesc(
    orders.filter((o) => workOrderMatchesQuery(db, o, query))
  );
}

export interface ClientListRow {
  user: User;
  vehicles: Vehicle[];
  orderCount: number;
}

export function filterClients(db: Database, query: string): ClientListRow[] {
  const clients = db.users.filter((u) => u.role === "client");
  return clients
    .map((user) => ({
      user,
      vehicles: db.vehicles.filter((v) => v.userId === user.id),
      orderCount: db.workOrders.filter((o) => o.userId === user.id).length,
    }))
    .filter(
      (row) =>
        matchesClientUser(row.user, query) ||
        clientHasMatchingWorkOrder(db, row.user.id, query) ||
        row.vehicles.some((v) => matchesVehicle(v, query))
    )
    .sort((a, b) =>
      clientListSortDate(db, b.user).localeCompare(clientListSortDate(db, a.user))
    );
}

export interface ClientHistoryRow {
  order: WorkOrder;
  client: User | null;
  vehicle: Vehicle | null;
}

export interface VehicleListRow {
  vehicle: Vehicle;
  client: User | null;
  orderCount: number;
  lastOrderId: string | null;
}

export function filterVehiclesList(db: Database, query: string): VehicleListRow[] {
  return db.vehicles
    .map((vehicle) => {
      const vehicleOrders = db.workOrders
        .filter((o) => o.vehicleId === vehicle.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return {
        vehicle,
        client: db.users.find((u) => u.id === vehicle.userId) ?? null,
        orderCount: vehicleOrders.length,
        lastOrderId: vehicleOrders[0]?.id ?? null,
      };
    })
    .filter((row) => {
      if (isEmptyCrmQuery(query)) return true;
      if (matchesVehicle(row.vehicle, query)) return true;
      if (row.client && matchesClientUser(row.client, query)) return true;
      return db.workOrders.some(
        (o) =>
          o.vehicleId === row.vehicle.id && o.number.toLowerCase().includes(query.trim().toLowerCase())
      );
    })
    .sort((a, b) => {
      const plate = b.vehicle.plate.localeCompare(a.vehicle.plate);
      if (plate !== 0) return plate;
      return `${b.vehicle.make} ${b.vehicle.model}`.localeCompare(
        `${a.vehicle.make} ${a.vehicle.model}`
      );
    });
}

export function filterClientHistory(
  db: Database,
  query: string
): ClientHistoryRow[] {
  const orders = sortWorkOrdersByDateDesc(db.workOrders);
  return orders
    .filter((o) => workOrderMatchesQuery(db, o, query))
    .map((order) => ({
      order,
      client: db.users.find((u) => u.id === order.userId) ?? null,
      vehicle: db.vehicles.find((v) => v.id === order.vehicleId) ?? null,
    }));
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
