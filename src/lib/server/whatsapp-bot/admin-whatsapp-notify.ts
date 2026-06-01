import {
  buildMasterTemplateMessage,
  stripHtmlForWhatsApp,
  type WaMasterTemplate,
  type WaMsgLocale,
} from "@/lib/whatsapp-messages";
import {
  isWhatsAppConfigured,
  sendWhatsAppTemplate,
  sendWhatsAppText,
} from "@/lib/server/whatsapp-api";
import type { Database, WorkOrder } from "@/lib/store";
import { resolveWhatsAppRecipient } from "./whatsapp-phone";
import { cleanEnvValue } from "@/lib/server/supabase-config";

function vehicleLabel(db: Database, order: WorkOrder): string {
  const v = db.vehicles.find((x) => x.id === order.vehicleId);
  return v ? `${v.make} ${v.model} · ${v.plate}`.trim() : order.number;
}

const TEMPLATE_ENV: Partial<Record<WaMasterTemplate, string>> = {
  ready: "WHATSAPP_TEMPLATE_READY",
  parts: "WHATSAPP_TEMPLATE_PARTS",
  delay: "WHATSAPP_TEMPLATE_DELAY",
  diagnostic: "WHATSAPP_TEMPLATE_DIAGNOSTIC",
  partsArrived: "WHATSAPP_TEMPLATE_PARTS_ARRIVED",
  pickup: "WHATSAPP_TEMPLATE_PICKUP",
  callme: "WHATSAPP_TEMPLATE_CALLME",
  prepay: "WHATSAPP_TEMPLATE_PREPAY",
};

export async function sendMasterTemplateToClientWhatsApp(
  db: Database,
  orderNumber: string,
  template: WaMasterTemplate,
  locale?: WaMsgLocale
): Promise<{ ok: boolean; message: string }> {
  if (!isWhatsAppConfigured()) {
    return { ok: false, message: "WhatsApp API не настроен." };
  }

  const order = db.workOrders.find((o) => o.number === orderNumber);
  if (!order) return { ok: false, message: "Заказ-наряд не найден." };

  const user = db.users.find((u) => u.id === order.userId && u.role === "client");
  const to = user ? resolveWhatsAppRecipient(user) : null;
  if (!to) {
    return { ok: false, message: "Нет WhatsApp у клиента (напишите нам в WA или проверьте телефон)." };
  }

  const loc: WaMsgLocale = locale ?? user?.telegramLocale ?? "ru";
  const car = vehicleLabel(db, order);
  const text = buildMasterTemplateMessage(template, loc, car, order.number);

  const direct = await sendWhatsAppText(to, stripHtmlForWhatsApp(text));
  if (direct.ok) {
    return { ok: true, message: "✅ Отправлено в WhatsApp." };
  }

  const envKey = TEMPLATE_ENV[template];
  const templateName = envKey ? cleanEnvValue(process.env[envKey]) : null;
  if (templateName) {
    const lang = cleanEnvValue(process.env.WHATSAPP_TEMPLATE_LANG) ?? "pl";
    const tpl = await sendWhatsAppTemplate(to, templateName, lang, [
      {
        type: "body",
        parameters: [
          { type: "text", text: car },
          { type: "text", text: order.number },
        ],
      },
    ]);
    if (tpl.ok) return { ok: true, message: "✅ Отправлено (шаблон WhatsApp)." };
  }

  return {
    ok: false,
    message: direct.error ?? "Ошибка WhatsApp (возможно, нужен шаблон Meta).",
  };
}
