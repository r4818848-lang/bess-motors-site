import { cleanEnvValue } from "@/lib/server/supabase-config";
import {
  handleWhatsAppClientMessage,
  type WhatsAppIncomingMessage,
} from "./client-handler";

type WebhookValue = {
  messaging_product?: string;
  metadata?: { display_phone_number?: string; phone_number_id?: string };
  contacts?: { profile?: { name?: string }; wa_id?: string }[];
  messages?: Record<string, unknown>[];
  statuses?: Record<string, unknown>[];
};

type WebhookBody = {
  object?: string;
  entry?: { changes?: { value?: WebhookValue; field?: string }[] }[];
};

function parseMessage(raw: Record<string, unknown>): WhatsAppIncomingMessage | null {
  const from = String(raw.from ?? "");
  const id = String(raw.id ?? "");
  const type = raw.type as string;

  if (type === "text" && raw.text && typeof raw.text === "object") {
    const text = raw.text as { body?: string };
    if (!text.body) return null;
    return { from, id, type: "text", text: { body: text.body } };
  }

  if (type === "button" && raw.button && typeof raw.button === "object") {
    const button = raw.button as { text?: string; payload?: string };
    return {
      from,
      id,
      type: "button",
      button: { text: button.text ?? "", payload: button.payload ?? "" },
    };
  }

  if (type === "interactive" && raw.interactive && typeof raw.interactive === "object") {
    const interactive = raw.interactive as {
      type?: string;
      button_reply?: { id?: string; title?: string };
    };
    if (interactive.type === "button_reply" && interactive.button_reply) {
      return {
        from,
        id,
        type: "interactive",
        interactive: {
          type: "button_reply",
          button_reply: {
            id: interactive.button_reply.id ?? "",
            title: interactive.button_reply.title ?? "",
          },
        },
      };
    }
  }

  return null;
}

export async function handleWhatsAppWebhook(body: WebhookBody): Promise<void> {
  if (body.object !== "whatsapp_business_account") return;

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "messages") continue;
      const value = change.value;
      if (!value?.messages?.length) continue;

      const contactName = value.contacts?.[0]?.profile?.name;

      for (const raw of value.messages) {
        const msg = parseMessage(raw);
        if (!msg) continue;
        await handleWhatsAppClientMessage(msg, contactName);
      }
    }
  }
}

export function getWhatsAppWebhookUrl(): string {
  const base = cleanEnvValue(process.env.NEXT_PUBLIC_SITE_URL) || "https://www.bess-motors.com";
  return `${base.replace(/\/$/, "")}/api/whatsapp/webhook`;
}
