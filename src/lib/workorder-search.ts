import { normalizePhone } from "./auth";
import type { Database, User, Vehicle } from "./store";

export interface SearchResult {
  user: User;
  vehicle: Vehicle | null;
}

/** Single client match from search text (name · phone, phone, or unique search hit). */
export function findClientByQuery(db: Database, query: string): User | null {
  const q = query.trim();
  if (!q) return null;

  const clients = db.users.filter((u) => u.role === "client");

  const byPhone = (raw: string): User | null => {
    const normalized = normalizePhone(raw);
    if (!normalized) return null;
    return clients.find((u) => normalizePhone(u.phone) === normalized) ?? null;
  };

  const dotParts = q.split("·").map((s) => s.trim()).filter(Boolean);
  if (dotParts.length >= 2) {
    const hit = byPhone(dotParts[dotParts.length - 1]!);
    if (hit) return hit;
  }

  const direct = byPhone(q);
  if (direct) return direct;

  const searched = searchClientsOnly(db, q);
  if (searched.length === 1) return searched[0]!;

  const qLower = q.toLowerCase();
  const byName = clients.filter(
    (u) =>
      u.name.toLowerCase() === qLower ||
      u.companyName?.toLowerCase() === qLower
  );
  if (byName.length === 1) return byName[0]!;

  return null;
}

export function searchClientsOnly(db: Database, query: string): User[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return db.users
    .filter((u) => u.role === "client")
    .filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.phone.replace(/\s/g, "").includes(q.replace(/\s/g, "")) ||
        (u.email?.toLowerCase().includes(q) ?? false) ||
        (u.companyName?.toLowerCase().includes(q) ?? false) ||
        (u.nip?.includes(q.replace(/\D/g, "")) ?? false)
    )
    .slice(0, 12);
}

export function searchVehiclesOnly(db: Database, query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: SearchResult[] = [];
  const seen = new Set<string>();

  for (const vehicle of db.vehicles) {
    const match =
      vehicle.vin.toLowerCase().includes(q) ||
      vehicle.plate.toLowerCase().includes(q) ||
      vehicle.make.toLowerCase().includes(q) ||
      vehicle.model.toLowerCase().includes(q) ||
      `${vehicle.make} ${vehicle.model}`.toLowerCase().includes(q);
    if (!match) continue;
    const user = db.users.find((u) => u.id === vehicle.userId);
    if (!user) continue;
    const key = `${user.id}-${vehicle.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({ user, vehicle });
  }
  return results.slice(0, 12);
}

export function searchClientsAndVehicles(db: Database, query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: SearchResult[] = [];
  const seen = new Set<string>();

  for (const order of db.workOrders) {
    if (order.number.toLowerCase().includes(q)) {
      const user = db.users.find((u) => u.id === order.userId);
      const vehicle = db.vehicles.find((v) => v.id === order.vehicleId) ?? null;
      if (user) {
        const key = `${user.id}-${vehicle?.id ?? "wo"}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({ user, vehicle });
        }
      }
    }
  }

  for (const user of db.users.filter((u) => u.role === "client")) {
    const matchUser =
      user.name.toLowerCase().includes(q) || user.phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""));

    const userVehicles = db.vehicles.filter((v) => v.userId === user.id);

    for (const vehicle of userVehicles) {
      const matchVehicle =
        vehicle.vin.toLowerCase().includes(q) || vehicle.plate.toLowerCase().includes(q);
      if (matchUser || matchVehicle) {
        const key = `${user.id}-${vehicle.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({ user, vehicle });
        }
      }
    }

    if (matchUser && userVehicles.length === 0) {
      const key = `${user.id}-none`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({ user, vehicle: null });
      }
    }
  }

  for (const vehicle of db.vehicles) {
    const matchVehicle =
      vehicle.vin.toLowerCase().includes(q) || vehicle.plate.toLowerCase().includes(q);
    if (matchVehicle) {
      const user = db.users.find((u) => u.id === vehicle.userId);
      if (user) {
        const key = `${user.id}-${vehicle.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({ user, vehicle });
        }
      }
    }
  }

  return results.slice(0, 12);
}
