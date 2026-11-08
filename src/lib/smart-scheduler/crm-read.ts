import { holdsFromLegacy, type Hold } from "@/lib/smart-scheduler/schedule";
import type { WorkshopHours } from "@/lib/workshop-schedule";

type CrmAppointment = {
  id: string;
  date: string;
  time: string;
  mechanicId?: string;
  workStart?: string;
  workMinutes?: number;
  leavesCar?: boolean;
  pickupDate?: string;
  appointmentStatus?: string;
  visitState?: string;
  clientPhone?: string;
  clientName?: string;
  clientPlate?: string;
  workOrderId?: string;
  vehicleId?: string;
};

type CrmDb = {
  mechanics: { id: string; name: string; phone?: string }[];
  appointments: CrmAppointment[];
  workOrders: { id: string; appointmentId?: string }[];
  vehicles?: { id: string; plate?: string; make?: string; model?: string; vin?: string }[];
};

export type ReadAppointment = {
  id: string;
  date: string;
  arrivalTime: string;
  workStart: string;
  workMinutes: number;
  mechanicId: string;
  plate: string;
  vehicle: string;
  workOrderId: string | null;
  clientId: string | null;
};

export function readOnlyAppointments(db: CrmDb, hours: WorkshopHours): { appointments: ReadAppointment[]; holds: Hold[]; mechanicNames: { id: string; name: string }[] } {
  const vehicles = new Map((db.vehicles ?? []).map((vehicle) => [vehicle.id, vehicle]));
  const appointments = db.appointments.map((appointment) => {
    const vehicle = appointment.vehicleId ? vehicles.get(appointment.vehicleId) : undefined;
    return {
      id: appointment.id,
      date: appointment.date,
      arrivalTime: appointment.time,
      workStart: appointment.workStart ?? "",
      workMinutes: appointment.workMinutes ?? 0,
      mechanicId: appointment.mechanicId ?? "",
      plate: appointment.clientPlate || vehicle?.plate || "",
      vehicle: [vehicle?.make, vehicle?.model].filter(Boolean).join(" "),
      workOrderId: appointment.workOrderId ?? null,
      clientId: null,
    };
  });
  const holds = db.appointments.flatMap((appointment) => holdsFromLegacy({ ...appointment, hours }));
  return {
    appointments,
    holds,
    mechanicNames: db.mechanics.map((mechanic) => ({ id: mechanic.id, name: mechanic.name })),
  };
}

export function snapshotHasPersonalSecrets(value: unknown): boolean {
  return /phone|password|vin/i.test(JSON.stringify(value));
}
