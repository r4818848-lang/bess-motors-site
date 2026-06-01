import type { Database, WorkOrder } from "@/lib/store";
import { mergeTimestampMs, normalizeIsoTimestamp } from "@/lib/work-order-timestamp";

function orderStamp(o: WorkOrder): string {
  return normalizeIsoTimestamp(o.updatedAt || o.createdAt);
}

function mergeById<T extends { id: string }>(
  local: T[],
  remote: T[],
  stamp: (item: T) => string = (x) =>
    normalizeIsoTimestamp(
      (x as { updatedAt?: string; createdAt?: string }).updatedAt ??
        (x as { createdAt?: string }).createdAt
    )
): T[] {
  const map = new Map<string, T>();
  for (const item of local) map.set(item.id, item);
  for (const item of remote) {
    const prev = map.get(item.id);
    const itemMs = mergeTimestampMs(stamp(item));
    const prevMs = prev ? mergeTimestampMs(stamp(prev)) : 0;
    if (!prev || itemMs >= prevMs) {
      map.set(item.id, item);
    }
  }
  return [...map.values()];
}

/** Merge cloud snapshot into local CRM — newer record wins per id; remote membership drops deletions */
export function mergeCloudIntoLocal(local: Database, remote: Database): Database {
  const merged: Database = {
    ...local,
    ...remote,
    currentUserId: local.currentUserId,
    workOrders: mergeById(local.workOrders, remote.workOrders, orderStamp).sort((a, b) =>
      orderStamp(b).localeCompare(orderStamp(a))
    ),
    users: mergeById(local.users, remote.users),
    vehicles: mergeById(local.vehicles, remote.vehicles),
    appointments: mergeById(local.appointments, remote.appointments),
    mechanics: mergeById(local.mechanics, remote.mechanics),
    expenses: mergeById(local.expenses, remote.expenses),
    warehouse: mergeById(local.warehouse, remote.warehouse),
    callRequests: mergeById(local.callRequests ?? [], remote.callRequests ?? []),
    vehicleHistory: mergeById(local.vehicleHistory ?? [], remote.vehicleHistory ?? []),
    notifications: mergeById(local.notifications ?? [], remote.notifications ?? []),
    clientRatings: mergeById(local.clientRatings ?? [], remote.clientRatings ?? []),
    passwordResets: remote.passwordResets ?? local.passwordResets,
    settings: { ...local.settings, ...remote.settings },
  };
  return applySnapshotMembership(merged, remote);
}

export function collectRemovedIds<T extends { id: string }>(
  before: T[],
  after: T[]
): string[] {
  const afterIds = new Set(after.map((x) => x.id));
  return before.filter((x) => !afterIds.has(x.id)).map((x) => x.id);
}

function ids<T extends { id: string }>(items: T[]): Set<string> {
  return new Set(items.map((x) => x.id));
}

/** Staff browser sends a full CRM snapshot — lists in `incoming` define who still exists */
function applySnapshotMembership(base: Database, incoming: Database): Database {
  const userIds = ids(incoming.users);
  const vehicleIds = ids(incoming.vehicles);
  const orderIds = ids(incoming.workOrders);
  const aptIds = ids(incoming.appointments);

  return {
    ...base,
    users: base.users.filter((u) => userIds.has(u.id)),
    vehicles: base.vehicles.filter((v) => vehicleIds.has(v.id)),
    workOrders: base.workOrders.filter((o) => orderIds.has(o.id)),
    appointments: base.appointments.filter((a) => aptIds.has(a.id)),
    callRequests: (base.callRequests ?? []).filter(
      (c) => !c.userId || userIds.has(c.userId)
    ),
    vehicleHistory: (base.vehicleHistory ?? []).filter(
      (h) => userIds.has(h.userId) && vehicleIds.has(h.vehicleId)
    ),
    notifications: (base.notifications ?? []).filter((n) => userIds.has(n.userId)),
    clientRatings: (base.clientRatings ?? []).filter(
      (r) => !r.userId || userIds.has(r.userId)
    ),
  };
}

/** Merge incoming PUT with cloud: newer fields per id, but deletions in incoming are kept */
export function mergeCloudDocuments(existing: Database, incoming: Database): Database {
  const merged = mergeCloudIntoLocal(incoming, existing);
  return applySnapshotMembership(merged, incoming);
}
