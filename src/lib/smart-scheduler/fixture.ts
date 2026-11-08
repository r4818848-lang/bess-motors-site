import { addDateKeyDays } from "@/lib/staff-calendar";
import { mechanicColumn, type MechanicColumn } from "@/lib/smart-scheduler/identity";
import { defaultSchedulerSettings, type SchedulerSettings } from "@/lib/smart-scheduler/settings";
import { holdsFromLegacy, type Hold } from "@/lib/smart-scheduler/schedule";
import { warsawParts, weekdayIndexFromDateKey, type WorkshopHours } from "@/lib/workshop-schedule";

export type SchedulerAppointment = {
  id: string;
  date: string;
  arrivalTime: string;
  workStart: string;
  workMinutes: number;
  mechanicId: string;
  plate: string;
  vehicle: string;
  operationCode: string;
  operationName: string;
  category: string;
  lift: string;
  leavesCar: boolean;
  pickupDate: string;
  appointmentStatus: string;
  workOrderId: string | null;
  clientId: string;
};

export type SchedulerSnapshot = {
  source: "fixture";
  writable: false;
  date: string;
  mechanics: MechanicColumn[];
  appointments: SchedulerAppointment[];
  settings: SchedulerSettings;
  crmHolds: Hold[];
};

const PROFILES = [
  { id: "mech-1", name: "Siergiej" },
  { id: "mech-2", name: "Piotr Nowak" },
];

export function upcomingMonday(now: Date): string {
  const date = warsawParts(now).dateKey;
  const weekday = weekdayIndexFromDateKey(date) ?? 1;
  const delta = weekday === 1 ? 0 : (8 - weekday) % 7;
  return addDateKeyDays(date, delta) ?? date;
}

export function syntheticSnapshot(now: Date, hours: WorkshopHours): SchedulerSnapshot {
  const monday = upcomingMonday(now);
  const friday = addDateKeyDays(monday, 4) ?? monday;
  const appointments: SchedulerAppointment[] = [
    {
      id: "fix-oil",
      date: monday,
      arrivalTime: "11:00",
      workStart: "11:00",
      workMinutes: 45,
      mechanicId: "mech-1",
      plate: "WX1001",
      vehicle: "Test Compact",
      operationCode: "MA-001",
      operationName: "Замена масла двигателя + фильтр",
      category: "MA",
      lift: "lift-1",
      leavesCar: false,
      pickupDate: "",
      appointmentStatus: "scheduled",
      workOrderId: "wo-test-1",
      clientId: "client-test-1",
    },
    {
      id: "fix-pads",
      date: monday,
      arrivalTime: "11:00",
      workStart: "11:20",
      workMinutes: 60,
      mechanicId: "mech-2",
      plate: "WX1002",
      vehicle: "Test Wagon",
      operationCode: "BR-001",
      operationName: "Передние колодки, ось",
      category: "BR",
      lift: "lift-2",
      leavesCar: true,
      pickupDate: addDateKeyDays(monday, 1) ?? monday,
      appointmentStatus: "scheduled",
      workOrderId: "wo-test-2",
      clientId: "client-test-2",
    },
    {
      id: "fix-long",
      date: friday,
      arrivalTime: "09:00",
      workStart: "17:30",
      workMinutes: 60,
      mechanicId: "mech-1",
      plate: "WX1003",
      vehicle: "Test Van",
      operationCode: "SU-001",
      operationName: "Стойка стабилизатора, 1 шт.",
      category: "SU",
      lift: "lift-1",
      leavesCar: true,
      pickupDate: addDateKeyDays(friday, 3) ?? friday,
      appointmentStatus: "scheduled",
      workOrderId: null,
      clientId: "client-test-3",
    },
  ];
  const crmHolds = appointments.flatMap((appointment) => holdsFromLegacy({
    id: appointment.id,
    date: appointment.date,
    mechanicId: appointment.mechanicId,
    workStart: appointment.workStart,
    workMinutes: appointment.workMinutes,
    leavesCar: appointment.leavesCar,
    pickupDate: appointment.pickupDate,
    appointmentStatus: appointment.appointmentStatus,
    hours,
  }).map((hold) => ({ ...hold, resourceIds: appointment.lift ? [appointment.lift] : hold.resourceIds })));
  return {
    source: "fixture",
    writable: false,
    date: warsawParts(now).dateKey,
    mechanics: PROFILES.map(mechanicColumn),
    appointments,
    settings: defaultSchedulerSettings,
    crmHolds,
  };
}
