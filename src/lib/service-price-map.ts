import type { ServiceId } from "./services-catalog";
import { getPriceItem, type PriceListItem } from "./price-list";

/** Базовая услуга при открытии записи по категории */
export const serviceBasePriceId: Partial<Record<ServiceId, string>> = {
  oil: "oil_filter",
  brakePads: undefined,
  brakesFull: undefined,
  acRefill: undefined,
  acRepair: undefined,
  diagnostic: "computer_diag",
  suspension: undefined,
  tires: undefined,
  timingBelt: undefined,
  chip: "stage1",
  stage1: "stage1",
  engine: "engine_diag",
  electric: "computer_diag",
  filters: undefined,
  alignment: "alignment",
  otherReason: undefined,
};

/** Опции мастера → позиции прайса (serviceId:optionId при коллизии id) */
export const flowOptionPriceIds: Record<string, string | string[]> = {
  oilFilter: [],
  cabinFilter: "cabin_filter",
  airFilter: "air_filter",
  fuelFilter: "fuel_filter",

  front: "brake_pads_front",
  rear: "brake_pads_rear",
  frontRear: ["brake_pads_front", "brake_pads_rear"],
  discFront: "brake_disc_front",
  discAll: ["brake_disc_front", "brake_disc_rear"],
  brakeDiag: "brake_diag",

  refill: "ac_r134a",
  leak: "ac_leak",
  ozone: "ac_ozone",
  clean: "ac_clean",
  acDiag: "ac_diag",

  change: "tire_change_cast_15_17",
  balance: "wheel_balance",
  repair: "puncture_repair",
  storage: "tire_storage",
  runflat: "runflat_mount",

  suspDiag: "suspension_diag",
  suspShocks: "shock_replace",
  suspBushings: "bushing_replace",
  suspArms: "arm_replace",
  suspSprings: "shock_replace",

  grmBelt: "timing_belt",
  grmChain: "timing_chain",
  grmKit: "timing_belt",
  grmPump: "water_pump",
  grmDiag: "engine_diag",

  dsgOil: "oil_filter",
  dsgDiag: "computer_diag",
  dsgRepair: "engine_diag",
  dsgAdapt: "computer_diag",
  dsgClutch: "clutch",

  filtersCabin: "cabin_filter",
  filtersAir: "air_filter",
  filtersFuel: "fuel_filter",
  filtersOil: "oil_filter",

  "acRefill:diag": "ac_diag",
  "acRepair:diag": "ac_diag",
  "brakePads:diag": "brake_diag",
  "brakesFull:diag": "brake_diag",
};

export function resolvePriceIdsForOption(
  serviceId: ServiceId,
  optionId: string
): string[] {
  const composite = `${serviceId}:${optionId}`;
  const mapped =
    flowOptionPriceIds[composite] ?? flowOptionPriceIds[optionId];
  if (mapped === undefined) return [];
  if (Array.isArray(mapped)) return mapped;
  if (mapped === "") return [];
  return [mapped];
}

export function getItemForOption(
  serviceId: ServiceId,
  optionId: string,
  locale: "pl" | "ru"
): PriceListItem | null {
  const ids = resolvePriceIdsForOption(serviceId, optionId);
  if (!ids[0]) return null;
  return getPriceItem(ids[0]) ?? null;
}

export function itemLabel(item: PriceListItem, locale: "pl" | "ru"): string {
  return locale === "ru" ? item.nameRu : item.namePl;
}
