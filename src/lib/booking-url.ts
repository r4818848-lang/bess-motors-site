import { getPriceItem } from "@/lib/price-list";

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

export type LastBookingSnapshot = {
  date: string;
  time: string;
  clientName: string;
  estimatedTotal?: number;
  serviceLabels?: string;
};

export function saveLastBooking(snapshot: LastBookingSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(LAST_BOOKING_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore */
  }
}

export function loadLastBooking(): LastBookingSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(LAST_BOOKING_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LastBookingSnapshot;
  } catch {
    return null;
  }
}
