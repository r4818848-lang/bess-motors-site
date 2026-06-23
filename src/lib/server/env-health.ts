import {
  cleanEnvValue,
  getSupabaseEnvDiagnostic,
  isSupabaseConfigured,
} from "@/lib/server/supabase-config";
import { getVapidPublicKey } from "@/lib/server/web-push-send";
import { isWhatsAppConfigured } from "@/lib/server/whatsapp-api";
import { getPromoRules } from "@/lib/promo-codes";
import { GOOGLE_ADS_ID, googleAdsBookingConversionSendTo } from "@/lib/google-ads";

export type EnvCheckId =
  | "supabase"
  | "telegram_bot"
  | "telegram_admin"
  | "telegram_webhook"
  | "telegram_public"
  | "whatsapp_api"
  | "whatsapp_webhook"
  | "vapid"
  | "cron"
  | "site_url"
  | "jwt_secret"
  | "admin_env"
  | "google_places"
  | "marketing_ga4"
  | "marketing_gads_conversion"
  | "marketing_promo";

export type EnvCheck = {
  id: EnvCheckId;
  ok: boolean;
  hint: string;
  debug?: Record<string, unknown>;
};

export function getEnvHealth(): { ok: boolean; checks: EnvCheck[] } {
  const vapidPublic = getVapidPublicKey();
  const vapidPrivate = cleanEnvValue(process.env.VAPID_PRIVATE_KEY);
  const supabaseDiag = getSupabaseEnvDiagnostic();

  const checks: EnvCheck[] = [
    {
      id: "supabase",
      ok: isSupabaseConfigured(),
      hint: "SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (Secret key)",
      debug: {
        urlPresent: supabaseDiag.present.url,
        urlValid: supabaseDiag.url.valid,
        url: supabaseDiag.url.value ? `${supabaseDiag.url.value.slice(0, 20)}...` : "",
        keyPresent: supabaseDiag.present.key,
        keyPrefix: supabaseDiag.key.prefix,
        keyLength: supabaseDiag.key.length,
        keyValid: supabaseDiag.key.valid,
        keyReason: supabaseDiag.key.reason,
      },
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
      id: "whatsapp_api",
      ok: isWhatsAppConfigured(),
      hint: "WHATSAPP_PHONE_NUMBER_ID + WHATSAPP_ACCESS_TOKEN",
    },
    {
      id: "whatsapp_webhook",
      ok: Boolean(cleanEnvValue(process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN)),
      hint: "WHATSAPP_WEBHOOK_VERIFY_TOKEN + Meta webhook → /api/whatsapp/webhook",
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
    {
      id: "google_places",
      ok: Boolean(
        cleanEnvValue(process.env.GOOGLE_PLACES_API_KEY) ||
          cleanEnvValue(process.env.GOOGLE_MAPS_API_KEY)
      ),
      hint: "GOOGLE_PLACES_API_KEY + Places API (New) enabled — live Google reviews on site",
    },
    {
      id: "marketing_ga4",
      ok: Boolean(cleanEnvValue(process.env.NEXT_PUBLIC_GA4_ID)),
      hint: "NEXT_PUBLIC_GA4_ID (GA4 — optional if GTM loads G-…)",
    },
    {
      id: "marketing_gads_conversion",
      ok: Boolean(googleAdsBookingConversionSendTo()),
      hint: `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_BOOKING=label (send_to ${GOOGLE_ADS_ID}/…)`,
    },
    {
      id: "marketing_promo",
      ok: getPromoRules().length > 0,
      hint: "NEXT_PUBLIC_PROMO_CODES=KLIM10:10 (optional summer promo)",
    },
  ];

  const critical: EnvCheckId[] = ["supabase", "telegram_bot", "telegram_admin"];
  const ok = critical.every((id) => checks.find((c) => c.id === id)?.ok);

  return { ok, checks };
}
