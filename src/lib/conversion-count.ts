import type { SubmissionKind } from "@/lib/submission-thank-you";

export const CONVERSION_COUNTED_KEY = "bess-conversion-counted";

/**
 * One successful form produces one GA4 event and, for a visit, one Google Ads
 * conversion. Do not also import the GA4 event into Google Ads: the Ads tag is
 * the only Ads conversion for this action.
 */
export type ConversionEventName =
  | "booking_request_submit_success"
  | "google_ads_booking"
  | "meta_schedule"
  | "callback_submit_success"
  | "vin_quote_submit_success"
  | "meta_lead";

export function conversionDedupeKey(kind: SubmissionKind, submittedAt: string): string {
  return `${kind}:${submittedAt}`;
}

export function claimConversionSlot(key: string, storage: { getItem(k: string): string | null; setItem(k: string, v: string): void }): boolean {
  const raw = storage.getItem(CONVERSION_COUNTED_KEY) ?? "";
  const seen = raw.split("\n").filter(Boolean);
  if (seen.includes(key)) return false;
  seen.push(key);
  storage.setItem(CONVERSION_COUNTED_KEY, seen.slice(-20).join("\n"));
  return true;
}

/** Events for one thank-you view. A repeat view of the same submission returns none. */
export function planThankYouConversions(
  snapshot: { kind: SubmissionKind; submittedAt: string } | null,
  firstTime: boolean
): ConversionEventName[] {
  if (!snapshot || !firstTime || !snapshot.submittedAt) return [];
  if (snapshot.kind === "booking") {
    return ["booking_request_submit_success", "google_ads_booking", "meta_schedule"];
  }
  return ["callback_submit_success", "meta_lead"];
}
