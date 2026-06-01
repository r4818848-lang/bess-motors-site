import { NextResponse } from "next/server";
import { cleanEnvValue } from "@/lib/server/supabase-config";
import { handleTelegramUpdate } from "@/lib/server/telegram-bot/handler";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = cleanEnvValue(process.env.TELEGRAM_WEBHOOK_SECRET);
  const deployed =
    process.env.VERCEL_ENV === "production" ||
    process.env.VERCEL_ENV === "preview" ||
    process.env.NODE_ENV === "production";
  if (deployed && !secret) {
    return NextResponse.json(
      { ok: false, error: "webhook_secret_required" },
      { status: 503 }
    );
  }
  if (secret) {
    const header = req.headers.get("x-telegram-bot-api-secret-token");
    if (header !== secret) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }
  }

  try {
    const update = await req.json();
    await handleTelegramUpdate(update);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[telegram webhook]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
