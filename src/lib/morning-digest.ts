import { siteLocaleLabel } from "@/lib/service-leads";
import type { Appointment, Database } from "@/lib/store";
import { warsawParts } from "@/lib/workshop-schedule";

export function warsawHour(now: Date): number {
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Warsaw",
    hour: "2-digit",
    hourCycle: "h23",
  }).format(now);
  return Number(time) % 24;
}

export function isMorningDigestHour(now: Date): boolean {
  return warsawHour(now) === 8;
}

export function visibleTodayArrivals(appointments: Appointment[], todayKey: string): Appointment[] {
  return appointments
    .filter(
      (apt) =>
        apt.date === todayKey &&
        !apt.calendarHidden &&
        apt.appointmentStatus !== "cancelled" &&
        apt.appointmentStatus !== "completed"
    )
    .sort((a, b) => a.time.localeCompare(b.time) || a.id.localeCompare(b.id));
}

function carLabel(db: Database, apt: Appointment): string {
  const vehicle = db.vehicles.find((item) => item.id === apt.vehicleId);
  const parts = [vehicle?.make, vehicle?.model, apt.clientPlate || vehicle?.plate].filter(Boolean);
  return parts.join(" ") || "Не указано";
}

export function formatMorningDigest(db: Database, todayKey: string): string {
  const rows = visibleTodayArrivals(db.appointments, todayKey);
  if (!rows.length) return `Приезды на ${todayKey}\n\nНа сегодня записей нет.`;
  const lines = rows.map((apt) => {
    const locale = apt.siteLocale ? ` · язык ${siteLocaleLabel(apt.siteLocale)}` : "";
    return `${apt.time} / ${apt.clientName || "Не указано"} / ${carLabel(db, apt)} / ${apt.problemText || apt.serviceIds.join(", ") || "Не указано"} / ${apt.clientPhone || "Не указано"}${locale}`;
  });
  return [`Приезды на ${todayKey}`, "", ...lines].join("\n");
}

export function morningDigestAlreadySent(db: Database, todayKey: string): boolean {
  return db.settings.morningDigestDate === todayKey;
}

export function warsawTodayKey(now: Date): string {
  return warsawParts(now).dateKey;
}
