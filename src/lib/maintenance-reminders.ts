import type { Vehicle, WorkOrder } from "@/lib/store";

export type MaintenanceReminder = {
  id: string;
  titlePl: string;
  titleRu: string;
  detailPl: string;
  detailRu: string;
  priority: "soon" | "upcoming" | "ok";
};

const OIL_INTERVAL_KM = 10_000;
const OIL_INTERVAL_MONTHS = 6;
const BRAKE_FLUID_MONTHS = 24;

function monthsSince(iso: string): number {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 999;
  const now = new Date();
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
}

function lastServiceDate(orders: WorkOrder[], vehicleId: string): string | null {
  const related = orders
    .filter((o) => o.vehicleId === vehicleId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return related[0]?.updatedAt ?? null;
}

export function buildMaintenanceReminders(
  vehicle: Vehicle,
  workOrders: WorkOrder[],
  locale: "pl" | "ru"
): MaintenanceReminder[] {
  const reminders: MaintenanceReminder[] = [];
  const mileage = vehicle.mileage ?? 0;
  const last = lastServiceDate(workOrders, vehicle.id);
  const months = last ? monthsSince(last) : 99;

  if (mileage > 0 && mileage % OIL_INTERVAL_KM > OIL_INTERVAL_KM - 2000) {
    reminders.push({
      id: "oil-km",
      titlePl: "Wymiana oleju",
      titleRu: "Замена масла",
      detailPl: `Przebieg ~${mileage.toLocaleString()} km — rozważ wymianę oleju (co ${OIL_INTERVAL_KM.toLocaleString()} km).`,
      detailRu: `Пробег ~${mileage.toLocaleString()} км — пора менять масло (каждые ${OIL_INTERVAL_KM.toLocaleString()} км).`,
      priority: "soon",
    });
  } else if (months >= OIL_INTERVAL_MONTHS) {
    reminders.push({
      id: "oil-time",
      titlePl: "Wymiana oleju",
      titleRu: "Замена масла",
      detailPl: `Od ostatniej wizyty minęło ${months} mies. — zalecana wymiana oleju co ${OIL_INTERVAL_MONTHS} mies.`,
      detailRu: `С последнего визита ${months} мес. — рекомендуем масло каждые ${OIL_INTERVAL_MONTHS} мес.`,
      priority: months >= OIL_INTERVAL_MONTHS + 2 ? "soon" : "upcoming",
    });
  }

  if (months >= BRAKE_FLUID_MONTHS) {
    reminders.push({
      id: "brake-fluid",
      titlePl: "Płyn hamulcowy",
      titleRu: "Тормозная жидкость",
      detailPl: `Co ${BRAKE_FLUID_MONTHS} mies. warto wymienić płyn hamulcowy.`,
      detailRu: `Каждые ${BRAKE_FLUID_MONTHS} мес. рекомендуем замену тормозной жидкости.`,
      priority: months >= BRAKE_FLUID_MONTHS + 6 ? "soon" : "upcoming",
    });
  }

  if (!reminders.length) {
    reminders.push({
      id: "ok",
      titlePl: "Plan serwisowy",
      titleRu: "План обслуживания",
      detailPl:
        locale === "pl"
          ? "Na podstawie przebiegu i historii — brak pilnych przypomnień. Umów przegląd profilaktyczny."
          : "Na podstawie przebiegu i historii — brak pilnych przypomnień.",
      detailRu: "По пробегу и истории срочных напоминаний нет. Запишитесь на профилактику.",
      priority: "ok",
    });
  }

  return reminders;
}
