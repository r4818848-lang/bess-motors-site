import type { Database } from "@/lib/store";

/** Telegram, web push, referral — after any CRM cloud write */
export async function notifyAfterCrmCloudSave(
  previous: Database,
  next: Database
): Promise<void> {
  const { dispatchTelegramFromCrmSave } = await import(
    "./telegram-bot/client-telegram-notify"
  );
  void dispatchTelegramFromCrmSave(previous, next);

  const { dispatchWhatsAppFromCrmSave } = await import(
    "./whatsapp-bot/client-whatsapp-notify"
  );
  void dispatchWhatsAppFromCrmSave(previous, next);

  const { dispatchWebPushFromCrmSave } = await import("@/lib/web-push-order-events");
  void dispatchWebPushFromCrmSave(previous, next);

  const { runReferralTelegramEffects } = await import("./referral-telegram-notify");
  for (const order of next.workOrders) {
    const old = previous.workOrders.find((o) => o.id === order.id);
    if (old) await runReferralTelegramEffects(next, order, old);
  }
}
