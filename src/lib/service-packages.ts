/** Fixed service bundles for bot / booking (no external APIs) */

import { getPriceItem } from "@/lib/price-list";

export type ServicePackageId = "to_standard" | "winter_prep" | "brake_check";

export type ServicePackage = {
  id: ServicePackageId;
  serviceIds: string[];
  priceItemIds: string[];
  namePl: string;
  nameRu: string;
  /** Discounted package price (PLN) */
  packagePricePln: number;
  /** Promo valid until (ISO date) */
  validUntil: string;
};

function sumItemPrices(ids: string[]): number {
  return ids.reduce((sum, id) => sum + (getPriceItem(id)?.basePrice ?? 0), 0);
}

export const servicePackages: ServicePackage[] = [
  {
    id: "to_standard",
    serviceIds: ["oil", "filters"],
    priceItemIds: ["oil_filter", "air_filter"],
    namePl: "Pakiet TO — olej + filtry",
    nameRu: "Пакет ТО — масло + фильтры",
    packagePricePln: 180,
    validUntil: "2026-12-31",
  },
  {
    id: "winter_prep",
    serviceIds: ["tires", "diagnostic"],
    priceItemIds: ["tire_change_cast_15_17", "computer_diag"],
    namePl: "Pakiet zimowy — opony + diagnostyka",
    nameRu: "Зимний пакет — шины + диагностика",
    packagePricePln: 320,
    validUntil: "2026-12-31",
  },
  {
    id: "brake_check",
    serviceIds: ["brakePads", "diagnostic"],
    priceItemIds: ["brake_diag", "brake_pads_front"],
    namePl: "Pakiet hamulcowy — przegląd + klocki",
    nameRu: "Тормозной пакет — проверка + колодки",
    packagePricePln: 200,
    validUntil: "2026-12-31",
  },
];

export function getServicePackage(id: string): ServicePackage | undefined {
  return servicePackages.find((p) => p.id === id);
}

export function packageRegularTotal(pkg: ServicePackage): number {
  return sumItemPrices(pkg.priceItemIds);
}

export function buildPackageBookingUrl(pkg: ServicePackage): string {
  return `/booking?package=${pkg.id}`;
}
