import { readOnlyAppointments, type CrmDb } from "@/lib/smart-scheduler/crm-read";
import type { WorkshopHours } from "@/lib/workshop-schedule";

export type CrmOccupancyBlock = {
  id: string;
  appointmentId: string;
  mechanicId: string;
  resourceId: string;
  startMs: number;
  endMs: number;
};

/** Server-side projection of existing CRM work. The browser does not supply this list. */
export function projectCrmOccupancy(db: CrmDb, hours: WorkshopHours): CrmOccupancyBlock[] {
  const read = readOnlyAppointments(db, hours);
  return read.holds.flatMap((hold, index) => {
    if (!hold.active || !hold.mechanicId) return [];
    const appointmentId = hold.id.split(":")[0] || hold.id;
    const resources = hold.resourceIds.length > 0 ? hold.resourceIds : [""];
    return resources.map((resourceId, resourceIndex) => ({
      id: `${appointmentId}:${index}:${resourceIndex}`,
      appointmentId,
      mechanicId: hold.mechanicId,
      resourceId,
      startMs: hold.startMs,
      endMs: hold.endMs,
    }));
  });
}
