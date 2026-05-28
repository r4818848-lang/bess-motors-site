import type { Database, RepairStatus, User, WorkOrder } from "./store";
import { sendWebPushToUser } from "@/lib/server/web-push-send";

const STATUS_PUSH: Partial<
  Record<RepairStatus, { pl: string; ru: string; en: string }>
> = {
  diagnostic: {
    pl: "Rozpoczęto diagnostykę Twojego auta",
    ru: "Начата диагностика вашего авто",
    en: "Diagnostics started on your vehicle",
  },
  repair: {
    pl: "Trwa naprawa Twojego auta",
    ru: "Идёт ремонт вашего авто",
    en: "Repair in progress",
  },
  waitingParts: {
    pl: "Oczekiwanie na części do Twojego auta",
    ru: "Ожидание запчастей для вашего авто",
    en: "Waiting for parts for your vehicle",
  },
  ready: {
    pl: "Twoje auto jest gotowe do odbioru!",
    ru: "Ваш автомобиль готов к выдаче!",
    en: "Your car is ready for pickup!",
  },
  delivered: {
    pl: "Dziękujemy za wizytę w BESS MOTORS",
    ru: "Спасибо за визит в BESS MOTORS",
    en: "Thank you for visiting BESS MOTORS",
  },
};

function userLocale(u: User): "pl" | "ru" | "en" {
  const l = u.telegramLocale;
  if (l === "ru" || l === "uk") return "ru";
  if (l === "en") return "en";
  return "pl";
}

export async function pushForOrderChange(
  user: User | undefined,
  order: WorkOrder,
  previous?: WorkOrder | null
): Promise<void> {
  if (!user?.pushSubscription?.endpoint) return;

  if (previous?.status !== order.status) {
    const msg = STATUS_PUSH[order.status];
    if (msg) {
      const loc = userLocale(user);
      await sendWebPushToUser(user, {
        title: "BESS MOTORS",
        body: msg[loc],
        url: "/cabinet",
      });
    }
  }

  if (
    previous?.paymentStatus !== "paid" &&
    order.paymentStatus === "paid"
  ) {
    const loc = userLocale(user);
    const body =
      loc === "ru"
        ? `Оплата по заказу ${order.number} получена`
        : loc === "en"
          ? `Payment received for ${order.number}`
          : `Płatność za ${order.number} przyjęta`;
    await sendWebPushToUser(user, { title: "BESS MOTORS", body, url: "/cabinet" });
  }

  if (
    previous?.clientPartsStatus !== order.clientPartsStatus &&
    order.clientPartsStatus
  ) {
    const labels: Record<string, { pl: string; ru: string; en: string }> = {
      ordered: {
        pl: "Części zamówione do Twojego auta",
        ru: "Запчасти заказаны для вашего авто",
        en: "Parts ordered for your vehicle",
      },
      in_transit: {
        pl: "Części w drodze",
        ru: "Запчасти в пути",
        en: "Parts in transit",
      },
      arrived: {
        pl: "Części dotarły — wkrótce montaż",
        ru: "Запчасти прибыли — скоро установка",
        en: "Parts arrived — installation soon",
      },
    };
    const msg = labels[order.clientPartsStatus];
    if (msg) {
      const loc = userLocale(user);
      await sendWebPushToUser(user, {
        title: "BESS MOTORS",
        body: msg[loc],
        url: "/cabinet",
      });
    }
  }

  const needsSign =
    order.confirmationStatus !== "confirmed" ||
    order.documentStatus === "awaiting_signature";
  const prevNeeds =
    previous &&
    (previous.confirmationStatus !== "confirmed" ||
      previous.documentStatus === "awaiting_signature");
  if (needsSign && !prevNeeds) {
    const loc = userLocale(user);
    const body =
      loc === "ru"
        ? `Требуется подпись заказ-наряда ${order.number}`
        : loc === "en"
          ? `Signature required for ${order.number}`
          : `Wymagany podpis dokumentu ${order.number}`;
    await sendWebPushToUser(user, {
      title: "BESS MOTORS",
      body,
      url: `/sign/${order.id}`,
    });
  }
}

export async function dispatchWebPushFromCrmSave(
  before: Database,
  after: Database
): Promise<void> {
  for (const order of after.workOrders) {
    const prev = before.workOrders.find((o) => o.id === order.id);
    if (!prev && order.status === "received") continue;
    const changed =
      !prev ||
      prev.status !== order.status ||
      prev.paymentStatus !== order.paymentStatus ||
      prev.clientPartsStatus !== order.clientPartsStatus ||
      prev.confirmationStatus !== order.confirmationStatus ||
      prev.documentStatus !== order.documentStatus;
    if (!changed) continue;
    const user = after.users.find((u) => u.id === order.userId);
    await pushForOrderChange(user, order, prev ?? null);
  }
}
