import type { Database, WorkOrder } from "@/lib/store";
import { mergeTimestampMs, normalizeIsoTimestamp } from "@/lib/work-order-timestamp";

function orderStamp(o: WorkOrder): string {
  return normalizeIsoTimestamp(o.updatedAt || o.createdAt);
}

function userStamp(u: { createdAt: string }): string {
  return normalizeIsoTimestamp(u.createdAt);
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

function mergeCloudRecords(local: Database, remote: Database): Database {
  return {
    ...local,
    ...remote,
    currentUserId: local.currentUserId,
    workOrders: mergeById(local.workOrders, remote.workOrders, orderStamp).sort((a, b) =>
      orderStamp(b).localeCompare(orderStamp(a))
    ),
    users: mergeById(local.users, remote.users, userStamp),
    vehicles: mergeById(local.vehicles, remote.vehicles, (v) =>
      normalizeIsoTimestamp(v.updatedAt ?? "")
    ),
    appointments: mergeById(local.appointments, remote.appointments),
    mechanics: mergeById(local.mechanics, remote.mechanics),
    expenses: mergeById(local.expenses, remote.expenses),
    warehouse: mergeById(local.warehouse, remote.warehouse),
    monthlyParts: mergeById(local.monthlyParts ?? [], remote.monthlyParts ?? [], (e) =>
      normalizeIsoTimestamp(e.createdAt)
    ),
    callRequests: mergeById(local.callRequests ?? [], remote.callRequests ?? []),
    vehicleHistory: mergeById(local.vehicleHistory ?? [], remote.vehicleHistory ?? []),
    notifications: mergeById(local.notifications ?? [], remote.notifications ?? []),
    clientRatings: mergeById(local.clientRatings ?? [], remote.clientRatings ?? []),
    passwordResets: remote.passwordResets ?? local.passwordResets,
    settings: { ...local.settings, ...remote.settings },
  };
}

export type MergeCloudPullOptions = {
  /** Browser last successful cloud pull/push timestamp */
  lastCloudSyncedAt?: string;
  /** `updatedAt` from GET /api/crm-db */
  remoteUpdatedAt?: string;
};

/**
 * Pull from cloud: merge by id, then apply remote deletions when cloud snapshot is newer.
 * Rows changed locally after `lastCloudSyncedAt` are kept (unsynced draft / new order).
 */
export function mergeCloudPullIntoLocal(
  local: Database,
  remote: Database,
  options?: MergeCloudPullOptions
): Database {
  const merged = mergeCloudRecords(local, remote);
  const lastSynced = options?.lastCloudSyncedAt;
  const remoteAt = options?.remoteUpdatedAt;
  if (!lastSynced || !remoteAt) return merged;
  if (mergeTimestampMs(remoteAt) <= mergeTimestampMs(lastSynced)) return merged;
  return applyPullRemoteDeletions(merged, remote, lastSynced);
}

/** Drop local rows removed on server; keep items created/edited locally after last sync */
function applyPullRemoteDeletions(
  base: Database,
  remote: Database,
  lastCloudSyncedAt: string
): Database {
  const syncCutoff = normalizeIsoTimestamp(lastCloudSyncedAt);
  const orderIds = ids(remote.workOrders);
  const userIds = ids(remote.users);
  const vehicleIds = ids(remote.vehicles);
  const aptIds = ids(remote.appointments);

  const users = base.users.filter((u) => {
    if (userIds.has(u.id)) return true;
    return mergeTimestampMs(userStamp(u)) > mergeTimestampMs(syncCutoff);
  });
  const keptUserIds = ids(users);

  return {
    ...base,
    users,
    vehicles: base.vehicles.filter((v) => {
      if (vehicleIds.has(v.id)) return true;
      return keptUserIds.has(v.userId);
    }),
    workOrders: base.workOrders.filter((o) => {
      if (orderIds.has(o.id)) return true;
      return mergeTimestampMs(orderStamp(o)) > mergeTimestampMs(syncCutoff);
    }),
    appointments: base.appointments.filter((a) => {
      if (aptIds.has(a.id)) return true;
      return (
        mergeTimestampMs(normalizeIsoTimestamp(a.createdAt)) >
        mergeTimestampMs(syncCutoff)
      );
    }),
    callRequests: (base.callRequests ?? []).filter(
      (c) => !c.userId || userIds.has(c.userId) || keptUserIds.has(c.userId)
    ),
    vehicleHistory: (base.vehicleHistory ?? []).filter(
      (h) => keptUserIds.has(h.userId) && vehicleIds.has(h.vehicleId)
    ),
    notifications: (base.notifications ?? []).filter((n) => keptUserIds.has(n.userId)),
    clientRatings: (base.clientRatings ?? []).filter(
      (r) => !r.userId || keptUserIds.has(r.userId)
    ),
  };
}

/** Merge cloud snapshot into local CRM — newer record wins per id; remote membership drops deletions */
export function mergeCloudIntoLocal(
  local: Database,
  remote: Database,
  options?: { lastCloudSyncedAt?: string }
): Database {
  const merged = mergeCloudRecords(local, remote);
  return applySnapshotMembership(merged, remote, options);
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
function applySnapshotMembership(
  base: Database,
  incoming: Database,
  options?: { lastCloudSyncedAt?: string }
): Database {
  const userIds = ids(incoming.users);
  const vehicleIds = ids(incoming.vehicles);
  const orderIds = ids(incoming.workOrders);
  const aptIds = ids(incoming.appointments);
  const syncCutoff = options?.lastCloudSyncedAt
    ? normalizeIsoTimestamp(options.lastCloudSyncedAt)
    : "";

  const users = base.users.filter((u) => {
    if (userIds.has(u.id)) return true;
    if (!syncCutoff) return false;
    return mergeTimestampMs(userStamp(u)) > mergeTimestampMs(syncCutoff);
  });
  const keptUserIds = ids(users);

  return {
    ...base,
    users,
    vehicles: base.vehicles.filter((v) => {
      if (vehicleIds.has(v.id)) return true;
      if (!syncCutoff) return false;
      return keptUserIds.has(v.userId);
    }),
    workOrders: base.workOrders.filter((o) => {
      if (orderIds.has(o.id)) return true;
      if (!syncCutoff) return false;
      return mergeTimestampMs(orderStamp(o)) > mergeTimestampMs(syncCutoff);
    }),
    appointments: base.appointments.filter((a) => {
      if (aptIds.has(a.id)) return true;
      if (!syncCutoff) return false;
      return (
        mergeTimestampMs(normalizeIsoTimestamp(a.createdAt)) >
        mergeTimestampMs(syncCutoff)
      );
    }),
    callRequests: (base.callRequests ?? []).filter((c) => {
      if (userIds.has(c.userId)) return true;
      if (!syncCutoff) return false;
      return (
        mergeTimestampMs(normalizeIsoTimestamp(c.createdAt)) >
        mergeTimestampMs(syncCutoff)
      );
    }),
    vehicleHistory: (base.vehicleHistory ?? []).filter((h) =>
      keptUserIds.has(h.userId)
    ),
    notifications: (base.notifications ?? []).filter((n) =>
      keptUserIds.has(n.userId)
    ),
    clientRatings: (base.clientRatings ?? []).filter(
      (r) => !r.userId || keptUserIds.has(r.userId)
    ),
  };
}

export type MergeCloudPutOptions = {
  /** From browser — protects rows created elsewhere since last successful sync */
  lastCloudSyncedAt?: string;
};

/**
 * Server-side CRM mutation (Telegram, API routes): merge by id only.
 * Never apply snapshot membership — that would drop newly inserted rows.
 */
export function mergeServerCloudMutation(
  existing: Database,
  mutated: Database
): Database {
  const merged = mergeCloudRecords(mutated, existing);
  return { ...merged, currentUserId: null };
}

/** Merge incoming PUT with cloud: newer fields per id; deletions only with sync marker */
export function mergeCloudDocuments(
  existing: Database,
  incoming: Database,
  options?: MergeCloudPutOptions
): Database {
  const merged = mergeCloudIntoLocal(incoming, existing);
  if (!options?.lastCloudSyncedAt?.trim()) {
    return merged;
  }
  return applySnapshotMembership(merged, incoming, {
    lastCloudSyncedAt: options.lastCloudSyncedAt,
  });
}
