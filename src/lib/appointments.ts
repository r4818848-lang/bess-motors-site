import type { Appointment, Database, RepairStatus } from "./store";

export type CalendarView = "day" | "week" | "month";

export const WORK_HOURS = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00",
];

export function parseDateKey(d: string): Date {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day);
}

export function formatDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay() === 0 ? 6 : x.getDay() - 1;
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function getAppointmentContext(db: Database, apt: Appointment) {
  const client = db.users.find((u) => u.id === apt.userId);
  const vehicle = db.vehicles.find((v) => v.id === apt.vehicleId);
  const mechanic = db.mechanics.find((m) => m.id === apt.mechanicId);
  const order = apt.workOrderId
    ? db.workOrders.find((o) => o.id === apt.workOrderId)
    : undefined;
  return { client, vehicle, mechanic, order };
}

export function filterAppointments(
  appointments: Appointment[],
  filters: {
    dateFrom?: string;
    dateTo?: string;
    mechanicId?: string;
    repairStatus?: RepairStatus | "";
    userId?: string;
    vehicleId?: string;
    plate?: string;
  }
): Appointment[] {
  return appointments.filter((a) => {
    if (filters.mechanicId && filters.mechanicId !== "all" && a.mechanicId !== filters.mechanicId)
      return false;
    if (filters.repairStatus && a.repairStatus !== filters.repairStatus) return false;
    if (filters.userId && a.userId !== filters.userId) return false;
    if (filters.vehicleId && a.vehicleId !== filters.vehicleId) return false;
    if (filters.dateFrom && a.date < filters.dateFrom) return false;
    if (filters.dateTo && a.date > filters.dateTo) return false;
    return true;
  });
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}
