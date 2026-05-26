import { cleanEnvValue } from "@/lib/server/supabase-config";

function getTelegramConfig(): { token: string; chatId: string } | null {
  const token = cleanEnvValue(process.env.TELEGRAM_BOT_TOKEN);
  const chatId = cleanEnvValue(process.env.TELEGRAM_CHAT_ID);
  if (!token || !chatId) return null;
  return { token, chatId };
}

export async function notifyAdminTelegram(text: string): Promise<boolean> {
  const cfg = getTelegramConfig();
  if (!cfg) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${cfg.token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: cfg.chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

