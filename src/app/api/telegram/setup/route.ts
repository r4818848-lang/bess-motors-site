import { NextResponse } from "next/server";
import { cleanEnvValue } from "@/lib/server/supabase-config";
import { getTelegramBotInfo, setTelegramWebhook } from "@/lib/server/telegram-api";

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

  const siteFromEnv = cleanEnvValue(process.env.NEXT_PUBLIC_SITE_URL);
  const siteFromRequest = new URL(req.url).origin;
  const siteUrl =
    siteFromEnv && siteFromEnv.startsWith("http")
      ? siteFromEnv.replace(/\/$/, "")
      : siteFromRequest.startsWith("http")
        ? siteFromRequest
        : "https://www.bess-motors.com";
  const webhookUrl = `${siteUrl}/api/telegram/webhook`;
  const secret = cleanEnvValue(process.env.TELEGRAM_WEBHOOK_SECRET);

  const bot = await getTelegramBotInfo();
  if (!bot.ok) {
    return NextResponse.json({
      ok: false,
      webhookUrl,
      step: "getMe",
      error: bot.error,
      hint:
        "Скопируйте токен заново из @BotFather → /mybots → ваш бот → API Token. В Vercel без пробелов и кавычек. Затем Redeploy.",
    });
  }

  const result = await setTelegramWebhook(webhookUrl, secret || undefined);
  return NextResponse.json({
    ok: result.ok,
    bot: bot.username ? `@${bot.username}` : undefined,
    webhookUrl,
    error: result.error,
    hint: result.ok
      ? "Webhook установлен. Отправьте /start боту в Telegram."
      : "Telegram отклонил webhook. Смотрите поле error выше.",
  });
}
