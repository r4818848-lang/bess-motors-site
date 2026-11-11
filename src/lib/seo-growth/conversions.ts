import { googleAdsBookingConversionSendTo } from "@/lib/google-ads";
import { planThankYouConversions, type ConversionEventName } from "@/lib/conversion-count";
import { publicAnalyticsParams } from "@/lib/gtag";

/**
 * Names already sent by the site. Do not rename them: a new name would split history.
 * The requested sprint names are aliases for the report, not new events.
 */
export const EVENT_ALIASES = [
  { requested: "click_call", live: "click_phone", means: "Klik w telefon. To nie jest odbyta rozmowa." },
  { requested: "click_whatsapp", live: "click_whatsapp", means: "Klik w WhatsApp. To nie jest wysłana wiadomość." },
  { requested: "click_route", live: "get_directions_click", means: "Klik w dojazd. To nie jest wizyta." },
  { requested: "booking_start", live: "booking_open", means: "Otwarcie formularza. To nie jest zgłoszenie." },
  { requested: "booking_success", live: "booking_request_submit_success", means: "Zapisane zgłoszenie. To nie jest przyjazd ani opłacone zlecenie." },
  { requested: "callback_request_success", live: "callback_submit_success", means: "Prośba o telefon. To nie jest odbyta rozmowa." },
] as const;

export const FUNNEL = [
  "site_visit",
  "click",
  "lead",
  "confirmed_booking",
  "arrived",
  "paid_order",
] as const;

export function thankYouEventsOnce(kind: "booking" | "call", firstTime: boolean): ConversionEventName[] {
  return planThankYouConversions(
    firstTime ? { kind, submittedAt: "2026-11-11T10:00:00.000Z" } : null,
    firstTime
  );
}

export function adsConversionConfigured(env: Record<string, string | undefined> = process.env): {
  status: "CONFIGURED" | "BLOCKED";
  reason: string;
} {
  const name = "NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_BOOKING";
  const previous = process.env[name];
  const next = env[name]?.trim();
  if (next) process.env[name] = next;
  else delete process.env[name];
  const sendTo = googleAdsBookingConversionSendTo();
  if (previous === undefined) delete process.env[name];
  else process.env[name] = previous;
  if (!sendTo) {
    return {
      status: "BLOCKED",
      reason: "NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_BOOKING nie jest ustawione. Etykiety nie wymyślamy. Import konwersji GA4 do Google Ads nie powinien liczyć tego samego zgłoszenia drugi raz.",
    };
  }
  return {
    status: "CONFIGURED",
    reason: "Etykieta jest w środowisku. Kod wysyła jedną konwersję Ads obok zdarzenia GA4 i nie importuje zdarzenia GA4 do Ads.",
  };
}

export function analyticsParamsDropPersonalData(params: Record<string, unknown>): Record<string, unknown> {
  return publicAnalyticsParams(params);
}

export const CONVERSION_LIMITS = [
  "Odmowa cookies zostawia consent denied. Opcjonalne tagi nie startują.",
  "Jedno zgłoszenie ma jeden klucz w sessionStorage. Drugie otwarcie podziękowania nie wysyła zdarzeń.",
  "Klik telefonu, formularz i przyjazd to osobne etapy. Panel ich nie skleja.",
  "CPL i koszt potwierdzonej wizyty: NO_DATA, bo ten sprint nie czyta wydatków reklam.",
  "Jakość leadów organicznych i płatnych: NO_DATA bez eksportu CRM pozbawionego danych osobowych.",
] as const;
