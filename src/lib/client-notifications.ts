import type {
  Appointment,
  ClientNotification,
  Database,
  RepairStatus,
  WorkOrder,
} from "./store";
import { siteConfig } from "./site";
import {
  buildCarReadyWhatsAppUrl as buildCarReadyWaUrl,
  type WaMsgLocale,
} from "./whatsapp-messages";
import {
  isReferralQualifiedWorkOrder,
  recomputeReferrerFromDb,
  unlockInviteeRewardIfEligible,
} from "./referral-system";
import { incrementLoyaltyOnDelivered } from "./loyalty";
import { orderNeedsClientSignature } from "./order-signature";

export type { ClientNotification, ClientNotificationType } from "./store";

type AppointmentKind = NonNullable<ClientNotification["appointmentKind"]>;

function ensureNotifications(db: Database): ClientNotification[] {
  db.notifications = db.notifications ?? [];
  return db.notifications;
}

function isClientUserId(userId: string | undefined): userId is string {
  return Boolean(userId && userId !== "guest");
}

function pushNotification(
  db: Database,
  data: Omit<ClientNotification, "id" | "read" | "createdAt">
): ClientNotification {
  const list = ensureNotifications(db);
  const notification: ClientNotification = {
    ...data,
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    read: false,
    createdAt: new Date().toISOString(),
  };
  list.push(notification);
  return notification;
}

function vehicleLabel(db: Database, order: WorkOrder | undefined): string {
  if (!order) return "";
  const vehicle = db.vehicles.find((v) => v.id === order.vehicleId);
  return vehicle
    ? `${vehicle.make} ${vehicle.model} · ${vehicle.plate}`.trim()
    : order.number;
}

function hasNotification(
  db: Database,
  match: (n: ClientNotification) => boolean
): boolean {
  return (db.notifications ?? []).some(match);
}

/** When CRM sets status to ready — create in-app notification for the client */
export function handleWorkOrderReadyTransition(
  db: Database,
  order: WorkOrder,
  previousStatus?: RepairStatus
): boolean {
  if (order.status !== "ready") return false;
  if (previousStatus === "ready") return false;
  if (order.readyNotifiedAt) return false;
  if (!isClientUserId(order.userId)) return false;

  if (
    hasNotification(
      db,
      (n) => n.workOrderId === order.id && n.type === "car_ready"
    )
  ) {
    return false;
  }

  pushNotification(db, {
    userId: order.userId,
    workOrderId: order.id,
    type: "car_ready",
    status: "ready",
  });
  order.readyNotifiedAt = new Date().toISOString();
  return true;
}

function handleWorkOrderStatusChange(
  db: Database,
  order: WorkOrder,
  previousStatus?: RepairStatus
): boolean {
  if (!isClientUserId(order.userId)) return false;
  if (previousStatus === undefined || previousStatus === order.status) return false;

  if (order.status === "ready") {
    return handleWorkOrderReadyTransition(db, order, previousStatus);
  }

  if (
    hasNotification(
      db,
      (n) =>
        n.workOrderId === order.id &&
        n.type === "status_change" &&
        n.status === order.status
    )
  ) {
    return false;
  }

  pushNotification(db, {
    userId: order.userId,
    workOrderId: order.id,
    type: "status_change",
    status: order.status,
  });
  return true;
}

export function handleWorkOrderSignRequired(
  db: Database,
  order: WorkOrder,
  previous?: WorkOrder | null
): boolean {
  if (!isClientUserId(order.userId)) return false;
  if (order.confirmationStatus === "confirmed") return false;

  if (!orderNeedsClientSignature(order)) return false;

  if (previous?.confirmationStatus === "confirmed") return false;

  if (
    hasNotification(
      db,
      (n) => n.workOrderId === order.id && n.type === "sign_required"
    )
  ) {
    return false;
  }

  pushNotification(db, {
    userId: order.userId,
    workOrderId: order.id,
    type: "sign_required",
  });
  return true;
}

/** Status change, car ready, signature required — call on every work order save/update */
export function notifyReferralFriendJoined(db: Database, referrerId: string): void {
  if (!isClientUserId(referrerId)) return;
  pushNotification(db, {
    userId: referrerId,
    type: "referral_friend_joined",
  });
}

