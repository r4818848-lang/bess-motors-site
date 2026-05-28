import type { ServiceId } from "@/lib/services-catalog";
import { serviceBasePriceId } from "@/lib/service-price-map";
import { buildBookingUrl } from "@/lib/booking-url";

/** SEO slug → related services for cross-links */
export const brandLandingExtras: Record<string, { titlePl: string; titleRu: string; serviceIds: ServiceId[] }> = {
  bmw: {
    titlePl: "Typowe usługi BMW",
    titleRu: "Типичные услуги BMW",
    serviceIds: ["diagnostic", "oil", "brakePads", "suspension"],
  },
  mercedes: {
    titlePl: "Typowe usługi Mercedes",
    titleRu: "Типичные услуги Mercedes",
    serviceIds: ["diagnostic", "oil", "electric", "acRefill"],
  },
  vag: {
    titlePl: "Typowe usługi VAG (VW / Audi / Skoda)",
    titleRu: "Типичные услуги VAG",
    serviceIds: ["diagnostic", "oil", "timingBelt", "brakesFull"],
  },
};

export function bookingUrlForService(serviceId: ServiceId): string {
  const priceId = serviceBasePriceId[serviceId];
  if (priceId) return buildBookingUrl([priceId]);
  return `/booking?service=${serviceId}`;
}
