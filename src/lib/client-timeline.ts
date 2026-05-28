import type { Appointment, ClientNotification, Database, WorkOrder } from "@/lib/store";

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
  locale: "pl" | "ru" | "uk" | "en"
): TimelineEvent[] {
  const useRu = locale === "ru" || locale === "uk";
  const events: TimelineEvent[] = [];

  for (const a of db.appointments.filter((x) => x.userId === userId)) {
    events.push({
      id: `apt-${a.id}`,
      at: `${a.date}T${a.time}:00`,
      kind: "appointment",
      title: useRu ? "Запись" : locale === "en" ? "Appointment" : "Wizyta",
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
        title: useRu ? "Подпись документа" : locale === "en" ? "Document signed" : "Podpis dokumentu",
        detail: o.number,
      });
    }
    if (o.warrantyUntil) {
      events.push({
        id: `war-${o.id}`,
        at: o.warrantyUntil,
        kind: "warranty",
        title: useRu ? "Гарантия до" : locale === "en" ? "Warranty until" : "Gwarancja do",
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
