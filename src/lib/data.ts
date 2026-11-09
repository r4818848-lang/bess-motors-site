import { businessConfig } from "@/lib/businessConfig";
import { arrivalTimesForDate } from "@/lib/arrival-window";

export { popularServices, serviceCategories, serviceFlows } from "./services-catalog";
export type { ServiceId } from "./services-catalog";

export const mechanics = [
  { id: "mech-1", name: "Jan Kowalski", specialty: "Engine / Tuning", rating: 4.9 },
  { id: "mech-2", name: "Piotr Nowak", specialty: "Diagnostics / Electric", rating: 4.8 },
  { id: "mech-3", name: "Marek Wiśniewski", specialty: "Detailing / Paint", rating: 5.0 },
];

/**
 * Weekday arrival times. Saturday is shorter and Sunday is closed;
 * use arrivalTimesForDate when the date is known.
 */
export const WORKSHOP_OPEN = businessConfig.openingHours.opens;
export const WORKSHOP_CLOSE = businessConfig.openingHours.closes;

export const timeSlots = arrivalTimesForDate("2026-11-09");

export const reviews = [
  { name: "Michał K.", car: "BMW M340i", text: "Stage 2 + downpipe — +80 KM. Profesjonalizm na najwyższym poziomie!", rating: 5 },
  { name: "Anna W.", car: "Mercedes C300", text: "Detailing ceramiczny — auto jak nowe. Polecam BESS MOTORS!", rating: 5 },
  { name: "Dmitry S.", car: "Audi RS3", text: "Chip tuning i diagnostyka komputerowa — szybko i dokładnie.", rating: 5 },
];

export const stats = [
  { value: "5", key: "rating" as const },
  { value: "1,000+", key: "repairs" as const },
  { value: "12+", key: "years" as const },
];
