import type { ServiceId } from "@/lib/services-catalog";

/** Primary SEO landing slug per booking service id */
export const SERVICE_LANDING_SLUG: Partial<Record<ServiceId, string>> = {
  oil: "wymiana-oleju",
  brakePads: "hamulce",
  brakesFull: "hamulce",
  diagnostic: "diagnostyka",
  suspension: "zawieszenie",
  acRefill: "klimatyzacja",
  acRepair: "klimatyzacja",
  alignment: "geometria",
  engine: "silnik",
  electric: "elektryka",
  tires: "opony",
  chip: "chip-tuning-warszawa",
  stage1: "chip-tuning-warszawa",
};

export function serviceLandingHref(serviceId: ServiceId): string | null {
  const slug = SERVICE_LANDING_SLUG[serviceId];
  return slug ? `/${slug}` : null;
}
