import { businessConfig } from "@/lib/businessConfig";

export { popularServices, serviceCategories, serviceFlows } from "./services-catalog";
export type { ServiceId } from "./services-catalog";

export const mechanics = [
  { id: "mech-1", name: "Jan Kowalski", specialty: "Engine / Tuning", rating: 4.9 },
  { id: "mech-2", name: "Piotr Nowak", specialty: "Diagnostics / Electric", rating: 4.8 },
  { id: "mech-3", name: "Marek Wiśniewski", specialty: "Detailing / Paint", rating: 5.0 },
];

/**
 * Arrival times a client can choose. The workshop still works
 * Mon–Fri 09:00–18:00 and Sat 09:00–14:00; those hours stay in businessConfig.
 */
export const WORKSHOP_OPEN = businessConfig.openingHours.opens;
export const WORKSHOP_CLOSE = businessConfig.openingHours.closes;

export const timeSlots = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
];

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
