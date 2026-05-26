import { NextResponse } from "next/server";
import { cleanEnvValue } from "@/lib/server/supabase-config";
import { setTelegramWebhook } from "@/lib/server/telegram-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** One-time: GET /api/telegram/setup?key=YOUR_SETUP_KEY */
export async function GET(req: Request) {
  const setupKey = cleanEnvValue(process.env.TELEGRAM_SETUP_KEY);
  const url = new URL(req.url);
  const key = url.searchParams.get("key");

  if (!setupKey || key !== setupKey) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const siteUrl = cleanEnvValue(process.env.NEXT_PUBLIC_SITE_URL) ?? "https://www.bess-motors.com";
  const webhookUrl = `${siteUrl.replace(/\/$/, "")}/api/telegram/webhook`;
  const secret = cleanEnvValue(process.env.TELEGRAM_WEBHOOK_SECRET);

  const ok = await setTelegramWebhook(webhookUrl, secret || undefined);
  return NextResponse.json({
    ok,
    webhookUrl,
    hint: ok
      ? "Webhook установлен. Отправьте /start боту в Telegram."
      : "Не удалось установить webhook. Проверьте TELEGRAM_BOT_TOKEN.",
  });
}
