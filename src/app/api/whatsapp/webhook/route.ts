import { NextResponse } from "next/server";
import { cleanEnvValue } from "@/lib/server/supabase-config";
import { verifyWhatsAppWebhookSignature } from "@/lib/server/whatsapp-api";
import { handleWhatsAppWebhook } from "@/lib/server/whatsapp-bot/handler";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const verifyToken = cleanEnvValue(process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN);
  if (mode === "subscribe" && token && verifyToken && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  if (!verifyWhatsAppWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  try {
    const body = JSON.parse(rawBody) as Parameters<typeof handleWhatsAppWebhook>[0];
    await handleWhatsAppWebhook(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[whatsapp webhook]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
