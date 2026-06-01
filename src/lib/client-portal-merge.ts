import type { ClientPortalSlice } from "@/lib/client-sign";
import type { Database } from "@/lib/store";
import { mergeTimestampMs } from "@/lib/work-order-timestamp";

function stamp(s: { updatedAt?: string; createdAt?: string }): string {
  return s.updatedAt || s.createdAt || "";
}

/** Merge cloud portal slice into local CRM without losing client-side state */
export function mergeClientPortalIntoLocal(db: Database, slice: ClientPortalSlice): Database {
  const ui = db.users.findIndex((u) => u.id === slice.user.id);
  if (ui >= 0) {
    const local = db.users[ui]!;
    db.users[ui] = {
      ...slice.user,
      referralCode: slice.user.referralCode || local.referralCode,
      pushSubscription: slice.user.pushSubscription ?? local.pushSubscription,
      telegramChatId: slice.user.telegramChatId || local.telegramChatId,
      telegramUserId: slice.user.telegramUserId ?? local.telegramUserId,
      telegramUsername: slice.user.telegramUsername ?? local.telegramUsername,
      telegramLinkedAt: slice.user.telegramLinkedAt ?? local.telegramLinkedAt,
      telegramLocale: slice.user.telegramLocale ?? local.telegramLocale,
    };
  } else {
    db.users.push(slice.user);
  }

  for (const v of slice.vehicles) {
    const i = db.vehicles.findIndex((x) => x.id === v.id);
    if (i >= 0) db.vehicles[i] = { ...db.vehicles[i], ...v };
    else db.vehicles.push(v);
  }

  for (const o of slice.workOrders) {
    const i = db.workOrders.findIndex((x) => x.id === o.id);
    if (i >= 0) {
      const local = db.workOrders[i]!;
      if (mergeTimestampMs(stamp(o)) >= mergeTimestampMs(stamp(local))) {
        db.workOrders[i] = o;
      }
    } else {
      db.workOrders.push(o);
    }
  }

  for (const a of slice.appointments) {
    const i = db.appointments.findIndex((x) => x.id === a.id);
    if (i >= 0) db.appointments[i] = a;
    else db.appointments.push(a);
  }

  if (!db.notifications) db.notifications = [];
  for (const n of slice.notifications) {
    const i = db.notifications.findIndex((x) => x.id === n.id);
    if (i >= 0) {
      const local = db.notifications[i]!;
      db.notifications[i] = { ...n, read: Boolean(local.read) || n.read };
    } else {
      db.notifications.push(n);
    }
  }

  db.currentUserId = slice.user.id;
  return applyClientPortalMembership(db, slice);
}

/** Drop local rows for this client that no longer exist in cloud slice. */
function applyClientPortalMembership(db: Database, slice: ClientPortalSlice): Database {
  const userId = slice.user.id;
  const orderIds = new Set(slice.workOrders.map((o) => o.id));
  const vehicleIds = new Set(slice.vehicles.map((v) => v.id));
  const aptIds = new Set(slice.appointments.map((a) => a.id));
  const notifIds = new Set(slice.notifications.map((n) => n.id));

  return {
    ...db,
    workOrders: db.workOrders.filter(
      (o) => o.userId !== userId || orderIds.has(o.id)
    ),
    vehicles: db.vehicles.filter(
      (v) => v.userId !== userId || vehicleIds.has(v.id)
    ),
    appointments: db.appointments.filter(
      (a) => a.userId !== userId || aptIds.has(a.id)
    ),
    notifications: (db.notifications ?? []).filter(
      (n) => n.userId !== userId || notifIds.has(n.id)
    ),
  };
}
