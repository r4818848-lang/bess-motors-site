import { downloadTelegramPhotoAsDataUrl } from "@/lib/server/telegram-api";
import { mutateCrm } from "./crm-actions";

export async function saveClientTelegramPhoto(params: {
  chatKey: string;
  fileId: string;
  orderId?: string;
}): Promise<{ ok: boolean; orderNumber?: string; error?: string }> {
  const dataUrl = await downloadTelegramPhotoAsDataUrl(params.fileId);
  if (!dataUrl) {
    return { ok: false, error: "download_failed" };
  }

  const result = await mutateCrm((db) => {
    const user = db.users.find(
      (u) => u.role === "client" && u.telegramChatId === params.chatKey
    );
    if (!user) return false;

    let order = params.orderId
      ? db.workOrders.find((o) => o.id === params.orderId && o.userId === user.id)
      : undefined;

    if (!order) {
      order = [...db.workOrders]
        .filter((o) => o.userId === user.id && o.status !== "delivered")
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    }

    if (!order) return false;

    order.files = order.files ?? [];
    order.files.push({
      id: `tg-photo-${Date.now()}`,
      name: `Telegram ${new Date().toISOString().slice(0, 10)}`,
      type: "image",
      category: "document",
      dataUrl,
      uploadedAt: new Date().toISOString(),
    });
    order.updatedAt = new Date().toISOString();
    return order.number;
  });

  if (!result.ok || typeof result.result !== "string") {
    return { ok: false, error: result.error ?? "no_order" };
  }
  return { ok: true, orderNumber: result.result };
}
