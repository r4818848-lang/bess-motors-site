import { createHash, createHmac } from "crypto";
import { cleanEnvValue } from "@/lib/server/supabase-config";

export type TelegramWidgetUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

export function verifyTelegramWidgetAuth(user: TelegramWidgetUser): boolean {
  const token = cleanEnvValue(process.env.TELEGRAM_BOT_TOKEN);
  if (!token || !user.hash) return false;

  const checkString = Object.keys(user)
    .filter((k) => k !== "hash")
    .sort()
    .map((k) => `${k}=${user[k as keyof TelegramWidgetUser]}`)
    .join("\n");

  const secret = createHash("sha256").update(token).digest();
  const hmac = createHmac("sha256", secret).update(checkString).digest("hex");

  if (hmac !== user.hash) return false;

  const ageSec = Math.floor(Date.now() / 1000) - Number(user.auth_date);
  return ageSec >= 0 && ageSec <= 86400;
}