export function notifyReferralFriendQualified(
  db: Database,
  referrerId: string,
  workOrderId: string
): void {
  if (!isClientUserId(referrerId)) return;
  if (
    hasNotification(
      db,
      (n) =>
        n.type === "referral_friend_qualified" &&
        n.userId === referrerId &&
        n.workOrderId === workOrderId
    )
  ) {
    return;
  }
  pushNotification(db, {
    userId: referrerId,
    type: "referral_friend_qualified",
    workOrderId,
  });
}

export function notifyReferralRewardUnlocked(db: Database, referrerId: string): void {
  if (!isClientUserId(referrerId)) return;
  if (
    hasNotification(db, (n) => n.userId === referrerId && n.type === "referral_reward_unlocked")
  ) {
    return;
  }
  pushNotification(db, {
    userId: referrerId,
    type: "referral_reward_unlocked",
  });
}

/** After WO save: update referrer when referred client gets first paid+delivered order. */
export function processReferralAfterWorkOrderSave(
  db: Database,
  order: WorkOrder,
  previous?: WorkOrder | null
): void {
  if (!isReferralQualifiedWorkOrder(order)) return;
  if (previous && isReferralQualifiedWorkOrder(previous)) return;

  const client = db.users.find((u) => u.id === order.userId && u.role === "client");
  if (!client?.referredByUserId) return;

  if (unlockInviteeRewardIfEligible(db, client)) {
    pushNotification(db, {
      userId: client.id,
      type: "referral_invitee_reward",
    });
  }

  const result = recomputeReferrerFromDb(db, client.referredByUserId);
  if (!result) return;

  notifyReferralFriendQualified(db, client.referredByUserId, order.id);
  if (result.justUnlocked) {
    notifyReferralRewardUnlocked(db, client.referredByUserId);
  }
}

export function handleWorkOrderClientNotifications(
  db: Database,
  order: WorkOrder,
  previous?: WorkOrder | null
): void {
  handleWorkOrderStatusChange(db, order, previous?.status);
  handleWorkOrderSignRequired(db, order, previous);
  processReferralAfterWorkOrderSave(db, order, previous);
  incrementLoyaltyOnDelivered(db, order, previous);
}

