import type { Database, RepairStatus, WorkOrder, ClientNotification } from "./store";
import { siteConfig } from "./site";

export type { ClientNotification, ClientNotificationType } from "./store";

/** When CRM sets status to ready — create in-app notification for the client */
export function handleWorkOrderReadyTransition(
  db: Database,
  order: WorkOrder,
  previousStatus?: RepairStatus
): boolean {
  if (order.status !== "ready") return false;
  if (previousStatus === "ready") return false;
  if (order.readyNotifiedAt) return false;

  db.notifications = db.notifications ?? [];
  const duplicate = db.notifications.some(
    (n) => n.workOrderId === order.id && n.type === "car_ready"
  );
  if (duplicate) return false;

  db.notifications.push({
    id: `n-${Date.now()}-${order.id}`,
    userId: order.userId,
    workOrderId: order.id,
    type: "car_ready",
    read: false,
    createdAt: new Date().toISOString(),
  });
  order.readyNotifiedAt = new Date().toISOString();
  return true;
}

export function getUserNotifications(db: Database, userId: string): ClientNotification[] {
  return (db.notifications ?? [])
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getUnreadNotificationCount(db: Database, userId: string): number {
  return getUserNotifications(db, userId).filter((n) => !n.read).length;
}

export function markNotificationRead(db: Database, notificationId: string): void {
  const n = (db.notifications ?? []).find((x) => x.id === notificationId);
  if (n) n.read = true;
}

export function markAllNotificationsRead(db: Database, userId: string): void {
  for (const n of db.notifications ?? []) {
    if (n.userId === userId) n.read = true;
  }
}

function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Pre-filled WhatsApp message when car is ready + Google review link */
export function buildCarReadyWhatsAppUrl(
  clientPhone: string,
  orderNumber: string,
  vehicleLabel: string,
  locale: "pl" | "ru" | "en" | "uk"
): string {
  const reviewUrl = siteConfig.googleMapsReviewsUrl;
  const loc = locale === "ru" || locale === "uk" ? "ru" : locale === "en" ? "en" : "pl";

  const messages: Record<string, string> = {
    pl: `Dzień dobry! Państwa ${vehicleLabel} jest gotowy do odbioru (${orderNumber}). Prosimy o odbiór w ciągu 7 dni. Będziemy wdzięczni za opinię w Google Maps: ${reviewUrl}`,
    ru: `Здравствуйте! Ваш автомобиль ${vehicleLabel} готов к выдаче (${orderNumber}). Заберите в течение 7 дней. Будем благодарны за отзыв в Google Maps: ${reviewUrl}`,
    en: `Hello! Your ${vehicleLabel} is ready for pickup (${orderNumber}). Please collect within 7 days. We would appreciate a Google Maps review: ${reviewUrl}`,
  };

  const text = messages[loc] ?? messages.pl;
  const digits = phoneDigits(clientPhone);
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

const PUSH_SEEN_PREFIX = "bess-notif-pushed-";

/** Browser push when client has the site open */
export function maybeShowBrowserNotifications(
  db: Database,
  userId: string,
  copy: { title: string; body: string }
): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const unread = getUserNotifications(db, userId).filter((n) => !n.read && n.type === "car_ready");

  for (const n of unread) {
    const seenKey = `${PUSH_SEEN_PREFIX}${n.id}`;
    if (sessionStorage.getItem(seenKey)) continue;

    const order = db.workOrders.find((o) => o.id === n.workOrderId);
    const vehicle = order ? db.vehicles.find((v) => v.id === order.vehicleId) : null;
    const label = vehicle
      ? `${vehicle.make} ${vehicle.model} · ${vehicle.plate}`.trim()
      : order?.number ?? "";

    try {
      const notification = new Notification(copy.title, {
        body: copy.body.replace("{vehicle}", label || order?.number || ""),
        icon: siteConfig.logoImage || "/images/logo.png",
        tag: n.id,
      });
      notification.onclick = () => {
        window.focus();
        window.location.href = "/cabinet?tab=notifications";
      };
      sessionStorage.setItem(seenKey, "1");
    } catch {
      /* ignore */
    }
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission | null> {
  if (typeof window === "undefined" || !("Notification" in window)) return null;
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    return await Notification.requestPermission();
  } catch {
    return null;
  }
}
