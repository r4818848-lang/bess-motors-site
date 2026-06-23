import { NextResponse } from "next/server";
import { getEnvHealth } from "@/lib/server/env-health";
import { cleanEnvValue, isSupabaseConfigured } from "@/lib/server/supabase-config";
import { GOOGLE_ADS_ID, googleAdsBookingConversionSendTo } from "@/lib/google-ads";
import { META_PIXEL_ID } from "@/lib/meta-pixel";
import { YANDEX_METRIKA_ID, isYandexMetrikaEnabled } from "@/lib/yandex-metrika";
import { getPromoRules } from "@/lib/promo-codes";
export const dynamic = "force-dynamic";

export async function GET() {
  const health = getEnvHealth();
  const marketing = {
    gtm: cleanEnvValue(process.env.NEXT_PUBLIC_GTM_ID) || "GTM-NVKV27L8",
    googleAds: GOOGLE_ADS_ID,
    googleAdsConversion: googleAdsBookingConversionSendTo(),
    metaPixel: META_PIXEL_ID,
    yandexMetrika: isYandexMetrikaEnabled() ? YANDEX_METRIKA_ID : null,
    ga4: cleanEnvValue(process.env.NEXT_PUBLIC_GA4_ID) || null,
    promoCodes: getPromoRules().map((p) => p.code),
  };
  return NextResponse.json({
    ok: health.ok,
    ts: new Date().toISOString(),
    cloud: isSupabaseConfigured(),
    vapid: health.checks.find((c) => c.id === "vapid")?.ok ?? false,
    marketing,
    checks: health.checks,
  });
}
