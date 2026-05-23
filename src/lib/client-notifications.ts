import type {
  Appointment,
  ClientNotification,
  ClientNotificationType,
  Database,
  RepairStatus,
  WorkOrder,
} from "./store";

const MAX_PER_USER = 80;

function isRealClient(userId: string | undefined): userId is string {
  return !!userId && userId !== "guest" && userId !== "admin-1";
}

function trimNotifications(db: Database, userId: string): void {
  const list = db.clientNotifications.filter((n) => n.userId === userId);
  if (list.length <= MAX_PER_USER) return;
  const toRemove = new Set(list.slice(MAX_PER_USER).map((n) => n.id));
  db.clientNotifications = db.clientNotifications.filter((n) => !toRemove.has(n.id));
}

function hasRecentDuplicate(
  db: Database,
  userId: string,
  type: ClientNotificationType,
  workOrderId?: string,
  appointmentId?: string,
  statusKey?: RepairStatus
): boolean {
  const hourAgo = Date.now() - 60 * 60 * 1000;
  return db.clientNotifications.some(
    (n) =>
      n.userId === userId &&
      n.type === type &&
      n.workOrderId === workOrderId &&
      n.appointmentId === appointmentId &&
      n.statusKey === statusKey &&
      new Date(n.createdAt).getTime() > hourAgo
  );
}

export function pushClientNotification(
  db: Database,
  data: Omit<ClientNotification, "id" | "read" | "createdAt">
): ClientNotification | null {
  if (!isRealClient(data.userId)) return null;

  if (
    hasRecentDuplicate(
      db,
      data.userId,
      data.type,
      data.workOrderId,
      data.appointmentId,
      data.statusKey
    )
  ) {
    return null;
  }

  const item: ClientNotification = {
    ...data,
    id: `cn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    read: false,
    createdAt: new Date().toISOString(),
  };

  db.clientNotifications.unshift(item);
  trimNotifications(db, data.userId);

  return item;
}

export function getUnreadCount(db: Database, userId: string): number {
  return db.clientNotifications.filter((n) => n.userId === userId && !n.read).length;
}

export function getNotificationsForUser(db: Database, userId: string): ClientNotification[] {
  return db.clientNotifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function markNotificationRead(db: Database, notificationId: string): void {
  const n = db.clientNotifications.find((x) => x.id === notificationId);
  if (n) n.read = true;
}

export function markAllNotificationsRead(db: Database, userId: string): void {
  for (const n of db.clientNotifications) {
    if (n.userId === userId) n.read = true;
  }
}

export function markWorkOrderNotificationsRead(
  db: Database,
  userId: string,
  workOrderId: string
): void {
  for (const n of db.clientNotifications) {
    if (n.userId === userId && n.workOrderId === workOrderId) n.read = true;
  }
}

export function notifyWorkOrderStatusChange(
  db: Database,
  order: WorkOrder,
  status: RepairStatus
): void {
  pushClientNotification(db, {
    userId: order.userId,
    type: "status_change",
    workOrderId: order.id,
    workOrderNumber: order.number,
    statusKey: status,
  });
}

export function notifyWorkOrderSignRequired(db: Database, order: WorkOrder): void {
  if (order.confirmationStatus !== "awaiting_confirmation" || order.signature) return;
  if (
    db.clientNotifications.some(
      (n) =>
        n.userId === order.userId &&
        n.type === "sign_required" &&
        n.workOrderId === order.id &&
        !n.read
    )
  ) {
    return;
  }
  pushClientNotification(db, {
    userId: order.userId,
    type: "sign_required",
    workOrderId: order.id,
    workOrderNumber: order.number,
  });
}

export function applyWorkOrderNotifications(
  db: Database,
  prev: WorkOrder | null,
  next: WorkOrder
): void {
  if (!isRealClient(next.userId)) return;

  if (!prev || prev.status !== next.status) {
    notifyWorkOrderStatusChange(db, next, next.status);
  }

  const needsSign =
    next.confirmationStatus === "awaiting_confirmation" && !next.signature;
  const prevNeedsSign =
    prev?.confirmationStatus === "awaiting_confirmation" && !prev.signature;

  if (needsSign && (!prev || !prevNeedsSign)) {
    notifyWorkOrderSignRequired(db, next);
  }
}

export function notifyAppointment(
  db: Database,
  apt: Appointment,
  kind: "created" | "confirmed" | "rescheduled"
): void {
  if (!isRealClient(apt.userId)) return;
  pushClientNotification(db, {
    userId: apt.userId,
    type: "appointment",
    appointmentId: apt.id,
    workOrderId: apt.workOrderId,
    appointmentDate: apt.date,
    appointmentTime: apt.time,
    appointmentKind: kind,
  });
}

const notificationTextCache = new Map<string, { title: string; body: string; url: string }>();

export function registerNotificationText(
  id: string,
  title: string,
  body: string,
  url: string
): void {
  notificationTextCache.set(id, { title, body, url });
  setTimeout(() => notificationTextCache.delete(id), 60_000);
}

export function showBrowserNotification(title: string, body: string, url: string): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, { body, icon: "/favicon.ico" });
    n.onclick = () => {
      window.focus();
      window.location.href = url;
      n.close();
    };
  } catch {
    /* ignore */
  }
}

export async function requestClientNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    const result = await Notification.requestPermission();
    return result === "granted";
  } catch {
    return false;
  }
}
