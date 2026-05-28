import type { WorkOrder } from "@/lib/store";

const OIL_KM = 10_000;
const OIL_MONTHS = 6;

export type MileageReminder = {
  id: string;
  titlePl: string;
  titleRu: string;
  detailPl: string;
  detailRu: string;
};

export function oilChangeRemindersFromHistory(
  vehicleId: string,
  workOrders: WorkOrder[],
  currentMileage: number,
  locale: "pl" | "ru"
): MileageReminder[] {
  const related = workOrders
    .filter((o) => o.vehicleId === vehicleId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const lastOil = related.find((o) =>
    o.services.some((s) => /olej|масл|oil/i.test(s.name))
  );
  if (!lastOil) return [];

  const lastDate = new Date(lastOil.updatedAt);
  const months = Math.floor(
    (Date.now() - lastDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
  );

  const out: MileageReminder[] = [];
  if (months >= OIL_MONTHS) {
    out.push({
      id: "oil-time-hist",
      titlePl: "Wymiana oleju (historia)",
      titleRu: "Замена масла (история)",
      detailPl: `Ostatnia wymiana oleju w zleceniu ${lastOil.number} — ${months} mies. temu.`,
      detailRu: `Последняя замена масла в заказе ${lastOil.number} — ${months} мес. назад.`,
    });
  }

  if (currentMileage > 0 && currentMileage % OIL_KM > OIL_KM - 2500) {
    out.push({
      id: "oil-km-hist",
      titlePl: "Przebieg a olej",
      titleRu: "Пробег и масло",
      detailPl: `Przebieg ~${currentMileage.toLocaleString()} km — rozważ olej (co ${OIL_KM.toLocaleString()} km).`,
      detailRu: `Пробег ~${currentMileage.toLocaleString()} км — пора менять масло (каждые ${OIL_KM.toLocaleString()} км).`,
    });
  }

  return out;
}
