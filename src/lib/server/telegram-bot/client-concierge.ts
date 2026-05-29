import { repairProgressPercent } from "@/lib/repair-progress";
import { calcClientTotal } from "@/lib/workorder-calc";
import type { WorkOrder } from "@/lib/store";
import type { BotLocale } from "./client-i18n";
import { getClientBotLabels } from "./client-i18n";
import { getClientPortalByChat } from "./client-telegram-link";
import { queuePositionText, activeOrderForUser } from "./client-extras";

function clientVisibleFiles(order: WorkOrder): number {
  return order.files.filter((f) => f.category !== "internal").length;
}

export async function formatConciergeMessage(
  locale: BotLocale,
  chatKey: string
): Promise<string | null> {
  const slice = await getClientPortalByChat(chatKey);
  if (!slice) return null;

  const L = getClientBotLabels(locale);
  const active = activeOrderForUser(slice.workOrders);
  if (!active) {
    return L.conciergeIntro;
  }

  const vehicle = slice.vehicles.find((v) => v.id === active.vehicleId);
  const pct = repairProgressPercent(active.status);
  const status = L.repairStatus[active.status] ?? active.status;
  const total = calcClientTotal(active);
  const queue = queuePositionText(locale, slice.workOrders, active.id);
  const photos = clientVisibleFiles(active);
  const works = active.services.slice(0, 5).map((s) => `• ${s.name}`).join("\n");
  const partsWait = active.status === "waitingParts" ? L.waitingPartsHint : "";
  const readyHint = active.status === "ready" ? L.readyHint : "";
  const sign = active.confirmationStatus !== "confirmed" ? L.needsSignature : "";

  const lines = [
    `🤖 <b>${L.yourCar}</b>`,
    "",
    `📋 <b>${active.number}</b>`,
    vehicle ? `🚗 ${vehicle.make} ${vehicle.model} · <code>${vehicle.plate}</code>` : "",
    `📌 ${status} · <b>${pct}%</b>`,
    queue,
    partsWait,
    readyHint,
    sign,
    "",
    `<b>${L.workSection}</b>`,
    works || "—",
    "",
    `💰 ${total.toFixed(2)} zł`,
    photos > 0 ? L.filesOnOrder(photos) : "",
    active.clientNotes
      ? `💬 ${active.clientNotes.slice(0, 120)}`
      : active.internalNotes
        ? ""
        : "",
  ];

  return lines.filter(Boolean).join("\n");
}
