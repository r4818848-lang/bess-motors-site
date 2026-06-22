import { getPriceItem } from "@/lib/price-list";
import type { ServiceId } from "@/lib/services-catalog";
import { getServicePackage } from "@/lib/service-packages";
import { serviceBasePriceId } from "@/lib/service-price-map";
import type { SubmissionSnapshot } from "@/lib/submission-thank-you";
import { saveSubmissionSnapshot } from "@/lib/submission-thank-you";

export type BookingUrlParams = {
  items: string[];
  plate?: string;
  serviceId?: string;
  packageId?: string;
};

/** Parse ?items=... &service=diagnostic &plate=WA123 &package=to_standard */
export function parseBookingParamsFromSearch(search: string): BookingUrlParams {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const items = parseBookingItemsFromSearch(search);
  const plate = params.get("plate")?.trim().toUpperCase();
  const packageId = params.get("package")?.trim();
  const pkg = packageId ? getServicePackage(packageId) : undefined;
  if (pkg) {
    for (const id of pkg.priceItemIds) {
      if (!items.includes(id)) items.push(id);
    }
  }
  const serviceRaw = params.get("service")?.trim() as ServiceId | undefined;
  let serviceId: string | undefined;
  if (serviceRaw && serviceBasePriceId[serviceRaw]) {
    const priceId = serviceBasePriceId[serviceRaw];
    if (priceId && !items.includes(priceId)) {
      items.push(priceId);
    }
    serviceId = serviceRaw;
  }
  return { items, plate: plate || undefined, serviceId, packageId: pkg?.id };
}

/** Parse ?items=oil_filter,brake_pads_front from URL */
export function parseBookingItemsFromSearch(search: string): string[] {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const raw = params.get("items") ?? params.get("services") ?? "";
  if (!raw.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((id) => getPriceItem(id));
}

export function buildBookingUrl(itemIds: string[], base = "/booking"): string {
  const valid = itemIds.filter((id) => getPriceItem(id));
  if (!valid.length) return base;
  return `${base}?items=${valid.join(",")}`;
}

export const LAST_BOOKING_STORAGE_KEY = "bess-last-booking";

/** @deprecated Use SubmissionSnapshot from submission-thank-you */
export type LastBookingSnapshot = Pick<
  SubmissionSnapshot,
  "date" | "time" | "clientFirstName" | "clientLastName" | "clientPhone" | "estimatedTotal" | "serviceLabels"
> & { clientName?: string };

export function saveLastBooking(snapshot: LastBookingSnapshot): void {
  const nameParts = snapshot.clientName?.trim().split(/\s+/) ?? [];
  saveSubmissionSnapshot({
    kind: "booking",
    submittedAt: new Date().toISOString(),
    clientFirstName: snapshot.clientFirstName ?? nameParts[0],
    clientLastName: snapshot.clientLastName ?? nameParts.slice(1).join(" "),
    clientPhone: snapshot.clientPhone ?? "",
    date: snapshot.date,
    time: snapshot.time,
    estimatedTotal: snapshot.estimatedTotal,
    serviceLabels: snapshot.serviceLabels,
  });
}

export function loadLastBooking(): LastBookingSnapshot | null {
  return null;
}
