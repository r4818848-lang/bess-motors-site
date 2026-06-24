import { timeSlots } from "@/lib/data";
import type { ServiceId } from "@/lib/services-catalog";

export const AC_BOOKING_SERVICE_IDS = ["acRefill", "acRepair"] as const;

export function isAcBookingService(serviceId: ServiceId | string): boolean {
  return (AC_BOOKING_SERVICE_IDS as readonly string[]).includes(serviceId);
}

export function isPhoneOnlyBookingUrl(search: string): boolean {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return params.get("quick") === "1" || params.get("quick") === "true";
}

export function isAcQuickBookingUrl(search: string): boolean {
  if (!isPhoneOnlyBookingUrl(search)) return false;
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const service = params.get("service")?.trim();
  return service === "acRefill" || service === "acRepair";
}

/** CRM / cabinet display name when client leaves only a phone number */
export function resolveBookingClientName(phone: string, name?: string): string {
  const trimmed = name?.trim();
  if (trimmed && trimmed.length >= 2 && trimmed !== "—") return trimmed;
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 9) return `Klient ${digits.slice(-9)}`;
  return "Klient";
}

export function isPhoneContactValid(phone: string): boolean {
  return phone.replace(/\D/g, "").length >= 9;
}

export function pickFirstAvailableSlot(
  dateStr: string,
  isSlotAvailable: (date: string, time: string) => boolean,
  slots: readonly string[] = timeSlots
): string | null {
  for (const slot of slots) {
    if (isSlotAvailable(dateStr, slot)) return slot;
  }
  return null;
}