export function handleAppointmentNotification(
  db: Database,
  apt: Appointment,
  kind: AppointmentKind,
  previous?: Pick<Appointment, "date" | "time" | "appointmentStatus"> | null
): boolean {
  if (!isClientUserId(apt.userId)) return false;

  if (kind === "rescheduled" && previous) {
    if (previous.date === apt.date && previous.time === apt.time) return false;
  }

  if (kind === "confirmed") {
    if (
      hasNotification(
        db,
        (n) => n.appointmentId === apt.id && n.appointmentKind === "confirmed"
      )
    ) {
      return false;
    }
  }

  if (kind === "scheduled") {
    if (
      hasNotification(
        db,
        (n) => n.appointmentId === apt.id && n.appointmentKind === "scheduled"
      )
    ) {
      return false;
    }
  }

  pushNotification(db, {
    userId: apt.userId,
    appointmentId: apt.id,
    workOrderId: apt.workOrderId,
    type: "appointment_invite",
    appointmentDate: apt.date,
    appointmentTime: apt.time,
    appointmentKind: kind,
  });
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

export type NotificationCopy = {
  title: string;
  body: string;
  accent: "green" | "red" | "amber" | "blue";
  showReviewLink?: boolean;
  signHref?: string;
  orderId?: string;
  appointmentTab?: boolean;
};

type RepairStatusLabels = Record<RepairStatus, string>;

export function getNotificationCopy(
  n: ClientNotification,
  db: Database,
  labels: {
    notifExt: {
      carReadyTitle: string;
      carReadyBody: string;
      statusChangeTitle: string;
      statusChangeBody: string;
      appointmentScheduledTitle: string;
      appointmentScheduledBody: string;
      appointmentConfirmedTitle: string;
      appointmentConfirmedBody: string;
      appointmentRescheduledTitle: string;
      appointmentRescheduledBody: string;
      signRequiredTitle: string;
      signRequiredBody: string;
    };
    repairStatus: RepairStatusLabels;
  }
): NotificationCopy {
  const order = n.workOrderId
    ? db.workOrders.find((o) => o.id === n.workOrderId)
    : undefined;
  const vehicle = order ? vehicleLabel(db, order) : "";
  const date = n.appointmentDate ?? "";
  const time = n.appointmentTime ?? "";
  const statusLabel = n.status ? labels.repairStatus[n.status] : "";

  switch (n.type) {
    case "car_ready":
      return {
        title: labels.notifExt.carReadyTitle,
        body: labels.notifExt.carReadyBody.replace("{vehicle}", vehicle || order?.number || ""),
        accent: "green",
        showReviewLink: true,
        orderId: order?.id,
      };
    case "status_change":
      return {
        title: labels.notifExt.statusChangeTitle,
        body: labels.notifExt.statusChangeBody
          .replace("{vehicle}", vehicle || order?.number || "")
          .replace("{status}", statusLabel),
        accent: "blue",
        orderId: order?.id,
      };
    case "appointment_invite": {
      if (n.appointmentKind === "confirmed") {
        return {
          title: labels.notifExt.appointmentConfirmedTitle,
          body: labels.notifExt.appointmentConfirmedBody
            .replace("{date}", date)
            .replace("{time}", time)
            .replace("{vehicle}", vehicle),
          accent: "green",
          appointmentTab: true,
          orderId: order?.id,
        };
      }
      if (n.appointmentKind === "rescheduled") {
        return {
          title: labels.notifExt.appointmentRescheduledTitle,
          body: labels.notifExt.appointmentRescheduledBody
            .replace("{date}", date)
            .replace("{time}", time),
          accent: "amber",
          appointmentTab: true,
        };
      }
      return {
        title: labels.notifExt.appointmentScheduledTitle,
        body: labels.notifExt.appointmentScheduledBody
          .replace("{date}", date)
          .replace("{time}", time),
        accent: "blue",
        appointmentTab: true,
      };
    }
    case "sign_required":
      return {
        title: labels.notifExt.signRequiredTitle,
        body: labels.notifExt.signRequiredBody.replace("{number}", order?.number ?? ""),
        accent: "amber",
        signHref: order ? `/sign/${order.id}` : undefined,
        orderId: order?.id,
      };
    case "referral_friend_joined":
      return {
        title: "🎁 Referral",
        body: "A friend registered using your link.",
        accent: "green",
      };
    case "referral_friend_qualified":
      return {
        title: "✅ Referral confirmed",
        body: `Friend completed a paid visit${order?.number ? ` (${order.number})` : ""}.`,
        accent: "green",
      };
    case "referral_reward_unlocked":
      return {
        title: "🎉 15% discount unlocked",
        body: "You invited 5 friends with paid visits — 15% off your next order.",
        accent: "green",
      };
    case "referral_invitee_reward":
      return {
        title: "🎁 Welcome bonus",
        body: "5% discount on your next visit — thank you for joining via referral.",
        accent: "green",
      };
    default:
      return { title: "", body: "", accent: "blue" };
  }
}

/** Pre-filled WhatsApp message when car is ready + Google review link */
export function buildCarReadyWhatsAppUrl(
  clientPhone: string,
  orderNumber: string,
  vehicleLabel: string,
  locale: WaMsgLocale
): string {
  return (
    buildCarReadyWaUrl(clientPhone, orderNumber, vehicleLabel, locale) ??
    `${siteConfig.whatsapp}`
  );
}

const PUSH_SEEN_PREFIX = "bess-notif-pushed-";

/** Browser push when client has the site open */
export function maybeShowBrowserNotifications(
  db: Database,
  userId: string,
  labels: Parameters<typeof getNotificationCopy>[2]
): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const unread = getUserNotifications(db, userId).filter((n) => !n.read);

  for (const n of unread) {
    const seenKey = `${PUSH_SEEN_PREFIX}${n.id}`;
    if (sessionStorage.getItem(seenKey)) continue;

    const copy = getNotificationCopy(n, db, labels);

    try {
      const notification = new Notification(copy.title, {
        body: copy.body,
        icon: siteConfig.logoImage || "/images/logo.png",
        tag: n.id,
      });
      notification.onclick = () => {
        window.focus();
        if (copy.signHref) {
          window.location.href = copy.signHref;
        } else {
          window.location.href = "/cabinet?tab=notifications";
        }
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
