import type { ServiceId } from "@/lib/services-catalog";

export const MOTION_KINDS = [
  "oil",
  "tires",
  "brakes",
  "diagnostic",
  "ac",
  "suspension",
  "timing",
  "engine",
  "transmission",
  "electric",
  "fleet",
  "checklist",
  "workshop",
] as const;

export type MotionKind = (typeof MOTION_KINDS)[number];

/** Map a public landing to one technical scene. Unknown pages get a quiet workshop frame. */
export function motionKindFor(slug: string, serviceId?: ServiceId | string): MotionKind {
  const value = slug.toLowerCase();
  if (value.includes("olej") || serviceId === "oil") return "oil";
  if (
    value.includes("opon") ||
    value.includes("wulkan") ||
    value === "opony" ||
    serviceId === "tires"
  ) {
    return "tires";
  }
  if (
    value.includes("hamul") ||
    value.includes("klock") ||
    value.includes("tarcz") ||
    serviceId === "brakePads" ||
    serviceId === "brakesFull"
  ) {
    return "brakes";
  }
  if (value.includes("diagnost") || value.includes("check-engine") || serviceId === "diagnostic") {
    return "diagnostic";
  }
  if (value.includes("klimat") || serviceId === "acRefill" || serviceId === "acRepair") {
    return "ac";
  }
  if (
    value.includes("zawiesz") ||
    value.includes("amort") ||
    value.includes("wahacz") ||
    serviceId === "suspension"
  ) {
    return "suspension";
  }
  if (value.includes("rozrzad") || serviceId === "timingBelt") return "timing";
  if (
    value.includes("skrzyn") ||
    value.includes("dsg") ||
    value.includes("haldex") ||
    value.includes("sprzeg") ||
    serviceId === "transmission" ||
    serviceId === "clutch"
  ) {
    return "transmission";
  }
  if (
    value.includes("silnik") ||
    value.includes("turbo") ||
    value.includes("dpf") ||
    value.includes("egr") ||
    serviceId === "engine" ||
    serviceId === "turbo"
  ) {
    return "engine";
  }
  if (
    value.includes("elektr") ||
    value.includes("akumulator") ||
    value.includes("alternator") ||
    value.includes("rozrusznik") ||
    serviceId === "electric" ||
    serviceId === "starterGen"
  ) {
    return "electric";
  }
  if (value.includes("flot")) return "fleet";
  if (value.includes("przeglad")) return "checklist";
  return "workshop";
}
