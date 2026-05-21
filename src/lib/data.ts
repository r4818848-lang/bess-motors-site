export { popularServices, serviceCategories, serviceFlows } from "./services-catalog";
export type { ServiceId } from "./services-catalog";

export const mechanics = [
  { id: "mech-1", name: "Jan Kowalski", specialty: "Engine / Tuning", rating: 4.9 },
  { id: "mech-2", name: "Piotr Nowak", specialty: "Diagnostics / Electric", rating: 4.8 },
  { id: "mech-3", name: "Marek Wiśniewski", specialty: "Detailing / Paint", rating: 5.0 },
];

export const timeSlots = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00",
];

export const reviews = [
  { name: "Michał K.", car: "BMW M340i", text: "Stage 2 + downpipe — +80 KM. Profesjonalizm na najwyższym poziomie!", rating: 5 },
  { name: "Anna W.", car: "Mercedes C300", text: "Detailing ceramiczny — auto jak nowe. Polecam BESS MOTORS!", rating: 5 },
  { name: "Dmitry S.", car: "Audi RS3", text: "Chip tuning i diagnostyka AI — szybko i dokładnie.", rating: 5 },
];

export const stats = [
  { value: "2,500+", key: "clients" as const },
  { value: "8,000+", key: "repairs" as const },
  { value: "12+", key: "years" as const },
  { value: "4.9", key: "rating" as const },
];
