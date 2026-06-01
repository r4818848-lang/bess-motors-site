import { cleanEnvValue, isSupabaseConfigured } from "@/lib/server/supabase-config";
import { getVapidPublicKey } from "@/lib/server/web-push-send";

export type EnvCheckId =
  | "supabase"
  | "telegram_bot"
  | "telegram_admin"
  | "telegram_webhook"
  | "telegram_public"
  | "vapid"
  | "cron"
  | "site_url"
  | "jwt_secret"
  | "admin_env";

export type EnvCheck = {
  id: EnvCheckId;
  ok: boolean;
  hint: string;
};

export function getEnvHealth(): { ok: boolean; checks: EnvCheck[] } {
  const vapidPublic = getVapidPublicKey();
  const vapidPrivate = cleanEnvValue(process.env.VAPID_PRIVATE_KEY);

  const checks: EnvCheck[] = [
    {
      id: "supabase",
      ok: isSupabaseConfigured(),
      hint: "SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (Secret key)",
    },
    {
      id: "telegram_bot",
      ok: Boolean(cleanEnvValue(process.env.TELEGRAM_BOT_TOKEN)),
      hint: "TELEGRAM_BOT_TOKEN (@BotFather)",
    },
    {
      id: "telegram_admin",
      ok: Boolean(cleanEnvValue(process.env.TELEGRAM_CHAT_ID)),
      hint: "TELEGRAM_CHAT_ID (admin chat id)",
    },
    {
      id: "telegram_webhook",
      ok: Boolean(cleanEnvValue(process.env.TELEGRAM_WEBHOOK_SECRET)),
      hint: "TELEGRAM_WEBHOOK_SECRET + GET /api/telegram/setup",
    },
    {
      id: "telegram_public",
      ok: Boolean(cleanEnvValue(process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME)),
      hint: "NEXT_PUBLIC_TELEGRAM_BOT_USERNAME",
    },
    {
      id: "vapid",
      ok: Boolean(vapidPublic && vapidPrivate),
      hint: "NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY",
    },
    {
      id: "cron",
      ok: Boolean(cleanEnvValue(process.env.CRON_SECRET)),
      hint: "CRON_SECRET (Vercel Cron)",
    },
    {
      id: "site_url",
      ok: Boolean(cleanEnvValue(process.env.NEXT_PUBLIC_SITE_URL)),
      hint: "NEXT_PUBLIC_SITE_URL=https://www.bess-motors.com",
    },
    {
      id: "jwt_secret",
      ok: Boolean(cleanEnvValue(process.env.JWT_SECRET)),
      hint: "JWT_SECRET (random string for API tokens)",
    },
    {
      id: "admin_env",
      ok: Boolean(
        cleanEnvValue(process.env.ADMIN_PHONE) &&
          cleanEnvValue(process.env.ADMIN_PASSWORD)
      ),
      hint: "ADMIN_PHONE + ADMIN_PASSWORD (staff login via /api/auth/staff-login)",
    },
  ];

  const critical: EnvCheckId[] = ["supabase", "telegram_bot", "telegram_admin"];
  const ok = critical.every((id) => checks.find((c) => c.id === id)?.ok);

  return { ok, checks };
}
