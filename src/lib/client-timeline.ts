import type { Database } from "@/lib/store";
import { getTranslations } from "./i18n/translations";
import type { Locale } from "./i18n/types";

export type TimelineEvent = {
  id: string;
  at: string;
  kind: "appointment" | "order" | "notification" | "signature" | "warranty";
  title: string;
  detail?: string;
  href?: string;
};

export function buildClientTimeline(
  db: Database,
  userId: string,
  locale: Locale
): TimelineEvent[] {
  const tl = getTranslations(locale).cabinetTimeline;
  const events: TimelineEvent[] = [];

  for (const a of db.appointments.filter((x) => x.userId === userId)) {
    events.push({
      id: `apt-${a.id}`,
      at: `${a.date}T${a.time}:00`,
      kind: "appointment",
      title: tl.appointment,
      detail: `${a.date} · ${a.time}`,
    });
  }

  for (const o of db.workOrders.filter((x) => x.userId === userId)) {
    events.push({
      id: `wo-${o.id}`,
      at: o.updatedAt || o.createdAt,
      kind: "order",
      title: o.number,
      detail: o.status,
      href: `orders:${o.id}`,
    });
    if (o.signature?.signedAt) {
      events.push({
        id: `sign-${o.id}`,
        at: o.signature.signedAt,
        kind: "signature",
        title: tl.documentSigned,
        detail: o.number,
      });
    }
    if (o.warrantyUntil) {
      events.push({
        id: `war-${o.id}`,
        at: o.warrantyUntil,
        kind: "warranty",
        title: tl.warrantyUntil,
        detail: o.warrantyUntil.slice(0, 10),
      });
    }
  }

  for (const n of db.notifications.filter((x) => x.userId === userId)) {
    events.push({
      id: `n-${n.id}`,
      at: n.createdAt,
      kind: "notification",
      title: n.type,
      detail: n.workOrderId ?? n.appointmentId,
    });
  }

  return events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 40);
}
