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

/** Merge cloud snapshot into local CRM — newer record wins per id */
export function mergeCloudIntoLocal(local: Database, remote: Database): Database {
  return {
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
}

/** Merge incoming PUT with existing cloud document */
export function mergeCloudDocuments(existing: Database, incoming: Database): Database {
  return mergeCloudIntoLocal(existing, incoming);
}
