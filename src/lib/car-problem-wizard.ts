import type { PriceCategoryId } from "@/lib/price-list";

export type WizardSymptomId =
  | "check_engine"
  | "noise_suspension"
  | "brakes_weak"
  | "ac_weak"
  | "oil_service"
  | "tires"
  | "chip_power"
  | "electrical";

export type WizardSymptom = {
  id: WizardSymptomId;
  priceItemIds: string[];
  categoryId: PriceCategoryId;
};

export const wizardSymptoms: WizardSymptom[] = [
  {
    id: "check_engine",
    priceItemIds: ["computer_diag", "engine_diag"],
    categoryId: "diagnostic",
  },
  {
    id: "noise_suspension",
    priceItemIds: ["suspension_diag", "shock_replace"],
    categoryId: "suspension",
  },
  {
    id: "brakes_weak",
    priceItemIds: ["brake_diag", "brake_pads_front"],
    categoryId: "brakes",
  },
  {
    id: "ac_weak",
    priceItemIds: ["ac_diag", "ac_r134a", "ac_clean"],
    categoryId: "ac",
  },
  {
    id: "oil_service",
    priceItemIds: ["oil_filter", "air_filter"],
    categoryId: "maintenance",
  },
  {
    id: "tires",
    priceItemIds: ["tire_change_cast_15_17", "alignment"],
    categoryId: "tires",
  },
  {
    id: "chip_power",
    priceItemIds: ["stage1", "computer_diag"],
    categoryId: "chip",
  },
  {
    id: "electrical",
    priceItemIds: ["electric_fault", "battery_check"],
    categoryId: "electrical",
  },
];

export function resolveWizardItemIds(selected: WizardSymptomId[]): string[] {
  const set = new Set<string>();
  for (const id of selected) {
    const s = wizardSymptoms.find((x) => x.id === id);
    s?.priceItemIds.forEach((pid) => set.add(pid));
  }
  return [...set];
}

export function wizardPrimaryCategory(selected: WizardSymptomId[]): PriceCategoryId {
  const first = wizardSymptoms.find((x) => x.id === selected[0]);
  return first?.categoryId ?? "diagnostic";
}
