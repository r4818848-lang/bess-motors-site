import { fireGtag } from "@/lib/gtag";

/** Google Ads account — gtag.js */
export const GOOGLE_ADS_ID = "AW-18182816065";

/**
 * Conversion label from Google Ads → Goals → Conversions → Tag setup.
 * Format: AW-18182816065/AbCdEfGhIj
 * Set in Vercel: NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_BOOKING
 */
export function googleAdsBookingConversionSendTo(): string | null {
  const raw = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_BOOKING?.trim();
  if (!raw) return null;
  if (raw.includes("/")) return raw;
  return `${GOOGLE_ADS_ID}/${raw}`;
}

export function trackGoogleAdsBookingConversion(meta?: Record<string, unknown>): void {
  const sendTo = googleAdsBookingConversionSendTo();
  if (!sendTo) return;
  fireGtag("conversion", {
    send_to: sendTo,
    ...meta,
  });
}
