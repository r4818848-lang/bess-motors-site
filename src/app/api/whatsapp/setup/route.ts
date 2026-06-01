import { NextResponse } from "next/server";
import { cleanEnvValue } from "@/lib/server/supabase-config";
import {
  getWhatsAppBusinessProfile,
  isWhatsAppConfigured,
} from "@/lib/server/whatsapp-api";
import { getWhatsAppWebhookUrl } from "@/lib/server/whatsapp-bot/handler";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  const setupKey = cleanEnvValue(process.env.WHATSAPP_SETUP_KEY);
  if (!setupKey || key !== setupKey) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const configured = isWhatsAppConfigured();
  const profile = configured ? await getWhatsAppBusinessProfile() : null;
  const webhookUrl = getWhatsAppWebhookUrl();
  const verifyToken = cleanEnvValue(process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN);

  return NextResponse.json({
    ok: configured,
    webhookUrl,
    verifyTokenSet: Boolean(verifyToken),
    displayPhone: profile?.displayPhone,
    steps: [
      "Meta Business Suite → WhatsApp → API Setup",
      `Webhook URL: ${webhookUrl}`,
      `Verify token: значение WHATSAPP_WEBHOOK_VERIFY_TOKEN`,
      "Subscribe to: messages",
      "Vercel env: WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN",
      "Optional templates: WHATSAPP_TEMPLATE_SIGN, WHATSAPP_TEMPLATE_READY, WHATSAPP_TEMPLATE_STATUS",
    ],
  });
}
