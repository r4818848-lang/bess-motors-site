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
    return locale === "pl"
      ? "🤖 <b>Asystent</b>\n\nBrak aktywnego zlecenia. Umów wizytę lub sprawdź historię."
      : locale === "en"
        ? "🤖 <b>Concierge</b>\n\nNo active work order. Book a visit or check history."
        : "🤖 <b>Консьерж</b>\n\nНет активного заказа. Запишитесь или откройте историю.";
  }

  const vehicle = slice.vehicles.find((v) => v.id === active.vehicleId);
  const pct = repairProgressPercent(active.status);
  const status = L.repairStatus[active.status] ?? active.status;
  const total = calcClientTotal(active);
  const queue = queuePositionText(locale, slice.workOrders, active.id);
  const photos = clientVisibleFiles(active);
  const works = active.services.slice(0, 5).map((s) => `• ${s.name}`).join("\n");
  const partsWait =
    active.status === "waitingParts"
      ? locale === "pl"
        ? "⏳ <b>Czekamy na części</b> — damy znać, gdy dotrą."
        : locale === "en"
          ? "⏳ <b>Waiting for parts</b> — we will notify you."
          : "⏳ <b>Ждём запчасти</b> — сообщим, когда приедут."
      : "";

  const readyHint =
    active.status === "ready"
      ? locale === "pl"
        ? "✅ Auto gotowe do odbioru!"
        : locale === "en"
          ? "✅ Car ready for pickup!"
          : "✅ Авто готово к выдаче!"
      : "";

  const sign =
    active.confirmationStatus !== "confirmed"
      ? L.needsSignature
      : "";

  const lines = [
    "🤖 <b>" + (locale === "pl" ? "Twój samochód" : locale === "en" ? "Your car" : "Ваш автомобиль") + "</b>",
    "",
    `📋 <b>${active.number}</b>`,
    vehicle ? `🚗 ${vehicle.make} ${vehicle.model} · <code>${vehicle.plate}</code>` : "",
    `📌 ${status} · <b>${pct}%</b>`,
    queue,
    partsWait,
    readyHint,
    sign,
    "",
    locale === "pl" ? "<b>Wykonane / plan:</b>" : locale === "en" ? "<b>Work:</b>" : "<b>Работы:</b>",
    works || "—",
    "",
    `💰 ${total.toFixed(2)} zł`,
    photos > 0
      ? locale === "pl"
        ? `📎 Pliki w zleceniu: <b>${photos}</b>`
        : locale === "en"
          ? `📎 Files on order: <b>${photos}</b>`
          : `📎 Файлов в заказе: <b>${photos}</b>`
      : "",
    active.clientNotes
      ? `💬 ${active.clientNotes.slice(0, 120)}`
      : active.internalNotes
        ? ""
        : "",
  ];

  return lines.filter(Boolean).join("\n");
}
