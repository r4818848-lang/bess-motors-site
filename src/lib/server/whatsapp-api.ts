import { createHmac, timingSafeEqual } from "crypto";
import { cleanEnvValue } from "@/lib/server/supabase-config";

export type WhatsAppConfig = {
  phoneNumberId: string;
  accessToken: string;
  apiVersion: string;
};

export function isWhatsAppConfigured(): boolean {
  return getWhatsAppConfig() !== null;
}

export function getWhatsAppConfig(): WhatsAppConfig | null {
  const phoneNumberId = cleanEnvValue(process.env.WHATSAPP_PHONE_NUMBER_ID);
  const accessToken =
    cleanEnvValue(process.env.WHATSAPP_ACCESS_TOKEN) ??
    cleanEnvValue(process.env.WHATSAPP_TOKEN);
  if (!phoneNumberId || !accessToken) return null;
  const apiVersion = cleanEnvValue(process.env.WHATSAPP_API_VERSION) ?? "v21.0";
  return { phoneNumberId, accessToken, apiVersion };
}

export function toWhatsAppRecipient(phoneOrWaId: string): string {
  return phoneOrWaId.replace(/\D/g, "");
}

type GraphResponse = {
  messages?: { id?: string }[];
  error?: { message?: string; code?: number; error_subcode?: number };
};

async function graphRequest(
  path: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; messageId?: string; error?: string; code?: number }> {
  const cfg = getWhatsAppConfig();
  if (!cfg) return { ok: false, error: "not_configured" };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${cfg.apiVersion}/${cfg.phoneNumberId}/${path}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfg.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
    const data = (await res.json()) as GraphResponse;
    if (!res.ok || data.error) {
      console.warn("[whatsapp]", path, res.status, data.error);
      return {
        ok: false,
        error: data.error?.message ?? "send_failed",
        code: data.error?.code,
      };
    }
    return { ok: true, messageId: data.messages?.[0]?.id };
  } catch (e) {
    console.warn("[whatsapp]", path, e);
    return { ok: false, error: "network_error" };
  }
}

export async function sendWhatsAppText(
  to: string,
  body: string
): Promise<{ ok: boolean; messageId?: string; error?: string; code?: number }> {
  const recipient = toWhatsAppRecipient(to);
  if (!recipient || body.trim().length < 1) {
    return { ok: false, error: "invalid_recipient" };
  }

  return graphRequest("messages", {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipient,
    type: "text",
    text: { preview_url: true, body: body.slice(0, 4096) },
  });
}

export async function sendWhatsAppCtaUrl(
  to: string,
  body: string,
  displayText: string,
  url: string
): Promise<{ ok: boolean; messageId?: string; error?: string; code?: number }> {
  const recipient = toWhatsAppRecipient(to);
  if (!recipient) return { ok: false, error: "invalid_recipient" };

  return graphRequest("messages", {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipient,
    type: "interactive",
    interactive: {
      type: "cta_url",
      body: { text: body.slice(0, 1024) },
      action: {
        name: "cta_url",
        parameters: {
          display_text: displayText.slice(0, 20),
          url,
        },
      },
    },
  });
}

export type WhatsAppTemplateComponent = {
  type: "body";
  parameters: { type: "text"; text: string }[];
};

/** Approved Meta template — required outside the 24h customer service window */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode: string,
  components?: WhatsAppTemplateComponent[]
): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const recipient = toWhatsAppRecipient(to);
  if (!recipient) return { ok: false, error: "invalid_recipient" };

  const template: Record<string, unknown> = {
    name: templateName,
    language: { code: languageCode },
  };
  if (components?.length) template.components = components;

  const result = await graphRequest("messages", {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipient,
    type: "template",
    template,
  });
  return result;
}

export async function markWhatsAppMessageRead(messageId: string): Promise<void> {
  await graphRequest("messages", {
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId,
  });
}

export function verifyWhatsAppWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secret = cleanEnvValue(process.env.WHATSAPP_APP_SECRET);
  if (!secret) return true;
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const received = signatureHeader.slice(7);
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex"));
  } catch {
    return false;
  }
}

export async function getWhatsAppBusinessProfile(): Promise<{
  ok: boolean;
  displayPhone?: string;
  error?: string;
}> {
  const cfg = getWhatsAppConfig();
  if (!cfg) return { ok: false, error: "not_configured" };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${cfg.apiVersion}/${cfg.phoneNumberId}?fields=display_phone_number,verified_name`,
      {
        headers: { Authorization: `Bearer ${cfg.accessToken}` },
      }
    );
    const data = (await res.json()) as {
      display_phone_number?: string;
      verified_name?: string;
      error?: { message?: string };
    };
    if (!res.ok) {
      return { ok: false, error: data.error?.message ?? "profile_failed" };
    }
    return { ok: true, displayPhone: data.display_phone_number };
  } catch {
    return { ok: false, error: "network_error" };
  }
}
