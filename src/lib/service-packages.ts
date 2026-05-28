/** Fixed service bundles for bot / booking (no external APIs) */

export type ServicePackageId = "to_standard" | "winter_prep" | "brake_check";

export type ServicePackage = {
  id: ServicePackageId;
  serviceIds: string[];
  priceItemIds: string[];
  namePl: string;
  nameRu: string;
};

export const servicePackages: ServicePackage[] = [
  {
    id: "to_standard",
    serviceIds: ["oil", "filters"],
    priceItemIds: ["oil_filter", "air_filter"],
    namePl: "Pakiet TO — olej + filtry",
    nameRu: "Пакет ТО — масло + фильтры",
  },
  {
    id: "winter_prep",
    serviceIds: ["tires", "diagnostic"],
    priceItemIds: ["tire_change_cast_15_17", "computer_diag"],
    namePl: "Pakiet zimowy — opony + diagnostyka",
    nameRu: "Зимний пакет — шины + диагностика",
  },
  {
    id: "brake_check",
    serviceIds: ["brakePads", "diagnostic"],
    priceItemIds: ["brake_diag", "brake_pads_front"],
    namePl: "Pakiet hamulcowy — przegląd + klocki",
    nameRu: "Тормозной пакет — проверка + колодки",
  },
];

export function getServicePackage(id: string): ServicePackage | undefined {
  return servicePackages.find((p) => p.id === id);
}
