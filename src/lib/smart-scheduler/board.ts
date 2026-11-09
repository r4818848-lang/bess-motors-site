import type { CrmDb } from "@/lib/smart-scheduler/crm-read";
import { readOnlyAppointments } from "@/lib/smart-scheduler/crm-read";
import { emptyLiveSnapshot, syntheticSnapshot, withDisplayNames, type SchedulerAppointment, type SchedulerSnapshot } from "@/lib/smart-scheduler/fixture";
import type { SchedulerSettings } from "@/lib/smart-scheduler/settings";
import { visibleToActor, type SchedulerActor } from "@/lib/smart-scheduler/visibility";
import type { WorkshopHours } from "@/lib/workshop-schedule";

export function assembleBoard(input: {
  mode: "live" | "test";
  actor: SchedulerActor;
  now: Date;
  hours: WorkshopHours;
  crm: CrmDb | null;
  settings: SchedulerSettings;
}): { snapshot: SchedulerSnapshot; message: string } {
  if (input.mode === "test") {
    const snapshot = withDisplayNames(syntheticSnapshot(input.now, input.hours), input.settings);
    const appointments = visibleToActor(input.actor, snapshot.appointments);
    return {
      snapshot: {
        ...snapshot,
        appointments,
        crmHolds: snapshot.crmHolds.filter((hold) => appointments.some((item) => hold.id === item.id || hold.id.startsWith(`${item.id}:`))),
      },
      message: "TEST. Синтетические автомобили, не записи клиентов.",
    };
  }
  if (!input.crm) {
    return {
      snapshot: withDisplayNames(emptyLiveSnapshot(input.now), input.settings),
      message: "Ошибка подключения к CRM. Расписание не загружено. Свободный день не показан.",
    };
  }
  const read = readOnlyAppointments(input.crm, input.hours);
  const rows = visibleToActor(input.actor, read.appointments);
  const appointments: SchedulerAppointment[] = rows.map((item) => ({
    id: item.id,
    date: item.date,
    arrivalTime: item.arrivalTime,
    workStart: item.workStart,
    workMinutes: item.workMinutes,
    mechanicId: item.mechanicId,
    plate: item.plate,
    vehicle: item.vehicle,
    operationCode: "",
    operationName: "",
    category: "MA",
    lift: "",
    leavesCar: false,
    pickupDate: "",
    appointmentStatus: "scheduled",
    workOrderId: item.workOrderId,
    clientId: "",
  }));
  const allowed = new Set(rows.map((item) => item.mechanicId));
  const names = new Map(read.mechanicNames.map((item) => [item.id, item.name]));
  const snapshot = withDisplayNames(emptyLiveSnapshot(input.now), input.settings);
  return {
    snapshot: {
      ...snapshot,
      source: "live",
      crmConnected: true,
      appointments,
      crmHolds: read.holds.filter((hold) => allowed.has(hold.mechanicId)),
      mechanics: snapshot.mechanics.map((mechanic) => {
        const crmName = names.get(mechanic.id);
        return crmName ? { ...mechanic, crmName } : mechanic;
      }),
    },
    message: "Записи прочитаны с сервера. Браузер не получает служебный ключ базы.",
  };
}
